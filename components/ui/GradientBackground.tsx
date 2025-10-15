import React from 'react';
import { View } from 'react-native';
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

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push(
        <View
          key={i}
          style={[
            styles.star,
            {
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.3,
              width: Math.random() * 2 + 2,
              height: Math.random() * 2 + 2,
            },
          ]}
        />
      );
    }
    return stars;
  };

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.starsContainer}>{renderStars()}</View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});