import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

import { User, ProfileStage } from './entities/user.entity';
import { UserPhoto } from './entities/user-photo.entity';
import { CompleteStage1Dto } from './dto/complete-profile.dto';
import { UploadPhotoBase64Dto } from './dto/upload-photo-base64.dto';
import { CoinsService } from '../coins/coins.service';
import {
  decodeBase64Image,
  multerFileFromBuffer,
} from '../common/utils/image-buffer.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private s3: AWS.S3;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPhoto)
    private readonly photoRepository: Repository<UserPhoto>,
    private readonly coinsService: CoinsService,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  // ─── Stage 1: Basic Profile ─────────────────────────────────────────────

  async completeStage1(userId: string, dto: CompleteStage1Dto): Promise<User> {
    const user = await this.findById(userId);
    const previousReferral = user.referredByCode;

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Generate referral code if not already set
    if (!user.referralCode) {
      user.referralCode = randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
    }

    Object.assign(user, {
      name: dto.name,
      gender: dto.gender,
      age: dto.age,
      city: dto.city,
      country: dto.country,
      role: dto.role,
      ...(dto.email ? { email: dto.email } : {}),
      ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      ...(dto.turnOns ? { turnOns: dto.turnOns } : {}),
      ...(dto.turnOffs ? { turnOffs: dto.turnOffs } : {}),
      profileStage: ProfileStage.STAGE1_COMPLETE,
      ...(dto.referredByCode ? { referredByCode: dto.referredByCode } : {}),
      // Female fields
      ...(dto.weeklyAllowanceExpectation !== undefined ? { weeklyAllowanceExpectation: dto.weeklyAllowanceExpectation } : {}),
      // Male fields
      ...(dto.canProvideAllowance !== undefined ? { canProvideAllowance: dto.canProvideAllowance } : {}),
      ...(dto.weeklyAllowanceAmount !== undefined ? { weeklyAllowanceAmount: dto.weeklyAllowanceAmount } : {}),
      ...(dto.canProvideAccommodation !== undefined ? { canProvideAccommodation: dto.canProvideAccommodation } : {}),
      ...(dto.accommodationType ? { accommodationType: dto.accommodationType } : {}),
    });

    const saved = await this.userRepository.save(user);

    if (dto.referredByCode && !previousReferral) {
      await this.coinsService.processReferral(userId, dto.referredByCode);
    }

    return saved;
  }

  async ensureReferralCode(userId: string): Promise<{ referralCode: string }> {
    const user = await this.findById(userId);
    if (!user.referralCode) {
      user.referralCode = randomBytes(3).toString('hex').toUpperCase();
      await this.userRepository.save(user);
    }
    return { referralCode: user.referralCode };
  }

  // ─── Stage 2: Photos ────────────────────────────────────────────────────

  async uploadPhotoFromBase64(
    userId: string,
    dto: UploadPhotoBase64Dto,
  ): Promise<UserPhoto> {
    const { buffer } = decodeBase64Image(dto.image);
    const mimeType =
      dto.mimeType?.startsWith('image/') ? dto.mimeType : 'image/jpeg';
    const ext =
      mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const file = multerFileFromBuffer(
      buffer,
      mimeType,
      dto.fileName || `photo.${ext}`,
    );
    return this.uploadPhoto(userId, file, dto.order);
  }

  async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
    order: number,
  ): Promise<UserPhoto> {
    const user = await this.findById(userId);

    if (user.profileStage < ProfileStage.STAGE1_COMPLETE) {
      throw new BadRequestException('Complete Stage 1 before uploading photos');
    }

    const existingPhotos = await this.photoRepository.find({
      where: { userId },
    });

    if (existingPhotos.length >= 6) {
      throw new BadRequestException('Maximum 6 photos allowed');
    }

    // Upload to S3
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket || !process.env.AWS_ACCESS_KEY_ID) {
      this.logger.error('AWS S3 is not configured (missing bucket or access key)');
      throw new BadRequestException(
        'Photo storage is not configured on the server. Contact support.',
      );
    }

    const contentType =
      file.mimetype?.startsWith('image/') ? file.mimetype : 'image/jpeg';
    const s3Key = `photos/${userId}/${uuidv4()}-${file.originalname}`;

    let uploadResult: AWS.S3.ManagedUpload.SendData;
    try {
      uploadResult = await this.s3
        .upload({
          Bucket: bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: contentType,
        })
        .promise();
    } catch (err: any) {
      this.logger.error(
        `S3 upload failed user=${userId} code=${err?.code} message=${err?.message}`,
      );
      throw new BadRequestException(
        err?.code === 'NoSuchBucket'
          ? 'Photo storage bucket is missing on the server.'
          : err?.code === 'InvalidAccessKeyId' || err?.code === 'SignatureDoesNotMatch'
            ? 'Photo storage credentials are invalid on the server.'
            : 'Could not save photo. Try again.',
      );
    }

    const photo = this.photoRepository.create({
      userId,
      url: uploadResult.Location,
      s3Key,
      order,
      isPrimary: existingPhotos.length === 0,
    });

    const savedPhoto = await this.photoRepository.save(photo);

    // Update profileStage after first photo
    const totalPhotos = existingPhotos.length + 1;
    if (totalPhotos >= 1 && user.profileStage === ProfileStage.STAGE1_COMPLETE) {
      user.profileStage = ProfileStage.STAGE2_COMPLETE;
      await this.userRepository.save(user);
    }

    return {
      ...savedPhoto,
      url: this.withCacheBuster(savedPhoto.url, savedPhoto.id),
    };
  }

  async getUserPhotos(userId: string): Promise<UserPhoto[]> {
    const photos = await this.photoRepository.find({
      where: { userId },
      order: { order: 'ASC' },
    });

    return photos.map((photo) => ({
      ...photo,
      url: this.withCacheBuster(photo.url, photo.id),
    }));
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    // Delete from S3
    await this.s3
      .deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: photo.s3Key,
      })
      .promise();

    await this.photoRepository.remove(photo);
  }

  async reorderPhotos(
    userId: string,
    photoOrders: { photoId: string; order: number }[],
  ): Promise<void> {
    for (const item of photoOrders) {
      await this.photoRepository.update(
        { id: item.photoId, userId },
        { order: item.order },
      );
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private withCacheBuster(url: string, version: string): string {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${version}`;
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastActiveAt: new Date() });
  }

  // ─── Hide profile ─────────────────────────────────────────────────────────

  async hideProfile(userId: string, months: 1 | 2 | 3): Promise<{ hiddenUntil: Date }> {
    const hiddenUntil = new Date();
    hiddenUntil.setMonth(hiddenUntil.getMonth() + months);
    await this.userRepository.update(userId, { hiddenUntil });
    return { hiddenUntil };
  }

  async unhideProfile(userId: string): Promise<void> {
    await this.userRepository.update(userId, { hiddenUntil: null });
  }

  // ─── Delete account (soft delete + anonymise) ────────────────────────────

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findById(userId);

    // Anonymise PII before soft-deleting
    await this.userRepository.update(userId, {
      name: 'Deleted User',
      email: null,
      phone: null,
      googleId: null,
      facebookId: null,
      appleId: null,
      bio: null,
      isActive: false,
    });

    // Delete photos from S3
    const photos = await this.photoRepository.find({ where: { userId } });
    for (const photo of photos) {
      try {
        await this.s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: photo.s3Key,
        }).promise();
      } catch { /* best effort */ }
    }
    await this.photoRepository.delete({ userId });

    // Soft-delete the user record (sets deletedAt)
    await this.userRepository.softDelete(userId);

    return { message: 'Account deleted' };
  }
}
