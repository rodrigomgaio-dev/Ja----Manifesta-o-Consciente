import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'background';
}

export default function GradientBackground({ 
  children, 
  variant = 'background' 
}: GradientBackgroundProps) {
  const { colors } = useTheme();
  
  const gradientColors = variant === 'primary' 
    ? colors.gradientPrimary
    : variant === 'secondary'
    ? colors.gradientSecondary
    : colors.gradientBackground;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});