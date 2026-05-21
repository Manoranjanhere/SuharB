import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OtpVerify: { phone: string };
  Stage1: undefined;
  Stage2: undefined;
  Main: undefined;
  Discover: undefined;
  ProfileDetail: { userId: string };
  YouLiked: undefined;
  LikedBy: undefined;
  Matches: undefined;
  Subscription: undefined;
  Coins: undefined;
  PhotoVerification: undefined;
  AccountSettings: undefined;
  AdminPanel: undefined;
  ChatConversation: { userId: string; userName?: string };
  Inbox: undefined;
};

// Typed props for every screen — import these in each screen file
export type WelcomeScreenProps        = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
export type PhoneEntryScreenProps     = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;
export type OtpVerifyScreenProps      = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;
export type Stage1ScreenProps         = NativeStackScreenProps<RootStackParamList, 'Stage1'>;
export type Stage2ScreenProps         = NativeStackScreenProps<RootStackParamList, 'Stage2'>;
export type DiscoverScreenProps       = NativeStackScreenProps<RootStackParamList, 'Discover'>;
export type ProfileDetailScreenProps  = NativeStackScreenProps<RootStackParamList, 'ProfileDetail'>;
export type YouLikedScreenProps       = NativeStackScreenProps<RootStackParamList, 'YouLiked'>;
export type LikedByScreenProps        = NativeStackScreenProps<RootStackParamList, 'LikedBy'>;
export type MatchesScreenProps        = NativeStackScreenProps<RootStackParamList, 'Matches'>;
export type SubscriptionScreenProps   = NativeStackScreenProps<RootStackParamList, 'Subscription'>;
export type CoinsScreenProps          = NativeStackScreenProps<RootStackParamList, 'Coins'>;
export type PhotoVerificationProps    = NativeStackScreenProps<RootStackParamList, 'PhotoVerification'>;
export type AccountSettingsProps      = NativeStackScreenProps<RootStackParamList, 'AccountSettings'>;
export type AdminPanelProps           = NativeStackScreenProps<RootStackParamList, 'AdminPanel'>;
export type InboxScreenProps          = NativeStackScreenProps<RootStackParamList, 'Inbox'>;
export type ChatConversationProps     = NativeStackScreenProps<RootStackParamList, 'ChatConversation'>;
