import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALL_PLAN_IDS = ['silver', 'gold', 'platinum', 'rich', 'very_rich', 'super_rich'];
const ALL_TOPUP_IDS = ['super_likes_5', 'extra_msgs_10', 'compliment'];

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'gold', enum: ALL_PLAN_IDS })
  @IsString()
  @IsIn(ALL_PLAN_IDS)
  planId: string;
}

export class PurchaseTopupDto {
  @ApiProperty({ example: 'super_likes_5', enum: ALL_TOPUP_IDS })
  @IsString()
  @IsIn(ALL_TOPUP_IDS)
  packageId: string;
}

export class StripeWebhookDto {
  type: string;
  data: { object: any };
}
