import { api } from './api';
import type { BillingPeriod } from './playBilling.service';

export interface PlanConfig {
  id: string;
  name: string;
  role: string;
  tier: number;
  monthlyPrice: number;
  quarterlyPrice: number;
  badge: string;
  color: string;
  features: string[];
  playProductIds?: { monthly: string; quarterly: string };
}

export interface TopupPackage {
  id: string;
  name: string;
  description: string;
  priceInr: number;
  superLikesAwarded: number;
  extraMsgsAwarded: number;
  emoji: string;
  playProductId?: string;
}

export interface BillingPeriodOption {
  id: BillingPeriod;
  label: string;
  months: number;
}

export interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface AllPlansResponse {
  female: PlanConfig[];
  male: PlanConfig[];
  topups: TopupPackage[];
  billingPeriods?: string[];
  paymentProvider?: string;
}

const SubscriptionService = {
  async getMyPlans(): Promise<{
    plans: PlanConfig[];
    topups: TopupPackage[];
    billingPeriods: BillingPeriodOption[];
    paymentProvider: string;
  }> {
    const { data } = await api.get('/subscriptions/my-plans');
    return data;
  },

  async getAllPlans(): Promise<AllPlansResponse> {
    const { data } = await api.get<AllPlansResponse>('/subscriptions/plans');
    return data;
  },

  async getCurrentSubscription() {
    const { data } = await api.get('/subscriptions/current');
    return data;
  },

  async verifyGooglePlaySubscription(productId: string, purchaseToken: string) {
    const { data } = await api.post('/subscriptions/google-play/verify-subscription', {
      productId,
      purchaseToken,
    });
    return data;
  },

  async verifyGooglePlayTopup(productId: string, purchaseToken: string) {
    const { data } = await api.post('/subscriptions/google-play/verify-topup', {
      productId,
      purchaseToken,
    });
    return data;
  },

  async getCoinsBalance(): Promise<{ coins: number; transactions: CoinTransaction[] }> {
    const { data } = await api.get('/coins/balance');
    return data;
  },

  async claimDailyReward(): Promise<{ awarded: boolean; coins: number; balance: number }> {
    const { data } = await api.post('/coins/daily-reward');
    return data;
  },
};

export default SubscriptionService;
