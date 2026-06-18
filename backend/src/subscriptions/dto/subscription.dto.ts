import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALL_PLAN_IDS = ['silver', 'gold', 'platinum', 'rich', 'very_rich', 'super_rich'];
const BILLING_PERIODS = ['monthly', 'quarterly'] as const;

/** @deprecated Stripe checkout — use Google Play on mobile */
export class CreateSubscriptionDto {
  @ApiProperty({ example: 'gold', enum: ALL_PLAN_IDS })
  @IsString()
  @IsIn(ALL_PLAN_IDS)
  planId: string;

  @ApiProperty({ example: 'monthly', enum: BILLING_PERIODS, required: false })
  @IsOptional()
  @IsIn(BILLING_PERIODS)
  billingPeriod?: 'monthly' | 'quarterly';
}

/** Verify a Google Play subscription purchase from the app */
export class VerifyGooglePlaySubscriptionDto {
  @ApiProperty({ example: 'sugarbf_gold_1m' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'purchaseToken from Google Play' })
  @IsString()
  purchaseToken: string;

  @ApiProperty({ required: false, example: 'com.sugarbf.app' })
  @IsOptional()
  @IsString()
  packageName?: string;
}

export class StripeWebhookDto {
  type: string;
  data: { object: any };
}
