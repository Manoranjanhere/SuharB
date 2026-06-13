// ─── Coins values ───────────────────────────────────────────────────────────
export const COIN_VALUE_INR = 1;          // 1 coin = Re 1
export const DAILY_LOGIN_COINS = 50;
export const REFERRAL_REWARD_COINS = 500; // 10 coins × Rs 50

// ─── Daily limits (all plans) ────────────────────────────────────────────────
export const DEFAULT_DAILY_MSG_QUOTA = 10;
export const DEFAULT_DAILY_SUPER_LIKE_QUOTA = 5;

// ─── Subscription tiers ──────────────────────────────────────────────────────
export enum SubscriptionTier {
  NONE = 0,
  BASE = 1,
  MID = 2,
  TOP = 3,
}

// ─── Billing periods (Google Play) ─────────────────────────────────────────
export type BillingPeriod = 'monthly' | 'quarterly';

export const BILLING_PERIOD_MONTHS: Record<BillingPeriod, number> = {
  monthly: 1,
  quarterly: 3,
};

/** Google Play subscription SKU: sugarbf_{planId}_1m | sugarbf_{planId}_3m */
export function getPlaySubscriptionProductId(planId: string, period: BillingPeriod): string {
  return `sugarbf_${planId}_${period === 'monthly' ? '1m' : '3m'}`;
}

/** Google Play one-time product SKU for top-ups */
export function getPlayTopupProductId(topupId: string): string {
  return `sugarbf_topup_${topupId}`;
}

export function parsePlaySubscriptionProductId(
  productId: string,
): { planId: string; period: BillingPeriod } | null {
  const match = productId.match(/^sugarbf_(.+)_(1m|3m)$/);
  if (!match) return null;
  const planId = match[1];
  const period: BillingPeriod = match[2] === '1m' ? 'monthly' : 'quarterly';
  if (!getPlanById(planId)) return null;
  return { planId, period };
}

export function parsePlayTopupProductId(productId: string): string | null {
  const match = productId.match(/^sugarbf_topup_(.+)$/);
  if (!match) return null;
  const topupId = match[1];
  if (!TOPUP_PACKAGES.find((p) => p.id === topupId)) return null;
  return topupId;
}

