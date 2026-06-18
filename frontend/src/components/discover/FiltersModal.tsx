import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { DiscoverFilters } from '../../services/discover.service';
import { getWeeklyAllowanceOptions } from '../../constants/allowance';
import { useAppCountry } from '../../hooks/useAppCountry';

interface Props {
  visible: boolean;
  filters: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
  onClose: () => void;
}

const DISTANCES = [5, 10, 25, 50, 100, 250];
const AGE_RANGES = [
  { label: '18–25', min: 18, max: 25 },
  { label: '25–35', min: 25, max: 35 },
  { label: '35–45', min: 35, max: 45 },
  { label: '45–55', min: 45, max: 55 },
  { label: '55+', min: 55, max: 65 },
  { label: 'Any', min: 18, max: 65 },
];
const GENDERS = [
  { label: '👨 Men', value: 'male' },
  { label: '👩 Women', value: 'female' },
  { label: '🌈 All', value: undefined },
];
const ROLES = [
  { label: '💼 Professionals', value: 'professional' },
  { label: '✨ Lifestyle Seekers', value: 'companion' },
  { label: '👥 Everyone', value: undefined },
];

export default function FiltersModal({ visible, filters, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<DiscoverFilters>(filters);
  const { formatMoney, formatWeeklyAllowance, countryCode } = useAppCountry();
  const allowanceOptions = getWeeklyAllowanceOptions(countryCode);

  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  const showFemaleAllowance =
    local.gender === 'female' || local.role === 'companion' || (!local.gender && !local.role);
  const showMaleAllowance =
    local.gender === 'male' || local.role === 'professional' || (!local.gender && !local.role);

  const apply = () => { onApply(local); onClose(); };
  const reset = () => setLocal({ maxDistance: 50, minAge: 18, maxAge: 65 });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Max Distance
              <Text style={styles.sectionValue}> — {local.maxDistance || 50} km</Text>
            </Text>
            <View style={styles.chipRow}>
              {DISTANCES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, local.maxDistance === d && styles.chipActive]}
                  onPress={() => setLocal((p) => ({ ...p, maxDistance: d }))}
                >
                  <Text style={[styles.chipText, local.maxDistance === d && styles.chipTextActive]}>
                    {d} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Age range */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Age Range</Text>
            <View style={styles.chipRow}>
              {AGE_RANGES.map((r) => {
                const isActive = local.minAge === r.min && local.maxAge === r.max;
                return (
                  <TouchableOpacity
                    key={r.label}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setLocal((p) => ({ ...p, minAge: r.min, maxAge: r.max }))}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Show Me</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => {
                const isActive = local.gender === g.value;
                return (
                  <TouchableOpacity
                    key={g.label}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setLocal((p) => ({ ...p, gender: g.value as any }))}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Role */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Looking For</Text>
            <View style={styles.chipRow}>
              {ROLES.map((r) => {
                const isActive = local.role === r.value;
                return (
                  <TouchableOpacity
                    key={r.label}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setLocal((p) => ({ ...p, role: r.value as any }))}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Min Allowance — male / professional profiles */}
          {showMaleAllowance && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Min Weekly Allowance (Male) 💰
                {local.minAllowance ? (
                  <Text style={styles.sectionValue}> — {formatMoney(local.minAllowance)}+</Text>
                ) : ''}
              </Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !local.minAllowance && styles.chipActive]}
                  onPress={() => setLocal((p) => ({ ...p, minAllowance: undefined }))}
                >
                  <Text style={[styles.chipText, !local.minAllowance && styles.chipTextActive]}>Any</Text>
                </TouchableOpacity>
                {allowanceOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, local.minAllowance === opt.value && styles.chipActive]}
                    onPress={() => setLocal((p) => ({ ...p, minAllowance: opt.value }))}
                  >
                    <Text style={[styles.chipText, local.minAllowance === opt.value && styles.chipTextActive]}>
                      {opt.label}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Weekly Allowance — female / companion profiles */}
          {showFemaleAllowance && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Weekly Allowance (Female) 💝
                {local.weeklyAllowanceFilter ? (
                  <Text style={styles.sectionValue}> — {formatWeeklyAllowance(local.weeklyAllowanceFilter)}</Text>
                ) : ''}
              </Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !local.weeklyAllowanceFilter && styles.chipActive]}
                  onPress={() => setLocal((p) => ({ ...p, weeklyAllowanceFilter: undefined }))}
                >
                  <Text style={[styles.chipText, !local.weeklyAllowanceFilter && styles.chipTextActive]}>Any</Text>
                </TouchableOpacity>
                {allowanceOptions.map((opt) => (
                  <TouchableOpacity
                    key={`f-${opt.value}`}
                    style={[styles.chip, local.weeklyAllowanceFilter === opt.value && styles.chipActive]}
                    onPress={() => setLocal((p) => ({ ...p, weeklyAllowanceFilter: opt.value }))}
                  >
                    <Text style={[styles.chipText, local.weeklyAllowanceFilter === opt.value && styles.chipTextActive]}>
                      {opt.labelWeekly}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Accommodation */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Accommodation 🏠</Text>
            <View style={styles.chipRow}>
              {[
                { label: 'Any', value: undefined },
                { label: '🏠 Live-in', value: 'live_in' },
                { label: '🛏 Own Room', value: 'independent_room' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, local.accommodationType === opt.value && styles.chipActive]}
                  onPress={() => setLocal((p) => ({ ...p, accommodationType: opt.value }))}
                >
                  <Text style={[styles.chipText, local.accommodationType === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Verified only toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.chip, local.verifiedOnly && styles.chipActive]}
              onPress={() => setLocal((p) => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
            >
              <Text style={[styles.chipText, local.verifiedOnly && styles.chipTextActive]}>
                ✅ Verified members only
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={apply}>
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  resetText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  sectionValue: { color: Colors.primary, textTransform: 'none', letterSpacing: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: '#3D0020', borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  applyBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
