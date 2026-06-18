import { create } from 'zustand';
import SubscriptionService from '../services/subscription.service';

interface FeatureFlagsState {
  paidFeaturesDisabled: boolean;
  loaded: boolean;
  fetchFlags: () => Promise<void>;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set) => ({
  paidFeaturesDisabled: false,
  loaded: false,
  fetchFlags: async () => {
    try {
      const flags = await SubscriptionService.getFeatureFlags();
      set({ paidFeaturesDisabled: !!flags.paidFeaturesDisabled, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
