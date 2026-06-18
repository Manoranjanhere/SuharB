import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiscoverScreenProps } from '../../navigation/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import DiscoverService, { NearbyUser, DiscoverFilters } from '../../services/discover.service';
import ProfileService from '../../services/profile.service';
import SwipeCard from '../../components/discover/SwipeCard';
import FiltersModal from '../../components/discover/FiltersModal';
import { useAuthStore } from '../../store/auth.store';
import { useInteractionAccess } from '../../hooks/useInteractionAccess';
import { getInteractionAccess, showSubscribeRequiredAlert, showTierUpgradeRequiredAlert, showPaymentOrCoinError, canSpendCoins } from '../../utils/subscription';
import { useFeatureFlagsStore } from '../../store/featureFlags.store';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
type Props = DiscoverScreenProps;

export default function DiscoverScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const paidFeaturesDisabled = useFeatureFlagsStore((s) => s.paidFeaturesDisabled);
  const coinBalance = authUser?.coins ?? 0;
  const showCoinsChip = canSpendCoins(authUser, paidFeaturesDisabled) && coinBalance > 0;
  const [cards, setCards] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<DiscoverFilters>({ maxDistance: 50, minAge: 18, maxAge: 65 });
  const [showFilters, setShowFilters] = useState(false);
  const [matchUser, setMatchUser] = useState<NearbyUser | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const matchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await loadCards(1, filters, true);
  };

  const loadCards = async (pageNum: number, f: DiscoverFilters, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      if (pageNum === 1) {
        await DiscoverService.updateLocation();
      }
      const res = await DiscoverService.getNearby(f, pageNum);
      setCards((prev) => reset ? res.users : [...prev, ...res.users]);
      setPage(pageNum);
      setHasMore(pageNum < res.pages);
      if (reset) {
        setCurrentIndex(0);
      }
    } catch (err: any) {
      if (err?.response?.status === 400) {
        // One more retry after forcing location update, useful on emulator startup.
        const updated = await DiscoverService.updateLocation();
        if (updated) {
          try {
            const res = await DiscoverService.getNearby(f, pageNum);
            setCards((prev) => reset ? res.users : [...prev, ...res.users]);
            setPage(pageNum);
            setHasMore(pageNum < res.pages);
            return;
          } catch {
            // Fall through to alert below.
          }
        }
        Alert.alert('Location needed', 'Enable location and set emulator GPS to discover nearby members.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const applyFilters = (f: DiscoverFilters) => {
    setFilters(f);
    loadCards(1, f, true);
  };

  const removeCard = useCallback((user: NearbyUser) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === user.id);
      const next = prev.filter((c) => c.id !== user.id);
      setCurrentIndex((ci) => {
        if (next.length === 0) return 0;
        if (idx < ci) return ci - 1;
        if (idx === ci) return ci >= next.length ? 0 : ci;
        return ci;
      });
      return next;
    });
  }, []);

  const maybeLoadMore = useCallback(() => {
    if (cards.length <= 3 && hasMore && !loadingMore) {
      loadCards(page + 1, filters);
    }
  }, [cards.length, hasMore, loadingMore, page, filters]);

  const handleNextProfile = useCallback(() => {
    if (cards.length === 0) return;
    const nextIndex = (currentIndex + 1) % cards.length;
    setCurrentIndex(nextIndex);
    if (nextIndex >= cards.length - 2 && hasMore && !loadingMore) {
      loadCards(page + 1, filters);
    }
  }, [cards.length, currentIndex, hasMore, loadingMore, page, filters]);

  const handlePrevProfile = useCallback(() => {
    if (cards.length === 0) return;
    setCurrentIndex((currentIndex - 1 + cards.length) % cards.length);
  }, [cards.length, currentIndex]);

  const promptSubscribe = useCallback(() => {
    showSubscribeRequiredAlert(navigation, 'like profiles and send messages');
  }, [navigation]);

  const promptUpgrade = useCallback(() => {
    showTierUpgradeRequiredAlert(navigation);
  }, [navigation]);

  const guardInteraction = useCallback((target: NearbyUser): boolean => {
    const access = getInteractionAccess(authUser, target.subscriptionTier ?? 0, { paidFeaturesDisabled });
    if (access === 'need_subscribe') {
      promptSubscribe();
      return false;
    }
    if (access === 'need_upgrade') {
      promptUpgrade();
      return false;
    }
    return true;
  }, [authUser, paidFeaturesDisabled, promptSubscribe, promptUpgrade]);

  const handleSwipeRight = useCallback(async (user: NearbyUser) => {
    if (!guardInteraction(user)) return;
    removeCard(user);
    maybeLoadMore();

    try {
      const res = await ProfileService.toggleLike(user.id);
      if (res.isMatch) {
        setMatchUser(user);
        Animated.sequence([
          Animated.spring(matchAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
      }
    } catch (err: any) {
      Alert.alert('Like failed', err?.response?.data?.message || 'Please try again');
    }
  }, [guardInteraction, removeCard, maybeLoadMore, matchAnim]);

  const handleSuperLike = useCallback(async (user: NearbyUser) => {
    if (!guardInteraction(user)) return;
    removeCard(user);
    maybeLoadMore();

    try {
      const res = await ProfileService.superLike(user.id);
      if (res.isMatch) {
        setMatchUser(user);
        Animated.sequence([
          Animated.spring(matchAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
      } else {
        Alert.alert('Super liked', `You super-liked ${user.name}`);
      }
    } catch (err: any) {
      showPaymentOrCoinError(navigation, err, 'super like this profile');
    }
  }, [guardInteraction, removeCard, maybeLoadMore, matchAnim, navigation]);

  const handleSwipeLeft = useCallback(async (user: NearbyUser) => {
    removeCard(user);
    maybeLoadMore();

    try {
      await DiscoverService.passUser(user.id);
    } catch { /* silent */ }
  }, [removeCard, maybeLoadMore]);

  const handleTap = useCallback((user: NearbyUser) => {
    navigation.navigate('ProfileDetail', { userId: user.id });
  }, [navigation]);

  const dismissMatch = () => {
    Animated.timing(matchAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setMatchUser(null);
    });
  };

  const stackUsers = React.useMemo(() => {
    if (cards.length === 0) return [];
    const count = Math.min(3, cards.length);
    return Array.from({ length: count }, (_, i) => cards[(currentIndex + i) % cards.length]);
  }, [cards, currentIndex]);

  const currentUser = stackUsers[0];
  const interactionAccess = useInteractionAccess(authUser, currentUser?.subscriptionTier ?? 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Sugar BF</Text>
          <Text style={styles.tagline}>Nearby members</Text>
        </View>
        <View style={styles.headerRight}>
          {showCoinsChip && (
            <TouchableOpacity
              style={styles.coinsChip}
              onPress={() => navigation.navigate('Coins')}
            >
              <Text style={styles.coinsChipText}>🪙 {coinBalance}</Text>
            </TouchableOpacity>
          )}
          {/* Inbox */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Inbox')}
          >
            <Text style={styles.headerBtnIcon}>💬</Text>
          </TouchableOpacity>
          {/* You liked shortcut */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('YouLiked')}
          >
            <Text style={styles.headerBtnIcon}>🤍</Text>
          </TouchableOpacity>
          {/* Liked by shortcut */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('LikedBy')}
          >
            <Text style={styles.headerBtnIcon}>💘</Text>
          </TouchableOpacity>
          {/* Settings */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Text style={styles.headerBtnIcon}>⚙️</Text>
          </TouchableOpacity>
          {/* Filters */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.headerBtnIcon}>🎛️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.emptyText}>Finding members near you...</Text>
          </View>
        ) : stackUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌍</Text>
            <Text style={styles.emptyTitle}>No one nearby</Text>
            <Text style={styles.emptyText}>
              Try increasing your distance in filters
            </Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => loadCards(1, filters, true)}
            >
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardStackRow}>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={handlePrevProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.cardStack}>
              {[...stackUsers].reverse().map((user, reversedIdx) => {
                const stackIndex = stackUsers.length - 1 - reversedIdx;
                return (
                  <SwipeCard
                    key={`${user.id}-${currentIndex}-${stackIndex}`}
                    user={user}
                    isTop={stackIndex === 0}
                    stackIndex={stackIndex}
                    likesEnabled={interactionAccess === 'allowed'}
                    onSwipeRight={handleSwipeRight}
                    onSwipeLeft={handleSwipeLeft}
                    onTap={handleTap}
                    onLikeBlocked={
                      interactionAccess === 'need_upgrade' ? promptUpgrade : promptSubscribe
                    }
                  />
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.browseBtn}
              onPress={handleNextProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnIcon}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {!loading && stackUsers.length > 0 && (
        <View style={[styles.actionsRow, { paddingBottom: insets.bottom + 12 }]}>
          {/* Pass */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => currentUser && handleSwipeLeft(currentUser)}
          >
            <Text style={styles.passBtnIcon}>✕</Text>
          </TouchableOpacity>

          {/* View profile */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.profileBtn]}
            onPress={() => currentUser && navigation.navigate('ProfileDetail', { userId: currentUser.id })}
          >
            <Text style={styles.profileBtnIcon}>👤</Text>
          </TouchableOpacity>

          {interactionAccess === 'allowed' ? (
            <>
              {/* Like */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.likeBtn]}
                onPress={() => currentUser && handleSwipeRight(currentUser)}
              >
                <Text style={styles.likeBtnIcon}>❤️</Text>
              </TouchableOpacity>

              {/* Super like */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.superLikeBtn]}
                onPress={() => currentUser && handleSuperLike(currentUser)}
              >
                <Text style={styles.superLikeBtnIcon}>⭐</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.subscribeBtn]}
              onPress={interactionAccess === 'need_upgrade' ? promptUpgrade : promptSubscribe}
            >
              <Text style={styles.subscribeBtnText}>
                {interactionAccess === 'need_upgrade' ? 'Upgrade' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filters modal */}
      <FiltersModal
        visible={showFilters}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Match celebration modal */}
      {matchUser && (
        <Modal transparent animationType="fade" visible onRequestClose={dismissMatch}>
          <View style={styles.matchOverlay}>
            <Animated.View
              style={[styles.matchCard, {
                transform: [{ scale: matchAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
                opacity: matchAnim,
              }]}
            >
              <Text style={styles.matchEmoji}>🎉</Text>
              <Text style={styles.matchTitle}>It's a Match!</Text>
              <Text style={styles.matchSubtitle}>
                You and <Text style={styles.matchName}>{matchUser.name}</Text> liked each other
              </Text>

              <TouchableOpacity
                style={styles.matchMsgBtn}
                onPress={() => {
                  const id = matchUser?.id;
                  const name = matchUser?.name;
                  dismissMatch();
                  if (id) {
                    navigation.navigate('ChatConversation', { userId: id, userName: name });
                  }
                }}
              >
                <Text style={styles.matchMsgBtnText}>Send a Message 💬</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.matchKeepBtn} onPress={dismissMatch}>
                <Text style={styles.matchKeepBtnText}>Keep Swiping</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  logo: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  tagline: { fontSize: FontSize.xs, color: Colors.textMuted },
  headerRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  coinsChip: {
    backgroundColor: '#1A1500',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  coinsChipText: { color: Colors.secondary, fontWeight: '800', fontSize: FontSize.xs },
  headerBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerBtnIcon: { fontSize: 18 },

  // Card area
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStackRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 30,
  },
  browseBtnIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 30,
  },

  // Empty
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 72 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: {
    fontSize: FontSize.md, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  refreshBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingTop: Spacing.md,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  passBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.surface,
    borderColor: Colors.error,
  },
  passBtnIcon: { fontSize: 24, color: Colors.error },
  profileBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  profileBtnIcon: { fontSize: 20 },
  likeBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  likeBtnIcon: { fontSize: 28 },
  superLikeBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surface,
    borderColor: Colors.secondary,
  },
  superLikeBtnIcon: { fontSize: 24 },
  subscribeBtn: {
    minWidth: 120,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subscribeBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

  // Match modal
  matchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  matchCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 28,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  matchEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  matchTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  matchSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  matchName: { color: Colors.textPrimary, fontWeight: '700' },
  matchMsgBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  matchMsgBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  matchKeepBtn: { paddingVertical: 10 },
  matchKeepBtnText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
