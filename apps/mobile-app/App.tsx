import React, { useEffect, useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';

import { store, persistor } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { analyticsService } from './src/services/analytics/analyticsService';
import { deepLinkService } from './src/services/deeplink/deepLinkService';
import { abTestService } from './src/services/ab-testing/abTestService';
import { pushNotificationService } from './src/services/notifications/pushNotificationService';
import './src/services/i18n';

// Ignore specific warnings
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

// Initialize Sentry
Sentry.init({
  dsn: __DEV__ ? undefined : 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  attachStacktrace: true,
  enabled: !__DEV__,
});

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string>();

  useEffect(() => {
    // Initialize services
    analyticsService.initialize();
    deepLinkService.initialize();

    // Hide splash screen
    if (SplashScreen) {
      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);
    }

    return () => {
      deepLinkService.cleanup();
    };
  }, []);

  useEffect(() => {
    // Initialize AB testing when user is authenticated
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (state.auth.user && !abTestService['initialized']) {
        abTestService.initialize(state.auth.user.id);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <PaperProvider>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => {
                    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
                    deepLinkService.setNavigationRef(navigationRef.current);
                  }}
                  onStateChange={() => {
                    const previousRouteName = routeNameRef.current;
                    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

                    if (previousRouteName !== currentRouteName) {
                      // Track screen view
                      if (currentRouteName) {
                        analyticsService.trackScreenView(currentRouteName);
                      }
                    }

                    routeNameRef.current = currentRouteName;
                  }}
                >
                  <RootNavigator />
                </NavigationContainer>
              </PaperProvider>
            </QueryClientProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(App);
