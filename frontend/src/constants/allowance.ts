import { formatInrInLocalCurrency, formatWeeklyAllowance } from '../utils/locale';

/** Weekly allowance tiers stored as INR — display converts to user's currency. */
export const WEEKLY_ALLOWANCE_VALUES = [
  5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000,
] as const;

export function getWeeklyAllowanceOptions(countryCode: string) {
  return WEEKLY_ALLOWANCE_VALUES.map((value) => ({
    value,
    label: formatInrInLocalCurrency(value, countryCode),
    labelWeekly: formatWeeklyAllowance(value, countryCode),
  }));
}

/** @deprecated Use getWeeklyAllowanceOptions(countryCode) for localized labels */
export const WEEKLY_ALLOWANCE_OPTIONS = WEEKLY_ALLOWANCE_VALUES.map((value) => ({
  label: `₹${value.toLocaleString('en-IN')}`,
  value,
}));
