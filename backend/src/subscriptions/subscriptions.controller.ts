import {
  Controller, Get, Post, Body, UseGuards, RawBodyRequest, Req,
  Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  VerifyGooglePlaySubscriptionDto,
} from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans + Google Play product IDs' })
  getAllPlans() {
    return this.subscriptionsService.getAllPlansPublic();
  }

  @Get('play-catalog')
  @ApiOperation({ summary: 'Google Play SKU catalog (package name + product IDs)' })
  getPlayCatalog() {
    return this.subscriptionsService.getPlayCatalog();
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'Public feature flags (paid bypass, etc.)' })
  getFeatureFlags() {
    return this.subscriptionsService.getFeatureFlags();
  }

  @Get('my-plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plans for current user role + Play SKUs' })
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

  @Post('google-play/verify-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Google Play subscription and activate plan' })
  verifyPlaySubscription(
    @CurrentUser() user: User,
    @Body() dto: VerifyGooglePlaySubscriptionDto,
  ) {
    return this.subscriptionsService.verifyGooglePlaySubscription(
      user.id,
      dto.productId,
      dto.purchaseToken,
    );
  }

  /** @deprecated Use Google Play in the mobile app */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Deprecated] Stripe checkout — use Google Play' })
  subscribe(@CurrentUser() user: User, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscriptionCheckout(user.id, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook (legacy)' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.subscriptionsService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
