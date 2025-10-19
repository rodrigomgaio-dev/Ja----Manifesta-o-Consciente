import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : 'rgba(45, 27, 94, 0.95)',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: Platform.select({
            ios: insets.bottom + 12,
            android: insets.bottom + 12,
            default: 12
          }),
          paddingTop: 12,
          height: Platform.select({
            ios: insets.bottom + 80,
            android: insets.bottom + 80,
            default: 90
          }),
          paddingHorizontal: 16,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 6,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      /><Tabs.Screen
        name="painel"
        options={{
          href: null,
        }}
      /><Tabs.Screen
        name="individual"
        options={{
          title: 'Minhas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      /><Tabs.Screen
        name="circulos"
        options={{
          title: 'Círculos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="group" size={size} color={color} />
          ),
        }}
      /><Tabs.Screen
        name="praticas"
        options={{
          title: 'Práticas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="spa" size={size} color={color} />
          ),
        }}
      /><Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
