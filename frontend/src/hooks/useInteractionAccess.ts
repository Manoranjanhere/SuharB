import { useMemo } from 'react';
import type { AppUser } from '../store/auth.store';
import { useFeatureFlagsStore } from '../store/featureFlags.store';
import { getInteractionAccess } from '../utils/subscription';

export function useInteractionAccess(
  authUser: AppUser | null | undefined,
  recipientTier: number = 0,
) {
  const paidFeaturesDisabled = useFeatureFlagsStore((s) => s.paidFeaturesDisabled);

  return useMemo(
    () => getInteractionAccess(authUser, recipientTier, { paidFeaturesDisabled }),
    [authUser, recipientTier, paidFeaturesDisabled],
  );
}
