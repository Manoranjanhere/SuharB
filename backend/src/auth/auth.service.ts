import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
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
import { AuditService } from '../audits/audits.service';
import { AccountActivityName, LoginActivityName } from '../audits/audit.constants';

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
    private readonly auditService: AuditService,
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

  /** Digits-only so +91 98765… and 98765… match the same ban */
  private normalizePhone(value: string): string {
    return value.replace(/\D/g, '');
  }

  private async checkBanned(type: BanType, value: string): Promise<void> {
    if (type === BanType.PHONE) {
      const digits = this.normalizePhone(value);
      if (!digits) return;

      // Use query builder — safer than enum find across TypeORM/Postgres versions
      const bans = await this.banRepository
        .createQueryBuilder('b')
        .where('b.type = :type', { type: 'phone' })
        .andWhere('b.isActive = true')
        .getMany();

      const hit = bans.some((b) => {
        const bannedDigits = this.normalizePhone(b.value);
        if (!bannedDigits) return false;
        return (
          bannedDigits === digits ||
          digits.endsWith(bannedDigits) ||
          bannedDigits.endsWith(digits)
        );
      });
      if (hit) {
        throw new ForbiddenException(
          'This phone number has been banned. Contact support.',
        );
      }
      return;
    }

    const normalized = type === BanType.EMAIL ? value.toLowerCase().trim() : value.trim();
    const ban = await this.banRepository
      .createQueryBuilder('b')
      .where('b.type = :type', { type })
      .andWhere('b.value = :value', { value: normalized })
      .andWhere('b.isActive = true')
      .getOne();
    if (ban) {
      throw new ForbiddenException(
        `This ${type} has been banned. Contact support.`,
      );
    }
  }

  private assertUserNotBanned(user: User): void {
    if (user.isBanned || !user.isActive) {
      throw new ForbiddenException(
        'Your account has been suspended. Contact support.',
      );
    }
  }

  // ─── Phone OTP (Firebase SMS on client, token verified here) ───────────────

  async checkPhoneForAuth(dto: SendOtpDto): Promise<{ message: string }> {
    await this.checkBanned(BanType.PHONE, dto.phone);
    return { message: 'Phone number can receive OTP' };
  }

  async verifyPhoneAuth(
    dto: VerifyPhoneAuthDto,
    clientIp?: string | null,
  ): Promise<{ accessToken: string; isNewUser: boolean; user: User }> {
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
      await this.auditService.logAccount({
        forUser: user.id,
        byUser: user.id,
        activityName: AccountActivityName.ACCOUNT_CREATED,
        affectedDataName: 'AuthProvider',
        fromValue: null,
        toValue: 'phone',
        notes: clientIp ? `IP: ${clientIp}` : null,
      });
    }

    this.assertUserNotBanned(user);

    await this.auditService.logLogin({
      forUser: user.id,
      byUser: user.id,
      activityName: LoginActivityName.LOGIN_PHONE,
      affectedDataName: 'Phone',
      fromValue: null,
      toValue: phone,
      notes: clientIp ? `IP: ${clientIp}` : null,
    });

    const accessToken = this.generateToken(user);
    return { accessToken, isNewUser, user };
  }

  // ─── Social Auth ────────────────────────────────────────────────────────────

  async socialAuth(
    dto: SocialAuthDto,
    clientIp?: string | null,
  ): Promise<{ accessToken: string; isNewUser: boolean; user: User }> {
    switch (dto.provider) {
      case SocialProvider.GOOGLE:
        return this.googleAuth(dto.idToken, clientIp);
      case SocialProvider.FACEBOOK:
        return this.facebookAuth(dto.idToken, clientIp);
      case SocialProvider.APPLE:
        return this.appleAuth(dto.idToken, clientIp);
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  private async googleAuth(idToken: string, clientIp?: string | null) {
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
      where: email ? [{ googleId }, { email }] : [{ googleId }],
    });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ googleId, email, name });
      await this.userRepository.save(user);
      await this.auditService.logAccount({
        forUser: user.id,
        byUser: user.id,
        activityName: AccountActivityName.ACCOUNT_CREATED,
        affectedDataName: 'AuthProvider',
        fromValue: null,
        toValue: 'google',
        notes: clientIp ? `IP: ${clientIp}` : null,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await this.userRepository.save(user);
    }

    this.assertUserNotBanned(user);

    await this.auditService.logLogin({
      forUser: user.id,
      byUser: user.id,
      activityName: LoginActivityName.LOGIN_GOOGLE,
      affectedDataName: 'Email',
      fromValue: null,
      toValue: email || googleId,
      notes: clientIp ? `IP: ${clientIp}` : null,
    });

    return { accessToken: this.generateToken(user), isNewUser, user };
  }

  private async facebookAuth(accessToken: string, clientIp?: string | null) {
    // Verify Facebook token by calling Graph API
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
    );
    if (!res.ok) throw new UnauthorizedException('Invalid Facebook token');

    const fbData: any = await res.json();
    if (fbData.error) throw new UnauthorizedException('Invalid Facebook token');

    const { id: facebookId, email, name } = fbData;

    if (email) await this.checkBanned(BanType.EMAIL, email);

    let user = await this.userRepository.findOne({
      where: [{ facebookId }, ...(email ? [{ email }] : [])],
    });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ facebookId, email, name });
      await this.userRepository.save(user);
      await this.auditService.logAccount({
        forUser: user.id,
        byUser: user.id,
        activityName: AccountActivityName.ACCOUNT_CREATED,
        affectedDataName: 'AuthProvider',
        fromValue: null,
        toValue: 'facebook',
        notes: clientIp ? `IP: ${clientIp}` : null,
      });
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      await this.userRepository.save(user);
    }

    this.assertUserNotBanned(user);

    await this.auditService.logLogin({
      forUser: user.id,
      byUser: user.id,
      activityName: LoginActivityName.LOGIN_FACEBOOK,
      affectedDataName: 'Email',
      fromValue: null,
      toValue: email || facebookId,
      notes: clientIp ? `IP: ${clientIp}` : null,
    });

    return { accessToken: this.generateToken(user), isNewUser, user };
  }

  private async appleAuth(idToken: string, clientIp?: string | null) {
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

    if (email) await this.checkBanned(BanType.EMAIL, email);

    let user = await this.userRepository.findOne({
      where: [{ appleId }, ...(email ? [{ email }] : [])],
    });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({ appleId, email });
      await this.userRepository.save(user);
      await this.auditService.logAccount({
        forUser: user.id,
        byUser: user.id,
        activityName: AccountActivityName.ACCOUNT_CREATED,
        affectedDataName: 'AuthProvider',
        fromValue: null,
        toValue: 'apple',
        notes: clientIp ? `IP: ${clientIp}` : null,
      });
    } else if (!user.appleId) {
      user.appleId = appleId;
      await this.userRepository.save(user);
    }

    this.assertUserNotBanned(user);

    await this.auditService.logLogin({
      forUser: user.id,
      byUser: user.id,
      activityName: LoginActivityName.LOGIN_APPLE,
      affectedDataName: 'Email',
      fromValue: null,
      toValue: email || appleId,
      notes: clientIp ? `IP: ${clientIp}` : null,
    });

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

  async consumeResetToken(
    token: string,
    clientIp?: string | null,
  ): Promise<{ accessToken: string }> {
    const reset = await this.resetRepository.findOne({ where: { token, isUsed: false } });
    if (!reset || new Date(reset.expiresAt) < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }
    reset.isUsed = true;
    await this.resetRepository.save(reset);

    const user = await this.userRepository.findOne({ where: { id: reset.userId } });
    if (!user || user.isBanned) throw new UnauthorizedException('Account not accessible');

    await this.auditService.logLogin({
      forUser: user.id,
      byUser: user.id,
      activityName: LoginActivityName.LOGIN_RESET_TOKEN,
      affectedDataName: 'ResetToken',
      fromValue: null,
      toValue: 'consumed',
      notes: clientIp ? `IP: ${clientIp}` : null,
    });

    return { accessToken: this.generateToken(user) };
  }
}
