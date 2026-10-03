import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import {
  COMPANY_FOR_GROUPS,
  DIET_LABELS,
  LOOKING_FOR_LABELS,
  ORIENTATION_LABELS,
  UPBRINGING_LABELS,
  formatHeight,
  yesNo,
  type CommonSpecs,
} from '../../constants/profileOptions';
import type { ProfileUser } from '../../services/profile.service';

interface Props {
  profile: ProfileUser;
  /** null when viewing your own profile */
  common: CommonSpecs | null;
}

function Tag({ label, isCommon }: { label: string; isCommon: boolean }) {
  return (
    <View style={[styles.tag, isCommon && styles.tagCommon]}>
      <Text style={[styles.tagText, isCommon && styles.tagTextCommon]}>
        {isCommon ? '✓ ' : ''}
        {label}
      </Text>
    </View>
  );
}

export default function ProfileSpecsView({ profile, common }: Props) {
  const iAm = [
    { label: 'Height', value: formatHeight(profile.heightCm), isCommon: false },
    { label: 'Food', value: profile.diet ? DIET_LABELS[profile.diet] : '', isCommon: !!common?.fields.has('diet') },
    {
      label: 'Alcohol',
      value: yesNo(profile.drinksAlcohol),
      isCommon: !!common?.fields.has('drinksAlcohol'),
    },
    { label: 'Smoke', value: yesNo(profile.smokes), isCommon: !!common?.fields.has('smokes') },
    {
      label: 'Upbringing',
      value: profile.upbringing ? UPBRINGING_LABELS[profile.upbringing] : '',
      isCommon: !!common?.fields.has('upbringing'),
    },
    {
      label: 'Orientation',
      value: profile.sexualOrientation ? ORIENTATION_LABELS[profile.sexualOrientation] : '',
      isCommon: !!common?.fields.has('sexualOrientation'),
    },
  ].filter((row) => row.value);

  const lookingFor = profile.lookingFor ?? [];
  const companyFor = new Set(profile.companyFor ?? []);
  const companyGroups = COMPANY_FOR_GROUPS.map((group) => ({
    ...group,
    options: group.options
      .filter((o) => companyFor.has(o.value))
      .sort((a, b) => Number(!!common?.companyFor.has(b.value)) - Number(!!common?.companyFor.has(a.value))),
  })).filter((group) => group.options.length > 0);

  if (iAm.length === 0 && lookingFor.length === 0 && companyGroups.length === 0) return null;

  return (
    <>
      {common && common.count > 0 ? (
        <View style={styles.commonBanner}>
          <Text style={styles.commonBannerTitle}>
            🤝 {common.count} {common.count === 1 ? 'thing' : 'things'} in common
          </Text>
          <Text style={styles.commonBannerText}>Shared specs are highlighted in gold below</Text>
        </View>
      ) : null}

      {iAm.length > 0 || lookingFor.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I am</Text>
          {iAm.length > 0 ? (
            <View style={styles.grid}>
              {iAm.map((row) => (
                <View key={row.label} style={[styles.cell, row.isCommon && styles.cellCommon]}>
                  <Text style={styles.cellLabel}>{row.label}</Text>
                  <Text style={[styles.cellValue, row.isCommon && styles.tagTextCommon]}>
                    {row.isCommon ? '✓ ' : ''}
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {lookingFor.length > 0 ? (
            <>
              <Text style={styles.subTitle}>Looking for</Text>
              <View style={styles.tagsRow}>
                {lookingFor.map((key) => (
                  <Tag
                    key={key}
                    label={LOOKING_FOR_LABELS[key] ?? key}
                    isCommon={!!common?.lookingFor.has(key)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {companyGroups.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wants company or help for</Text>
          {companyGroups.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.subTitle}>
                {group.emoji} {group.title}
              </Text>
              <View style={styles.tagsRow}>
                {group.options.map((o) => (
                  <Tag key={o.value} label={o.label} isCommon={!!common?.companyFor.has(o.value)} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  commonBanner: {
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: '#1A1500',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  commonBannerTitle: { color: Colors.secondary, fontSize: FontSize.lg, fontWeight: '800' },
  commonBannerText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  subTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  group: { marginBottom: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cell: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: '30%',
    flexGrow: 1,
  },
  cellCommon: { borderColor: Colors.secondary, backgroundColor: '#1A1500' },
  cellLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  cellValue: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', marginTop: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tagCommon: { borderColor: Colors.secondary, backgroundColor: '#1A1500' },
  tagText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  tagTextCommon: { color: Colors.secondary, fontWeight: '700' },
});
