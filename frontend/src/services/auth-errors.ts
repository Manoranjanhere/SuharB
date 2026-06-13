import axios from 'axios';
import { getNetworkErrorHint } from './api';

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}

export function formatOtpError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return getNetworkErrorHint();
    }
    const data = err.response.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join('\n');
    if (data?.message) return data.message;
    return err.message || 'Request failed';
  }

  const firebaseErr = err as { code?: string; message?: string };
  switch (firebaseErr.code) {
    case 'auth/missing-client-identifier':
      return (
        'Firebase cannot verify this app (Play Integrity / reCAPTCHA failed).\n\n' +
        'Your debug build SHA-1 is likely 7B:C9:5E:90:… — add it in Firebase Console → ' +
        'Project settings → Android app → SHA certificate fingerprints (SHA-1 + SHA-256). ' +
        'Run: cd android && gradlew signingReport\n\n' +
        'Then download a new google-services.json, replace android/app/google-services.json, ' +
        'and rebuild (npm run android). Use a device/emulator with Google Play.'
      );
    case 'auth/invalid-phone-number':
      return 'Invalid phone number. Use country code, e.g. +918658247125';
    case 'auth/too-many-requests':
      if (firebaseErr.message?.includes('blocked all requests from this device')) {
        return (
          'Firebase blocked OTP on this device after too many attempts.\n\n' +
          'Wait 1–24 hours, or use a test number (Auth → Phone → Phone numbers for testing), ' +
          'or try another phone/emulator. Avoid hammering Send OTP while debugging.'
        );
      }
      return 'Too many OTP requests. Wait a few minutes and try again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Use a test phone number in Firebase Console for dev.';
    case 'auth/network-request-failed':
      return 'Firebase network error. Check internet connection on your phone.';
    case 'auth/app-not-authorized':
      return 'This app is not authorized for Firebase Phone Auth. Check google-services.json and package name.';
    case 'auth/operation-not-allowed':
      if (firebaseErr.message?.includes('region')) {
        return (
          'SMS to India (+91) is blocked by Firebase region policy.\n\n' +
          'Firebase Console → Authentication → Settings → SMS region policy → ' +
          'Allow → add India.\n\n' +
          'Phone SMS also requires the Blaze (pay-as-you-go) plan. ' +
          'For dev without SMS, add a test number under Sign-in method → Phone → Phone numbers for testing.'
        );
      }
      return (
        'Phone sign-in is not allowed. Enable Phone in Firebase Console → Authentication → Sign-in method.'
      );
    default:
      if (firebaseErr.message) return firebaseErr.message;
      return 'Failed to send OTP. Try again.';
  }
}
