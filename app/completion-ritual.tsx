import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

export default function CompletionRitualScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams();
  const id = cocreationId as string;

  const [phase, setPhase] = useState<'celebration' | 'realization' | 'completed'>('celebration');
  const scaleAnim = new Animated.Value(0.8);
  const textOpacity = new Animated.Value(0);
  const textY = new Animated.Value(50);

  useEffect(() => {
    // Fase 1: Celebração (3 segundos)
    const celebrationTimer = setTimeout(() => {
      setPhase('realization');
    }, 3000);

    // Fase 2: Realização (2 segundos)
    const realizationTimer = setTimeout(() => {
      setPhase('completed');
    }, 5000);

    return () => {
      clearTimeout(celebrationTimer);
      clearTimeout(realizationTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === 'celebration') {
      // Animação pulsante do ícone
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }

    if (phase === 'realization') {
      // Animação de aparecimento do texto
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase]);

  const handleGoToMemoryConfig = () => {
    router.push({
      pathname: '/memory-config',
      params: { cocreationId: id }
    });
  };

  const handleGoToMemory = () => {
    router.push({
      pathname: '/symbolic-nft',
      params: { cocreationId: id }
    });
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {phase === 'celebration' && (
          <View style={styles.celebrationContainer}>
            {/* Partículas animadas */}
            {[...Array(20)].map((_, index) => (
              <FloatingParticle
                key={index}
                index={index}
                colors={colors}
              />
            ))}

            {/* Ícone pulsante */}
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <MaterialIcons name="auto-awesome" size={120} color={colors.glowStart} />
            </Animated.View>

            <Text style={styles.celebrationText}>Celebrando sua Cocriação</Text>
          </View>
        )}

        {phase === 'realization' && (
          <View style={styles.realizationContainer}>
            <Animated.View
              style={[
                styles.realizationTextContainer,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textY }]
                }
              ]}
            >
              <Text style={styles.realizationTitle}>Já é.</Text>
              <Animated.View
                style={[
                  styles.realizationSubtitleContainer,
                  { opacity: textOpacity }
                ]}
              >
                <Text style={styles.realizationSubtitle}>
                  Gratidão pela cocriação.
                </Text>
              </Animated.View>
            </Animated.View>
          </View>
        )}

        {phase === 'completed' && (
          <View style={styles.completedContainer}>
            <MaterialIcons name="celebration" size={80} color={colors.glowStart} />
            <Text style={styles.completedTitle}>Sua Jornada Está Completa</Text>
            <Text style={styles.completedText}>
              Você reconheceu que tudo que desejou já era real.
              {'\n\n'}
              Agora podemos criar sua Memória de Cocriação.
            </Text>

            <SacredButton
              title="Personalizar Memória"
              onPress={handleGoToMemoryConfig}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

// Componente para as partículas flutuantes
const FloatingParticle = ({ index, colors }) => {
  const [position] = useState({
    x: Math.random() * width,
    y: height + 50,
  });

  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateParticle = () => {
      Animated.timing(animation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        animation.setValue(0);
        animateParticle();
      });
    };

    animateParticle();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height - 100],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: position.x,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <MaterialIcons name="star" size={8} color={colors.glowStart} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  particle: {
    position: 'absolute',
  },
  realizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realizationTextContainer: {
    alignItems: 'center',
  },
  realizationTitle: {
    fontSize: 48,
    fontWeight: '100',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  realizationSubtitleContainer: {
    marginTop: Spacing.lg,
  },
  realizationSubtitle: {
    fontSize: 18,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  completedText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    minWidth: 200,
  },
});