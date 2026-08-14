import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Calendar, FileText, Send } from 'lucide-react-native';
import { colors, shadows } from '../../src/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: '#11253e', // Deep Navy website footer/nav color
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          ...shadows.header,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.meetings'),
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('tabs.events'),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="agendas"
        options={{
          title: t('tabs.agendas'),
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: t('tabs.contact'),
          tabBarIcon: ({ color, size }) => <Send color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

