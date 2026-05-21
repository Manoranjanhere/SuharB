import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CoinsScreenProps } from '../../navigation/types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import SubscriptionService, { CoinTransaction } from '../../services/subscription.service';

type Props = CoinsScreenProps;

const TX_ICON: Record<string, string> = {
  earned_daily: '🌅',
  earned_referral: '👥',
  purchased: '💳',
  topup_purchase: '💳',
  spent_super_like: '⭐',
  spent_msg: '💬',
  spent_compliment: '💝',
};

export default function CoinsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await SubscriptionService.getCoinsBalance();
      setBalance(data.coins);
      setTransactions(data.transactions);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coins</Text>
      </View>

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceEmoji}>🪙</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
        <Text style={styles.balanceLabel}>Coin Balance</Text>
        <Text style={styles.balanceValue}>≈ ₹{balance.toLocaleString()} value</Text>
      </View>

      {/* Earn more section */}
      <View style={styles.earnSection}>
        <Text style={styles.sectionTitle}>How to Earn Coins</Text>
        {[
          { icon: '🌅', label: 'Daily Login', desc: '+50 coins every day', highlight: true },
          { icon: '👥', label: 'Refer a Friend', desc: '+500 coins per referral' },
          { icon: '💳', label: 'Purchase Packs', desc: 'Buy topup packages' },
        ].map((item) => (
          <View key={item.label} style={[styles.earnRow, item.highlight && styles.earnRowHighlight]}>
            <Text style={styles.earnIcon}>{item.icon}</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnLabel}>{item.label}</Text>
              <Text style={styles.earnDesc}>{item.desc}</Text>
            </View>
            {item.highlight && <Text style={styles.earnTag}>Daily</Text>}
          </View>
        ))}
      </View>

      {/* Spend coins section */}
      <View style={styles.spendSection}>
        <Text style={styles.sectionTitle}>Spend Coins On</Text>
        {[
          { icon: '⭐', label: 'Super Like', cost: '100 coins', desc: 'Appear top of Liked By + 255 char msg' },
          { icon: '💬', label: 'Extra Message', cost: '50 coins', desc: 'Send 1 message above daily quota' },
          { icon: '💝', label: 'Compliment', cost: '100 coins', desc: 'Special message with your like' },
        ].map((item) => (
          <View key={item.label} style={styles.spendRow}>
            <Text style={styles.spendIcon}>{item.icon}</Text>
            <View style={styles.spendInfo}>
              <Text style={styles.spendLabel}>{item.label}</Text>
              <Text style={styles.spendDesc}>{item.desc}</Text>
            </View>
            <View style={styles.spendCostBadge}>
              <Text style={styles.spendCost}>{item.cost}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Buy more button */}
      <TouchableOpacity
        style={styles.buyMoreBtn}
        onPress={() => navigation.navigate('Subscription')}
      >
        <Text style={styles.buyMoreBtnText}>Buy Top-up Packs →</Text>
      </TouchableOpacity>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <View style={styles.txSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <Text style={styles.txIcon}>{TX_ICON[tx.type] || '🪙'}</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={[styles.txAmount, tx.amount > 0 ? styles.txCredit : styles.txDebit]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: { fontSize: 28, color: Colors.textPrimary },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  balanceCard: {
    margin: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: 24, padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.secondary,
  },
  balanceEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  balanceAmount: { fontSize: 52, fontWeight: '900', color: Colors.secondary },
  balanceLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  balanceValue: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  earnSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  spendSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  earnRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  earnRowHighlight: { borderColor: Colors.secondary, backgroundColor: '#1A1500' },
  earnIcon: { fontSize: 28 },
  earnInfo: { flex: 1 },
  earnLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  earnDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  earnTag: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    fontSize: FontSize.xs, fontWeight: '800', color: '#000',
  },
  spendRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  spendIcon: { fontSize: 28 },
  spendInfo: { flex: 1 },
  spendLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  spendDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  spendCostBadge: {
    backgroundColor: '#1A0010', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary,
  },
  spendCost: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.xs },
  buyMoreBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 14, marginHorizontal: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.xl,
  },
  buyMoreBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  txSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  txIcon: { fontSize: 22 },
  txInfo: { flex: 1 },
  txDesc: { color: Colors.textPrimary, fontSize: FontSize.sm },
  txDate: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  txAmount: { fontWeight: '800', fontSize: FontSize.md },
  txCredit: { color: '#4CAF50' },
  txDebit: { color: Colors.error },
});
