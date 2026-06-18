import axios from 'axios';
import { MMKV } from 'react-native-mmkv';
import { NativeModules, Platform } from 'react-native';
import { DEV_API_BASE_URL, DEV_API_HOST_OVERRIDE, PROD_API_BASE_URL } from '../config/api.config';

export const storage = new MMKV();

const isAndroidEmulator = (() => {
  if (Platform.OS !== 'android') {
    return false;
  }

  const androidConstants = Platform.constants as {
    Fingerprint?: string;
    Model?: string;
  };

  const deviceFingerprint = `${androidConstants.Fingerprint ?? ''} ${androidConstants.Model ?? ''}`;
  return /(generic|emulator|sdk_gphone|vbox86p|google_sdk)/i.test(deviceFingerprint);
})();

const getMetroHost = (): string | null => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL) return null;

  try {
    const parsed = new URL(scriptURL);
    return parsed.hostname || null;
  } catch {
    return null;
  }
};

const getAndroidDevBaseUrl = (): string => {
  if (DEV_API_HOST_OVERRIDE.trim()) {
    return `http://${DEV_API_HOST_OVERRIDE.trim()}:3000/api/v1`;
  }

  const metroHost = getMetroHost();
  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
    // Physical device on same network as dev machine (Metro IP)
    return `http://${metroHost}:3000/api/v1`;
  }

  if (isAndroidEmulator) {
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Physical device over USB with adb reverse tcp:3000 tcp:3000
  return 'http://localhost:3000/api/v1';
};

const getDevBaseUrl = (): string => {
  if (DEV_API_BASE_URL.trim()) {
    return DEV_API_BASE_URL.trim().replace(/\/$/, '');
  }

  if (Platform.OS === 'android') {
    return getAndroidDevBaseUrl();
  }

  return 'http://localhost:3000/api/v1';
};

const BASE_URL = __DEV__ ? getDevBaseUrl() : PROD_API_BASE_URL.replace(/\/$/, '');

if (__DEV__) {
  console.log('[API] Using base URL:', BASE_URL);
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = storage.getString('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Axios + RN FormData: drop JSON content-type and skip body transforms
  if (config.data instanceof FormData) {
    if (config.headers) {
      config.headers['Content-Type'] = undefined;
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
    }
    config.transformRequest = [(data) => data];
  }
  return config;
});

/** Multipart uploads — fetch handles RN FormData more reliably than axios. */
export async function postFormData<T = unknown>(
  path: string,
  formData: FormData,
  options?: { timeout?: number },
): Promise<{ data: T; status: number }> {
  const token = storage.getString('accessToken');
  const timeoutMs = options?.timeout ?? 60000;
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    const text = await response.text();
    let data: T;
    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      const parseErr: any = new Error('Invalid server response');
      parseErr.response = { status: response.status, data: { message: text.slice(0, 200) } };
      throw parseErr;
    }

    if (!response.ok) {
      const err: any = new Error('Request failed');
      err.response = { status: response.status, data };
      throw err;
    }

    return { data, status: response.status };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      const timeoutErr: any = new Error('Upload timed out');
      timeoutErr.code = 'ECONNABORTED';
      throw timeoutErr;
    }
    if (!err.response) {
      err.message = err?.message || 'Network request failed';
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Handle 401 — clear storage and redirect to auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.delete('accessToken');
      storage.delete('user');
    }
    return Promise.reject(error);
  },
);

export function getNetworkErrorHint(): string {
  if (!__DEV__) {
    return 'Check your internet connection and try again.';
  }

  if (DEV_API_BASE_URL.trim()) {
    return `Cannot reach the server. Check your internet connection (${DEV_API_BASE_URL.trim()}).`;
  }

  if (Platform.OS === 'android' && !isAndroidEmulator) {
    return (
      'Cannot reach the backend. Make sure npm run start:dev is running, then either:\n' +
      '• Phone on WiFi: set DEV_API_HOST_OVERRIDE in src/config/api.config.ts to your PC IP\n' +
      '• Phone on USB: run adb reverse tcp:3000 tcp:3000'
    );
  }

  return 'Cannot reach the backend. Make sure npm run start:dev is running on port 3000.';
}
