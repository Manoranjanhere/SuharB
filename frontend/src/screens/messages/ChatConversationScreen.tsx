import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChatConversationProps } from '../../navigation/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import MessageService, { ChatMessage } from '../../services/message.service';
import { useAuthStore } from '../../store/auth.store';
import { io, Socket } from 'socket.io-client';
import { storage } from '../../services/api';

type Props = ChatConversationProps;

export default function ChatConversationScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { userId, userName } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const title = useMemo(() => userName || 'Chat', [userName]);

  const loadConversation = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await MessageService.getConversation(userId, 1, 100);
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, userId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!currentUserId) return;

    const token = storage.getString('accessToken');
    if (!token) return;

    const socket = io(`${MessageService.getRealtimeBaseUrl()}/chat`, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('conversation:join', { userId });
    });
    socket.on('message:new', (incoming: ChatMessage) => {
      const isCurrentThread =
        (incoming.senderId === currentUserId && incoming.recipientId === userId) ||
        (incoming.senderId === userId && incoming.recipientId === currentUserId);
      if (!isCurrentThread) return;

      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, userId]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText('');

    try {
      const sent = await MessageService.sendMessage(userId, content);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
    >
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadConversation}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm }}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.bubbleWrap, mine ? styles.alignEnd : styles.alignStart]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.content}</Text>
                  <Text style={[styles.messageTime, mine && styles.messageTimeMine]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Start the conversation 👋</Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.inputBar,
          {
            paddingBottom:
              Platform.OS === 'ios'
                ? insets.bottom + 14
                : keyboardVisible
                  ? 6
                  : Math.max(insets.bottom, 0) + 14,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
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
  title: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
  bubbleWrap: { width: '100%' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  bubbleMine: { backgroundColor: Colors.primary },
  bubbleOther: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  messageText: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 20 },
  messageTextMine: { color: '#fff' },
  messageTime: { color: Colors.textMuted, fontSize: FontSize.xs, alignSelf: 'flex-end' },
  messageTimeMine: { color: 'rgba(255,255,255,0.8)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    minHeight: 64,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 72,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
});
