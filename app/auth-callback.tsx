import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAppTheme } from '../src/theme';
import { AppText } from '../src/components/ui';

// Complete auth session if redirected here
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  useEffect(() => {
    // Complete session and safely route back to agendas/home
    WebBrowser.maybeCompleteAuthSession();
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/agendas');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText
        variant="caption"
        color={colors.textSecondary}
        weight="600"
        style={styles.text}
      >
        جاري إتمام المصادقة... / Completing sign-in...
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    marginTop: 16,
    textAlign: 'center',
  },
});
