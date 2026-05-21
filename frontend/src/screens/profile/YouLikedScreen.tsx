import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { YouLikedScreenProps } from '../../navigation/types';

import { Colors, Spacing, FontSize } from '../../theme';
import ProfileService from '../../services/profile.service';
import ProfileCard from '../../components/profile/ProfileCard';

type Props = YouLikedScreenProps;

export default function YouLikedScreen({ navigation }: Props) {
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
      const res = await ProfileService.getYouLiked(pageNum, 20);
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
    if (!loadingMore && page < totalPages) {
      loadData(page + 1);
    }
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>You Liked</Text>
        <Text style={styles.subtitle}>{users.length} people you've liked</Text>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptyText}>Start swiping to like profiles</Text>
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
            loadingMore ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  row: { justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: 12 },
  listContent: { paddingTop: Spacing.sm, paddingBottom: 32 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
