import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAppTheme } from '../src/theme';
import { AppText } from '../src/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors, borderRadius } = useAppTheme();

  useEffect(() => {
    // Attempt closing any lingering auth sessions that hit unmatched routes
    try {
      WebBrowser.maybeCompleteAuthSession();
    } catch {}

    // Automatically navigate safely to the main tabs after brief pause
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 600);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <AppText variant="h3" color={colors.textPrimary} weight="700">
        العودة للتطبيق...
      </AppText>
      <AppText
        variant="bodySmall"
        color={colors.textSecondary}
        style={styles.subtitle}
      >
        Returning to main screen...
      </AppText>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.8}
      >
        <AppText variant="label" color="#ffffff" weight="700">
          الصفحة الرئيسية / Home
        </AppText>
      </TouchableOpacity>
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
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
