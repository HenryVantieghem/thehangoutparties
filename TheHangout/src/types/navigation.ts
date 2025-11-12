/**
 * Proper TypeScript navigation types for The Hangout
 * Fixes the critical type safety issues throughout the app
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Root Stack Parameter List
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  PartyDetail: { partyId: string };
  PhotoDetail: { photoId: string; partyId?: string };
  FriendList: { userId?: string };
  Settings: undefined;
};

// Auth Stack Parameter List
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  ResetPasswordEmailSent: { email: string };
};

// Main Tab Parameter List
export type MainTabParamList = {
  Discover: undefined;
  Map: undefined;
  CreateParty: undefined;
  Messages: undefined;
  Profile: { userId?: string };
};

// Main Stack Parameter List (wraps tabs + other screens)
export type MainStackParamList = {
  MainTabs: undefined;
  CreatePartyFlow: undefined;
  PartyDetail: { partyId: string };
  UserProfile: { userId: string };
  EditProfile: undefined;
  Camera: { mode: 'photo' | 'video' };
  Chat: { conversationId: string; partyId?: string };
  PartyPhotos: { partyId: string };
  PartyAttendees: { partyId: string };
  Search: { query?: string };
  Notifications: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<MainStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Navigation prop types for specific screens
export type DiscoverScreenProps = MainTabScreenProps<'Discover'>;
export type MapScreenProps = MainTabScreenProps<'Map'>;
export type CreatePartyScreenProps = MainTabScreenProps<'CreateParty'>;
export type MessagesScreenProps = MainTabScreenProps<'Messages'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export type PartyDetailModalProps = RootStackScreenProps<'PartyDetail'>;
export type PhotoDetailModalProps = RootStackScreenProps<'PhotoDetail'>;
export type FriendListModalProps = RootStackScreenProps<'FriendList'>;
export type SettingsModalProps = RootStackScreenProps<'Settings'>;

export type SignInScreenProps = AuthStackScreenProps<'SignIn'>;
export type SignUpScreenProps = AuthStackScreenProps<'SignUp'>;
export type ResetPasswordScreenProps = AuthStackScreenProps<'ResetPassword'>;

// Common navigation methods interface
export interface NavigationMethods {
  navigate: (screen: string, params?: any) => void;
  push: (screen: string, params?: any) => void;
  replace: (screen: string, params?: any) => void;
  goBack: () => void;
  popToTop: () => void;
  reset: (state: any) => void;
}

// Utility types for route params
export type RouteParams<T extends keyof RootStackParamList> = RootStackParamList[T];
export type TabRouteParams<T extends keyof MainTabParamList> = MainTabParamList[T];

// Deep linking types
export type DeepLinkParams = {
  partyId?: string;
  photoId?: string;
  userId?: string;
  conversationId?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}