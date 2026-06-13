import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import appleAuth from '@invertase/react-native-apple-authentication';

import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import AuthService from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import type { WelcomeScreenProps } from '../../navigation/types';

GoogleSignin.configure({
  webClientId: '1005197032536-aqp23ko5gc3rf85491cjj58c2kd47j48.apps.googleusercontent.com',
  offlineAccess: false,
});

const { height } = Dimensions.get('window');

type Props = WelcomeScreenProps;

export default function WelcomeScreen({ navigation }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  const confirmGoogleAccount = (email?: string): Promise<boolean> =>
    new Promise((resolve) => {
      Alert.alert(
        'Continue with this account?',
        email || 'Selected Google account',
        [
          { text: 'Choose Another', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continue', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });

  const handleAuthSuccess = async (response: any) => {
    setToken(response.accessToken);
    setUser(response.user);

    // Register device for push
    await AuthService.registerDevice();

    if (response.isNewUser || response.user.profileStage === 0) {
      navigation.replace('Stage1');
    } else if (response.user.profileStage === 1) {
      navigation.replace('Stage2');
    } else {
      navigation.replace('Main');
    }
  };

  // ─── Google Sign In ───────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const previousUser = GoogleSignin.getCurrentUser();
      if (previousUser) {
        // Force account chooser instead of silently reusing previous Google account.
        await GoogleSignin.signOut();
      }
      const googleUser = await GoogleSignin.signIn();
      const shouldContinue = await confirmGoogleAccount(googleUser?.user?.email);
      if (!shouldContinue) {
        await GoogleSignin.signOut();
        return;
      }
      const tokens = await GoogleSignin.getTokens();
      const res = await AuthService.socialAuth('google', tokens.idToken);
      await handleAuthSuccess(res);
    } catch (err: any) {
      console.error('[Google] Auth failed:', err.message);
      Alert.alert('Google sign in failed', err?.response?.data?.message || err?.message || 'Please try again.');
    }
  };

  // ─── Facebook Sign In ─────────────────────────────────────────────────────
  const handleFacebook = async () => {
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) return;
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) return;
      const res = await AuthService.socialAuth('facebook', data.accessToken);
      await handleAuthSuccess(res);
    } catch (err: any) {
      console.error('[Facebook] Auth failed:', err.message);
      Alert.alert('Facebook sign in failed', err?.response?.data?.message || err?.message || 'Please try again.');
    }
  };

  // ─── Apple Sign In ────────────────────────────────────────────────────────
  const handleApple = async () => {
    try {
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      const { identityToken } = appleAuthResponse;
      if (!identityToken) return;
      const res = await AuthService.socialAuth('apple', identityToken);
      await handleAuthSuccess(res);
    } catch (err: any) {
      if (err.code !== appleAuth.Error.CANCELED) {
        console.error('[Apple] Auth failed:', err.message);
        Alert.alert('Apple sign in failed', err?.response?.data?.message || err?.message || 'Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero gradient background */}
      <LinearGradient
        colors={['#1a0010', '#3D0020', '#C9184A']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />

      {/* Logo & tagline */}
      <View style={styles.heroSection}>
        <Text style={styles.logo}>SugarBf</Text>
        <Text style={styles.tagline}>Where Ambition Meets Desire</Text>
        <Text style={styles.subtitle}>
          Premium connections for the elite lifestyle
        </Text>
      </View>

      {/* Auth buttons */}
      <View style={styles.buttonsContainer}>
        {/* Phone OTP */}
        <TouchableOpacity
          style={[styles.button, styles.phoneButton]}
          onPress={() => navigation.navigate('PhoneEntry')}
          activeOpacity={0.85}
        >
          <Text style={styles.phoneIcon}>📱</Text>
          <Text style={styles.buttonText}>Continue with Phone</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        {/* Google */}
        <TouchableOpacity
          style={[styles.button, styles.socialButton]}
          onPress={handleGoogle}
          activeOpacity={0.85}
        >
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity
          style={[styles.button, styles.socialButton]}
          onPress={handleFacebook}
          activeOpacity={0.85}
        >
          <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
          <Text style={styles.socialButtonText}>Continue with Facebook</Text>
        </TouchableOpacity>

        {/* Apple (iOS only) */}
        {appleAuth.isSupported && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleApple}
            activeOpacity={0.85}
          >
            <Text style={[styles.socialIcon, { color: '#fff' }]}></Text>
            <Text style={[styles.socialButtonText, { color: '#fff' }]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  logo: {
    fontSize: 46,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: FontSize.lg,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  buttonsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  phoneButton: {
    backgroundColor: '#25D366',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  phoneIcon: { fontSize: 18 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  socialButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appleButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    width: 22,
    textAlign: 'center',
  },
  socialButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  terms: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  termsLink: { color: Colors.primary, fontWeight: '600' },
});
