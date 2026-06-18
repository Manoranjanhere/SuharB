// ─── Coins values ───────────────────────────────────────────────────────────
export const COIN_VALUE_INR = 50;           // 1 coin = ₹50 (Play regional pricing)
export const DAILY_LOGIN_COINS = 1;
export const REFERRAL_REWARD_COINS = 10;    // Referrer earns when someone uses their code
export const REFERRAL_SIGNUP_BONUS_COINS = 10; // New user bonus for entering a valid code
export const COIN_ACTION_COST = 1;          // 1 coin = 1 super like | message | compliment

// ─── Subscription tiers ──────────────────────────────────────────────────────
export enum SubscriptionTier {
  NONE = 0,
  BASE = 1,
  MID = 2,
  TOP = 3,
}

// ─── Daily limits by subscription tier (resets each calendar day) ─────────────
export interface TierDailyQuotas {
  messages: number;
  superLikes: number;
  compliments: number;
}

export const TIER_DAILY_QUOTAS: Record<SubscriptionTier, TierDailyQuotas> = {
  [SubscriptionTier.NONE]: { messages: 0, superLikes: 0, compliments: 0 },
  [SubscriptionTier.BASE]: { messages: 10, superLikes: 5, compliments: 5 },
  [SubscriptionTier.MID]: { messages: 20, superLikes: 10, compliments: 10 },
  [SubscriptionTier.TOP]: { messages: 30, superLikes: 20, compliments: 20 },
};

/** Silver/Rich = BASE, Gold/Very Rich = MID, Platinum/Super Rich = TOP */
export function getDailyQuotasForTier(tier: number): TierDailyQuotas {
  if (tier >= SubscriptionTier.TOP) return TIER_DAILY_QUOTAS[SubscriptionTier.TOP];
  if (tier >= SubscriptionTier.MID) return TIER_DAILY_QUOTAS[SubscriptionTier.MID];
  if (tier >= SubscriptionTier.BASE) return TIER_DAILY_QUOTAS[SubscriptionTier.BASE];
  return TIER_DAILY_QUOTAS[SubscriptionTier.NONE];
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

/** Google Play one-time SKU for coin packs: sugarbf_coins_1, sugarbf_coins_5, … */
export function getPlayCoinProductId(packId: string): string {
  return `sugarbf_${packId}`;
}

export function parsePlayCoinProductId(productId: string): string | null {
  const match = productId.match(/^sugarbf_coins_(\d+)$/);
  if (!match) return null;
  const packId = `coins_${match[1]}`;
  if (!COIN_PACKS.find((p) => p.id === packId)) return null;
  return packId;
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
  const coinPacks = COIN_PACKS.map((pack) => ({
    productId: getPlayCoinProductId(pack.id),
    packId: pack.id,
    coins: pack.coins,
    priceInr: pack.priceInr,
  }));
  return {
    packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.sugarbf.app',
    subscriptions,
    coinPacks,
  };
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
      '5 photo compliments/day',
      'Browse all profiles',
      'Like & message Free + Silver members (not Gold/Platinum)',
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
      '20 new messages/day',
      'Unlimited profile & photo likes',
      '10 super likes/day',
      '10 photo compliments/day',
      'Browse all profiles',
      'Like & message Gold, Silver & Free (not Platinum)',
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
      '30 new messages/day',
      'Unlimited profile & photo likes',
      '20 super likes/day',
      '20 photo compliments/day',
      'Browse all profiles',
      'Like & message all members',
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
      '5 photo compliments/day',
      'Browse all profiles',
      'Like & message Free + Rich members (not Very Rich/Super Rich)',
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
      '20 new messages/day',
      'Unlimited profile & photo likes',
      '10 super likes/day',
      '10 photo compliments/day',
      'Browse all profiles',
      'Like & message Very Rich, Rich & Free (not Super Rich)',
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
      '30 new messages/day',
      'Unlimited profile & photo likes',
      '20 super likes/day',
      '20 photo compliments/day',
      'Browse all profiles',
      'Like & message all members',
      'Top of every search',
      'Exclusive Super Rich crown',
    ],
  },
];

// ─── Coin packs (Google Play consumables) ───────────────────────────────────
export interface CoinPack {
  id: string;
  coins: number;
  priceInr: number;
  label: string;
  emoji: string;
}

export const COIN_PACKS: CoinPack[] = [
  { id: 'coins_1', coins: 1, priceInr: 50, label: '1 Coin', emoji: '🪙' },
  { id: 'coins_5', coins: 5, priceInr: 250, label: '5 Coins', emoji: '🪙' },
  { id: 'coins_10', coins: 10, priceInr: 500, label: '10 Coins', emoji: '💰' },
  { id: 'coins_25', coins: 25, priceInr: 1250, label: '25 Coins', emoji: '💎' },
  { id: 'coins_50', coins: 50, priceInr: 2500, label: '50 Coins', emoji: '👑' },
];

// ─── Tier interaction rule ───────────────────────────────────────────────────
// Subscribed senders may like/message same tier or LOWER only (incl. free tier 0).
// Free users (tier 0) cannot like or message anyone.
// Example: Silver (1) → Free + Silver. Gold (2) cannot message Platinum (3).
export function canInteractWithMember(senderTier: number, recipientTier: number): boolean {
  if (senderTier === SubscriptionTier.NONE) {
    return false;
  }
  return senderTier >= (recipientTier ?? 0);
}

export function getMemberTierLabel(planId: string | null | undefined, tier: number): string {
  if (planId) return getPlanBadge(planId);
  if (tier === 0) return 'Free member';
  return `Tier ${tier}`;
}

export function getPlanById(planId: string): PlanConfig | undefined {
  return [...FEMALE_PLANS, ...MALE_PLANS].find((p) => p.id === planId);
}

export function getPlanBadge(planId: string): string {
  const plan = getPlanById(planId);
  return plan ? `${plan.badge} ${plan.name}` : '';
}
