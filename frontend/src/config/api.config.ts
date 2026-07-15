/**
 * Dev overrides — only used when running the app in development (__DEV__).
 */

/** Host only, e.g. '192.168.1.42' (uses port 3000). Ignored if DEV_API_BASE_URL is set. */
export const DEV_API_HOST_OVERRIDE = '';

/**
 * Full API base URL for dev builds (Metro / npm run android).
 * Uses the same HTTPS API domain as production.
 */
export const DEV_API_BASE_URL = 'https://api.sugarbf.club/api/v1';

/** Production release APK (non-__DEV__) */
export const PROD_API_BASE_URL = 'https://api.sugarbf.club/api/v1';
