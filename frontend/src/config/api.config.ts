/**
 * Dev overrides — only used when running the app in development (__DEV__).
 */

/** Host only, e.g. '192.168.1.42' (uses port 3000). Ignored if DEV_API_BASE_URL is set. */
export const DEV_API_HOST_OVERRIDE = '';

/**
 * Full API base URL for dev builds pointing at AWS / staging.
 * Examples:
 *   'https://api.sugarbfapp.com/api/v1'
 *   'http://YOUR_EC2_PUBLIC_IP:3000/api/v1'  (quick test; HTTP only works in debug builds)
 */
export const DEV_API_BASE_URL = '';

/** Production release builds (non-__DEV__) */
export const PROD_API_BASE_URL = 'https://api.sugarbfapp.com/api/v1';
