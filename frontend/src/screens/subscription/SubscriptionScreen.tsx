import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SubscriptionScreenProps } from '../../navigation/types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import SubscriptionService, { AllPlansResponse, PlanConfig, TopupPackage } from '../../services/subscription.service';
import PlayBilling, { BillingPeriod } from '../../services/playBilling.service';
import { useAuthStore } from '../../store/auth.store';
import { useAppCountry } from '../../hooks/useAppCountry';

type Props = SubscriptionScreenProps;

export default function SubscriptionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [topups, setTopups] = useState<TopupPackage[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanConfig | null>(null);
  const [allPlans, setAllPlans] = useState<AllPlansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [playPrices, setPlayPrices] = useState<Record<string, string>>({});
  const updateUser = useAuthStore((s) => s.updateUser);
  const { formatMoney, currency } = useAppCountry();

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const [all, myPlans, current] = await Promise.all([
        SubscriptionService.getAllPlans(),
        SubscriptionService.getMyPlans(),
        SubscriptionService.getCurrentSubscription(),
      ]);
      setAllPlans(all);
      setPlans(myPlans.plans);
      setTopups(myPlans.topups);
      setCurrentPlan(current.plan);

      if (Platform.OS === 'android') {
        const subSkus = myPlans.plans.flatMap((p) => {
          const ids = p.playProductIds;
          if (ids) return [ids.monthly, ids.quarterly];
          return [
            PlayBilling.getProductId(p.id, 'monthly'),
            PlayBilling.getProductId(p.id, 'quarterly'),
          ];
        });
        const topupSkus = myPlans.topups.map(
          (t) => t.playProductId || PlayBilling.getTopupProductId(t.id),
        );
        const prices = await PlayBilling.fetchLocalizedPlayPrices(subSkus, topupSkus);
        setPlayPrices(prices);
      }
    } catch {
      Alert.alert('Error', 'Could not load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Subscriptions are purchased through Google Play on Android.');
      return;
    }
    setPurchasing(planId);
    try {
      await PlayBilling.purchasePlan(planId, billingPeriod);
      const current = await SubscriptionService.getCurrentSubscription();
      setCurrentPlan(current.plan);
      if (current.plan) {
        updateUser({
          subscriptionPlan: current.plan.id,
          subscriptionTier: current.plan.tier,
        });
      }
      Alert.alert(
        'Subscribed',
        `Your ${current.plan?.name || 'plan'} is active via Google Play.`,
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Purchase failed';
      if (!String(msg).toLowerCase().includes('cancel')) {
        Alert.alert('Payment failed', msg);
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleTopup = async (packageId: string) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Top-ups are purchased through Google Play on Android.');
      return;
    }
    setPurchasing(packageId);
    try {
      await PlayBilling.purchaseTopupPack(packageId);
      Alert.alert('Success', 'Top-up applied to your account.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Purchase failed';
      if (!String(msg).toLowerCase().includes('cancel')) {
        Alert.alert('Payment failed', msg);
      }
    } finally {
      setPurchasing(null);
    }
  };

  const isFemale = user?.role === 'companion';

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Plans</Text>
        <Text style={styles.headerSubtitle}>
          {isFemale ? 'Lifestyle Seeker Plans' : 'Professional Plans'}
        </Text>
        {currentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>
              {currentPlan.badge} Currently on {currentPlan.name}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Billing period + Google Play notice */}
      <View style={styles.billingNotice}>
        <Text style={styles.billingNoticeIcon}>▶️</Text>
        <Text style={styles.billingNoticeText}>
          Payments via Google Play in your country ({currency}). Subscriptions renew automatically until you cancel in Play Store.
        </Text>
      </View>

      <View style={styles.periodToggle}>
        <TouchableOpacity
          style={[styles.periodBtn, billingPeriod === 'monthly' && styles.periodBtnActive]}
          onPress={() => setBillingPeriod('monthly')}
        >
          <Text style={[styles.periodBtnText, billingPeriod === 'monthly' && styles.periodBtnTextActive]}>
            1 Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, billingPeriod === 'quarterly' && styles.periodBtnActive]}
          onPress={() => setBillingPeriod('quarterly')}
        >
          <Text style={[styles.periodBtnText, billingPeriod === 'quarterly' && styles.periodBtnTextActive]}>
            3 Months
          </Text>
        </TouchableOpacity>
      </View>

      {/* Plan cards */}
      <View style={styles.plansContainer}>
        {plans.map((plan, idx) => {
          const isActive = currentPlan?.id === plan.id;
          const isPopular = idx === 1; // middle plan
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              playPrices={playPrices}
              formatMoney={formatMoney}
              isActive={isActive}
              isPopular={isPopular}
              isPurchasing={purchasing === plan.id}
              onSubscribe={() => handleSubscribe(plan.id)}
            />
          );
        })}
      </View>

      {/* Role-wise plan visibility */}
      {allPlans && (
        <View style={styles.rolePlansSection}>
          <Text style={styles.rolePlansTitle}>Membership Plans By Role</Text>
          <Text style={styles.rolePlansSubtitle}>
            You can subscribe only to your role, but both plan sets are visible.
          </Text>

          <View style={styles.rolePlansBlock}>
            <Text style={styles.rolePlansBlockTitle}>♀ Companion Plans</Text>
            <View style={styles.rolePlanChips}>
              {allPlans.female.map((plan) => (
                <View key={plan.id} style={styles.rolePlanChip}>
                  <Text style={styles.rolePlanChipText}>{plan.badge} {plan.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.rolePlansBlock}>
            <Text style={styles.rolePlansBlockTitle}>♂ Professional Plans</Text>
            <View style={styles.rolePlanChips}>
              {allPlans.male.map((plan) => (
                <View key={plan.id} style={styles.rolePlanChip}>
                  <Text style={styles.rolePlanChipText}>{plan.badge} {plan.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Messaging rule */}
      <View style={styles.ruleBox}>
        <Text style={styles.ruleTitle}>📨 Messaging Rules</Text>
        <Text style={styles.ruleText}>
          You can message members with the <Text style={styles.ruleHighlight}>same or lower tier</Text> plan.
          Upgrade to message everyone!
        </Text>
        <View style={styles.ruleTable}>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.ruleRow}>
              <Text style={styles.rulePlanText}>{plan.badge} {plan.name}</Text>
              <Text style={styles.ruleCanMsg}>
                Can message: {plans.filter((p) => p.tier <= plan.tier).map((p) => p.name).join(', ')}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Topup packages */}
      <View style={styles.topupSection}>
        <Text style={styles.sectionTitle}>⚡ Top-up Packs</Text>
        <Text style={styles.sectionSubtitle}>Boost your experience with extra credits</Text>
        {topups.map((pkg) => (
          <TopupCard
            key={pkg.id}
            pkg={pkg}
            playPrices={playPrices}
            formatMoney={formatMoney}
            isPurchasing={purchasing === pkg.id}
            onBuy={() => handleTopup(pkg.id)}
          />
        ))}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, billingPeriod, playPrices, formatMoney, isActive, isPopular, isPurchasing, onSubscribe }: {
  plan: PlanConfig; billingPeriod: BillingPeriod;
  playPrices: Record<string, string>;
  formatMoney: (amountInr: number) => string;
  isActive: boolean; isPopular: boolean;
  isPurchasing: boolean; onSubscribe: () => void;
}) {
  const displayPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.quarterlyPrice;
  const priceLabel = billingPeriod === 'monthly' ? '/month' : '/3 months';
  const sku = plan.playProductIds
    ? plan.playProductIds[billingPeriod === 'monthly' ? 'monthly' : 'quarterly']
    : PlayBilling.getProductId(plan.id, billingPeriod);
  const priceDisplay = playPrices[sku] || formatMoney(displayPrice);
  return (
    <View style={[styles.planCard, isActive && styles.planCardActive, isPopular && styles.planCardPopular]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>✓ ACTIVE</Text>
        </View>
      )}

      <Text style={styles.planBadge}>{plan.badge}</Text>
      <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>

      <View style={styles.planPriceRow}>
        <Text style={styles.planPrice}>{priceDisplay}</Text>
        <Text style={styles.planPriceUnit}>{priceLabel}</Text>
      </View>
      <Text style={styles.planQuarterly}>
        Google Play · {billingPeriod === 'monthly' ? '1-month' : '3-month'} recurring subscription
      </Text>

      <View style={styles.planDivider} />

      {plan.features.map((f) => (
        <View key={f} style={styles.featureRow}>
          <Text style={styles.featureCheck}>✓</Text>
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.subscribeBtn, isActive && styles.subscribeBtnActive, { borderColor: plan.color }]}
        onPress={onSubscribe}
        disabled={isPurchasing || isActive}
      >
        {isPurchasing
          ? <ActivityIndicator color={isActive ? '#fff' : plan.color} />
          : <Text style={[styles.subscribeBtnText, { color: isActive ? '#fff' : plan.color }]}>
              {isActive ? '✓ Current Plan' : `Buy on Google Play →`}
            </Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─── Topup Card ───────────────────────────────────────────────────────────────

function TopupCard({ pkg, playPrices, formatMoney, isPurchasing, onBuy }: {
  pkg: TopupPackage;
  playPrices: Record<string, string>;
  formatMoney: (amountInr: number) => string;
  isPurchasing: boolean; onBuy: () => void;
}) {
  const sku = pkg.playProductId || PlayBilling.getTopupProductId(pkg.id);
  const priceDisplay = playPrices[sku] || formatMoney(pkg.priceInr);
  return (
    <TouchableOpacity style={styles.topupCard} onPress={onBuy} disabled={isPurchasing}>
      <Text style={styles.topupEmoji}>{pkg.emoji}</Text>
      <View style={styles.topupInfo}>
        <Text style={styles.topupName}>{pkg.name}</Text>
        <Text style={styles.topupDesc}>{pkg.description}</Text>
      </View>
      <View style={styles.topupPriceCol}>
        <Text style={styles.topupPrice}>{priceDisplay}</Text>
        {isPurchasing
          ? <ActivityIndicator color={Colors.primary} size="small" />
          : <Text style={styles.topupBuyBtn}>Buy</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing.sm },
  backBtnText: { fontSize: 28, color: Colors.textPrimary },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  currentBadge: {
    marginTop: Spacing.sm, alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,24,74,0.2)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary,
  },
  currentBadgeText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },

  // Billing notice
  billingNotice: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  billingNoticeIcon: { fontSize: 18 },
  billingNoticeText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },

  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },
  periodBtnTextActive: { color: '#fff' },

  // Plans
  plansContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    position: 'relative', overflow: 'hidden',
  },
  planCardActive: { borderColor: Colors.primary, backgroundColor: '#1A0010' },
  planCardPopular: { borderColor: Colors.secondary },
  popularBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: Colors.secondary, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  popularBadgeText: { fontSize: 9, fontWeight: '800', color: '#000', letterSpacing: 1 },
  activeBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  planBadge: { fontSize: 36, marginBottom: 4 },
  planName: { fontSize: FontSize.xl, fontWeight: '900', marginBottom: Spacing.xs },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 2 },
  planPrice: { fontSize: 36, fontWeight: '900', color: Colors.textPrimary },
  planPriceUnit: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: 6 },
  planQuarterly: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  planDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  featureRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 6 },
  featureCheck: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  featureText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
  subscribeBtn: {
    marginTop: Spacing.md, borderRadius: BorderRadius.full,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 2,
  },
  subscribeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  subscribeBtnText: { fontWeight: '700', fontSize: FontSize.md },

  // Messaging rules
  ruleBox: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
  },
  ruleTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  ruleText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  ruleHighlight: { color: Colors.primary, fontWeight: '700' },
  ruleTable: { gap: Spacing.sm },
  ruleRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  rulePlanText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: 2 },
  ruleCanMsg: { color: Colors.textMuted, fontSize: FontSize.xs },

  // Role plan visibility
  rolePlansSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  rolePlansTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  rolePlansSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  rolePlansBlock: { marginBottom: Spacing.sm },
  rolePlansBlockTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  rolePlanChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  rolePlanChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  rolePlanChipText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Topups
  topupSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  topupCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  topupEmoji: { fontSize: 32 },
  topupInfo: { flex: 1 },
  topupName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  topupDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 16, marginTop: 2 },
  topupPriceCol: { alignItems: 'flex-end', gap: 4 },
  topupPrice: { color: Colors.textPrimary, fontWeight: '800', fontSize: FontSize.md },
  topupBuyBtn: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },

  // Default limits
  defaultLimits: {
    marginHorizontal: Spacing.lg, backgroundColor: '#0D0D0D',
    borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  defaultLimitsTitle: {
    color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  defaultLimitItem: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 28 },
});
