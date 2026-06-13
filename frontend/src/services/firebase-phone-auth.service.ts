import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { normalizePhone } from './auth-errors';

let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export const FirebasePhoneAuth = {
  async sendOtp(phone: string): Promise<void> {
    const e164 = normalizePhone(phone);
    if (__DEV__) {
      console.log('[Firebase] Sending OTP to:', e164);
    }
    pendingConfirmation = await auth().signInWithPhoneNumber(e164);
  },

  async verifyOtp(code: string): Promise<string> {
    if (!pendingConfirmation) {
      throw new Error('No OTP was sent. Go back and request a new code.');
    }

    await pendingConfirmation.confirm(code);
    pendingConfirmation = null;

    const user = auth().currentUser;
    if (!user) {
      throw new Error('Phone verification failed');
    }

    return await user.getIdToken();
  },

  clearPending(): void {
    pendingConfirmation = null;
  },
};
