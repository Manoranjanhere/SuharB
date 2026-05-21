import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export class SocialAuthDto {
  @ApiProperty({ enum: SocialProvider })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({ description: 'ID token from the social provider SDK' })
  @IsString()
  idToken: string;
}

export class RegisterDeviceDto {
  @ApiProperty({ example: 'fcm_token_here' })
  @IsString()
  fcmToken: string;

  @ApiProperty({ enum: ['ios', 'android'] })
  @IsString()
  platform: 'ios' | 'android';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appVersion?: string;
}
