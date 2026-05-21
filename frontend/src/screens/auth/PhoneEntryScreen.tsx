import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import AuthService from '../../services/auth.service';
import type { PhoneEntryScreenProps } from '../../navigation/types';

type Props = PhoneEntryScreenProps;

export default function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const phoneRef = React.useRef<PhoneInput>(null);

  const handleSendOtp = async () => {
    const isValid = phoneRef.current?.isValidNumber(phone);
    if (!isValid) {
      Alert.alert('Invalid number', 'Please enter a valid phone number with country code.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.sendOtp(formattedPhone);
      navigation.navigate('OtpVerify', { phone: formattedPhone });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Your number</Text>
        <Text style={styles.subtitle}>
          We'll send a verification code to your WhatsApp
        </Text>

        <View style={styles.phoneWrapper}>
          <PhoneInput
            ref={phoneRef}
            defaultValue={phone}
            defaultCode="IN"
            layout="first"
            onChangeText={setPhone}
            onChangeFormattedText={setFormattedPhone}
            withDarkTheme
            withShadow={false}
            containerStyle={styles.phoneContainer}
            textContainerStyle={styles.phoneTextContainer}
            textInputStyle={styles.phoneTextInput}
            codeTextStyle={styles.codeText}
            flagButtonStyle={styles.flagButton}
            countryPickerButtonStyle={styles.countryPicker}
          />
        </View>

        <Text style={styles.hint}>
          📱 A 6-digit code will be sent via WhatsApp
        </Text>

        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueBtnText}>Send OTP →</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    lineHeight: 22,
  },
  phoneWrapper: { marginBottom: Spacing.md },
  phoneContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phoneTextContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  phoneTextInput: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
  },
  codeText: { color: Colors.textPrimary },
  flagButton: {},
  countryPicker: {},
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.6 },
  continueBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
