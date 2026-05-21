import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import AuthService from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import type { OtpVerifyScreenProps } from '../../navigation/types';

type Props = OtpVerifyScreenProps;

const RESEND_SECONDS = 60;

export default function OtpVerifyScreen({ navigation, route }: Props) {
  const { phone } = route.params as { phone: string };
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    setResendTimer(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await AuthService.sendOtp(phone);
      startTimer();
    } catch {
      Alert.alert('Error', 'Could not resend OTP');
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await AuthService.verifyOtp(phone, code);
      setToken(res.accessToken);
      setUser(res.user);

      await AuthService.registerDevice();

      if (res.isNewUser || res.user.profileStage === 0) {
        navigation.replace('Stage1');
      } else if (res.user.profileStage === 1) {
        navigation.replace('Stage2');
      } else {
        navigation.replace('Main');
      }
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.response?.data?.message || 'The code is wrong or expired.');
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone.replace(/(\+\d{2})(\d+)(\d{4})/, '$1****$3');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>{maskedPhone}</Text>
          {'\n'}via WhatsApp
        </Text>

        {/* OTP Input */}
        <OtpInput
          numberOfDigits={6}
          onTextChange={setOtp}
          onFilled={handleVerify}
          focusColor={Colors.primary}
          theme={{
            containerStyle: styles.otpContainer,
            inputsContainerStyle: styles.otpInputsContainer,
            pinCodeContainerStyle: styles.otpBox,
            pinCodeTextStyle: styles.otpText,
            focusedPinCodeContainerStyle: styles.otpBoxFocused,
          }}
        />

        {loading && (
          <ActivityIndicator
            color={Colors.primary}
            size="large"
            style={{ marginTop: Spacing.lg }}
          />
        )}

        {/* Resend */}
        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>
              Resend in <Text style={styles.resendTimerHighlight}>{resendTimer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, (loading || otp.length < 6) && styles.verifyBtnDisabled]}
          onPress={() => handleVerify(otp)}
          disabled={loading || otp.length < 6}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  back: { padding: Spacing.lg, paddingBottom: 0, marginTop: 40 },
  backArrow: { fontSize: 24, color: Colors.textPrimary },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 26,
  },
  phone: { color: Colors.textPrimary, fontWeight: '700' },
  otpContainer: { marginBottom: Spacing.lg },
  otpInputsContainer: { gap: Spacing.sm },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  otpBoxFocused: { borderColor: Colors.primary },
  otpText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  resendRow: { alignItems: 'center', marginVertical: Spacing.lg },
  resendTimer: { color: Colors.textMuted, fontSize: FontSize.sm },
  resendTimerHighlight: { color: Colors.textSecondary, fontWeight: '600' },
  resendLink: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
