import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { InboxScreenProps } from '../../navigation/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import MessageService, { InboxConversation } from '../../services/message.service';

type Props = InboxScreenProps;

export default function InboxScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);

  const loadInbox = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await MessageService.getInbox();
      setConversations(data.conversations || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInbox(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadInbox(false)}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.helper}>Loading chats...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.helper}>Like someone and start chatting from their profile.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('ChatConversation', {
                  userId: item.userId,
                  userName: item.userName,
                })
              }
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileDetail', { userId: item.userId })}
                activeOpacity={0.85}
              >
                {item.primaryPhoto ? (
                  <FastImage source={{ uri: item.primaryPhoto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{item.userName?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.content}>
                <View style={styles.topLine}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ProfileDetail', { userId: item.userId })}
                    activeOpacity={0.85}
                    style={styles.nameTap}
                  >
                    <Text style={styles.name} numberOfLines={1}>{item.userName}</Text>
                  </TouchableOpacity>
                  <Text style={styles.time}>
                    {new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.bottomLine}>
                  <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshText: { color: Colors.textPrimary, fontSize: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: 28 },
  helper: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },
  emptyEmoji: { fontSize: 52, marginBottom: Spacing.xs },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.surface },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.lg },
  content: { flex: 1, gap: 2 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameTap: { flex: 1, marginRight: Spacing.sm },
  name: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  time: { color: Colors.textMuted, fontSize: FontSize.xs },
  bottomLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  preview: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
