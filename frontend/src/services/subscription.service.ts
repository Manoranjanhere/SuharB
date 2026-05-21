import { api } from './api';

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
}

export interface TopupPackage {
  id: string;
  name: string;
  description: string;
  priceInr: number;
  superLikesAwarded: number;
  extraMsgsAwarded: number;
  emoji: string;
}

export interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const SubscriptionService = {
  async getMyPlans(): Promise<{ plans: PlanConfig[]; topups: TopupPackage[] }> {
    const { data } = await api.get('/subscriptions/my-plans');
    return data;
  },

  async getAllPlans() {
    const { data } = await api.get('/subscriptions/plans');
    return data;
  },

  async getCurrentSubscription() {
    const { data } = await api.get('/subscriptions/current');
    return data;
  },

  async subscribe(planId: string): Promise<{ sessionUrl: string; sessionId: string }> {
    const { data } = await api.post('/subscriptions/subscribe', { planId });
    return data;
  },

  async purchaseTopup(packageId: string): Promise<{ sessionUrl: string; sessionId: string }> {
    const { data } = await api.post('/subscriptions/topup', { packageId });
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
