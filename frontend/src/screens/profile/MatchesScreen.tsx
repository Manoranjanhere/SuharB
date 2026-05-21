import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MatchesScreenProps } from '../../navigation/types';
import { Colors, Spacing, FontSize } from '../../theme';
import ProfileService from '../../services/profile.service';
import ProfileCard from '../../components/profile/ProfileCard';

type Props = MatchesScreenProps;

export default function MatchesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = useCallback(async (pageNum: number, refresh = false) => {
    if (pageNum === 1) {
      refresh ? setRefreshing(true) : setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await ProfileService.getMatches(pageNum, 20);
      setUsers(pageNum === 1 ? res.users : (prev: any[]) => [...prev, ...res.users]);
      setTotalPages(res.pages);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Matches</Text>
          <Text style={styles.subtitle}>
            {users.length > 0 ? `${users.length} mutual matches` : 'No matches yet'}
          </Text>
        </View>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>Keep swiping and super-liking to create matches.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProfileCard
              user={item}
              onPress={() => navigation.navigate('ChatConversation', { userId: item.id, userName: item.name })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(1, true)}
              tintColor={Colors.primary}
            />
          }
          onEndReached={() => {
            if (!loadingMore && page < totalPages) {
              loadData(page + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: { fontSize: 28, color: Colors.textPrimary },
  headerText: { flex: 1 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  row: { justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: 12 },
  listContent: { paddingTop: Spacing.sm, paddingBottom: 32 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center' },
});
