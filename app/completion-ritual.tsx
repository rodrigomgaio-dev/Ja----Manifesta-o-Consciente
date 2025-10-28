// app/completion-ritual.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

export default function CompletionRitualScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateCocriation } = useIndividualCocriations();

  const [step, setStep] = useState<'celebration' | 'realization'>('celebration');
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(50)).current;
  
  // Partículas
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Animação de celebração
    startCelebrationAnimation();
    
    // Criar partículas
    createParticles();
    
    // Transição para tela de realização
    setTimeout(() => {
      setStep('realization');
      startRealizationAnimation();
    }, 3000);
  }, []);

  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      const particle = {
        id: i,
        x: Math.random() * width,
        y: height + Math.random() * 100,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 3000 + 2000,
        delay: Math.random() * 500,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
      };
      
      // Animar partícula subindo
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: -height - 100,
            duration: particle.duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      newParticles.push(particle);
    }
    setParticles(newParticles);
  };

  const startCelebrationAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startRealizationAnimation = () => {
    Animated.sequence([
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(subtitleSlideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleViewNFT = async () => {
    if (!id) return;
    
    // Marcar cocriação como concluída
    await updateCocriation(id, {
      status: 'completed',
      completion_date: new Date().toISOString(),
    });
    
    // Navegar para tela do NFT (que virou Momória de Cocriação)
    router.replace(`/symbolic-nft?cocreationId=${id}`);
  };

  if (step === 'celebration') {
    return (
      <LinearGradient
        colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']}
        style={styles.container}
      >
        {/* Partículas douradas */}
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                bottom: 0,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                transform: [{ translateY: particle.translateY }],
              },
            ]}
          >
            <MaterialIcons name="auto-awesome" size={particle.size} color="#FBBF24" />
          </Animated.View>
        ))}
        
        {/* Ícone central pulsante */}
        <Animated.View
          style={[
            styles.celebrationIcon,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#FBBF24']}
            style={styles.iconGradient}
          >
            <MaterialIcons name="celebration" size={80} color="white" />
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#6B46C1', '#8B5CF6', '#A855F7', '#EC4899', '#FBBF24']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.realizationContainer}>
        {/* Texto "Já é." */}
        <Animated.View
          style={[
            styles.mainTextContainer,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          <Text style={styles.mainText}>Já é.</Text>
        </Animated.View>
        
        {/* Subtitle deslizando */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: subtitleSlideAnim }],
            },
          ]}
        >
          <Text style={styles.subtitle}>Gratidão pela cocriação.</Text>
        </Animated.View>
        
        {/* Botão Ver NFT */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.nftButton}
            onPress={handleViewNFT}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.nftButtonGradient}
            >
              <MaterialIcons name="card-giftcard" size={24} color="white" />
              <Text style={styles.nftButtonText}>Ver minha Memória de Cocriação</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  celebrationIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  realizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  mainTextContainer: {
    marginBottom: Spacing.xl * 2,
  },
  mainText: {
    fontSize: 72,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 8,
  },
  subtitleContainer: {
    marginBottom: Spacing.xl * 3,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  nftButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nftButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
  },
  nftButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
});
