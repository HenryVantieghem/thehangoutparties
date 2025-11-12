import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../stores';
import { COLORS, RADIUS, SPACING } from '../constants';
import { ScreenErrorBoundary } from '../components/ErrorBoundary';

// Auth Screens
import { SignInScreen as _SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen as _SignUpScreen } from '../screens/auth/SignUpScreen';
import { ResetPasswordScreen as _ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { OnboardingScreen as _OnboardingScreen } from '../screens/OnboardingScreen';

// Main Screens
import { DiscoverScreen as _DiscoverScreen } from '../screens/DiscoverScreen';
import { MapScreen as _MapScreen } from '../screens/MapScreen';
import { CreatePartyScreen as _CreatePartyScreen } from '../screens/CreatePartyScreen';
import { MessagesScreen as _MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen as _ProfileScreen } from '../screens/ProfileScreen';

// Wrap screens with error boundaries
const SignInScreen = () => <ScreenErrorBoundary screenName="SignIn"><_SignInScreen /></ScreenErrorBoundary>;
const SignUpScreen = () => <ScreenErrorBoundary screenName="SignUp"><_SignUpScreen /></ScreenErrorBoundary>;
const ResetPasswordScreen = () => <ScreenErrorBoundary screenName="ResetPassword"><_ResetPasswordScreen /></ScreenErrorBoundary>;
const OnboardingScreen = () => <ScreenErrorBoundary screenName="Onboarding"><_OnboardingScreen /></ScreenErrorBoundary>;
const DiscoverScreen = () => <ScreenErrorBoundary screenName="Discover"><_DiscoverScreen /></ScreenErrorBoundary>;
const MapScreen = () => <ScreenErrorBoundary screenName="Map"><_MapScreen /></ScreenErrorBoundary>;
const CreatePartyScreen = () => <ScreenErrorBoundary screenName="CreateParty"><_CreatePartyScreen /></ScreenErrorBoundary>;
const MessagesScreen = () => <ScreenErrorBoundary screenName="Messages"><_MessagesScreen /></ScreenErrorBoundary>;
const ProfileScreen = () => <ScreenErrorBoundary screenName="Profile"><_ProfileScreen /></ScreenErrorBoundary>;

// Modal Screens
import PartyDetailModal as _PartyDetailModal from '../screens/PartyDetailModal';
import PhotoDetailModal as _PhotoDetailModal from '../screens/PhotoDetailModal';
import FriendListScreen as _FriendListScreen from '../screens/FriendListScreen';

// Wrap modal screens with error boundaries
const PartyDetailModal = () => <ScreenErrorBoundary screenName="PartyDetail"><_PartyDetailModal /></ScreenErrorBoundary>;
const PhotoDetailModal = () => <ScreenErrorBoundary screenName="PhotoDetail"><_PhotoDetailModal /></ScreenErrorBoundary>;
const FriendListModal = () => <ScreenErrorBoundary screenName="FriendList"><_FriendListScreen /></ScreenErrorBoundary>;
const SettingsModal = () => <ScreenErrorBoundary screenName="Settings"><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Settings Coming Soon</Text></View></ScreenErrorBoundary>;

// Stack and Tab navigators
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const TabNavigator = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Tab Icon component with glassmorphism
function TabIcon({ 
  iconName, 
  focused, 
  size = 24 
}: { 
  iconName: string; 
  focused: boolean; 
  size?: number;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: focused ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
      }}
    >
      <Ionicons
        name={iconName as any}
        size={size}
        color={focused ? COLORS.cyan : COLORS.gray500}
      />
    </View>
  );
}

// Create Party button with special styling
function CreatePartyButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.pink,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.pink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 20, // Lift it up a bit
      }}
    >
      <Ionicons name="add" size={32} color={COLORS.white} />
    </TouchableOpacity>
  );
}

// Custom Tab Bar with glassmorphism
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom || SPACING.lg,
      }}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(10, 14, 39, 0.8)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          paddingTop: SPACING.lg,
          paddingHorizontal: SPACING.lg,
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Special handling for Create button
          if (route.name === 'CreateParty') {
            return (
              <View
                key={index}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreatePartyButton onPress={onPress} />
              </View>
            );
          }

          // Get the appropriate icon for each tab
          let iconName;
          switch (route.name) {
            case 'Discover':
              iconName = isFocused ? 'home' : 'home-outline';
              break;
            case 'Map':
              iconName = isFocused ? 'map' : 'map-outline';
              break;
            case 'Messages':
              iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = isFocused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: SPACING.sm,
              }}
            >
              <TabIcon iconName={iconName} focused={isFocused} />
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <TabNavigator.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <TabNavigator.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
      <TabNavigator.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <TabNavigator.Screen
        name="CreateParty"
        component={CreatePartyScreen}
        options={{
          tabBarLabel: 'Create',
        }}
      />
      <TabNavigator.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      <TabNavigator.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </TabNavigator.Navigator>
  );
}

// Main Stack Navigator (wraps tabs)
function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
    </MainStack.Navigator>
  );
}

// Root Stack Navigator (includes modals)
function RootStackNavigator() {
  const { user, isAuthenticated, loading } = useAuthStore();

  // Show loading screen while checking auth
  if (loading) {
    return null; // Could show a loading screen here
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        gestureEnabled: true,
      }}
    >
      {!isAuthenticated ? (
        <>
          <RootStack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ gestureEnabled: false }}
          />
          <RootStack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{ gestureEnabled: false }}
          />
        </>
      ) : (
        <>
          <RootStack.Screen 
            name="Main" 
            component={MainNavigator}
            options={{ gestureEnabled: false }}
          />
          
          {/* Modal Screens */}
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name="PartyDetail"
              component={PartyDetailModal}
              options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
            <RootStack.Screen
              name="PhotoDetail"
              component={PhotoDetailModal}
              options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
            <RootStack.Screen
              name="FriendList"
              component={FriendListModal}
              options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
            <RootStack.Screen
              name="Settings"
              component={SettingsModal}
              options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
          </RootStack.Group>
        </>
      )}
    </RootStack.Navigator>
  );
}

// Linking configuration for deep links
const linking = {
  prefixes: ['thehangout://'],
  config: {
    screens: {
      Auth: {
        screens: {
          SignIn: 'signin',
          SignUp: 'signup',
          ResetPassword: 'reset-password',
        },
      },
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
};

export function RootNavigator() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <NavigationContainer linking={linking as any}>
      <RootStackNavigator />
    </NavigationContainer>
  );
}