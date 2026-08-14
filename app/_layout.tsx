import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../src/i18n'; // Initialize i18next
import { seedInitialLocalData, pullMasterData } from '../src/database/sync';
import { startOutboxNetworkListener } from '../src/database/outboxWorker';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { BrandedSplashScreen } from '../src/components/BrandedSplashScreen';
import { colors } from '../src/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Seed initial local database tables & pull live data
    seedInitialLocalData()
      .then(() => {
        pullMasterData();
      })
      .catch((err) => {
        console.warn('Initial data seeding error:', err);
      });

    // Start network listener for outbox queue worker
    const unsubscribeOutbox = startOutboxNetworkListener();
    return () => {
      unsubscribeOutbox();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bgLight },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              title: 'تسجيل دخول الخدامات • Microsoft SSO',
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
        {showSplash && <BrandedSplashScreen onFinish={() => setShowSplash(false)} />}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

