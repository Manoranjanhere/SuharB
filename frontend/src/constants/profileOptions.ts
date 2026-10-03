import type { AppUser } from '../store/auth.store';
import { hasActiveSubscription } from '../utils/subscription';

// Keys must match backend/src/users/profile-options.ts.

export type Option<T extends string = string> = { value: T; label: string; emoji?: string };

export const DIET_OPTIONS: Option[] = [
  { value: 'veg', label: 'Veg', emoji: '🥗' },
  { value: 'non_veg', label: 'Non-Veg', emoji: '🍗' },
  { value: 'jain', label: 'Jain', emoji: '🌿' },
  { value: 'any', label: 'Any Cuisine', emoji: '🍽️' },
];

export const UPBRINGING_OPTIONS: Option[] = [
  { value: 'liberal', label: 'Liberal' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'conservative', label: 'Conservative' },
];

export const ORIENTATION_OPTIONS: Option[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'bisexual', label: 'Bisexual' },
];

export const LOOKING_FOR_OPTIONS: Option[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'nsa', label: 'NSA' },
  { value: 'committed', label: 'Committed' },
  { value: 'open_relationship', label: 'Open Relationship' },
  { value: 'bdsm', label: 'BDSM' },
];

export type CompanyGroup = { title: string; emoji: string; options: Option[] };

export const COMPANY_FOR_GROUPS: CompanyGroup[] = [
  {
    title: 'Enjoy Travel',
    emoji: '✈️',
    options: [
      { value: 'travel_luxury_resort', label: '4-5 Star Resort / Comfort / Pools' },
      { value: 'travel_trek_explore', label: 'Trek / Explore / Bike / Camps / Mid Budget' },
      { value: 'travel_nature', label: 'Mountains / Beaches / Forests' },
    ],
  },
  {
    title: 'Enjoy Food',
    emoji: '🍷',
    options: [
      { value: 'food_fine_dining', label: 'Fine Dining / International Cuisines' },
      { value: 'food_foodie_explore', label: 'Foodie / Explore Gems / Street / Festivals' },
      { value: 'food_cook_for_me', label: 'Help - Cook My Fav Food for Me' },
    ],
  },
  {
    title: 'Enjoy Music',
    emoji: '🎵',
    options: [
      { value: 'music_trendy_pop', label: 'Trendy / Pop / Latest' },
      { value: 'music_new_romantic', label: 'New Soft Romantic' },
      { value: 'music_90s_romantic', label: '90s Soft Romantic' },
      { value: 'music_oldies_sufi', label: 'Oldies / Sufi etc' },
      { value: 'music_rock_metal', label: 'Hard / Metal / Rock' },
    ],
  },
  {
    title: 'Enjoy Lifestyle',
    emoji: '🥂',
    options: [
      { value: 'lifestyle_massage', label: 'Help - Massage Me' },
      { value: 'lifestyle_housekeep', label: 'Help - Housekeep for Me' },
      { value: 'lifestyle_seduce', label: 'Try to Seduce Me' },
      { value: 'lifestyle_sufi_concerts', label: 'Sufi Style Concerts' },
      { value: 'lifestyle_pop_concerts', label: 'Trendy / Pop / Latest Concerts' },
      { value: 'lifestyle_cinema_art', label: 'Cinema / Theatre / Art Festivals' },
      { value: 'lifestyle_fitness', label: 'Gym / Pool / Fitness Activities' },
    ],
  },
  {
    title: 'Gifts',
    emoji: '🎁',
    options: [
      { value: 'gifts_expensive', label: 'Expensive Gifts / Phones / Jewellery' },
      { value: 'gifts_medium_budget', label: 'Medium Budget Gifts Matching My Lifestyle' },
      { value: 'gifts_travel', label: 'Travel Related Gifts' },
      { value: 'gifts_suave', label: 'Suave / Tasteful Gifts' },
      { value: 'gifts_story', label: 'Gifts with a Story' },
    ],
  },
  {
    title: 'Presence In Life',
    emoji: '💞',
    options: [
      { value: 'presence_intimacy', label: 'Be Available for Physical Intimacy' },
      { value: 'presence_deep_talks', label: 'Emotionally Available for Deep Talks' },
      { value: 'presence_destress', label: 'Help - Reduce My Stress / Cheer Me Up' },
      { value: 'presence_fun', label: 'Funny / Lively / Chilled Out Presence' },
      { value: 'presence_positive', label: 'Positive / Motivating / Healing / Supportive Presence' },
      { value: 'presence_intellectual', label: "Intellectual / Money-Can't-Buy-Class Company" },
    ],
  },
];

