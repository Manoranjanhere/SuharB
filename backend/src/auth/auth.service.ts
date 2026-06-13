import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignIn from 'apple-signin-auth';

import { User } from '../users/entities/user.entity';
import { BannedIdentity, BanType } from './entities/banned-identity.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { MailService } from '../common/services/mail.service';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyPhoneAuthDto } from './dto/verify-phone-auth.dto';
import { SocialAuthDto, SocialProvider } from './dto/social-auth.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BannedIdentity)
    private readonly banRepository: Repository<BannedIdentity>,
    @InjectRepository(PasswordReset)
    private readonly resetRepository: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {
    // No fixed client — we verify idTokens against all configured audiences.
    this.googleClient = new OAuth2Client();
  }

  private getGoogleTokenAudiences(): string[] {
    const fromEnv = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter((id): id is string => Boolean(id?.trim()));

    const defaults = [
      '887817604127-62iml2nfpdmcfl5b100riok8iepuo58l.apps.googleusercontent.com',
      '887817604127-mlu4ekvrjufocnnbgq1e6ekjanapmk84.apps.googleusercontent.com',
    ];

    return [...new Set([...fromEnv, ...defaults])];
  }

  private logGoogleTokenAudienceMismatch(idToken: string, expected: string[]): void {
    try {
      const payload = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'),
      );
      console.error('[Google] token aud:', payload.aud, 'expected one of:', expected);
    } catch {
      /* ignore decode errors */
    }
  }

  // ─── Ban check helper ─────────────────────────────────────────────────────

  private async checkBanned(type: BanType, value: string): Promise<void> {
    const ban = await this.banRepository.findOne({ where: { type, value: value.toLowerCase(), isActive: true } });
    if (ban) throw new UnauthorizedException(`This ${type} has been restricted. Contact support.`);
  }

  // ─── Phone OTP (Firebase SMS on client, token verified here) ───────────────

  async checkPhoneForAuth(dto: SendOtpDto): Promise<{ message: string }> {
    await this.checkBanned(BanType.PHONE, dto.phone);
    return { message: 'Phone number can receive OTP' };
  }

  async verifyPhoneAuth(dto: VerifyPhoneAuthDto): Promise<{ accessToken: string; isNewUser: boolean; user: User }> {
    const decoded = await this.firebaseAdmin.verifyIdToken(dto.idToken);

    const phone = decoded.phone_number;
    if (!phone) {
      throw new UnauthorizedException('Firebase token does not include a phone number');
    }

    await this.checkBanned(BanType.PHONE, phone);

    let user = await this.userRepository.findOne({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ phone });
      await this.userRepository.save(user);
      this.notifyAdmins(user);
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
    const audiences = this.getGoogleTokenAudiences();

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('[Google] verifyIdToken failed:', (err as Error)?.message);
      this.logGoogleTokenAudienceMismatch(idToken, audiences);
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
