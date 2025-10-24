import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import GradientBackground from '@/components/ui/GradientBackground';

function RootNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.replace('/login');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Carregando...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="app-pitch" />
      <Stack.Screen name="create-individual" />
      <Stack.Screen name="edit-individual" />
      <Stack.Screen name="cocriacao-details" />
      <Stack.Screen name="vision-board" />
      <Stack.Screen name="vision-board-view" />
      <Stack.Screen name="practice-schedule" />
      <Stack.Screen name="practice-schedule-form" />
      <Stack.Screen name="future-letter" />
      <Stack.Screen name="cocreation-moments" />
      <Stack.Screen name="create-circle" />
      <Stack.Screen name="circle-details" />
      <Stack.Screen name="circle-invite" />
      <Stack.Screen name="invitation-details" />
      <Stack.Screen name="alignment-ritual" />
      <Stack.Screen name="completion-ritual" />
      <Stack.Screen name="symbolic-nft" />
      <Stack.Screen name="completed-cocreations" />
      <Stack.Screen name="jae-practice" />
      <Stack.Screen name="jae-affirmation-list" />
      <Stack.Screen name="jae-mantram-list" />
      <Stack.Screen name="jae-meditation-list" />
      <Stack.Screen name="gratitude-practice" />
      <Stack.Screen name="affirmations-practice" />
      <Stack.Screen name="mantram-practice" />
      <Stack.Screen name="meditation-practice" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}