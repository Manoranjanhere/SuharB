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

interface Props {
  user: {
    id: string;
    name: string;
    age: number;
    city: string;
    primaryPhoto?: string;
    role: string;
  };
  onPress: () => void;
}

export default function ProfileCard({ user, onPress }: Props) {
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

      {/* Info overlay */}
      <View style={styles.overlay}>
        <Text style={styles.nameText} numberOfLines={1}>
          {user.name}, {user.age}
        </Text>
        <Text style={styles.cityText} numberOfLines={1}>
          📍 {user.city}
        </Text>
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
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});
