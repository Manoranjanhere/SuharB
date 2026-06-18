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

export function getInteractionAccess(
  user: AppUser | null | undefined,
  recipientTier: number = 0,
): InteractionAccess {
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
