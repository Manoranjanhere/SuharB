import { Platform, Alert } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  getProducts,
  requestSubscription,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type Purchase,
  type Subscription,
  type Product,
} from 'react-native-iap';
import { api } from './api';
import { useAuthStore } from '../store/auth.store';

export type BillingPeriod = 'monthly' | 'quarterly';

let connectionReady = false;

async function ensureConnection(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    Alert.alert('Not available', 'Google Play billing is only available on Android.');
    return false;
  }
  if (!connectionReady) {
    connectionReady = await initConnection();
  }
  return connectionReady;
}

function getProductId(planId: string, period: BillingPeriod): string {
  return `sugarbf_${planId}_${period === 'monthly' ? '1m' : '3m'}`;
}

function getCoinProductId(packId: string): string {
  return `sugarbf_${packId}`;
}

async function verifySubscriptionOnServer(purchase: Purchase) {
  const productId = purchase.productId;
  const purchaseToken =
    purchase.purchaseToken || (purchase as any).purchaseTokenAndroid;
  if (!productId || !purchaseToken) {
    throw new Error('Missing purchase data from Google Play');
  }

  const { data } = await api.post('/subscriptions/google-play/verify-subscription', {
    productId,
    purchaseToken,
  });

  if (data.user) {
    useAuthStore.getState().updateUser(data.user);
  }

  return data;
}

async function verifyCoinPurchaseOnServer(purchase: Purchase) {
  const productId = purchase.productId;
  const purchaseToken =
    purchase.purchaseToken || (purchase as any).purchaseTokenAndroid;
  if (!productId || !purchaseToken) {
    throw new Error('Missing purchase data from Google Play');
  }

  const { data } = await api.post('/coins/google-play/verify', {
    productId,
    purchaseToken,
  });
  if (typeof data.balance === 'number') {
    useAuthStore.getState().updateUser({ coins: data.balance });
  }
  return data;
}

export async function fetchPlaySubscriptions(
  productIds: string[],
): Promise<Subscription[]> {
  const ok = await ensureConnection();
  if (!ok || !productIds.length) return [];
  try {
    return await getSubscriptions({ skus: productIds });
  } catch {
    return [];
  }
}

export async function fetchPlayProducts(productIds: string[]): Promise<Product[]> {
  const ok = await ensureConnection();
  if (!ok || !productIds.length) return [];
  try {
    return await getProducts({ skus: productIds });
  } catch {
    return [];
  }
}

/** Google Play localized price strings keyed by product SKU. */
export async function fetchLocalizedPlayPrices(
  subscriptionSkus: string[],
  productSkus: string[],
): Promise<Record<string, string>> {
  const [subs, products] = await Promise.all([
    fetchPlaySubscriptions(subscriptionSkus),
    fetchPlayProducts(productSkus),
  ]);
  const map: Record<string, string> = {};
  subs.forEach((s) => {
    if (s.productId && s.localizedPrice) map[s.productId] = s.localizedPrice;
  });
  products.forEach((p) => {
    if (p.productId && p.localizedPrice) map[p.productId] = p.localizedPrice;
  });
  return map;
}

export async function purchasePlan(
  planId: string,
  period: BillingPeriod,
): Promise<void> {
  const ok = await ensureConnection();
  if (!ok) return;

  const sku = getProductId(planId, period);

  return new Promise((resolve, reject) => {
    const subUpdate = purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId !== sku) return;
      try {
        await verifySubscriptionOnServer(purchase);
        await finishTransaction({ purchase, isConsumable: false });
        subUpdate.remove();
        subError.remove();
        resolve();
      } catch (e) {
        subUpdate.remove();
        subError.remove();
        reject(e);
      }
    });

    const subError = purchaseErrorListener((err) => {
      subUpdate.remove();
      subError.remove();
      if (err.code !== 'E_USER_CANCELLED') {
        reject(err);
      } else {
        reject(new Error('Purchase cancelled'));
      }
    });

    requestSubscription({ sku }).catch((e) => {
      subUpdate.remove();
      subError.remove();
      reject(e);
    });
  });
}

export async function purchaseCoinPack(packId: string): Promise<{ coins: number; balance: number }> {
  const ok = await ensureConnection();
  if (!ok) throw new Error('Billing unavailable');

  const sku = getCoinProductId(packId);

  return new Promise((resolve, reject) => {
    const subUpdate = purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId !== sku) return;
      try {
        const data = await verifyCoinPurchaseOnServer(purchase);
        await finishTransaction({ purchase, isConsumable: true });
        subUpdate.remove();
        subError.remove();
        resolve({ coins: data.coins, balance: data.balance });
      } catch (e) {
        subUpdate.remove();
        subError.remove();
        reject(e);
      }
    });

    const subError = purchaseErrorListener((err) => {
      subUpdate.remove();
      subError.remove();
      if (err.code !== 'E_USER_CANCELLED') {
        reject(err);
      } else {
        reject(new Error('Purchase cancelled'));
      }
    });

    requestPurchase({ skus: [sku] }).catch((e) => {
      subUpdate.remove();
      subError.remove();
      reject(e);
    });
  });
}

export async function disconnectBilling() {
  if (connectionReady) {
    await endConnection();
    connectionReady = false;
  }
}

export const PlayBilling = {
  getProductId,
  getCoinProductId,
  fetchPlaySubscriptions,
  fetchPlayProducts,
  fetchLocalizedPlayPrices,
  purchasePlan,
  purchaseCoinPack,
  disconnectBilling,
};

export default PlayBilling;
