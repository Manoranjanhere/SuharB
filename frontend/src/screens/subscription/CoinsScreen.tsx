import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CoinsScreenProps } from '../../navigation/types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import SubscriptionService, { CoinTransaction, CoinPack } from '../../services/subscription.service';
import PlayBilling from '../../services/playBilling.service';
import { useAppCountry } from '../../hooks/useAppCountry';
import { useAuthStore } from '../../store/auth.store';
import { canSpendCoins } from '../../utils/subscription';
import { useFeatureFlagsStore } from '../../store/featureFlags.store';

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
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [playPrices, setPlayPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { formatMoney } = useAppCountry();
  const authUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const paidFeaturesDisabled = useFeatureFlagsStore((s) => s.paidFeaturesDisabled);
  const canUseCoins = canSpendCoins(authUser, paidFeaturesDisabled);
  const coinUnitValue = formatMoney(1);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [data, packs] = await Promise.all([
        SubscriptionService.getCoinsBalance(),
        SubscriptionService.getCoinPacks(),
      ]);
      setBalance(data.coins);
      setTransactions(data.transactions);
      setCoinPacks(packs);
      updateUser({ coins: data.coins });

      if (Platform.OS === 'android' && packs.length) {
        const skus = packs.map((p) => p.playProductId);
        const prices = await PlayBilling.fetchLocalizedPlayPrices([], skus);
        setPlayPrices(prices);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleBuyCoins = async (pack: CoinPack) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Coin purchases are available via Google Play on Android.');
      return;
    }
    setPurchasing(pack.id);
    try {
      const result = await PlayBilling.purchaseCoinPack(pack.id);
      setBalance(result.balance);
      updateUser({ coins: result.balance });
      await loadData();
      Alert.alert('Coins added', `+${result.coins} coins added to your balance.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Purchase failed';
      if (!String(msg).toLowerCase().includes('cancel')) {
        Alert.alert('Payment failed', msg);
      }
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coins</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceEmoji}>🪙</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
        <Text style={styles.balanceLabel}>Coin Balance</Text>
        <Text style={styles.balanceValue}>1 coin = {coinUnitValue}</Text>
      </View>

      {!canUseCoins && (
        <View style={styles.subscribeBanner}>
          <Text style={styles.subscribeBannerTitle}>Subscribe to spend coins</Text>
          <Text style={styles.subscribeBannerText}>
            You can earn and buy coins anytime. Subscribe to a plan to use them on super likes, new-profile messages, and compliments.
          </Text>
          <TouchableOpacity
            style={styles.subscribeBannerBtn}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.subscribeBannerBtnText}>View Plans</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.useCoinsSection}>
        <Text style={styles.sectionTitle}>Use Your Coins</Text>
        <Text style={styles.sectionSubtitle}>
          Each action below costs <Text style={styles.sectionSubtitleBold}>1 coin</Text> when your daily plan allowance is used up (free while quota remains).
        </Text>
        {[
          {
            icon: '⭐',
            title: 'Super Like',
            desc: 'Discover home → tap ⭐, or open a profile → tap ⭐',
            cost: '1 coin',
            onPress: () => navigation.navigate('Discover'),
          },
          {
            icon: '💬',
            title: 'Message New Profile',
            desc: 'Open someone\'s profile → tap 💬 to start a first-time chat',
            cost: '1 coin',
            onPress: () => navigation.navigate('Discover'),
          },
          {
            icon: '💝',
            title: 'Compliment',
            desc: 'Open someone\'s profile → tap 💝 and send your message with a like',
            cost: '1 coin',
            onPress: () => navigation.navigate('Discover'),
          },
        ].map((item) => (
          <TouchableOpacity key={item.title} style={styles.useRow} onPress={item.onPress}>
            <Text style={styles.useIcon}>{item.icon}</Text>
            <View style={styles.useInfo}>
              <Text style={styles.useLabel}>{item.title}</Text>
              <Text style={styles.useDesc}>{item.desc}</Text>
            </View>
            <View style={styles.spendCostBadge}>
              <Text style={styles.spendCost}>{item.cost}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buySection}>
        <Text style={styles.sectionTitle}>Buy Coins (Google Play)</Text>
        <Text style={styles.sectionSubtitle}>
          Top up anytime. Prices shown in your country&apos;s currency.
        </Text>
        {coinPacks.map((pack) => {
          const price = playPrices[pack.playProductId] || formatMoney(pack.priceInr);
          return (
            <TouchableOpacity
              key={pack.id}
              style={styles.packCard}
              onPress={() => handleBuyCoins(pack)}
              disabled={purchasing === pack.id}
            >
              <Text style={styles.packEmoji}>{pack.emoji}</Text>
              <View style={styles.packInfo}>
                <Text style={styles.packLabel}>{pack.label}</Text>
                <Text style={styles.packDesc}>{pack.coins} coin{pack.coins > 1 ? 's' : ''} · use on super likes, messages & compliments</Text>
              </View>
              <View style={styles.packPriceCol}>
                {purchasing === pack.id
                  ? <ActivityIndicator color={Colors.primary} size="small" />
                  : <Text style={styles.packPrice}>{price}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.earnSection}>
        <Text style={styles.sectionTitle}>How to Earn Coins</Text>
        {[
          { icon: '🌅', label: 'Daily Login', desc: `+1 coin every day (${coinUnitValue} value)`, highlight: true },
          { icon: '👥', label: 'Refer a Friend', desc: '+10 coins when someone joins with your code' },
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
  subscribeBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#1A0010',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  subscribeBannerTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: FontSize.md,
    marginBottom: 6,
  },
  subscribeBannerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  subscribeBannerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subscribeBannerBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  useCoinsSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionSubtitleBold: { color: Colors.secondary, fontWeight: '700' },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  useIcon: { fontSize: 28 },
  useInfo: { flex: 1 },
  useLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  useDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2, lineHeight: 16 },
  useArrow: { color: Colors.primary, fontSize: 22, fontWeight: '700' },
  buySection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md, marginTop: -4 },
  packCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.secondary,
  },
  packEmoji: { fontSize: 28 },
  packInfo: { flex: 1 },
  packLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  packDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  packPriceCol: { minWidth: 72, alignItems: 'flex-end' },
  packPrice: { color: Colors.secondary, fontWeight: '800', fontSize: FontSize.md },
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
