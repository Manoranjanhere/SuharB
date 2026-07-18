import React, { useCallback, useEffect, useRef, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  navigationRef: any;
}

type PushType =
  | 'match'
  | 'like'
  | 'message'
  | 'super_like'
  | 'compliment'
  | 'marketing'
  | 'warning'
  | 'banned'
  | 'photo_removed';

interface ToastPayload {
  type: PushType;
  userId?: string;
  title: string;
  body: string;
}

const ICON_MAP: Record<PushType, string> = {
  match: '🎉',
  like: '❤️',
  message: '💬',
  super_like: '⭐',
  compliment: '💝',
  marketing: '📣',
  warning: '⚠️',
  banned: '🚫',
  photo_removed: '📸',
};

const ACCENT_MAP: Record<PushType, string> = {
  match: Colors.secondary,
  like: Colors.primary,
  message: '#6EC6FF',
  super_like: Colors.secondary,
  compliment: '#FF7FB5',
  marketing: Colors.secondary,
  warning: Colors.warning,
  banned: Colors.error,
  photo_removed: Colors.secondary,
};

const VALID_TYPES: PushType[] = [
  'match',
  'like',
  'message',
  'super_like',
  'compliment',
  'marketing',
  'warning',
  'banned',
  'photo_removed',
];

/**
 * Handles foreground and background push notifications.
 * Mount this once inside the main app navigator.
 */
export default function NotificationHandler({ navigationRef }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const slideAnim = useRef(new Animated.Value(-140)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningCheckedRef = useRef<string | null>(null);

  const isValidType = (type?: string): type is PushType =>
    !!type && VALID_TYPES.includes(type as PushType);

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

  const navigateFromInteraction = useCallback((type: PushType, userId?: string) => {
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

  const showStoredWarning = useCallback((message: string) => {
    Alert.alert(
      '⚠️ Account Warning',
      message || 'Your account has received a warning for violating community guidelines.',
      [
        {
          text: 'OK',
          onPress: async () => {
            try {
              await api.post('/users/warnings/acknowledge');
              updateUser({ accountWarningMessage: null, accountWarningAt: null } as any);
            } catch {
              /* still dismiss locally */
              updateUser({ accountWarningMessage: null, accountWarningAt: null } as any);
            }
          },
        },
      ],
    );
  }, [updateUser]);

  // Show pending admin warning when user opens the app
  useEffect(() => {
    if (!user?.id) {
      warningCheckedRef.current = null;
      return;
    }
    if (warningCheckedRef.current === user.id) return;
    warningCheckedRef.current = user.id;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        const me = data?.user;
        if (cancelled || !me) return;
        updateUser(me);
        if (me.accountWarningMessage) {
          showStoredWarning(me.accountWarningMessage);
        }
      } catch {
        if ((user as any).accountWarningMessage) {
          showStoredWarning((user as any).accountWarningMessage);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, showStoredWarning, updateUser]);

  useEffect(() => {
    const unsubForeground = messaging().onMessage(async (remoteMessage) => {
      const rawType = remoteMessage.data?.type;
      const userId = remoteMessage.data?.userId;
      const { title, body } = remoteMessage.notification || {};
      const type = isValidType(rawType) ? rawType : 'marketing';

      // Immediate in-app alert for warnings even if toast is dismissed
      if (type === 'warning') {
        showStoredWarning(
          body || 'Your account has received a warning for violating community guidelines.',
        );
      }

      showToast({
        type,
        userId,
        title: title || (type === 'warning' ? 'Account Warning' : 'Notification'),
        body: body || 'You have a new notification',
      });
    });

    const unsubBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      const { type, userId } = remoteMessage.data || {};
      if (type === 'warning') {
        showStoredWarning(
          remoteMessage.notification?.body ||
            'Your account has received a warning for violating community guidelines.',
        );
        return;
      }
      if (!isValidType(type)) return;
      navigateFromInteraction(type, userId);
    });

    messaging().getInitialNotification().then((remoteMessage) => {
      if (!remoteMessage) return;
      const { type, userId } = remoteMessage.data || {};
      if (type === 'warning') {
        showStoredWarning(
          remoteMessage.notification?.body ||
            'Your account has received a warning for violating community guidelines.',
        );
        return;
      }
      if (!isValidType(type)) return;
      navigateFromInteraction(type, userId);
    });

    return () => {
      clearHideTimer();
      unsubForeground();
      unsubBackground();
    };
  }, [clearHideTimer, navigateFromInteraction, showStoredWarning, showToast]);

  if (!toast) return null;

  const canNavigate =
    toast.type === 'message' ||
    toast.type === 'match' ||
    toast.type === 'like' ||
    toast.type === 'super_like' ||
    toast.type === 'compliment';
  const actionLabel =
    toast.type === 'message' || toast.type === 'match' ? 'Open Chat' : 'View';

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
        onPress={() =>
          canNavigate
            ? hideToast(() => navigateFromInteraction(toast.type, toast.userId))
            : hideToast()
        }
      >
        <Text style={styles.toastIcon}>{ICON_MAP[toast.type]}</Text>
        <View style={styles.toastTextWrap}>
          <Text numberOfLines={1} style={styles.toastTitle}>{toast.title}</Text>
          <Text numberOfLines={2} style={styles.toastMessage}>{toast.body}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        {canNavigate ? (
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => hideToast(() => navigateFromInteraction(toast.type, toast.userId))}
          >
            <Text style={styles.primaryActionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
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
