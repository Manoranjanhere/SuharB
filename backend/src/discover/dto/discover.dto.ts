import { IsOptional, IsNumber, IsEnum, IsInt, Min, Max, IsIn, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from '../../users/entities/user.entity';

export const WEEKLY_ALLOWANCE_FILTER_VALUES = [
  5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000,
] as const;

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

  // ─── Male filter: minimum weekly allowance offered ────────────────────────
  @ApiProperty({ required: false, description: 'Min weekly allowance offered by male (INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...WEEKLY_ALLOWANCE_FILTER_VALUES])
  minAllowance?: number;

  // ─── Female filter: weekly allowance expectation ──────────────────────────
  @ApiProperty({ required: false, description: 'Filter companions by weekly allowance expectation (INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...WEEKLY_ALLOWANCE_FILTER_VALUES])
  weeklyAllowanceFilter?: number;

  // ─── Male filter: accommodation preference ────────────────────────────────
  @ApiProperty({ required: false, enum: ['live_in', 'independent_room'] })
  @IsOptional()
  accommodationType?: string;

  // ─── Show verified only ───────────────────────────────────────────────────
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;
}
