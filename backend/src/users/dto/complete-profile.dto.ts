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
  ArrayUnique,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserGender, UserRole } from '../entities/user.entity';
import {
  COMPANY_FOR_OPTIONS,
  COMPANY_FOR_LIMITS,
  DIET_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MAX_HEIGHT_CM,
  MIN_HEIGHT_CM,
  ORIENTATION_OPTIONS,
  UPBRINGING_OPTIONS,
} from '../profile-options';
import { SubscriptionTier } from '../../subscriptions/subscription.constants';

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

  // ─── "I am" ───────────────────────────────────────────────────────────────
  @ApiProperty({ required: false, minimum: MIN_HEIGHT_CM, maximum: MAX_HEIGHT_CM })
  @IsOptional()
  @IsInt()
  @Min(MIN_HEIGHT_CM)
  @Max(MAX_HEIGHT_CM)
  heightCm?: number | null;

  @ApiProperty({ required: false, enum: DIET_OPTIONS })
  @IsOptional()
  @IsIn(DIET_OPTIONS)
  diet?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  drinksAlcohol?: boolean | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  smokes?: boolean | null;

  @ApiProperty({ required: false, enum: UPBRINGING_OPTIONS })
  @IsOptional()
  @IsIn(UPBRINGING_OPTIONS)
  upbringing?: string | null;

  @ApiProperty({ required: false, enum: ORIENTATION_OPTIONS })
  @IsOptional()
  @IsIn(ORIENTATION_OPTIONS)
  sexualOrientation?: string | null;

  @ApiProperty({ required: false, isArray: true, enum: LOOKING_FOR_OPTIONS })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(LOOKING_FOR_OPTIONS, { each: true })
  lookingFor?: string[];

  @ApiProperty({
    required: false,
    isArray: true,
    enum: COMPANY_FOR_OPTIONS,
    description: 'Max 3 free / 5 tier 1 / 8 tier 2 / 10 tier 3 (checked against current plan)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(COMPANY_FOR_OPTIONS, { each: true })
  @ArrayMaxSize(COMPANY_FOR_LIMITS[SubscriptionTier.TOP])
  companyFor?: string[];
}
