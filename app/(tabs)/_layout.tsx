import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { MapPin, Calendar, FileText, Send } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme';
import { haptic } from '../../src/utils/haptics';

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: isDark ? colors.cardBg : colors.primaryDark,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)',
          height: 64 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          borderTopWidth: 1,
          ...shadows.header,
        },
      }}
      screenListeners={{
        tabPress: () => {
          haptic.selection();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.meetings'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <MapPin color={color} size={focused ? 24 : 22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('tabs.events'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Calendar color={color} size={focused ? 24 : 22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="agendas"
        options={{
          title: t('tabs.agendas'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <FileText color={color} size={focused ? 24 : 22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: t('tabs.contact'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Send color={color} size={focused ? 24 : 22} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
  },
  activeIconWrapper: {
    transform: [{ scale: 1.08 }],
  },
});
