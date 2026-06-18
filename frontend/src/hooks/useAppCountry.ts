import { useLocaleStore } from '../store/locale.store';
import {
  getCurrencyForCountry,
  formatInrInLocalCurrency,
  formatWeeklyAllowance,
} from '../utils/locale';

export function useAppCountry() {
  const countryCode = useLocaleStore((s) => s.countryCode);
  const { currency, locale } = getCurrencyForCountry(countryCode);

  return {
    countryCode,
    currency,
    locale,
    formatMoney: (amountInr: number) => formatInrInLocalCurrency(amountInr, countryCode),
    formatWeeklyAllowance: (amountInr: number) => formatWeeklyAllowance(amountInr, countryCode),
  };
}
