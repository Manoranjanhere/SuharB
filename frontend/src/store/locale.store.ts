import { create } from 'zustand';
import type { CountryCode } from 'react-native-phone-number-input';
import {
  getStoredCountryCode,
  resolveCountryCode,
  setStoredCountryCode,
} from '../utils/locale';

interface LocaleState {
  countryCode: CountryCode;
  setCountryCode: (code: CountryCode) => void;
  syncFromProfile: (profileCountry?: string | null) => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  countryCode: resolveCountryCode({ stored: getStoredCountryCode() }),

  setCountryCode: (code) => {
    setStoredCountryCode(code);
    set({ countryCode: code });
  },

  syncFromProfile: (profileCountry) => {
    const next = resolveCountryCode({
      stored: getStoredCountryCode() ?? get().countryCode,
      profileCountry,
    });
    set({ countryCode: next });
  },
}));
