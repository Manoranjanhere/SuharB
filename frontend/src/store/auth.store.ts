import { create } from 'zustand';
import AuthService from '../services/auth.service';
import { storage } from '../services/api';

export type ProfileStage = 0 | 1 | 2 | 3;

export interface AppUser {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  gender?: string;
  age?: number;
  city?: string;
  country?: string;
  bio?: string;
  turnOns?: string[];
  turnOffs?: string[];
  role?: 'professional' | 'companion';
  weeklyAllowanceExpectation?: number;
  canProvideAllowance?: boolean;
  weeklyAllowanceAmount?: number;
  canProvideAccommodation?: boolean;
  accommodationType?: string;
  hiddenUntil?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  subscriptionTier?: number;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: string | null;
  profileStage: ProfileStage;
  isVerified: boolean;
  coins?: number;
  referralCode?: string;
}

interface AuthState {
  user: AppUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: AppUser) => void;
  setToken: (token: string) => void;
  updateUser: (partial: Partial<AppUser>) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setUser: (user) => {
    storage.set('user', JSON.stringify(user));
    set({ user });
  },
  setToken: (accessToken) => {
    storage.set('accessToken', accessToken);
    set({ accessToken });
  },

  updateUser: (partial) =>
    set((state) => {
      const user = state.user ? { ...state.user, ...partial } : null;
      if (user) {
        storage.set('user', JSON.stringify(user));
      }
      return { user };
    }),

  logout: () => {
    AuthService.clearSession();
    set({ user: null, accessToken: null });
  },

  hydrate: () => {
    try {
      const user = AuthService.getStoredUser() as AppUser | null;
      const accessToken = AuthService.isLoggedIn()
        ? require('../services/api').storage.getString('accessToken')
        : null;
      set({ user, accessToken, isLoading: false });
    } catch (e) {
      console.warn('[hydrate] failed:', e);
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));
