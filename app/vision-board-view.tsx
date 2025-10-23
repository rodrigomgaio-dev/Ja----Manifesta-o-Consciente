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
import SacredCard from '@/components/ui/SacredCard';
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
    { value: 30, label: '30 segundos' },
    { value: 60, label: '1 minuto' },
    { value: 300, label: '5 minutos' },
    { value: -1, label: 'Sem parar' },
  ];

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
  ];

  const progressPercentage = duration !== -1 && duration > 0
    ? ((duration - timeRemaining) / duration) * 100
    : 0;

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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Modo estático: mostra todas as imagens */}
        {!isPlaying && (
          <ScrollView contentContainerStyle={styles.staticBoardContainer} showsVerticalScrollIndicator={false}>
            {imageItems.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="dashboard" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Seu Vision Board está vazio
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
                  Adicione imagens para visualizar.
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
        )}

        {/* Modo animação: uma imagem por vez */}
        {isPlaying && imageItems.length > 0 && (
          <View style={styles.visualizationContainer}>
            <Animated.View style={[styles.animatedImageContainer, getAnimatedStyle()]}>
              {imageItems[currentImageIndex]?.uri ? (
                <Image
                  source={{ uri: imageItems[currentImageIndex].uri }}
                  style={styles.fullImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={0}
                  blurRadius={0}
                />
              ) : (
                <View style={[styles.placeholderContainer, { backgroundColor: colors.surface + '60' }]}>
                  <MaterialIcons name="broken-image" size={64} color={colors.textMuted} />
                  <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                    Imagem não disponível
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Controles de reprodução */}
            <View style={styles.playbackControls}>
              {duration !== -1 && (
                <View style={[styles.timerContainer, { backgroundColor: colors.surface + 'CC' }]}>
                  <MaterialIcons name="timer" size={20} color={colors.primary} />
                  <Text style={[styles.timerText, { color: colors.text }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                </View>
              )}

              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {currentImageIndex + 1} / {imageItems.length}
                </Text>
              </View>

              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.surface + 'CC' }]}
                  onPress={handlePause}
                >
                  <MaterialIcons name={isPaused ? "play-arrow" : "pause"} size={28} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.error + 'CC' }]}
                  onPress={handleStop}
                >
                  <MaterialIcons name="stop" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Controles de configuração (sempre visíveis) */}
        <View style={[styles.controlsPanel, { backgroundColor: colors.surface + 'E0' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.controlsScroll}>
            <View style={styles.controlsRow}>
              {/* Animação */}
              <View style={styles.controlGroup}>
                <Text style={[styles.controlLabel, { color: colors.text }]}>Animação</Text>
                <View style={styles.optionsRow}>
                  {animationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.type}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selectedAnimation === option.type ? colors.primary + '30' : colors.surface,
                          borderColor: selectedAnimation === option.type ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedAnimation(option.type)}
                    >
                      <Text style={[styles.optionChipText, { color: selectedAnimation === option.type ? colors.primary : colors.textSecondary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duração */}
              <View style={styles.controlGroup}>
                <Text style={[styles.controlLabel, { color: colors.text }]}>Duração</Text>
                <View style={styles.optionsRow}>
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: duration === option.value ? colors.accent + '30' : colors.surface,
                          borderColor: duration === option.value ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setDuration(option.value)}
                    >
                      <Text style={[styles.optionChipText, { color: duration === option.value ? colors.accent : colors.textSecondary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Velocidade */}
              <View style={styles.controlGroup}>
                <Text style={[styles.controlLabel, { color: colors.text }]}>Velocidade</Text>
                <View style={styles.optionsRow}>
                  {speedOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: speed === option.value ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setSpeed(option.value)}
                    >
                      <Text style={[styles.optionChipText, { color: speed === option.value ? 'white' : colors.textSecondary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={handleStart}
            disabled={imageItems.length === 0}
          >
            <MaterialIcons name="play-arrow" size={24} color="white" />
            <Text style={styles.playButtonText}>Iniciar Visualização</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  staticBoardContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 220, // espaço para o painel de controles
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  staticImage: {
    width: '100%',
    height: '100%',
  },
  visualizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  playbackControls: {
    position: 'absolute',
    bottom: 180,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlsScroll: {
    marginBottom: Spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  controlGroup: {
    minWidth: 200,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  optionChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
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