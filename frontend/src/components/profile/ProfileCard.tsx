import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - Spacing.lg * 2 - CARD_GAP) / 2;
const CARD_H = CARD_W * 1.45;
const PLAN_BADGE_LABELS: Record<string, string> = {
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  platinum: '💎 Platinum',
  rich: '💰 Rich',
  very_rich: '💎 Very Rich',
  super_rich: '👑 Super Rich',
};

interface Props {
  user: {
    id: string;
    name: string;
    age: number;
    city: string;
    primaryPhoto?: string;
    role: string;
    isSuperLike?: boolean;
    subscriptionPlan?: string;
    complimentMessage?: string | null;
  };
  onPress: () => void;
}

export default function ProfileCard({ user, onPress }: Props) {
  const membershipLabel = user.subscriptionPlan ? PLAN_BADGE_LABELS[user.subscriptionPlan] : '';
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Photo */}
      {user.primaryPhoto ? (
        <FastImage
          source={{ uri: user.primaryPhoto, priority: FastImage.priority.normal }}
          style={styles.photo}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Text style={styles.photoFallbackText}>
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}

      {/* Role indicator dot */}
      <View style={[
        styles.roleDot,
        user.role === 'professional' ? styles.roleDotPro : styles.roleDotComp
      ]} />

      {user.isSuperLike ? (
        <View style={styles.superLikeBadge}>
          <Text style={styles.superLikeBadgeText}>⭐</Text>
        </View>
      ) : null}

      {/* Info overlay */}
      <View style={styles.overlay}>
        {membershipLabel ? (
          <View style={styles.membershipChip}>
            <Text style={styles.membershipChipText}>{membershipLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.nameText} numberOfLines={1}>
          {user.name}, {user.age}
        </Text>
        <Text style={styles.cityText} numberOfLines={1}>
          📍 {user.city}
        </Text>
        {user.complimentMessage ? (
          <Text style={styles.complimentText} numberOfLines={1}>
            💝 {user.complimentMessage}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  photo: { width: '100%', height: '100%' },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  photoFallbackText: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.primary,
  },
  roleDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  roleDotPro: { backgroundColor: Colors.secondary },
  roleDotComp: { backgroundColor: Colors.primary },
  superLikeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,10,0.7)',
    borderWidth: 1,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  superLikeBadgeText: { fontSize: 12 },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  membershipChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(36,36,36,0.9)',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  membershipChipText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  nameText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  cityText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 1,
  },
  complimentText: {
    color: '#FFD3E3',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
});