export function getPlayCatalog() {
  const allPlans = [...FEMALE_PLANS, ...MALE_PLANS];
  const subscriptions = allPlans.flatMap((plan) =>
    (['monthly', 'quarterly'] as BillingPeriod[]).map((period) => ({
      productId: getPlaySubscriptionProductId(plan.id, period),
      planId: plan.id,
      period,
      role: plan.role,
      priceInr: period === 'monthly' ? plan.monthlyPrice : plan.quarterlyPrice,
      months: BILLING_PERIOD_MONTHS[period],
    })),
  );
  const topups = TOPUP_PACKAGES.map((pkg) => ({
    productId: getPlayTopupProductId(pkg.id),
    topupId: pkg.id,
    priceInr: pkg.priceInr,
  }));
  return { packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.sugarbf.app', subscriptions, topups };
}

// ─── Plan definitions ────────────────────────────────────────────────────────
export interface PlanConfig {
  id: string;
  name: string;
  role: 'companion' | 'professional';
  tier: SubscriptionTier;
  monthlyPrice: number;   // INR
  quarterlyPrice: number; // INR (3 months billed together)
  badge: string;
  color: string;
  features: string[];
}

export function enrichPlanWithPlayIds(plan: PlanConfig) {
  return {
    ...plan,
    playProductIds: {
      monthly: getPlaySubscriptionProductId(plan.id, 'monthly'),
      quarterly: getPlaySubscriptionProductId(plan.id, 'quarterly'),
    },
  };
}

export const FEMALE_PLANS: PlanConfig[] = [
  {
    id: 'silver',
    name: 'Silver',
    role: 'companion',
    tier: SubscriptionTier.BASE,
    monthlyPrice: 300,
    quarterlyPrice: 900,
    badge: '🥈',
    color: '#A8A9AD',
    features: [
      '10 new messages/day',
      'Unlimited profile & photo likes',
      '5 super likes/day',
      'Message Silver & below members (not Gold/Platinum)',
      '1-month or 3-month via Google Play',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    role: 'companion',
    tier: SubscriptionTier.MID,
    monthlyPrice: 600,
    quarterlyPrice: 1800,
    badge: '🥇',
    color: '#FFB703',
    features: [
      '10 new messages/day',
      'Unlimited profile & photo likes',
      '5 super likes/day',
      'Message Gold, Silver & below (not Platinum)',
      'Priority in search results',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    role: 'companion',
    tier: SubscriptionTier.TOP,
    monthlyPrice: 900,
    quarterlyPrice: 2700,
    badge: '💎',
    color: '#E5E4E2',
    features: [
      '10 new messages/day',
      'Unlimited profile & photo likes',
      '5 super likes/day',
      'Message ALL members',
      'Top of search results',
      'Verified Platinum badge',
    ],
  },
];

export const MALE_PLANS: PlanConfig[] = [
  {
    id: 'rich',
    name: 'Rich',
    role: 'professional',
    tier: SubscriptionTier.BASE,
    monthlyPrice: 1000,
    quarterlyPrice: 3000,
    badge: '💰',
    color: '#A8A9AD',
    features: [
      '10 new messages/day',
      'Unlimited profile & photo likes',
      '5 super likes/day',
      'Message Rich & below members (not Very Rich/Super Rich)',
    ],
  },
  {
    id: 'very_rich',
    name: 'Very Rich',
    role: 'professional',
    tier: SubscriptionTier.MID,
    monthlyPrice: 2000,
    quarterlyPrice: 6000,
    badge: '💎',
    color: '#FFB703',
    features: [
      '10 new messages/day',
      'Unlimited profile & photo likes',
      '5 super likes/day',
      'Message Very Rich, Rich & below (not Super Rich)',
      'Priority in search results',
    ],
  },
  {
    id: 'super_rich',
    name: 'Super Rich',
    role: 'professional',
    tier: SubscriptionTier.TOP,
    monthlyPrice: 3000,
    quarterlyPrice: 9000,
    badge: '👑',
    color: '#C9184A',
    features: [
      '10 new messages/day',
      'Unlimited profile & photo likes',
      '5 super likes/day',
      'Message ALL members',
      'Top of every search',
      'Exclusive Super Rich crown',
    ],
  },
];

// ─── Topup packages ──────────────────────────────────────────────────────────
export interface TopupPackage {
  id: string;
  name: string;
  description: string;
  priceInr: number;
  coinsAwarded: number;
  superLikesAwarded: number;
  extraMsgsAwarded: number;
  emoji: string;
}

export const TOPUP_PACKAGES: TopupPackage[] = [
  {
    id: 'super_likes_5',
    name: '5 Super Likes',
    description: 'Appear at the top of Liked By lists + send a 255 char message',
    priceInr: 500,
    coinsAwarded: 0,
    superLikesAwarded: 5,
    extraMsgsAwarded: 0,
    emoji: '⭐',
  },
  {
    id: 'extra_msgs_10',
    name: '10 Extra Messages',
    description: '10 additional chat messages above your daily quota',
    priceInr: 500,
    coinsAwarded: 0,
    superLikesAwarded: 0,
    extraMsgsAwarded: 10,
    emoji: '💬',
  },
  {
    id: 'compliment',
    name: 'Compliment Message',
    description: 'Send a special compliment message along with your like',
    priceInr: 100,
    coinsAwarded: 0,
    superLikesAwarded: 0,
    extraMsgsAwarded: 1,
    emoji: '💝',
  },
];

// ─── Tier messaging rule ─────────────────────────────────────────────────────
// Sender may message same tier or LOWER tiers only (not higher).
// Example: Gold (2) → Gold, Silver (1). Gold cannot message Platinum (3).
export function canMessage(senderTier: number, recipientTier: number): boolean {
  if (senderTier === SubscriptionTier.NONE || recipientTier === SubscriptionTier.NONE) {
    return false; // Both must be subscribed
  }
  return senderTier >= recipientTier;
}

export function getPlanById(planId: string): PlanConfig | undefined {
  return [...FEMALE_PLANS, ...MALE_PLANS].find((p) => p.id === planId);
}

export function getPlanBadge(planId: string): string {
  const plan = getPlanById(planId);
  return plan ? `${plan.badge} ${plan.name}` : '';
}
