import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/Colors';

interface SacredCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowing?: boolean;
  onPress?: () => void;
  animated?: boolean;
}

export default function SacredCard({ 
  children, 
  style, 
  glowing = false,
  onPress,
  animated = false
}: SacredCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const brightness = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: interpolate(brightness.value, [1, 1.15], [1, 1]),
    };
  });

  const handlePressIn = () => {
    if (animated || onPress) {
      scale.value = withSpring(1.02, {
        damping: 15,
        stiffness: 300,
      });
      brightness.value = withSpring(1.15, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (animated || onPress) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      brightness.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const CardContent = (
    <View style={[styles.container, style]}>
      {glowing && (
        <LinearGradient
          colors={[colors.primary + '40', colors.accent + '20', 'transparent']}
          style={styles.glow}
        />
      )}
      <Animated.View 
        style={[
          styles.card, 
          { backgroundColor: colors.card, borderColor: colors.border },
          animated || onPress ? animatedStyle : undefined
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );

  if (onPress || animated) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
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