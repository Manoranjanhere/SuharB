import {
  Controller, Get, Post, Body, UseGuards, RawBodyRequest, Req,
  Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, PurchaseTopupDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FEMALE_PLANS, MALE_PLANS, TOPUP_PACKAGES } from './subscription.constants';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── Public: list all plans ───────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  getAllPlans() {
    return {
      female: FEMALE_PLANS,
      male: MALE_PLANS,
      topups: TOPUP_PACKAGES,
    };
  }

  // ─── Authenticated routes ─────────────────────────────────────────────────

  @Get('my-plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plans available for current user role' })
  getMyPlans(@CurrentUser() user: User) {
    return this.subscriptionsService.getPlansForUser(user.role);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active subscription' })
  getCurrent(@CurrentUser() user: User) {
    return this.subscriptionsService.getCurrentSubscription(user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription history' })
  getHistory(@CurrentUser() user: User) {
    return this.subscriptionsService.getSubscriptionHistory(user.id);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session for a subscription plan' })
  subscribe(@CurrentUser() user: User, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscriptionCheckout(user.id, dto);
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a topup package (super likes, extra msgs, etc)' })
  purchaseTopup(@CurrentUser() user: User, @Body() dto: PurchaseTopupDto) {
    return this.subscriptionsService.createTopupCheckout(user.id, dto);
  }

  // ─── Stripe webhook (no auth — uses signature) ────────────────────────────

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.subscriptionsService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
