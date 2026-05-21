import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe = require('stripe');

import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { CoinTransaction, CoinTxType } from '../coins/entities/coin-transaction.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateSubscriptionDto, PurchaseTopupDto } from './dto/subscription.dto';
import {
  FEMALE_PLANS, MALE_PLANS, TOPUP_PACKAGES,
  getPlanById, SubscriptionTier,
} from './subscription.constants';

@Injectable()
export class SubscriptionsService {
  private stripe: any;

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CoinTransaction)
    private readonly txRepository: Repository<CoinTransaction>,
  ) {
    this.stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  // ─── Get plans for user role ───────────────────────────────────────────────

  getPlansForUser(role: UserRole) {
    return {
      plans: role === UserRole.COMPANION ? FEMALE_PLANS : MALE_PLANS,
      topups: TOPUP_PACKAGES,
    };
  }

  // ─── Create Stripe checkout for subscription ──────────────────────────────

  async createSubscriptionCheckout(userId: string, dto: CreateSubscriptionDto): Promise<{ sessionUrl: string; sessionId: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = getPlanById(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');

    // Validate role matches plan
    const userRole = user.role;
    const planRole = plan.role === 'companion' ? UserRole.COMPANION : UserRole.PROFESSIONAL;
    if (userRole !== planRole) {
      throw new BadRequestException(`This plan is for ${plan.role}s only`);
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId: customerId });
    }

    // Quarterly amount in paise (1 INR = 100 paise)
    const amountPaise = plan.quarterlyPrice * 100;

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          unit_amount: amountPaise,
          product_data: {
            name: `SugarBf ${plan.name} — 3 Months`,
            description: `${plan.badge} ${plan.name} membership (quarterly)`,
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `sugarbf://subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `sugarbf://subscription/cancel`,
      metadata: {
        userId,
        planId: plan.id,
        tier: String(plan.tier),
        type: 'subscription',
      },
    });

    return { sessionUrl: session.url, sessionId: session.id };
  }

  // ─── Create Stripe checkout for topup ─────────────────────────────────────

  async createTopupCheckout(userId: string, dto: PurchaseTopupDto): Promise<{ sessionUrl: string; sessionId: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const pkg = TOPUP_PACKAGES.find((p) => p.id === dto.packageId);
    if (!pkg) throw new BadRequestException('Invalid package');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId: customerId });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          unit_amount: pkg.priceInr * 100,
          product_data: {
            name: `SugarBf ${pkg.emoji} ${pkg.name}`,
            description: pkg.description,
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `sugarbf://topup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `sugarbf://topup/cancel`,
      metadata: {
        userId,
        packageId: pkg.id,
        type: 'topup',
      },
    });

    return { sessionUrl: session.url, sessionId: session.id };
  }

  // ─── Stripe Webhook handler ────────────────────────────────────────────────

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
        await this.activateSubscription(meta.userId, meta.planId, parseInt(meta.tier), session.id);
      } else if (meta.type === 'topup') {
        await this.activateTopup(meta.userId, meta.packageId, session.id);
      }
    }
  }

  // ─── Activate subscription after payment ──────────────────────────────────

  async activateSubscription(userId: string, planId: string, tier: number, sessionId: string): Promise<void> {
    const plan = getPlanById(planId);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 months

    const sub = this.subRepository.create({
      userId,
      planId,
      tier,
      amountPaid: plan.quarterlyPrice * 100,
      stripeSessionId: sessionId,
      status: SubscriptionStatus.ACTIVE,
      startsAt: now,
      expiresAt,
    });
    await this.subRepository.save(sub);

    await this.userRepository.update(userId, {
      subscriptionPlan: planId,
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
    });
  }

  // ─── Activate topup after payment ─────────────────────────────────────────

  async activateTopup(userId: string, packageId: string, sessionId: string): Promise<void> {
    const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;

    const updates: Partial<User> = {};
    if (pkg.superLikesAwarded > 0) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      updates.extraSuperLikeCredits = (user.extraSuperLikeCredits || 0) + pkg.superLikesAwarded;
    }
    if (pkg.extraMsgsAwarded > 0) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      updates.extraMsgCredits = (user.extraMsgCredits || 0) + pkg.extraMsgsAwarded;
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepository.update(userId, updates);
    }
  }

  // ─── Get current subscription ─────────────────────────────────────────────

  async getCurrentSubscription(userId: string) {
    const sub = await this.subRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { expiresAt: 'DESC' },
    });
    const plan = sub ? getPlanById(sub.planId) : null;
    return { subscription: sub, plan };
  }

  async getSubscriptionHistory(userId: string) {
    return this.subRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
