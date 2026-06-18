import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe = require('stripe');

import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import {
  FEMALE_PLANS, MALE_PLANS,
  getPlanById, BillingPeriod, BILLING_PERIOD_MONTHS,
  parsePlaySubscriptionProductId,
  getPlayCatalog, enrichPlanWithPlayIds,
} from './subscription.constants';
import { GooglePlayBillingService } from './google-play-billing.service';

@Injectable()
export class SubscriptionsService {
  private stripe: any;

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly googlePlay: GooglePlayBillingService,
  ) {
    this.stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  getPlansForUser(role: UserRole) {
    const plans = role === UserRole.COMPANION ? FEMALE_PLANS : MALE_PLANS;
    return {
      plans: plans.map(enrichPlanWithPlayIds),
      billingPeriods: [
        { id: 'monthly' as BillingPeriod, label: '1 Month', months: 1 },
        { id: 'quarterly' as BillingPeriod, label: '3 Months', months: 3 },
      ],
      paymentProvider: 'google_play',
      playCatalog: getPlayCatalog(),
    };
  }

  getPlayCatalog() {
    return getPlayCatalog();
  }

  getFeatureFlags() {
    return {
      paidFeaturesDisabled:
        process.env.DISABLE_PAID_FEATURES === 'true' ||
        process.env.NODE_ENV === 'development',
    };
  }

  getAllPlansPublic() {
    return {
      female: FEMALE_PLANS.map(enrichPlanWithPlayIds),
      male: MALE_PLANS.map(enrichPlanWithPlayIds),
      billingPeriods: ['monthly', 'quarterly'],
      paymentProvider: 'google_play',
      playCatalog: getPlayCatalog(),
    };
  }

  async verifyGooglePlaySubscription(
    userId: string,
    productId: string,
    purchaseToken: string,
  ) {
    const parsed = parsePlaySubscriptionProductId(productId);
    if (!parsed) {
      throw new BadRequestException('Unknown Google Play subscription product');
    }

    const existing = await this.subRepository.findOne({
      where: { googlePlayPurchaseToken: purchaseToken },
    });
    if (existing) {
      const plan = getPlanById(existing.planId);
      return {
        alreadyProcessed: true,
        subscription: existing,
        plan,
        expiresAt: existing.expiresAt,
      };
    }

    const verification = await this.googlePlay.verifySubscription(productId, purchaseToken);
    if (!verification.valid) {
      throw new BadRequestException('Google Play subscription is not valid');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = getPlanById(parsed.planId);
    if (!plan) throw new BadRequestException('Invalid plan');

    const planRole = plan.role === 'companion' ? UserRole.COMPANION : UserRole.PROFESSIONAL;
    if (user.role !== planRole) {
      throw new BadRequestException(`This plan is for ${plan.role}s only`);
    }

    const sub = await this.activateSubscription({
      userId,
      planId: parsed.planId,
      tier: plan.tier,
      billingPeriod: parsed.period,
      amountPaid: (parsed.period === 'monthly' ? plan.monthlyPrice : plan.quarterlyPrice) * 100,
      googlePlayProductId: productId,
      googlePlayPurchaseToken: purchaseToken,
      googlePlayOrderId: verification.orderId,
      playExpiryTimeMillis: verification.expiryTimeMillis,
    });

    const updatedUser = await this.userRepository.findOne({ where: { id: userId } });

    return {
      alreadyProcessed: false,
      subscription: sub,
      plan,
      expiresAt: updatedUser?.subscriptionExpiresAt,
      user: {
        subscriptionPlan: updatedUser?.subscriptionPlan,
        subscriptionTier: updatedUser?.subscriptionTier,
        subscriptionExpiresAt: updatedUser?.subscriptionExpiresAt,
      },
    };
  }

  private async activateSubscription(opts: {
    userId: string;
    planId: string;
    tier: number;
    billingPeriod: BillingPeriod;
    amountPaid: number;
    googlePlayProductId?: string;
    googlePlayPurchaseToken?: string;
    googlePlayOrderId?: string;
    stripeSessionId?: string;
    playExpiryTimeMillis?: number;
  }): Promise<Subscription> {
    const plan = getPlanById(opts.planId);
    const now = new Date();

    const user = await this.userRepository.findOne({ where: { id: opts.userId } });
    const baseStart =
      user?.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now
        ? new Date(user.subscriptionExpiresAt)
        : now;

    let expiresAt: Date;
    if (opts.playExpiryTimeMillis && opts.playExpiryTimeMillis > Date.now()) {
      expiresAt = new Date(opts.playExpiryTimeMillis);
    } else {
      expiresAt = new Date(baseStart);
      expiresAt.setMonth(
        expiresAt.getMonth() + BILLING_PERIOD_MONTHS[opts.billingPeriod],
      );
    }

    const sub = this.subRepository.create({
      userId: opts.userId,
      planId: opts.planId,
      tier: opts.tier,
      billingPeriod: opts.billingPeriod,
      amountPaid: opts.amountPaid,
      stripeSessionId: opts.stripeSessionId,
      googlePlayProductId: opts.googlePlayProductId,
      googlePlayPurchaseToken: opts.googlePlayPurchaseToken,
      googlePlayOrderId: opts.googlePlayOrderId,
      status: SubscriptionStatus.ACTIVE,
      startsAt: now,
      expiresAt,
    });
    await this.subRepository.save(sub);

    await this.userRepository.update(opts.userId, {
      subscriptionPlan: opts.planId,
      subscriptionTier: opts.tier,
      subscriptionExpiresAt: expiresAt,
    });

    return sub;
  }

  async createSubscriptionCheckout(_userId: string, _dto: CreateSubscriptionDto) {
    throw new BadRequestException(
      'Use Google Play billing in the app. Stripe checkout is disabled for mobile subscriptions.',
    );
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const meta = session.metadata;
      if (meta.type === 'subscription') {
        const period: BillingPeriod = meta.billingPeriod === 'monthly' ? 'monthly' : 'quarterly';
        const plan = getPlanById(meta.planId);
        await this.activateSubscription({
          userId: meta.userId,
          planId: meta.planId,
          tier: parseInt(meta.tier, 10),
          billingPeriod: period,
          amountPaid: plan ? (period === 'monthly' ? plan.monthlyPrice : plan.quarterlyPrice) * 100 : 0,
          stripeSessionId: session.id,
        });
      }
    }
  }

  async getCurrentSubscription(userId: string) {
    const sub = await this.subRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { expiresAt: 'DESC' },
    });
    const plan = sub ? getPlanById(sub.planId) : null;
    return { subscription: sub, plan: plan ? enrichPlanWithPlayIds(plan) : null };
  }

  async getSubscriptionHistory(userId: string) {
    return this.subRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
