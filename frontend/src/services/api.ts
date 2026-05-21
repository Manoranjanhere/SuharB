import axios from 'axios';
import { MMKV } from 'react-native-mmkv';
import { NativeModules, Platform } from 'react-native';

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
  const metroHost = getMetroHost();
  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
    // Physical device on same network as dev machine
    return `http://${metroHost}:3000/api/v1`;
  }

  if (isAndroidEmulator) {
    // Android emulator -> host machine localhost
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Physical Android over USB requires: adb reverse tcp:3000 tcp:3000
  return 'http://localhost:3000/api/v1';
};

const DEV_BASE_URL =
  Platform.OS === 'android'
    ? getAndroidDevBaseUrl()
    : 'http://localhost:3000/api/v1';

const BASE_URL = __DEV__ ? DEV_BASE_URL : 'https://api.sugarbfapp.com/api/v1';

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
  return config;
});

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
