import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import {
  COMPANY_FOR_GROUPS,
  DIET_OPTIONS,
  HEIGHT_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ORIENTATION_OPTIONS,
  UPBRINGING_OPTIONS,
  type Option,
} from '../../constants/profileOptions';

export interface ProfileSpecsValue {
  heightCm: number | null;
  diet: string | null;
  drinksAlcohol: boolean | null;
  smokes: boolean | null;
  upbringing: string | null;
  sexualOrientation: string | null;
  lookingFor: string[];
  companyFor: string[];
}

interface Props {
  value: ProfileSpecsValue;
  onChange: (next: ProfileSpecsValue) => void;
  companyForLimit: number;
  onCompanyForLimitReached: () => void;
}

const YES_NO: Option[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];
const toYesNo = (v: boolean | null) => (v === null ? null : v ? 'yes' : 'no');

function Chip({
  label,
  emoji,
  selected,
  dimmed,
  onPress,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  dimmed?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected, dimmed && styles.chipDimmed]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {emoji ? <Text style={styles.chipEmoji}>{emoji}</Text> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Single choice; tapping the selected chip clears it. */
function SingleSelect({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Option[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            emoji={o.emoji}
            selected={selected === o.value}
            onPress={() => onSelect(selected === o.value ? null : o.value)}
          />
        ))}
      </View>
    </View>
  );
}

export default function ProfileSpecsForm({
  value,
  onChange,
  companyForLimit,
  onCompanyForLimitReached,
}: Props) {
  const set = (patch: Partial<ProfileSpecsValue>) => onChange({ ...value, ...patch });

  const toggleLookingFor = (key: string) =>
    set({
      lookingFor: value.lookingFor.includes(key)
        ? value.lookingFor.filter((k) => k !== key)
        : [...value.lookingFor, key],
    });

  const companyCount = value.companyFor.length;
  const atLimit = companyCount >= companyForLimit;

  const toggleCompanyFor = (key: string) => {
    if (value.companyFor.includes(key)) {
      set({ companyFor: value.companyFor.filter((k) => k !== key) });
      return;
    }
    if (atLimit) {
      onCompanyForLimitReached();
      return;
    }
    set({ companyFor: [...value.companyFor, key] });
  };

  return (
    <>
      {/* ── I am ── */}
      <View style={styles.section}>
        <Text style={styles.heading}>I am</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Height</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipLine}>
            {HEIGHT_OPTIONS.map((o) => {
              const cm = Number(o.value);
              return (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={value.heightCm === cm}
                  onPress={() => set({ heightCm: value.heightCm === cm ? null : cm })}
                />
              );
            })}
          </ScrollView>
        </View>

        <SingleSelect
          label="Food"
          options={DIET_OPTIONS}
          selected={value.diet}
          onSelect={(diet) => set({ diet })}
        />
        <SingleSelect
          label="Take alcohol"
          options={YES_NO}
          selected={toYesNo(value.drinksAlcohol)}
          onSelect={(v) => set({ drinksAlcohol: v === null ? null : v === 'yes' })}
        />
        <SingleSelect
          label="Smoke"
          options={YES_NO}
          selected={toYesNo(value.smokes)}
          onSelect={(v) => set({ smokes: v === null ? null : v === 'yes' })}
        />
        <SingleSelect
          label="Upbringing"
          options={UPBRINGING_OPTIONS}
          selected={value.upbringing}
          onSelect={(upbringing) => set({ upbringing })}
        />
        <SingleSelect
          label="Orientation"
          options={ORIENTATION_OPTIONS}
          selected={value.sexualOrientation}
          onSelect={(sexualOrientation) => set({ sexualOrientation })}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Looking for</Text>
          <Text style={styles.hint}>Select all that apply</Text>
          <View style={styles.chipRow}>
            {LOOKING_FOR_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={value.lookingFor.includes(o.value)}
                onPress={() => toggleLookingFor(o.value)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── My match should provide company or help for ── */}
      <View style={styles.section}>
        <Text style={styles.heading}>My match should provide company or help for</Text>
        <View style={styles.counterRow}>
          <Text style={styles.hint}>Your plan allows up to {companyForLimit}</Text>
          <Text style={[styles.counter, atLimit && styles.counterFull]}>
            {companyCount}/{companyForLimit} selected
          </Text>
        </View>

        {COMPANY_FOR_GROUPS.map((group) => (
          <View key={group.title} style={styles.field}>
            <Text style={styles.groupTitle}>
              {group.emoji} {group.title}
            </Text>
            <View style={styles.chipRow}>
              {group.options.map((o) => {
                const selected = value.companyFor.includes(o.value);
                return (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={selected}
                    dimmed={atLimit && !selected}
                    onPress={() => toggleCompanyFor(o.value)}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  field: { marginBottom: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  groupTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  hint: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.sm },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  counter: { color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm },
  counterFull: { color: Colors.primary },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chipLine: { flexDirection: 'row', gap: Spacing.sm },
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
  chipDimmed: { opacity: 0.45 },
  chipEmoji: { fontSize: 16 },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  chipTextSelected: { color: Colors.primary },
});
