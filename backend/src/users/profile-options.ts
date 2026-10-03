import { SubscriptionTier } from '../subscriptions/subscription.constants';

// Keys are stored in the DB; labels live in the app (frontend/src/constants/profileOptions.ts).
// Keep both lists in sync when adding or renaming options.

export const DIET_OPTIONS = ['veg', 'non_veg', 'jain', 'any'] as const;
export const UPBRINGING_OPTIONS = ['liberal', 'moderate', 'conservative'] as const;
export const ORIENTATION_OPTIONS = ['straight', 'bisexual'] as const;
export const LOOKING_FOR_OPTIONS = [
  'casual',
  'nsa',
  'committed',
  'open_relationship',
  'bdsm',
] as const;

export const COMPANY_FOR_OPTIONS = [
  // Enjoy Travel
  'travel_luxury_resort',
  'travel_trek_explore',
  'travel_nature',
  // Enjoy Food
  'food_fine_dining',
  'food_foodie_explore',
  'food_cook_for_me',
  // Enjoy Music
  'music_trendy_pop',
  'music_new_romantic',
  'music_90s_romantic',
  'music_oldies_sufi',
  'music_rock_metal',
  // Enjoy Lifestyle
  'lifestyle_massage',
  'lifestyle_housekeep',
  'lifestyle_seduce',
  'lifestyle_sufi_concerts',
  'lifestyle_pop_concerts',
  'lifestyle_cinema_art',
  'lifestyle_fitness',
  // Gifts
  'gifts_expensive',
  'gifts_medium_budget',
  'gifts_travel',
  'gifts_suave',
  'gifts_story',
  // Presence In Life
  'presence_intimacy',
  'presence_deep_talks',
  'presence_destress',
  'presence_fun',
  'presence_positive',
  'presence_intellectual',
] as const;

export const MIN_HEIGHT_CM = 137; // 4'6"
export const MAX_HEIGHT_CM = 213; // 7'0"

export const COMPANY_FOR_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.NONE]: 3,
  [SubscriptionTier.BASE]: 5,
  [SubscriptionTier.MID]: 8,
  [SubscriptionTier.TOP]: 10,
};

export function getCompanyForLimit(tier: number): number {
  if (tier >= SubscriptionTier.TOP) return COMPANY_FOR_LIMITS[SubscriptionTier.TOP];
  if (tier >= SubscriptionTier.MID) return COMPANY_FOR_LIMITS[SubscriptionTier.MID];
  if (tier >= SubscriptionTier.BASE) return COMPANY_FOR_LIMITS[SubscriptionTier.BASE];
  return COMPANY_FOR_LIMITS[SubscriptionTier.NONE];
}
