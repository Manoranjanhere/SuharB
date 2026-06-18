import { Platform, NativeModules } from 'react-native';
import type { CountryCode } from 'react-native-phone-number-input';
import { storage } from '../services/api';

const STORAGE_KEY = 'appCountryCode';

/** Approximate display rates: 1 INR → local currency (for allowance labels when Play price unavailable). */
const INR_TO_CURRENCY: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0095,
  EUR: 0.011,
  AED: 0.044,
  SAR: 0.045,
  SGD: 0.016,
  AUD: 0.018,
  CAD: 0.016,
  MYR: 0.056,
  THB: 0.43,
  IDR: 190,
  PHP: 0.67,
  PKR: 3.3,
  BDT: 1.4,
  NGN: 18,
  ZAR: 0.22,
  BRL: 0.06,
  MXN: 0.21,
};

export const COUNTRY_CURRENCY: Record<string, { currency: string; locale: string }> = {
  IN: { currency: 'INR', locale: 'en-IN' },
  US: { currency: 'USD', locale: 'en-US' },
  GB: { currency: 'GBP', locale: 'en-GB' },
  AE: { currency: 'AED', locale: 'en-AE' },
  SA: { currency: 'SAR', locale: 'ar-SA' },
  SG: { currency: 'SGD', locale: 'en-SG' },
  AU: { currency: 'AUD', locale: 'en-AU' },
  CA: { currency: 'CAD', locale: 'en-CA' },
  DE: { currency: 'EUR', locale: 'de-DE' },
  FR: { currency: 'EUR', locale: 'fr-FR' },
  MY: { currency: 'MYR', locale: 'ms-MY' },
  TH: { currency: 'THB', locale: 'th-TH' },
  ID: { currency: 'IDR', locale: 'id-ID' },
  PH: { currency: 'PHP', locale: 'en-PH' },
  PK: { currency: 'PKR', locale: 'en-PK' },
  BD: { currency: 'BDT', locale: 'bn-BD' },
  NG: { currency: 'NGN', locale: 'en-NG' },
  ZA: { currency: 'ZAR', locale: 'en-ZA' },
  BR: { currency: 'BRL', locale: 'pt-BR' },
  MX: { currency: 'MXN', locale: 'es-MX' },
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  india: 'IN',
  'united states': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  uae: 'AE',
  'united arab emirates': 'AE',
  singapore: 'SG',
  australia: 'AU',
  canada: 'CA',
  germany: 'DE',
  france: 'FR',
  malaysia: 'MY',
  thailand: 'TH',
  indonesia: 'ID',
  philippines: 'PH',
  pakistan: 'PK',
  bangladesh: 'BD',
  nigeria: 'NG',
  'south africa': 'ZA',
  brazil: 'BR',
  mexico: 'MX',
  'saudi arabia': 'SA',
};

export function getDeviceCountryCode(): CountryCode {
  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const region = intlLocale.split('-')[1];
    if (region && region.length === 2) {
      return region.toUpperCase() as CountryCode;
    }
    const androidLocale =
      NativeModules.I18nManager?.localeIdentifier ||
      (Platform.OS === 'android' ? NativeModules.PlatformConstants?.Locale : null);
    if (androidLocale) {
      const parts = String(androidLocale).split(/[-_]/);
      const code = parts[parts.length - 1];
      if (code?.length === 2) return code.toUpperCase() as CountryCode;
    }
  } catch {
    /* use default */
  }
  return 'IN';
}

export function getStoredCountryCode(): CountryCode | null {
  const code = storage.getString(STORAGE_KEY);
  return code ? (code as CountryCode) : null;
}

export function setStoredCountryCode(code: CountryCode): void {
  storage.set(STORAGE_KEY, code);
}

export function countryFromProfileName(countryName?: string | null): CountryCode | null {
  if (!countryName?.trim()) return null;
  const key = countryName.trim().toLowerCase();
  return (COUNTRY_NAME_TO_CODE[key] as CountryCode) || null;
}

export function resolveCountryCode(options?: {
  stored?: CountryCode | null;
  profileCountry?: string | null;
}): CountryCode {
  if (options?.stored) return options.stored;
  const fromProfile = countryFromProfileName(options?.profileCountry);
  if (fromProfile) return fromProfile;
  const saved = getStoredCountryCode();
  if (saved) return saved;
  return getDeviceCountryCode();
}

export function getCurrencyForCountry(countryCode: string): { currency: string; locale: string } {
  return COUNTRY_CURRENCY[countryCode] || { currency: 'USD', locale: 'en-US' };
}

/** Format INR-base amount (plans/allowance stored in INR) in user's local currency. */
export function formatInrInLocalCurrency(amountInr: number, countryCode: string): string {
  const { currency, locale } = getCurrencyForCountry(countryCode);
  const rate = INR_TO_CURRENCY[currency] ?? INR_TO_CURRENCY.USD;
  const localAmount = amountInr * rate;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'IDR' || currency === 'NGN' ? 0 : 0,
      minimumFractionDigits: 0,
    }).format(localAmount);
  } catch {
    return `₹${amountInr.toLocaleString('en-IN')}`;
  }
}

export function formatWeeklyAllowance(amountInr: number, countryCode: string): string {
  return `${formatInrInLocalCurrency(amountInr, countryCode)}/week`;
}
