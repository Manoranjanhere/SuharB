import { api, storage } from './api';
import { Platform } from 'react-native';
import { FirebasePhoneAuth } from './firebase-phone-auth.service';

export interface AuthResponse {
  accessToken: string;
  isNewUser: boolean;
  user: any;
}

const AuthService = {
  // ─── Phone OTP (Firebase SMS) ─────────────────────────────────────────────

  async checkPhone(phone: string): Promise<void> {
    await api.post('/auth/phone/check', { phone });
  },

  async sendOtp(phone: string): Promise<void> {
    await AuthService.checkPhone(phone);
    await FirebasePhoneAuth.sendOtp(phone);
  },

  async verifyOtp(phone: string, code: string): Promise<AuthResponse> {
    const firebaseIdToken = await FirebasePhoneAuth.verifyOtp(code);
    const { data } = await api.post<AuthResponse>('/auth/phone/verify', { idToken: firebaseIdToken });
    AuthService.saveSession(data);
    return data;
  },

  // ─── Social Auth ──────────────────────────────────────────────────────────

  async socialAuth(provider: 'google' | 'facebook' | 'apple', idToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/social', { provider, idToken });
    AuthService.saveSession(data);
    return data;
  },

  // ─── FCM Device Registration ──────────────────────────────────────────────

  async registerDevice(): Promise<void> {
    try {
      const messaging = (await import('@react-native-firebase/messaging')).default;

      // iOS needs explicit permission. Android still needs POST_NOTIFICATIONS on API 33+,
      // but we always try getToken — otherwise devices never register and admin push = 0.
      if (Platform.OS === 'ios') {
        const permission = await messaging().requestPermission();
        const enabled =
          permission === messaging.AuthorizationStatus.AUTHORIZED ||
          permission === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;
      } else {
        await messaging().requestPermission();
      }

      const fcmToken = await messaging().getToken();
      if (!fcmToken) {
        console.warn('[FCM] No token returned — use a real device / Play Services emulator');
        return;
      }

      await api.post('/auth/device/register', {
        fcmToken,
        platform: Platform.OS as 'ios' | 'android',
        appVersion: '1.0.0',
      });
      if (__DEV__) console.log('[FCM] Device registered');
    } catch (err) {
      console.warn('[FCM] Device registration failed:', err);
    }
  },

  // ─── Session helpers ──────────────────────────────────────────────────────

  saveSession(data: AuthResponse): void {
    storage.set('accessToken', data.accessToken);
    storage.set('user', JSON.stringify(data.user));
  },

  clearSession(): void {
    storage.delete('accessToken');
    storage.delete('user');
    FirebasePhoneAuth.clearPending();
  },

  getStoredUser(): any | null {
    const raw = storage.getString('user');
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn(): boolean {
    return !!storage.getString('accessToken');
  },
};

export default AuthService;
