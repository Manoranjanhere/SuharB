import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';
import { UserPhoto } from './entities/user-photo.entity';

const FACE_MATCH_THRESHOLD = 85; // 85%+ confidence = verified

@Injectable()
export class PhotoVerificationService {
  private s3: AWS.S3;
  private rekognition: AWS.Rekognition;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPhoto)
    private readonly photoRepository: Repository<UserPhoto>,
  ) {
    const awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-south-1',
    };
    this.s3 = new AWS.S3(awsConfig);
    this.rekognition = new AWS.Rekognition(awsConfig);
  }

  async verifySelfie(
    userId: string,
    selfieFile: Express.Multer.File,
  ): Promise<{ status: string; confidence?: number; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Get primary profile photo
    const primaryPhoto = await this.photoRepository.findOne({
      where: { userId, isPrimary: true },
    });
    if (!primaryPhoto) {
      const firstPhoto = await this.photoRepository.findOne({
        where: { userId },
        order: { order: 'ASC' },
      });
      if (!firstPhoto) {
        throw new BadRequestException('Upload at least one profile photo before verifying');
      }
    }

    const profilePhoto = primaryPhoto || await this.photoRepository.findOne({
      where: { userId },
      order: { order: 'ASC' },
    });

    // Mark as pending
    await this.userRepository.update(userId, { photoVerifiedStatus: 'pending' });

    // Upload selfie to S3
    const selfieKey = `selfies/${userId}/${uuidv4()}.jpg`;
    await this.s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: selfieKey,
      Body: selfieFile.buffer,
      ContentType: selfieFile.mimetype,
    }).promise();

    if (
      process.env.NODE_ENV !== 'production' &&
      (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'your_aws_access_key')
    ) {
      // Dev only: skip real AI when AWS is not configured
      await this.userRepository.update(userId, {
        photoVerifiedStatus: 'verified',
        selfieS3Key: selfieKey,
        faceMatchConfidence: 99,
        isVerified: true,
      });
      return { status: 'verified', confidence: 99, message: '[DEV] Photo verification bypassed' };
    }

    try {
      // Call AWS Rekognition CompareFaces
      const profilePhotoKey = profilePhoto.s3Key;

      const result = await this.rekognition.compareFaces({
        SourceImage: {
          S3Object: { Bucket: process.env.AWS_S3_BUCKET, Name: selfieKey },
        },
        TargetImage: {
          S3Object: { Bucket: process.env.AWS_S3_BUCKET, Name: profilePhotoKey },
        },
        SimilarityThreshold: 50,
      }).promise();

      const topMatch = result.FaceMatches?.[0];
      const confidence = topMatch?.Similarity || 0;

      if (!topMatch) {
        await this.userRepository.update(userId, {
          photoVerifiedStatus: 'failed',
          selfieS3Key: selfieKey,
          faceMatchConfidence: 0,
        });
        return {
          status: 'failed',
          confidence: 0,
          message: '❌ Verification failed. Use a clear selfie that matches your main profile photo.',
        };
      }

      const isVerified = confidence >= FACE_MATCH_THRESHOLD;
      const status = isVerified ? 'verified' : 'failed';

      await this.userRepository.update(userId, {
        photoVerifiedStatus: status,
        selfieS3Key: selfieKey,
        faceMatchConfidence: confidence,
        ...(isVerified ? { isVerified: true } : {}),
      });

      return {
        status,
        confidence: Math.round(confidence),
        message: isVerified
          ? `✅ Verified! ${Math.round(confidence)}% face match`
          : `❌ Verification failed. Face match too low (${Math.round(confidence)}%). Use a clear frontal photo.`,
      };
    } catch (err) {
      await this.userRepository.update(userId, { photoVerifiedStatus: 'failed' });
      throw new BadRequestException('Photo verification service error. Please try again.');
    }
  }

  async getVerificationStatus(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'photoVerifiedStatus', 'faceMatchConfidence', 'isVerified'],
    });
    return user;
  }
}
