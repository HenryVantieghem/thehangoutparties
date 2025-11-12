import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingProvider } from './src/providers/LoadingProvider';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Pre-load fonts if needed
        await Font.loadAsync({
          // Add custom fonts here if any
        });

        // Artificially delay for demo purposes (remove in production)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isReady) {
      // Hide the splash screen
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LoadingProvider
          showGlobalIndicator={true}
          showOverlayForCritical={true}
          automaticErrorHandling={true}
        >
          <StatusBar style="light" backgroundColor="#0A0E27" />
          <RootNavigator />
        </LoadingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}