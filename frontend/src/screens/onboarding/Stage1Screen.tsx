import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import type { Stage1ScreenProps } from '../../navigation/types';

type Props = Stage1ScreenProps;

const GENDERS = [
  { label: 'Man', value: 'male', emoji: '👨' },
  { label: 'Woman', value: 'female', emoji: '👩' },
  { label: 'Other', value: 'other', emoji: '🌈' },
];

const ALLOWANCE_OPTIONS = [
  { label: '₹5,000/week', value: 5000 },
  { label: '₹7,000/week', value: 7000 },
  { label: '₹10,000/week', value: 10000 },
  { label: '₹15,000/week', value: 15000 },
  { label: '₹20,000/week', value: 20000 },
  { label: '₹30,000/week', value: 30000 },
  { label: '₹40,000/week', value: 40000 },
  { label: '₹50,000/week', value: 50000 },
];

const ACCOMMODATION_OPTIONS = [
  { label: '🏠 Live-in arrangement', value: 'live_in' },
  { label: '🛏️ Independent room', value: 'independent_room' },
];

const ROLES = [
  {
    value: 'professional',
    title: 'Successful Professional',
    desc: 'I\'m established, driven, and want to share my success',
    emoji: '💼',
  },
  {
    value: 'companion',
    title: 'Lifestyle Seeker',
    desc: 'I\'m fun, ambitious, and want to experience the finer things',
    emoji: '✨',
  },
];