export const COMPANY_FOR_LIMIT_BY_TIER = [3, 5, 8, 10] as const;
export const MAX_COMPANY_FOR = COMPANY_FOR_LIMIT_BY_TIER[3];

export function getCompanyForLimit(user: AppUser | null | undefined, paidFeaturesDisabled = false): number {
  if (paidFeaturesDisabled) return MAX_COMPANY_FOR;
  if (!hasActiveSubscription(user)) return COMPANY_FOR_LIMIT_BY_TIER[0];
  const tier = Math.min(Math.max(user?.subscriptionTier ?? 0, 0), 3);
  return COMPANY_FOR_LIMIT_BY_TIER[tier];
}

// ─── Height (stored in cm, shown in feet/inches) ─────────────────────────────

const cmToFeetInches = (cm: number) => {
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`;
};

/** 4'6" to 7'0" in 1-inch steps */
export const HEIGHT_OPTIONS: Option<string>[] = Array.from({ length: 31 }, (_, i) => {
  const cm = Math.round((54 + i) * 2.54);
  return { value: String(cm), label: cmToFeetInches(cm) };
});

export const formatHeight = (cm?: number | null) => (cm ? `${cmToFeetInches(cm)} (${cm} cm)` : '');

// ─── Display helpers ─────────────────────────────────────────────────────────

const labelMap = (options: Option[]) =>
  Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<string, string>;

export const DIET_LABELS = labelMap(DIET_OPTIONS);
export const UPBRINGING_LABELS = labelMap(UPBRINGING_OPTIONS);
export const ORIENTATION_LABELS = labelMap(ORIENTATION_OPTIONS);
export const LOOKING_FOR_LABELS = labelMap(LOOKING_FOR_OPTIONS);
export const COMPANY_FOR_LABELS = labelMap(COMPANY_FOR_GROUPS.flatMap((g) => g.options));

export const yesNo = (v?: boolean | null) => (v === true ? 'Yes' : v === false ? 'No' : '');

// ─── Common specs between the viewer and another profile ────────────────────

export interface ProfileSpecs {
  diet?: string | null;
  drinksAlcohol?: boolean | null;
  smokes?: boolean | null;
  upbringing?: string | null;
  sexualOrientation?: string | null;
  lookingFor?: string[] | null;
  companyFor?: string[] | null;
}

type SingleSpec = 'diet' | 'drinksAlcohol' | 'smokes' | 'upbringing' | 'sexualOrientation';
const SINGLE_SPECS: SingleSpec[] = ['diet', 'drinksAlcohol', 'smokes', 'upbringing', 'sexualOrientation'];

export interface CommonSpecs {
  fields: Set<SingleSpec>;
  lookingFor: Set<string>;
  companyFor: Set<string>;
  count: number;
}

const intersect = (a?: string[] | null, b?: string[] | null) => {
  const other = new Set(b ?? []);
  return new Set((a ?? []).filter((x) => other.has(x)));
};

export function getCommonSpecs(me: ProfileSpecs | null | undefined, other: ProfileSpecs): CommonSpecs {
  const fields = new Set<SingleSpec>();
  if (me) {
    for (const key of SINGLE_SPECS) {
      const mine = me[key];
      if (mine !== null && mine !== undefined && mine === other[key]) fields.add(key);
    }
  }
  const lookingFor = intersect(me?.lookingFor, other.lookingFor);
  const companyFor = intersect(me?.companyFor, other.companyFor);
  return { fields, lookingFor, companyFor, count: fields.size + lookingFor.size + companyFor.size };
}
