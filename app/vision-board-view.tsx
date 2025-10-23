import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnimationType = 'fade' | 'slide' | 'zoom' | 'pulse' | 'flip' | 'slideDown' | 'slideUp' | 'random';
type DurationType = 30 | 60 | 300 | -1;
type SpeedType = 0.5 | 1 | 1.5 | 2;

export default function VisionBoardViewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { items, loading } = useVisionBoardItems(cocreationId || '');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('fade');
  const [duration, setDuration] = useState<DurationType>(60);
  const [speed, setSpeed] = useState<SpeedType>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const sequenceAnimationValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentAnimationType = useRef<Exclude<AnimationType, 'random'>>('fade');

  const imageItems = items.filter(item => {
    if (item.type !== 'image') return false;
    const uri = (item as any).content || (item as any).uri;
    return !!uri;
  }).map(item => ({
    ...item,
    uri: (item as any).content || (item as any).uri
  }));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) animationRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused && imageItems.length > 0) {
      startTimer();
      startAnimationCycle();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) animationRef.current.stop();
    }
  }, [isPlaying, isPaused, currentImageIndex, speed]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setTotalElapsed(prev => prev + 1);
        if (duration !== -1) {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              handleStop();
              return 0;
            }
            return prev - 1;
          });
        }
      }
    }, 1000);
  };

  const getRandomAnimation = (): Exclude<AnimationType, 'random'> => {
    const animations: Exclude<AnimationType, 'random'>[] = ['fade', 'slide', 'zoom', 'pulse', 'flip', 'slideDown', 'slideUp'];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  const startAnimationCycle = () => {
    sequenceAnimationValue.setValue(0);
    const currentAnim = selectedAnimation === 'random' 
      ? getRandomAnimation() 
      : selectedAnimation;
    currentAnimationType.current = currentAnim;

    const baseFadeInDuration = 500;
    const baseEffectDuration = 2500;
    const baseFadeOutDuration = 500;
    const basePauseDuration = 10;

    const fadeInDuration = baseFadeInDuration / speed;
    const effectDuration = baseEffectDuration / speed;
    const fadeOutDuration = baseFadeOutDuration / speed;
    const pauseDuration = basePauseDuration / speed;

    const sequence = Animated.sequence([
      Animated.timing(sequenceAnimationValue, {
        toValue: 0.1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sequenceAnimationValue, {
        toValue: 0.8,
        duration: effectDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sequenceAnimationValue, {
        toValue: 0.9,
        duration: fadeOutDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sequenceAnimationValue, {
        toValue: 1.0,
        duration: pauseDuration,
        useNativeDriver: true,
      }),
    ]);

    if (animationRef.current) animationRef.current.stop();
    animationRef.current = sequence;

    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused) {
        const nextIndex = (currentImageIndex + 1) % imageItems.length;
        setCurrentImageIndex(nextIndex);
        if (imageItems.length === 1) {
          setTimeout(() => {
            if (isPlaying && !isPaused) startAnimationCycle();
          }, 10);
        }
      }
    });
  };

  const getAnimatedStyle = () => {
    const currentAnim = currentAnimationType.current;
    const inputRange = [0, 0.1, 0.8, 0.9, 1.0];
    const opacity = sequenceAnimationValue.interpolate({
      inputRange,
      outputRange: [0, 1, 1, 0, 0],
    });

    if (currentAnim === 'slide') {
      const isEvenIndex = currentImageIndex % 2 === 0;
      const startX = isEvenIndex ? -SCREEN_WIDTH : SCREEN_WIDTH;
      const endX = isEvenIndex ? SCREEN_WIDTH : -SCREEN_WIDTH;
      return {
        opacity,
        transform: [{ translateX: sequenceAnimationValue.interpolate({ inputRange: [0, 0.1, 0.8, 0.9, 1.0], outputRange: [startX, 0, endX, endX, endX] }) }],
      };
    }

    if (currentAnim === 'flip') {
      const flipInputRange = [0, 0.1, 0.45, 0.8, 0.9, 1.0];
      const flipOutputRange = ['0deg', '0deg', '180deg', '0deg', '0deg', '0deg'];
      return {
        opacity,
        transform: [{ rotateY: sequenceAnimationValue.interpolate({ inputRange: flipInputRange, outputRange: flipOutputRange }) }],
      };
    }

    if (currentAnim === 'zoom') {
      const zoomInputRange = [0, 0.1, 0.45, 0.8, 0.9, 1.0];
      const zoomOutputRange = [0.2, 0.2, 2.0, 0.2, 0.2, 0.2];
      return {
        opacity,
        transform: [{ scale: sequenceAnimationValue.interpolate({ inputRange: zoomInputRange, outputRange: zoomOutputRange }) }],
      };
    }

    if (currentAnim === 'pulse') {
      const pulseInputRange = [0.0, 0.1, 0.18, 0.22, 0.32, 0.36, 0.52, 0.60, 0.64, 0.74, 0.78, 0.94, 0.97, 1.0];
      const scaleOutputRange = [1.0, 1.0, 1.12, 1.0, 1.12, 1.0, 1.0, 1.12, 1.0, 1.12, 1.0, 1.0, 1.0, 1.0];
      return {
        opacity,
        transform: [{ scale: sequenceAnimationValue.interpolate({ inputRange: pulseInputRange, outputRange: scaleOutputRange }) }],
      };
    }

    if (currentAnim === 'slideDown') {
      const translateY = sequenceAnimationValue.interpolate({
        inputRange: [0, 0.1, 0.8, 0.9, 1.0],
        outputRange: [-SCREEN_HEIGHT * 0.5, 0, 0, SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.3],
      });
      return { opacity, transform: [{ translateY }] };
    }

    if (currentAnim === 'slideUp') {
      const translateY = sequenceAnimationValue.interpolate({
        inputRange: [0, 0.1, 0.8, 0.9, 1.0],
        outputRange: [SCREEN_HEIGHT * 0.3, 0, 0, -SCREEN_HEIGHT * 0.3, -SCREEN_HEIGHT * 0.3],
      });
      return { opacity, transform: [{ translateY }] };
    }

    return { opacity };
  };

  const handleStart = () => {
    if (imageItems.length === 0) {
      setModalVisible(true);
      return;
    }
    setIsPlaying(true);
    setIsPaused(false);
    setTimeRemaining(duration === -1 ? 0 : duration);
    setTotalElapsed(0);
    setCurrentImageIndex(0);
    sequenceAnimationValue.setValue(0);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused && animationRef.current) animationRef.current.stop();
    else startAnimationCycle();
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) animationRef.current.stop();
    sequenceAnimationValue.setValue(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animationOptions = [
    { type: 'fade', icon: 'opacity', label: 'Fade' },
    { type: 'slide', icon: 'swap-horiz', label: 'Deslizar' },
    { type: 'zoom', icon: 'zoom-in', label: 'Zoom' },
    { type: 'pulse', icon: 'favorite', label: 'Pulsar' },
    { type: 'flip', icon: 'flip', label: 'Virar' },
    { type: 'slideDown', icon: 'arrow-downward', label: 'Descer' },
    { type: 'slideUp', icon: 'arrow-upward', label: 'Subir' },
    { type: 'random', icon: 'shuffle', label: 'Aleatório' },
  ];

  const durationOptions = [
    { value: 30, label: '30s', icon: 'timer' },
    { value: 60, label: '1min', icon: 'timer' },
    { value: 300, label: '5min', icon: 'timer' },
    { value: -1, label: '∞', icon: 'infinity' },
  ];

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
  ];

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Botão Voltar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Duração e Velocidade (abaixo do Voltar) */}
        <View style={styles.configPanel}>
          <View style={styles.durationRow}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationButton,
                  {
                    backgroundColor: duration === option.value ? colors.accent + '20' : 'transparent',
                    borderColor: duration === option.value ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setDuration(option.value)}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={16}
                  color={duration === option.value ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.durationLabel,
                    { color: duration === option.value ? colors.accent : colors.textSecondary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.speedRow}>
            {speedOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.speedButton,
                  {
                    backgroundColor: speed === option.value ? colors.primary + '20' : 'transparent',
                    borderColor: speed === option.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSpeed(option.value)}
              >
                <Text
                  style={[
                    styles.speedLabel,
                    { color: speed === option.value ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Centro: Grid ou Animação */}
        {!isPlaying ? (
          <ScrollView
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
          >
            {imageItems.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="dashboard" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Seu Vision Board está vazio
                </Text>
              </View>
            ) : (
              <View style={styles.imageGrid}>
                {imageItems.map((item, index) => (
                  <View key={index} style={styles.staticImageWrapper}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.staticImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.centerContent}>
            <Animated.View style={[styles.animatedImageContainer, getAnimatedStyle()]}>
              {imageItems[currentImageIndex]?.uri ? (
                <Image
                  source={{ uri: imageItems[currentImageIndex].uri }}
                  style={styles.fullImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              ) : (
                <View style={[styles.placeholderContainer, { backgroundColor: colors.surface + '60' }]}>
                  <MaterialIcons name="broken-image" size={48} color={colors.textMuted} />
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* Controles de reprodução */}
        <View style={styles.playbackPanel}>
          {isPlaying && (
            <View style={styles.timerRow}>
              <MaterialIcons name="timer" size={16} color={colors.primary} />
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(timeRemaining)}
              </Text>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                • {currentImageIndex + 1} / {imageItems.length}
              </Text>
            </View>
          )}

          <View style={styles.playbackButtons}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.primary }]}
              onPress={isPlaying ? handlePause : handleStart}
            >
              <MaterialIcons
                name={isPlaying && !isPaused ? "pause" : "play-arrow"}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            {isPlaying && (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.error }]}
                onPress={handleStop}
              >
                <MaterialIcons name="stop" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Efeitos (abaixo dos controles) */}
        <View style={[styles.effectsPanel, { backgroundColor: colors.surface + 'C0' }]}>
          <View style={styles.effectsGrid}>
            {animationOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.effectButton,
                  {
                    backgroundColor: selectedAnimation === option.type ? colors.primary + '30' : colors.surface,
                    borderColor: selectedAnimation === option.type ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedAnimation(option.type)}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={18}
                  color={selectedAnimation === option.type ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.effectLabel,
                    {
                      color: selectedAnimation === option.type ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SacredModal
          visible={modalVisible}
          title="Vision Board Vazio"
          message="Adicione imagens ao seu Vision Board antes de iniciar a visualização."
          type="info"
          onClose={() => setModalVisible(false)}
        />
      </View>
    </GradientBackground>
  );
}

const ITEM_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  configPanel: {
    marginTop: 70,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  durationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  speedButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  speedLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  staticImageWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  staticImage: {
    width: '100%',
    height: '100%',
  },
  animatedImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  placeholderContainer: {
    width: '90%',
    height: '90%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackPanel: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  playbackButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  effectsPanel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: Spacing.lg,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  effectButton: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
  },
  effectLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});