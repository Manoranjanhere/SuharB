import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

interface Props {
  navigationRef: any;
}

/**
 * Handles foreground and background push notifications.
 * Mount this once inside the main app navigator.
 */
export default function NotificationHandler({ navigationRef }: Props) {

  useEffect(() => {
    // ── Foreground notification ──────────────────────────────────────────────
    const unsubForeground = messaging().onMessage(async (remoteMessage) => {
      const { type, userId } = remoteMessage.data || {};
      const { title, body } = remoteMessage.notification || {};

      if (type === 'match') {
        Alert.alert(title || "🎉 It's a Match!", body || '', [
          { text: 'Message', onPress: () => navigationRef.current?.navigate('ChatConversation', { userId }) },
          { text: 'Later', style: 'cancel' },
        ]);
      } else if (type === 'like') {
        Alert.alert(title || '❤️ New Like', body || '', [
          { text: 'View', onPress: () => navigationRef.current?.navigate('LikedBy') },
          { text: 'Dismiss', style: 'cancel' },
        ]);
      } else if (type === 'message') {
        Alert.alert(title || '💬 New Message', body || '', [
          { text: 'Reply', onPress: () => navigationRef.current?.navigate('ChatConversation', { userId }) },
          { text: 'Dismiss', style: 'cancel' },
        ]);
      } else if (type === 'super_like') {
        Alert.alert(title || '⭐ Super Like!', body || '', [
          { text: 'View Profile', onPress: () => navigationRef.current?.navigate('ProfileDetail', { userId }) },
          { text: 'Dismiss', style: 'cancel' },
        ]);
      }
    });

    // ── App opened from background notification ────────────────────────────
    const unsubBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      const { type, userId } = remoteMessage.data || {};
      if (type === 'message' || type === 'match') {
        navigationRef.current?.navigate('ChatConversation', { userId });
      } else if (type === 'like' || type === 'super_like') {
        navigationRef.current?.navigate('LikedBy');
      }
    });

    // ── Cold start (app killed) ────────────────────────────────────────────
    messaging().getInitialNotification().then((remoteMessage) => {
      if (!remoteMessage) return;
      const { type, userId } = remoteMessage.data || {};
      if (type === 'message' || type === 'match') {
        navigationRef.current?.navigate('ChatConversation', { userId });
      }
    });

    return () => {
      unsubForeground();
      unsubBackground();
    };
  }, [navigationRef]);

  return null; // Renders nothing
}
