import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="app-pitch" />
          <Stack.Screen name="circle-invite/[token]" />
          <Stack.Screen name="invitation-details" />
          <Stack.Screen name="alignment-ritual" />
          <Stack.Screen name="create-individual" />
          <Stack.Screen name="create-circle" />
          <Stack.Screen name="future-letter" />
          <Stack.Screen name="vision-board" />
          <Stack.Screen name="cocriacao-details" />
          <Stack.Screen name="circle-details" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}