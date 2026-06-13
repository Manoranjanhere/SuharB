import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { LikedByScreenProps } from '../../navigation/types';

import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import ProfileService from '../../services/profile.service';
import ProfileCard from '../../components/profile/ProfileCard';

type Props = LikedByScreenProps;

export default function LikedByScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadData(1);
  }, []);

  const loadData = async (pageNum: number, refresh = false) => {
    if (pageNum === 1) refresh ? setRefreshing(true) : setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await ProfileService.getLikedBy(pageNum, 20);
      setUsers(pageNum === 1 ? res.users : (prev) => [...prev, ...res.users]);
      setTotalPages(res.pages);
      setPage(pageNum);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!loadingMore && page < totalPages) loadData(page + 1);
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ProfileCard
      user={item}
      onPress={() => navigation.navigate('ProfileDetail', { userId: item.id })}
    />
  ), [navigation]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header with gradient accent */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Liked By</Text>
            <Text style={styles.subtitle}>
              {users.length > 0
                ? `${users.length} ${users.length === 1 ? 'person has' : 'people have'} liked you 🔥`
                : 'No likes yet'}
            </Text>
          </View>
        </View>
        {users.some((u) => u.isSuperLike) ? (
          <Text style={styles.superLikeHint}>⭐ Super Likes are shown first</Text>
        ) : null}
      </LinearGradient>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💘</Text>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptyText}>Complete your profile to attract more likes</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(1, true)}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
              : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 30 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  superLikeHint: { fontSize: FontSize.xs, color: Colors.secondary, marginTop: 6, fontWeight: '700' },
  row: { justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: 12 },
  listContent: { paddingTop: Spacing.sm, paddingBottom: 32 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
