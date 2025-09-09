import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/Colors';

interface SacredCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowing?: boolean;
}

export default function SacredCard({ children, style, glowing = false }: SacredCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {glowing && (
        <LinearGradient
          colors={[colors.primary + '40', colors.accent + '20', 'transparent']}
          style={styles.glow}
        />
      )}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.lg + 4,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
});