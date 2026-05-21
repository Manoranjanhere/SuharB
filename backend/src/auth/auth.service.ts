import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Twilio } from 'twilio';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignIn from 'apple-signin-auth';

import { User } from '../users/entities/user.entity';
import { Otp } from '../otp/entities/otp.entity';
import { BannedIdentity, BanType } from './entities/banned-identity.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { MailService } from '../common/services/mail.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SocialAuthDto, SocialProvider } from './dto/social-auth.dto';

@Injectable()
export class AuthService {
  private twilioClient: Twilio;
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(BannedIdentity)
    private readonly banRepository: Repository<BannedIdentity>,
    @InjectRepository(PasswordReset)
    private readonly resetRepository: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  // ─── Ban check helper ─────────────────────────────────────────────────────

  private async checkBanned(type: BanType, value: string): Promise<void> {
    const ban = await this.banRepository.findOne({ where: { type, value: value.toLowerCase(), isActive: true } });
    if (ban) throw new UnauthorizedException(`This ${type} has been restricted. Contact support.`);
  }

  // ─── WhatsApp OTP ───────────────────────────────────────────────────────────

  async sendWhatsAppOtp(dto: SendOtpDto): Promise<{ message: string }> {
    await this.checkBanned(BanType.PHONE, dto.phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous OTPs for this phone
    await this.otpRepository.update(
      { phone: dto.phone, isUsed: false },
      { isUsed: true },
    );

    await this.otpRepository.save(
      this.otpRepository.create({ phone: dto.phone, code, expiresAt }),
    );

    // Send via Twilio WhatsApp
    if (process.env.NODE_ENV !== 'development') {
      await this.twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${dto.phone}`,
        body: `Your SugarBf verification code is: *${code}*\nValid for 10 minutes. Do not share this with anyone.`,
      });
    } else {
      // In dev, log the code
      console.log(`[DEV] OTP for ${dto.phone}: ${code}`);
    }

    return { message: 'OTP sent via WhatsApp' };
  }

  async verifyWhatsAppOtp(dto: VerifyOtpDto): Promise<{ accessToken: string; isNewUser: boolean; user: User }> {
    const otp = await this.otpRepository.findOne({
      where: {
        phone: dto.phone,
        code: dto.code,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    // Find or create user
    let user = await this.userRepository.findOne({ where: { phone: dto.phone } });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ phone: dto.phone });
      await this.userRepository.save(user);
      this.notifyAdmins(user); // fire-and-forget
    }

    const accessToken = this.generateToken(user);
    return { accessToken, isNewUser, user };
  }

  // ─── Social Auth ────────────────────────────────────────────────────────────

  async socialAuth(dto: SocialAuthDto): Promise<{ accessToken: string; isNewUser: boolean; user: User }> {
    switch (dto.provider) {
      case SocialProvider.GOOGLE:
        return this.googleAuth(dto.idToken);
      case SocialProvider.FACEBOOK:
        return this.facebookAuth(dto.idToken);
      case SocialProvider.APPLE:
        return this.appleAuth(dto.idToken);
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  private async googleAuth(idToken: string) {
    let payload: any;
    try {
      // Ban check happens after token verification when we have the email
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { sub: googleId, email, name } = payload;

    if (email) await this.checkBanned(BanType.EMAIL, email);

    let user = await this.userRepository.findOne({
      where: [{ googleId }, { email }],
    });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ googleId, email, name });
      await this.userRepository.save(user);
    } else if (!user.googleId) {
      user.googleId = googleId;
      await this.userRepository.save(user);
    }

    return { accessToken: this.generateToken(user), isNewUser, user };
  }

  private async facebookAuth(accessToken: string) {
    // Verify Facebook token by calling Graph API
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
    );
    if (!res.ok) throw new UnauthorizedException('Invalid Facebook token');

    const fbData: any = await res.json();
    if (fbData.error) throw new UnauthorizedException('Invalid Facebook token');

    const { id: facebookId, email, name } = fbData;

    let user = await this.userRepository.findOne({
      where: [{ facebookId }, ...(email ? [{ email }] : [])],
    });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ facebookId, email, name });
      await this.userRepository.save(user);
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      await this.userRepository.save(user);
    }

    return { accessToken: this.generateToken(user), isNewUser, user };
  }

  private async appleAuth(idToken: string) {
    let appleData: any;
    try {
      appleData = await appleSignIn.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException('Invalid Apple token');
    }

    const { sub: appleId, email } = appleData;

    let user = await this.userRepository.findOne({
      where: [{ appleId }, ...(email ? [{ email }] : [])],
    });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ appleId, email });
      await this.userRepository.save(user);
    } else if (!user.appleId) {
      user.appleId = appleId;
      await this.userRepository.save(user);
    }

    return { accessToken: this.generateToken(user), isNewUser, user };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async notifyAdmins(user: User): Promise<void> {
    try {
      const admins = await this.userRepository.find({ where: { isAdmin: true, isActive: true } });
      const adminEmails = admins.map((a) => a.email).filter(Boolean);
      if (adminEmails.length) {
        await this.mailService.sendNewUserAlertToAdmins(adminEmails, {
          id: user.id, name: user.name, email: user.email, phone: user.phone,
          role: user.role, city: user.city, country: user.country, createdAt: user.createdAt,
        });
      }
    } catch { /* non-critical */ }
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
    });
  }

  async getProfile(userId: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }

  async consumeResetToken(token: string): Promise<{ accessToken: string }> {
    const reset = await this.resetRepository.findOne({ where: { token, isUsed: false } });
    if (!reset || new Date(reset.expiresAt) < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }
    reset.isUsed = true;
    await this.resetRepository.save(reset);

    const user = await this.userRepository.findOne({ where: { id: reset.userId } });
    if (!user || user.isBanned) throw new UnauthorizedException('Account not accessible');

    return { accessToken: this.generateToken(user) };
  }
}
