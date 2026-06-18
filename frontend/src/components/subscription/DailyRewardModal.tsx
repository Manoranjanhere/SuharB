import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';

interface Props {
  visible: boolean;
  coinsAwarded: number;
  newBalance: number;
  onClose: () => void;
}

export default function DailyRewardModal({ visible, coinsAwarded, newBalance, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(coinAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      coinAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Coin animation */}
          <Animated.Text style={[styles.coinEmoji, {
            transform: [{
              translateY: coinAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [20, -10, 0],
              }),
            }],
            opacity: coinAnim,
          }]}>
            🪙
          </Animated.Text>

          <Text style={styles.title}>Daily Reward!</Text>
          <Text style={styles.amount}>+{coinsAwarded} Coin{coinsAwarded === 1 ? '' : 's'}</Text>
          <Text style={styles.subtitle}>
            {coinsAwarded === 1
              ? '1 coin = ₹50 value · daily login bonus'
              : "You've earned your daily login bonus"}
          </Text>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceValue}>🪙 {newBalance}</Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              💡 Use coins for Super Likes, Extra Messages & Compliments
            </Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Awesome! 🎉</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 28, padding: Spacing.xl,
    alignItems: 'center', width: '100%',
    borderWidth: 1.5, borderColor: Colors.secondary,
  },
  coinEmoji: { fontSize: 72, marginBottom: Spacing.sm },
  title: {
    fontSize: FontSize.xxl, fontWeight: '900',
    color: Colors.secondary, marginBottom: 4,
  },
  amount: {
    fontSize: 42, fontWeight: '900',
    color: Colors.textPrimary, marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    marginBottom: Spacing.lg, textAlign: 'center',
  },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  balanceValue: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.lg },
  tipBox: {
    backgroundColor: 'rgba(201,24,74,0.1)', borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.lg, width: '100%',
  },
  tipText: { color: Colors.textSecondary, fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18 },
  btn: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.full,
    paddingVertical: 14, paddingHorizontal: Spacing.xl, width: '100%',
    alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '800', fontSize: FontSize.md },
});
