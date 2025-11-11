import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores';
import { COLORS } from '../constants';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ResetPasswordEmailSentScreen from '../screens/auth/ResetPasswordEmailSentScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import MapScreen from '../screens/MapScreen';
import CreatePartyScreen from '../screens/CreatePartyScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PartyDetailModal from '../screens/PartyDetailModal';
import PhotoDetailModal from '../screens/PhotoDetailModal';
import FriendListScreen from '../screens/FriendListScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  PartyDetail: { partyId: string };
  PhotoDetail: { photoId: string };
  FriendList: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  ResetPasswordEmailSent: { email: string };
};

export type MainTabParamList = {
  Discover: undefined;
  Map: undefined;
  Create: undefined;
  Messages: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

/**
 * Auth Stack Navigator
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.dark },
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="ResetPasswordEmailSent" component={ResetPasswordEmailSentScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Main Tab Navigator with glassmorphism styling
 */
function MainNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Discover') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.gray600,
        tabBarStyle: {
          backgroundColor: 'rgba(26, 31, 58, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 88,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <MainTabs.Screen name="Discover" component={DiscoverScreen} />
      <MainTabs.Screen name="Map" component={MapScreen} />
      <MainTabs.Screen
        name="Create"
        component={CreatePartyScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={size + 8}
              color={focused ? COLORS.cyan : COLORS.gray600}
            />
          ),
        }}
      />
      <MainTabs.Screen name="Messages" component={MessagesScreen} />
      <MainTabs.Screen name="Profile" component={ProfileScreen} />
    </MainTabs.Navigator>
  );
}

/**
 * Root Navigator with conditional rendering based on auth state
 */
export default function RootNavigator() {
  const { user } = useAuthStore();
  const [isOnboarded, setIsOnboarded] = React.useState(false);

  React.useEffect(() => {
    // Check if user has completed onboarding
    // In production, check AsyncStorage or user preferences
    AsyncStorage.getItem('onboarding_completed').then((value) => {
      setIsOnboarded(value === 'true');
    });
  }, []);

  return (
    <NavigationContainer
      linking={{
        prefixes: ['thehangout://'],
        config: {
          screens: {
            Main: {
              screens: {
                Discover: 'discover',
                Map: 'map',
                Create: 'create',
                Messages: 'messages',
                Profile: 'profile',
              },
            },
            PartyDetail: 'party/:partyId',
            PhotoDetail: 'photo/:photoId',
            FriendList: 'friends',
          },
        },
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: COLORS.dark },
        }}
      >
        {!isOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
              name="PartyDetail"
              component={PartyDetailModal}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <RootStack.Screen
              name="PhotoDetail"
              component={PhotoDetailModal}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <RootStack.Screen
              name="FriendList"
              component={FriendListScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

