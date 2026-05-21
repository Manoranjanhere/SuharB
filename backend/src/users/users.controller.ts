import {
  Controller,
  Patch,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { UsersService } from './users.service';
import { PhotoVerificationService } from './photo-verification.service';
import { CompleteStage1Dto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('Users / Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly photoVerificationService: PhotoVerificationService,
  ) {}

  // ─── Stage 1 ─────────────────────────────────────────────────────────────

  @Patch('profile/stage1')
  @ApiOperation({ summary: 'Complete Stage 1: name, gender, age, city, country, role' })
  completeStage1(@CurrentUser() user: User, @Body() dto: CompleteStage1Dto) {
    return this.usersService.completeStage1(user.id, dto);
  }

  // ─── Stage 2 – Photos ────────────────────────────────────────────────────

  @Post('profile/photos')
  @ApiOperation({ summary: 'Upload a profile photo (max 6)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
        order: { type: 'integer', minimum: 0, maximum: 5 },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only JPEG, PNG, WEBP images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('order', ParseIntPipe) order: number,
  ) {
    return this.usersService.uploadPhoto(user.id, file, order);
  }

  @Get('profile/photos')
  @ApiOperation({ summary: 'Get all photos of current user' })
  getMyPhotos(@CurrentUser() user: User) {
    return this.usersService.getUserPhotos(user.id);
  }

  @Delete('profile/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a profile photo' })
  deletePhoto(@CurrentUser() user: User, @Param('photoId') photoId: string) {
    return this.usersService.deletePhoto(user.id, photoId);
  }

  @Patch('profile/photos/reorder')
  @ApiOperation({ summary: 'Reorder profile photos' })
  reorderPhotos(
    @CurrentUser() user: User,
    @Body() body: { photos: { photoId: string; order: number }[] },
  ) {
    return this.usersService.reorderPhotos(user.id, body.photos);
  }

  // ─── Photo Verification ───────────────────────────────────────────────────

  @Post('verify/selfie')
  @ApiOperation({ summary: 'Upload selfie to verify identity via AWS Rekognition face match' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { selfie: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('selfie', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only JPEG, PNG, WEBP images allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  verifySelfie(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.photoVerificationService.verifySelfie(user.id, file);
  }

  @Get('verify/status')
  @ApiOperation({ summary: 'Get photo verification status' })
  getVerificationStatus(@CurrentUser() user: User) {
    return this.photoVerificationService.getVerificationStatus(user.id);
  }

  // ─── Profile Visibility ───────────────────────────────────────────────────

  @Patch('profile/hide')
  @ApiOperation({ summary: 'Hide profile from discover for 1, 2 or 3 months' })
  hideProfile(
    @CurrentUser() user: User,
    @Body('months') months: 1 | 2 | 3,
  ) {
    return this.usersService.hideProfile(user.id, months);
  }

  @Patch('profile/unhide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make profile visible again before hidden period ends' })
  unhideProfile(@CurrentUser() user: User) {
    return this.usersService.unhideProfile(user.id);
  }

  // ─── Account Deletion ─────────────────────────────────────────────────────

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request account + data deletion (soft delete, purged in 30 days)' })
  deleteAccount(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }
}
