import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuthStore } from '../store/auth.store';
import { Colors } from '../theme';
import type { RootStackParamList } from './types';

export type { RootStackParamList } from './types';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';

// Onboarding
import Stage1Screen from '../screens/onboarding/Stage1Screen';
import Stage2PhotosScreen from '../screens/onboarding/Stage2PhotosScreen';

// Profile
import ProfileDetailScreen from '../screens/profile/ProfileDetailScreen';
import YouLikedScreen from '../screens/profile/YouLikedScreen';
import LikedByScreen from '../screens/profile/LikedByScreen';
import MatchesScreen from '../screens/profile/MatchesScreen';

// Discover
import DiscoverScreen from '../screens/discover/DiscoverScreen';

// Subscription
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import CoinsScreen from '../screens/subscription/CoinsScreen';

// Verification
import PhotoVerificationScreen from '../screens/verification/PhotoVerificationScreen';

// Settings
import AccountSettingsScreen from '../screens/settings/AccountSettingsScreen';

// Messages
import InboxScreen from '../screens/messages/InboxScreen';
import ChatConversationScreen from '../screens/messages/ChatConversationScreen';

// Admin
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';
import NotificationHandler from '../components/notifications/NotificationHandler';
import DailyRewardModal from '../components/subscription/DailyRewardModal';
import SubscriptionService from '../services/subscription.service';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, isLoading, hydrate } = useAuthStore();
  const navigationRef = useRef<any>(null);
  const [rewardVisible, setRewardVisible] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    let mounted = true;
    const claimDailyReward = async () => {
      if (!user) return;
      try {
        const data = await SubscriptionService.claimDailyReward();
        if (mounted && data.awarded) {
          setRewardCoins(data.coins);
          setRewardBalance(data.balance);
          setRewardVisible(true);
        }
      } catch {
        // Ignore reward failures to avoid blocking app load.
      }
    };

    claimDailyReward();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const getInitialRoute = (): string => {
    if (!user) return 'Welcome';
    if (user.profileStage === 0) return 'Stage1';
    if (user.profileStage === 1) return 'Stage2';
    return 'Main';
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <NotificationHandler navigationRef={navigationRef} />
      <Stack.Navigator
        initialRouteName={getInitialRoute() as keyof RootStackParamList}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {/* Auth */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
        <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />

        {/* Onboarding */}
        <Stack.Screen name="Stage1" component={Stage1Screen} />
        <Stack.Screen name="Stage2" component={Stage2PhotosScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={DiscoverScreen} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />

        {/* Subscription */}
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Coins" component={CoinsScreen} />

        {/* Verification */}
        <Stack.Screen name="PhotoVerification" component={PhotoVerificationScreen} />

        {/* Settings */}
        <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />

        {/* Admin Panel */}
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />

        {/* Chat */}
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />

        {/* Profile Views */}
        <Stack.Screen
          name="ProfileDetail"
          component={ProfileDetailScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen name="YouLiked" component={YouLikedScreen} />
        <Stack.Screen name="LikedBy" component={LikedByScreen} />
      </Stack.Navigator>
      <DailyRewardModal
        visible={rewardVisible}
        coinsAwarded={rewardCoins}
        newBalance={rewardBalance}
        onClose={() => setRewardVisible(false)}
      />
    </NavigationContainer>
  );
}
