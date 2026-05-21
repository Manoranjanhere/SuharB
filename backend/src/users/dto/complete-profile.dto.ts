import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsEmail,
  IsOptional,
  Length,
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender, UserRole } from '../entities/user.entity';

export class CompleteStage1Dto {
  @ApiProperty({ example: 'Alex Morgan' })
  @IsString()
  @Length(2, 60)
  name: string;

  @ApiProperty({ enum: UserGender })
  @IsEnum(UserGender)
  gender: UserGender;

  @ApiProperty({ example: 32, minimum: 18, maximum: 65 })
  @IsInt()
  @Min(18)
  @Max(65)
  age: number;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @Length(2, 100)
  city: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @Length(2, 100)
  country: string;

  @ApiProperty({ example: 'alex@gmail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: UserRole, description: 'professional or companion' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, description: 'Short bio (max 300 chars)' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  bio?: string;

  @ApiProperty({ required: false, isArray: true, example: ['Coffee', 'Travel', 'Fine dining'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  turnOns?: string[];

  @ApiProperty({ required: false, isArray: true, example: ['Smoking', 'Rudeness'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  turnOffs?: string[];

  @ApiProperty({ required: false, description: 'Referral code from a friend' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  referredByCode?: string;

  // ─── Female: allowance expectation ───────────────────────────────────────
  @ApiProperty({
    required: false,
    description: 'Weekly allowance expectation (INR) — for companions',
    enum: [5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000],
  })
  @IsOptional()
  @IsInt()
  @IsIn([5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000])
  weeklyAllowanceExpectation?: number;

  // ─── Male: allowance offer ────────────────────────────────────────────────
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canProvideAllowance?: boolean;

  @ApiProperty({
    required: false,
    enum: [5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000],
  })
  @IsOptional()
  @IsInt()
  @IsIn([5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000])
  weeklyAllowanceAmount?: number;

  // ─── Male: accommodation ──────────────────────────────────────────────────
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canProvideAccommodation?: boolean;

  @ApiProperty({ required: false, enum: ['live_in', 'independent_room'] })
  @IsOptional()
  @IsIn(['live_in', 'independent_room'])
  accommodationType?: string;
}
