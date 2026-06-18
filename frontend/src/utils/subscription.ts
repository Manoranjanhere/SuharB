import { Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppUser } from '../store/auth.store';

export function hasActiveSubscription(user: AppUser | null | undefined): boolean {
  if (!user) return false;
  const tier = user.subscriptionTier ?? 0;
  if (tier <= 0) return false;
  if (user.subscriptionExpiresAt) {
    return new Date(user.subscriptionExpiresAt) > new Date();
  }
  return true;
}

/** Subscribed (or dev bypass) — required before coins can be spent on actions. */
export function canSpendCoins(
  user: AppUser | null | undefined,
  paidFeaturesDisabled = false,
): boolean {
  return paidFeaturesDisabled || hasActiveSubscription(user);
}

/** Subscribed users may like/message same tier or lower (incl. free tier 0). */
export function canInteractWithMember(
  user: AppUser | null | undefined,
  recipientTier: number = 0,
): boolean {
  if (!hasActiveSubscription(user)) return false;
  const senderTier = user!.subscriptionTier ?? 0;
  return senderTier >= (recipientTier ?? 0);
}

export type InteractionAccess = 'allowed' | 'need_subscribe' | 'need_upgrade';

export type InteractionAccessOptions = {
  /** Backend dev / DISABLE_PAID_FEATURES mode */
  paidFeaturesDisabled?: boolean;
};

export function getInteractionAccess(
  user: AppUser | null | undefined,
  recipientTier: number = 0,
  options?: InteractionAccessOptions,
): InteractionAccess {
  if (options?.paidFeaturesDisabled) {
    return 'allowed';
  }
  if (!hasActiveSubscription(user)) return 'need_subscribe';
  if (!canInteractWithMember(user, recipientTier)) return 'need_upgrade';
  return 'allowed';
}

export function showSubscribeRequiredAlert(
  navigation: NavigationProp<Record<string, object | undefined>>,
  feature = 'use this feature',
): void {
  Alert.alert(
    'Subscription required',
    `Subscribe to a plan to ${feature}. Free members can browse profiles only.`,
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'View plans', onPress: () => navigation.navigate('Subscription') },
    ],
  );
}

export function showTierUpgradeRequiredAlert(
  navigation: NavigationProp<Record<string, object | undefined>>,
): void {
  Alert.alert(
    'Upgrade required',
    'Your plan can like and message members at your tier and below. Upgrade to connect with this member.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'View plans', onPress: () => navigation.navigate('Subscription') },
    ],
  );
}

export function showInsufficientCoinsAlert(
  navigation: NavigationProp<Record<string, object | undefined>>,
  action = 'do this',
): void {
  Alert.alert(
    'Not enough coins',
    `You need 1 coin to ${action}. Buy coins or use your daily plan quota.`,
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Buy coins', onPress: () => navigation.navigate('Coins') },
    ],
  );
}

export function showPaymentOrCoinError(
  navigation: NavigationProp<Record<string, object | undefined>>,
  err: unknown,
  action = 'complete this action',
): void {
  const msg = (err as { response?: { data?: { message?: string } }; message?: string })
    ?.response?.data?.message
    || (err as { message?: string })?.message
    || 'Please try again';

  if (String(msg).toLowerCase().includes('insufficient coins')) {
    showInsufficientCoinsAlert(navigation, action);
    return;
  }

  Alert.alert('Could not complete', msg);
}
