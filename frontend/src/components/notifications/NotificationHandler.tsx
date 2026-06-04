import React, { useCallback, useEffect, useRef, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Spacing } from '../../theme';

interface Props {
  navigationRef: any;
}

type InteractionType = 'match' | 'like' | 'message' | 'super_like' | 'compliment';

interface ToastPayload {
  type: InteractionType;
  userId?: string;
  title: string;
  body: string;
}

const ICON_MAP: Record<InteractionType, string> = {
  match: '🎉',
  like: '❤️',
  message: '💬',
  super_like: '⭐',
  compliment: '💝',
};

const ACCENT_MAP: Record<InteractionType, string> = {
  match: Colors.secondary,
  like: Colors.primary,
  message: '#6EC6FF',
  super_like: Colors.secondary,
  compliment: '#FF7FB5',
};

const VALID_TYPES: InteractionType[] = ['match', 'like', 'message', 'super_like', 'compliment'];

/**
 * Handles foreground and background push notifications.
 * Mount this once inside the main app navigator.
 */
export default function NotificationHandler({ navigationRef }: Props) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const slideAnim = useRef(new Animated.Value(-140)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValidType = (type?: string): type is InteractionType =>
    !!type && VALID_TYPES.includes(type as InteractionType);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideToast = useCallback((afterHide?: () => void) => {
    clearHideTimer();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -140,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
      afterHide?.();
    });
  }, [clearHideTimer, fadeAnim, slideAnim]);

  const navigateFromInteraction = useCallback((type: InteractionType, userId?: string) => {
    if (type === 'message' || type === 'match') {
      if (userId) {
        navigationRef.current?.navigate('ChatConversation', { userId });
      }
      return;
    }
    if (type === 'like' || type === 'super_like' || type === 'compliment') {
      navigationRef.current?.navigate('LikedBy');
    }
  }, [navigationRef]);

  const showToast = useCallback((payload: ToastPayload) => {
    clearHideTimer();
    setToast(payload);
    slideAnim.setValue(-140);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 80,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimerRef.current = setTimeout(() => hideToast(), 5200);
  }, [clearHideTimer, fadeAnim, hideToast, slideAnim]);

  useEffect(() => {
    // ── Foreground notification ──────────────────────────────────────────────
    const unsubForeground = messaging().onMessage(async (remoteMessage) => {
      const { type, userId } = remoteMessage.data || {};
      const { title, body } = remoteMessage.notification || {};
      if (!isValidType(type)) return;

      showToast({
        type,
        userId,
        title: title || 'New interaction',
        body: body || 'You have a new notification',
      });
    });

    // ── App opened from background notification ────────────────────────────
    const unsubBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      const { type, userId } = remoteMessage.data || {};
      if (!isValidType(type)) return;
      navigateFromInteraction(type, userId);
    });

    // ── Cold start (app killed) ────────────────────────────────────────────
    messaging().getInitialNotification().then((remoteMessage) => {
      if (!remoteMessage) return;
      const { type, userId } = remoteMessage.data || {};
      if (!isValidType(type)) return;
      navigateFromInteraction(type, userId);
    });

    return () => {
      clearHideTimer();
      unsubForeground();
      unsubBackground();
    };
  }, [clearHideTimer, navigateFromInteraction, showToast]);

  if (!toast) return null;

  const actionLabel = toast.type === 'message' || toast.type === 'match' ? 'Open Chat' : 'View';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: insets.top + 8,
          borderColor: ACCENT_MAP[toast.type],
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.toastBody}
        onPress={() => hideToast(() => navigateFromInteraction(toast.type, toast.userId))}
      >
        <Text style={styles.toastIcon}>{ICON_MAP[toast.type]}</Text>
        <View style={styles.toastTextWrap}>
          <Text numberOfLines={1} style={styles.toastTitle}>{toast.title}</Text>
          <Text numberOfLines={2} style={styles.toastMessage}>{toast.body}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => hideToast(() => navigateFromInteraction(toast.type, toast.userId))}
        >
          <Text style={styles.primaryActionText}>{actionLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => hideToast()}>
          <Text style={styles.secondaryActionText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 999,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  toastBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  toastIcon: {
    fontSize: 22,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryAction: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
  secondaryAction: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  secondaryActionText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
});
