import { IsString, IsIn, IsOptional, IsEnum, IsEmail, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BanType } from '../../auth/entities/banned-identity.entity';

export class ReportActionDto {
  @ApiProperty({ enum: ['dismiss', 'warn_user', 'remove_photo', 'ban_user'] })
  @IsString()
  @IsIn(['dismiss', 'warn_user', 'remove_photo', 'ban_user'])
  action: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminUserActionDto {
  @ApiProperty({ enum: ['ban', 'unban', 'make_admin', 'remove_admin', 'delete'] })
  @IsString()
  @IsIn(['ban', 'unban', 'make_admin', 'remove_admin', 'delete'])
  action: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BanIdentityDto {
  @ApiProperty({ enum: BanType })
  @IsEnum(BanType)
  type: BanType;

  @ApiProperty({ example: '+919876543210 | 192.168.1.1 | user@email.com' })
  @IsString()
  value: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  relatedUserId?: string;
}

export class MarketingNotificationDto {
  @ApiProperty({ example: '10 new Rich guys joined near you! 🔥' })
  @IsString()
  title: string;

  @ApiProperty({ example: "Check who's nearby and start chatting!" })
  @IsString()
  body: string;

  @ApiProperty({ required: false, example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, enum: ['male', 'female', 'other'] })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false, enum: ['professional', 'companion'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(18)
  minAge?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Max(65)
  maxAge?: number;

  @ApiProperty({ required: false, description: 'Extra data payload key-values' })
  @IsOptional()
  data?: Record<string, string>;
}

export class AdminSelfUpdateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
