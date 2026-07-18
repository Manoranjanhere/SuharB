import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { Report } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { BannedIdentity, BanType } from '../auth/entities/banned-identity.entity';
import { PasswordReset } from '../auth/entities/password-reset.entity';
import { Device } from '../devices/entities/device.entity';
import { ReportActionDto, AdminUserActionDto, BanIdentityDto, MarketingNotificationDto, AdminSelfUpdateDto } from './dto/admin.dto';
import { DevicesService } from '../devices/devices.service';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class AdminService {
  private s3: AWS.S3;

  constructor(
    @InjectRepository(Report)       private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)         private readonly userRepository: Repository<User>,
    @InjectRepository(UserPhoto)    private readonly photoRepository: Repository<UserPhoto>,
    @InjectRepository(BannedIdentity) private readonly banRepository: Repository<BannedIdentity>,
    @InjectRepository(PasswordReset)  private readonly resetRepository: Repository<PasswordReset>,
    @InjectRepository(Device)       private readonly deviceRepository: Repository<Device>,
    private readonly devicesService: DevicesService,
    private readonly mailService: MailService,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [totalUsers, activeUsers, pendingReports, bannedUsers, verifiedUsers, bannedIdentities] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.reportRepository.count({ where: { isReviewed: false } }),
      this.userRepository.count({ where: { isBanned: true } }),
      this.userRepository.count({ where: { photoVerifiedStatus: 'verified' } }),
      this.banRepository.count({ where: { isActive: true } }),
    ]);
    return { totalUsers, activeUsers, pendingReports, bannedUsers, verifiedUsers, bannedIdentities };
  }

  // ─── Reports ─────────────────────────────────────────────────────────────

  async getReports(page = 1, limit = 20, status?: 'pending' | 'reviewed') {
    const qb = this.reportRepository.createQueryBuilder('r')
      .leftJoinAndSelect('r.reporter', 'reporter')
      .leftJoinAndSelect('r.reportedUser', 'reported')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit).take(limit);
    if (status === 'pending') qb.where('r.isReviewed = false');
    if (status === 'reviewed') qb.where('r.isReviewed = true');
    const [reports, total] = await qb.getManyAndCount();
    return { reports, total, page, pages: Math.ceil(total / limit) };
  }

  async takeReportAction(reportId: string, dto: ReportActionDto, adminId: string): Promise<{ message: string }> {
    const report = await this.reportRepository.findOne({ where: { id: reportId }, relations: ['reportedUser'] });
    if (!report) throw new NotFoundException('Report not found');

    const reportedUser = report.reportedUser;

    switch (dto.action) {
      case 'dismiss': break;

      case 'warn_user': {
        const note = dto.note || 'Violation of community guidelines';
        await this.userRepository.update(report.reportedUserId, {
          accountWarningMessage: note,
          accountWarningAt: new Date(),
        });
        await this.devicesService.sendPushToUser(report.reportedUserId, {
          title: '⚠️ Account Warning',
          body: 'Your account has received a warning for violating community guidelines.',
          data: { type: 'warning' },
        });
        if (reportedUser?.email) {
          await this.mailService.sendAccountWarning(reportedUser.email, reportedUser.name, note);
        }
        break;
      }

      case 'remove_photo':
        if (report.reportedPhotoId) {
          const photo = await this.photoRepository.findOne({ where: { id: report.reportedPhotoId } });
          if (photo) {
            try { await this.s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: photo.s3Key }).promise(); } catch { }
            await this.photoRepository.remove(photo);
          }
          await this.devicesService.sendPushToUser(report.reportedUserId, {
            title: '📸 Photo Removed', body: 'A photo was removed for violating guidelines.', data: { type: 'photo_removed' },
          });
        }
        break;

      case 'ban_user':
        await this.banAccount(report.reportedUserId, adminId, dto.note || `Banned via report ${reportId}`);
        break;
    }

    report.isReviewed = true;
    await this.reportRepository.save(report);
    return { message: `Action "${dto.action}" applied` };
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string) {
    const qb = this.userRepository.createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search?.trim()) {
      qb.where(
        '(u.name ILIKE :s OR u.email ILIKE :s OR u.phone ILIKE :s OR u.id::text ILIKE :s)',
        { s: `%${search.trim()}%` },
      );
    }
    const [users, total] = await qb.getManyAndCount();
    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async getUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const photos = await this.photoRepository.find({ where: { userId }, order: { order: 'ASC' } });
    return { ...user, photos };
  }

  /** Ban account + phone/email identities so Bans tab & login blocks stay in sync */
  private async banAccount(userId: string, adminId: string, reason: string): Promise<User> {
    const target = await this.userRepository.findOne({ where: { id: userId } });
    if (!target) throw new NotFoundException('User not found');

    await this.userRepository.update(userId, { isBanned: true, isActive: false });

    if (target.phone) {
      await this.addBan(adminId, {
        type: BanType.PHONE,
        value: target.phone,
        reason,
        relatedUserId: userId,
      });
    }
    if (target.email) {
      await this.addBan(adminId, {
        type: BanType.EMAIL,
        value: target.email,
        reason,
        relatedUserId: userId,
      });
    }
    // Always record a device_id-style marker with user id so every ban has an identity row
    await this.addBan(adminId, {
      type: BanType.DEVICE_ID,
      value: `user:${userId}`,
      reason,
      relatedUserId: userId,
    });

    await this.devicesService.sendPushToUser(userId, {
      title: '🚫 Account Suspended',
      body: reason || 'Your account has been suspended.',
      data: { type: 'banned' },
    });

    return target;
  }

  private async unbanAccount(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isBanned: false, isActive: true });
    await this.banRepository.update({ relatedUserId: userId, isActive: true }, { isActive: false });
  }

  async adminUserAction(userId: string, dto: AdminUserActionDto, adminUser: User): Promise<{ message: string }> {
    const target = await this.userRepository.findOne({ where: { id: userId } });
    if (!target) throw new NotFoundException('User not found');

    if ((dto.action === 'make_admin' || dto.action === 'remove_admin') && !adminUser.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admin can manage admin roles');
    }

    switch (dto.action) {
      case 'ban':
        await this.banAccount(userId, adminUser.id, dto.reason || 'Admin ban');
        break;
      case 'unban':
        await this.unbanAccount(userId);
        break;
      case 'make_admin':
        await this.userRepository.update(userId, { isAdmin: true });
        break;
      case 'remove_admin':
        if (target.isSuperAdmin) throw new ForbiddenException('Cannot demote a super admin');
        await this.userRepository.update(userId, { isAdmin: false });
        break;
      case 'delete':
        await this.hardDeleteUser(userId);
        break;
    }
    return { message: `Action "${dto.action}" applied to ${target.name || userId}` };
  }

  private async hardDeleteUser(userId: string): Promise<void> {
    const photos = await this.photoRepository.find({ where: { userId } });
    for (const photo of photos) {
      try { await this.s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: photo.s3Key }).promise(); } catch { }
    }
    await this.banRepository.update({ relatedUserId: userId, isActive: true }, { isActive: false });
    await this.userRepository.update(userId, { name: 'Deleted User', email: null, phone: null, googleId: null, facebookId: null, appleId: null, bio: null, isActive: false, isBanned: true });
    await this.userRepository.softDelete(userId);
  }

  // ─── Banned Identities ────────────────────────────────────────────────────

  async addBan(adminId: string, dto: { type: BanType; value: string; reason?: string; relatedUserId?: string }): Promise<BannedIdentity> {
    const value =
      dto.type === BanType.EMAIL
        ? dto.value.toLowerCase().trim()
        : dto.value.trim();
    const existing = await this.banRepository.findOne({ where: { type: dto.type, value, isActive: true } });
    if (existing) return existing;
    return this.banRepository.save(this.banRepository.create({
      type: dto.type, value,
      reason: dto.reason, bannedByAdminId: adminId,
      relatedUserId: dto.relatedUserId, isActive: true,
    }));
  }

  async addBanFromAdmin(adminId: string, dto: BanIdentityDto): Promise<{ message: string }> {
    await this.addBan(adminId, { type: dto.type, value: dto.value, reason: dto.reason, relatedUserId: dto.relatedUserId });
    // If banning an email/phone that matches a user, also mark that account banned
    if (dto.type === BanType.EMAIL || dto.type === BanType.PHONE) {
      const value = dto.type === BanType.EMAIL ? dto.value.toLowerCase().trim() : dto.value.trim();
      const matched = await this.userRepository.findOne({
        where: dto.type === BanType.EMAIL ? { email: value } : { phone: value },
      });
      if (matched && !matched.isBanned) {
        await this.banAccount(matched.id, adminId, dto.reason || `Banned via ${dto.type}`);
      }
    }
    return { message: `${dto.type} "${dto.value}" has been banned` };
  }

  async removeBan(banId: string): Promise<{ message: string }> {
    const ban = await this.banRepository.findOne({ where: { id: banId } });
    if (!ban) throw new NotFoundException('Ban not found');
    await this.banRepository.update(banId, { isActive: false });

    // If this was the user marker (device_id user:uuid), unban the account too
    if (ban.type === BanType.DEVICE_ID && ban.value.startsWith('user:') && ban.relatedUserId) {
      await this.unbanAccount(ban.relatedUserId);
    }
    return { message: 'Ban lifted successfully' };
  }

  /**
   * Full bans listing: every banned user account + active phone/email/ip blocks.
   */
  async getBans(type?: BanType, page = 1, limit = 50) {
    const bannedUsers = await this.userRepository.find({
      where: { isBanned: true },
      order: { updatedAt: 'DESC' },
      take: Math.min(limit, 100),
    });

    const where: any = { isActive: true };
    if (type) where.type = type;
    const [identities, totalIdentities] = await this.banRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich identity rows that are user markers
    const identitiesView = identities.map((b) => ({
      ...b,
      isUserMarker: b.type === BanType.DEVICE_ID && b.value.startsWith('user:'),
      displayValue:
        b.type === BanType.DEVICE_ID && b.value.startsWith('user:')
          ? b.value.replace('user:', '')
          : b.value,
    }));

    return {
      bannedUsers,
      identities: identitiesView,
      bans: identitiesView, // backward compatible for older clients
      total: bannedUsers.length,
      totalIdentities,
      page,
      pages: Math.ceil(totalIdentities / limit) || 1,
    };
  }

  async isBanned(type: BanType, value: string): Promise<boolean> {
    const normalized = type === BanType.EMAIL ? value.toLowerCase().trim() : value.trim();
    const ban = await this.banRepository.findOne({ where: { type, value: normalized, isActive: true } });
    return !!ban;
  }

  // ─── Password Reset (admin-triggered) ────────────────────────────────────

  async sendPasswordResetLink(userId: string, adminId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.email) throw new BadRequestException('User has no email address');

    // Invalidate existing tokens
    await this.resetRepository.update({ userId, isUsed: false }, { isUsed: true });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.resetRepository.save(this.resetRepository.create({ userId, token, expiresAt, initiatedByAdminId: adminId }));
    await this.mailService.sendPasswordResetLink(user.email, user.name || 'User', token);

    return { message: `Password reset link sent to ${user.email}` };
  }

  async consumeResetToken(token: string): Promise<{ accessToken: string }> {
    const reset = await this.resetRepository.findOne({ where: { token, isUsed: false } });
    if (!reset || new Date(reset.expiresAt) < new Date()) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    reset.isUsed = true;
    await this.resetRepository.save(reset);

    // Return a new JWT (handled by AuthService — just return userId for now)
    return { accessToken: reset.userId }; // Auth service will issue actual JWT
  }

  // ─── Marketing Push Notifications ─────────────────────────────────────────

  async sendMarketingNotification(dto: MarketingNotificationDto): Promise<{ sent: number; message: string }> {
    const qb = this.userRepository.createQueryBuilder('u')
      .where('u."isActive" = :isActive', { isActive: true })
      .andWhere('u."isBanned" = :isBanned', { isBanned: false })
      .andWhere('u."deletedAt" IS NULL');

    if (dto.country) qb.andWhere('u."country" ILIKE :country', { country: `%${dto.country.trim()}%` });
    if (dto.city) qb.andWhere('u."city" ILIKE :city', { city: `%${dto.city.trim()}%` });
    if (dto.gender) qb.andWhere('u."gender" = :gender', { gender: dto.gender });
    if (dto.role) qb.andWhere('u."role" = :role', { role: dto.role });
    if (dto.minAge) qb.andWhere('u."age" >= :minAge', { minAge: dto.minAge });
    if (dto.maxAge) qb.andWhere('u."age" <= :maxAge', { maxAge: dto.maxAge });

    const users = await qb.select(['u.id']).getMany();
    const userIds = users.map((u) => u.id);

    if (!userIds.length) return { sent: 0, message: 'No users matched the criteria' };

    // Get all FCM tokens
    const devices = await this.deviceRepository.find({ where: { userId: In(userIds) } });
    const tokens = [...new Set(devices.map((d) => d.fcmToken))];

    if (!tokens.length) return { sent: 0, message: 'No device tokens found — users must open the app after login so FCM can register' };

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    let sent = 0;
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      return {
        sent: 0,
        message: 'Firebase Admin not initialized on server — check FIREBASE_* env vars',
      };
    }

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: dto.title, body: dto.body },
          data: { type: 'marketing', ...(dto.data || {}) },
          android: { priority: 'normal' },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        sent += batch.length;
      } catch (err) {
        // Continue even if a batch fails
      }
    }

    return { sent, message: `Notification sent to ${sent} devices across ${userIds.length} users` };
  }

  // ─── Admin Self Management ────────────────────────────────────────────────

  async updateSelf(adminId: string, dto: AdminSelfUpdateDto): Promise<User> {
    const updates: Partial<User> = {};
    if (dto.name) updates.name = dto.name;
    if (dto.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== adminId) throw new BadRequestException('Email already in use');
      updates.email = dto.email;
    }
    await this.userRepository.update(adminId, updates);
    return this.userRepository.findOne({ where: { id: adminId } });
  }

  // ─── Notify admins of new user ────────────────────────────────────────────

  async notifyAdminsOfNewUser(user: User): Promise<void> {
    const admins = await this.userRepository.find({ where: { isAdmin: true, isActive: true } });
    const adminEmails = admins.map((a) => a.email).filter(Boolean);
    if (!adminEmails.length) return;
    await this.mailService.sendNewUserAlertToAdmins(adminEmails, {
      id: user.id, name: user.name, email: user.email, phone: user.phone,
      role: user.role, city: user.city, country: user.country, createdAt: user.createdAt,
    });
  }
}
