import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface GratitudeItem {
  text: string;
  timestamp: Date;
}

export default function GratitudePracticeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId, circleId, title } = useLocalSearchParams<{ 
    cocreationId?: string; 
    circleId?: string;
    title?: string;
  }>();

  const [gratitudes, setGratitudes] = useState(['', '', '']);
  const [recentGratitudes, setRecentGratitudes] = useState<GratitudeItem[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);

  // Animation values
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;
  const heartTranslateY = useRef(new Animated.Value(0)).current;
  const particles = useRef([...Array(12)].map(() => ({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  const updateGratitude = (index: number, value: string) => {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = value;
    setGratitudes(newGratitudes);
  };

  const handleSendGratitudes = () => {
    const filledGratitudes = gratitudes.filter(g => g.trim() !== '');
    
    if (filledGratitudes.length === 0) {
      return;
    }

    // Add to recent gratitudes
    const newRecent = filledGratitudes.map(text => ({
      text,
      timestamp: new Date(),
    }));
    setRecentGratitudes(prev => [...newRecent, ...prev]);

    // Start animation
    setShowAnimation(true);
    startAnimation();

    // Clear inputs after animation
    setTimeout(() => {
      setGratitudes(['', '', '']);
      setShowAnimation(false);
      resetAnimation();
    }, 3000);
  };

  const startAnimation = () => {
    // Heart animation - scale up and move up while fading
    Animated.parallel([
      Animated.timing(heartScale, {
        toValue: 2.5,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(heartTranslateY, {
        toValue: -height,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Particles animation - spread out
    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 200;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - height / 2;

      Animated.sequence([
        Animated.delay(index * 50),
        Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: targetX,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: targetY,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Fade in particles initially
    particles.forEach((particle) => {
      particle.opacity.setValue(1);
      particle.scale.setValue(1);
    });
  };

  const resetAnimation = () => {
    heartScale.setValue(1);
    heartOpacity.setValue(1);
    heartTranslateY.setValue(0);
    particles.forEach((particle) => {
      particle.translateX.setValue(0);
      particle.translateY.setValue(0);
      particle.opacity.setValue(0);
      particle.scale.setValue(0);
    });
  };

  const getHeaderText = () => {
    if (cocreationId || circleId) {
      return `${title || 'Cocriação'}`;
    }
    return 'Hoje eu sou grato por...';
  };

  const getSubheaderText = () => {
    if (cocreationId || circleId) {
      return 'Sou grato pela possibilidade e capacidade de realizar esta cocriação, e também por...';
    }
    return '';
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays} dias atrás`;
  };

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <MaterialIcons name="favorite" size={48} color="#EC4899" />
          
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Momento de Gratidão
          </Text>
        </View>

        {/* Cocreation Title */}
        {(cocreationId || circleId) && title && (
          <View style={styles.cocreationTitleContainer}>
            <Text style={[styles.cocreationTitle, { color: '#EC4899' }]}>
              Cocriando {title}
            </Text>
          </View>
        )}

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
            Celebre as bênçãos da sua vida
          </Text>
        </View>

        {/* Gratitude Input Card */}
        <SacredCard glowing style={styles.inputCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Hoje sou grato por:
          </Text>

          {gratitudes.map((gratitude, index) => (
            <View key={index} style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.surface + '60',
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                value={gratitude}
                onChangeText={(value) => updateGratitude(index, value)}
                placeholder={
                  index === 0 
                    ? 'Escreva algo pelo qual você é grato hoje...'
                    : index === 1
                    ? 'Mais uma coisa especial que aconteceu...'
                    : 'Uma pessoa importante na sua vida...'
                }
                placeholderTextColor={colors.textMuted + '80'}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSendGratitudes}
            disabled={gratitudes.every(g => g.trim() === '')}
          >
            <LinearGradient
              colors={['#EC4899', '#F97316', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.submitButtonText}>
                Enviar Gratidões
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SacredCard>

        {/* Recent Gratitudes */}
        {recentGratitudes.length > 0 && (
          <SacredCard style={styles.recentCard}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>
              Gratidões Recentes
            </Text>

            {recentGratitudes.map((item, index) => (
              <View key={index} style={styles.recentItem}>
                <Text style={[styles.recentText, { color: colors.text }]}>
                  {item.text}
                </Text>
                <Text style={[styles.recentTimestamp, { color: colors.textMuted }]}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
            ))}
          </SacredCard>
        )}

        {/* Animation Overlay */}
        {showAnimation && (
          <View style={styles.animationOverlay} pointerEvents="none">
            {/* Center Heart */}
            <Animated.View
              style={[
                styles.animatedHeart,
                {
                  transform: [
                    { scale: heartScale },
                    { translateY: heartTranslateY },
                  ],
                  opacity: heartOpacity,
                },
              ]}
            >
              <MaterialIcons name="favorite" size={80} color={colors.primary} />
            </Animated.View>

            {/* Particles */}
            {particles.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    transform: [
                      { translateX: particle.translateX },
                      { translateY: particle.translateY },
                      { scale: particle.scale },
                    ],
                    opacity: particle.opacity,
                  },
                ]}
              >
                <MaterialIcons 
                  name="auto-awesome" 
                  size={20} 
                  color={colors.accent} 
                />
              </Animated.View>
            ))}

            {/* Message */}
            <Animated.View
              style={[
                styles.animationMessage,
                {
                  opacity: heartOpacity,
                },
              ]}
            >
              <Text style={[styles.animationMessageText, { color: colors.text }]}>
                Suas gratidões foram enviadas ao universo ✨
              </Text>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  cocreationTitleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  cocreationTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainSubtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inputCard: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    minHeight: 80,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  gradientButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  recentCard: {
    marginBottom: Spacing.xl,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  recentItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
    marginBottom: Spacing.sm,
  },
  recentText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  recentTimestamp: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  animatedHeart: {
    position: 'absolute',
    top: height / 2 - 100,
  },
  particle: {
    position: 'absolute',
    top: height / 2,
    left: width / 2,
  },
  animationMessage: {
    position: 'absolute',
    bottom: height / 3,
    paddingHorizontal: Spacing.xl,
  },
  animationMessageText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
