import { IsOptional, IsNumber, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from '../../users/entities/user.entity';

export class UpdateLocationDto {
  @ApiProperty({ example: 19.076 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 72.8777 })
  @IsNumber()
  longitude: number;
}

export class DiscoverQueryDto {
  @ApiProperty({ required: false, default: 50, description: 'Max distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  maxDistance?: number = 50;

  @ApiProperty({ required: false, default: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  minAge?: number = 18;

  @ApiProperty({ required: false, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(65)
  maxAge?: number = 60;

  @ApiProperty({ required: false, enum: UserGender })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiProperty({ required: false, enum: ['professional', 'companion'] })
  @IsOptional()
  role?: 'professional' | 'companion';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  // ─── Female filter: minimum weekly allowance from male ────────────────────
  @ApiProperty({ required: false, description: 'Min weekly allowance offered by male (INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minAllowance?: number;

  // ─── Male filter: accommodation preference ────────────────────────────────
  @ApiProperty({ required: false, enum: ['live_in', 'independent_room'] })
  @IsOptional()
  accommodationType?: string;

  // ─── Show verified only ───────────────────────────────────────────────────
  @ApiProperty({ required: false })
  @IsOptional()
  verifiedOnly?: boolean;
}