export default function Stage1Screen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<string | null>(user?.gender || null);
  const [age, setAge] = useState<string>(user?.age?.toString() || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState<string | null>(user?.role || null);
  const [referredByCode, setReferredByCode] = useState('');
  // Female-specific
  const [weeklyAllowanceExpectation, setWeeklyAllowanceExpectation] = useState<number | null>(
    user?.weeklyAllowanceExpectation ?? null,
  );
  // Male-specific
  const [canProvideAllowance, setCanProvideAllowance] = useState<boolean | null>(
    user?.canProvideAllowance ?? null,
  );
  const [weeklyAllowanceAmount, setWeeklyAllowanceAmount] = useState<number | null>(
    user?.weeklyAllowanceAmount ?? null,
  );
  const [canProvideAccommodation, setCanProvideAccommodation] = useState<boolean | null>(
    user?.canProvideAccommodation ?? null,
  );
  const [accommodationType, setAccommodationType] = useState<string | null>(
    user?.accommodationType ?? null,
  );
  const [loading, setLoading] = useState(false);

  const needsEmail = !user?.email; // Needed if registered via OTP or Facebook

  const isValid =
    name.trim().length >= 2 &&
    gender &&
    parseInt(age) >= 18 &&
    parseInt(age) <= 65 &&
    city.trim().length >= 2 &&
    country.trim().length >= 2 &&
    role &&
    (!needsEmail || email.includes('@'));

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        gender,
        age: parseInt(age),
        city: city.trim(),
        country: country.trim(),
        role,
      };
      if (needsEmail && email) payload.email = email.trim();
      if (referredByCode.length === 6) payload.referredByCode = referredByCode.toUpperCase();
      // Role-specific fields
      if (role === 'companion' && weeklyAllowanceExpectation) {
        payload.weeklyAllowanceExpectation = weeklyAllowanceExpectation;
      }
      if (role === 'professional') {
        if (canProvideAllowance !== null) payload.canProvideAllowance = canProvideAllowance;
        if (canProvideAllowance && weeklyAllowanceAmount) payload.weeklyAllowanceAmount = weeklyAllowanceAmount;
        if (canProvideAccommodation !== null) payload.canProvideAccommodation = canProvideAccommodation;
        if (canProvideAccommodation && accommodationType) payload.accommodationType = accommodationType;
      }

      const { data } = await api.patch('/users/profile/stage1', payload);
      updateUser({ ...data, profileStage: 1 });
      navigation.replace('Stage2');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressStep, styles.progressActive]}>
        <Text style={styles.progressStepText}>1</Text>
      </View>
      <View style={styles.progressLine} />
      <View style={styles.progressStep}>
        <Text style={[styles.progressStepText, { color: Colors.textMuted }]}>2</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ProgressBar />
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>This stays private until you match</Text>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Your first name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            placeholderTextColor={Colors.textMuted}
            maxLength={60}
          />
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, gender === g.value && styles.chipSelected]}
                onPress={() => setGender(g.value)}
              >
                <Text style={styles.chipEmoji}>{g.emoji}</Text>
                <Text style={[styles.chipText, gender === g.value && styles.chipTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age */}
        <View style={styles.section}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            placeholder="18–65"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={2}
          />
          {age && (parseInt(age) < 18 || parseInt(age) > 65) && (
            <Text style={styles.errorText}>Must be between 18 and 65</Text>
          )}
        </View>

        {/* City */}
        <View style={styles.section}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Mumbai"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Country */}
        <View style={styles.section}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. India"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        {/* Email (if needed) */}
        {needsEmail && (
          <View style={styles.section}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Role */}
        <View style={styles.section}>
          <Text style={styles.label}>I am a...</Text>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
              onPress={() => setRole(r.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
              <View style={styles.roleTextContainer}>
                <Text style={[styles.roleTitle, role === r.value && styles.roleTitleSelected]}>
                  {r.title}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </View>
              {role === r.value && (
                <View style={styles.roleCheck}>
                  <Text style={styles.roleCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Female: Weekly Allowance Expectation ── */}
        {role === 'companion' && (
          <View style={styles.section}>
            <Text style={styles.label}>Weekly Allowance I'm Looking For 💰</Text>
            <Text style={styles.labelHint}>What weekly allowance are you expecting?</Text>
            <View style={styles.chipRow}>
              {ALLOWANCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, weeklyAllowanceExpectation === opt.value && styles.chipSelected]}
                  onPress={() => setWeeklyAllowanceExpectation(opt.value)}
                >
                  <Text style={[styles.chipText, weeklyAllowanceExpectation === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Male: Can Provide Allowance ── */}
        {role === 'professional' && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Can you provide weekly allowance? 💸</Text>
              <View style={styles.chipRow}>
                {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.chip, canProvideAllowance === opt.value && styles.chipSelected]}
                    onPress={() => { setCanProvideAllowance(opt.value); if (!opt.value) setWeeklyAllowanceAmount(null); }}
                  >
                    <Text style={[styles.chipText, canProvideAllowance === opt.value && styles.chipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {canProvideAllowance === true && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={styles.labelHint}>Select the amount you can provide:</Text>
                  <View style={[styles.chipRow, { marginTop: Spacing.sm }]}>
                    {ALLOWANCE_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, weeklyAllowanceAmount === opt.value && styles.chipSelected]}
                        onPress={() => setWeeklyAllowanceAmount(opt.value)}
                      >
                        <Text style={[styles.chipText, weeklyAllowanceAmount === opt.value && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Can you provide accommodation? 🏠</Text>
              <View style={styles.chipRow}>
                {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.chip, canProvideAccommodation === opt.value && styles.chipSelected]}
                    onPress={() => { setCanProvideAccommodation(opt.value); if (!opt.value) setAccommodationType(null); }}
                  >
                    <Text style={[styles.chipText, canProvideAccommodation === opt.value && styles.chipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {canProvideAccommodation === true && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={styles.labelHint}>Select accommodation type:</Text>
                  <View style={[styles.chipRow, { marginTop: Spacing.sm }]}>
                    {ACCOMMODATION_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, accommodationType === opt.value && styles.chipSelected]}
                        onPress={() => setAccommodationType(opt.value)}
                      >
                        <Text style={[styles.chipText, accommodationType === opt.value && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Referral Code */}
        <View style={styles.section}>
          <Text style={styles.label}>Referral Code (optional)</Text>
          <TextInput
            style={styles.input}
            value={referredByCode}
            onChangeText={(v) => setReferredByCode(v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            placeholder="Enter 6-char code from a friend"
            placeholderTextColor={Colors.textMuted}
            maxLength={6}
            autoCapitalize="characters"
          />
          {referredByCode.length > 0 && referredByCode.length < 6 && (
            <Text style={styles.errorText}>Code must be exactly 6 characters</Text>
          )}
          {referredByCode.length === 6 && (
            <Text style={{ color: '#4CAF50', fontSize: 12, marginTop: 4 }}>
              🎉 Your friend earns 500 coins on your activation!
            </Text>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueBtn, (!isValid || loading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueBtnText}>Continue → Add Photos</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.lg },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressStepText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: Spacing.xs },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  inputText: { color: Colors.textPrimary, fontSize: FontSize.md },
  placeholderText: { color: Colors.textMuted, fontSize: FontSize.md },
  inputSmall: { width: 120 },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
  labelHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#3D0020' },
  chipEmoji: { fontSize: 16 },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  chipTextSelected: { color: Colors.primary },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  roleCardSelected: { borderColor: Colors.primary, backgroundColor: '#1A0010' },
  roleEmoji: { fontSize: 28 },
  roleTextContainer: { flex: 1 },
  roleTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  roleTitleSelected: { color: Colors.primary },
  roleDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  roleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
