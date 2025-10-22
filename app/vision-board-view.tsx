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
import { useVisionBoardItems, BoardElement } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnimationType = 'fade' | 'slide' | 'zoom' | 'blur' | 'wave' | 'pulse' | 'flip' | 'random';
type DurationType = 30 | 60 | 300 | -1;
type SpeedType = 0.5 | 1 | 1.5 | 2;

export default function VisionBoardViewScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { items, loading } = useVisionBoardItems(cocreationId || '');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
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
    const animations: Exclude<AnimationType, 'random'>[] = ['fade', 'slide', 'zoom', 'blur', 'wave', 'pulse', 'flip'];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  const startAnimationCycle = () => {
    sequenceAnimationValue.setValue(0);

    const currentAnim = selectedAnimation === 'random' 
      ? getRandomAnimation() 
      : selectedAnimation;

    currentAnimationType.current = currentAnim;

    // Timings ajustados para transição mais suave do blur
    const baseFadeInDuration = 1500;  // Aumentado para transição mais suave
    const baseEffectDuration = 3000;   // Aumentado para mais tempo na imagem nítida
    const baseFadeOutDuration = 1500;  // Aumentado para transição mais suave
    const basePauseDuration = 100;     // Pequena pausa antes da próxima imagem

    const fadeInDuration = baseFadeInDuration / speed;
    const effectDuration = baseEffectDuration / speed;
    const fadeOutDuration = baseFadeOutDuration / speed;
    const pauseDuration = basePauseDuration / speed;

    const sequence = Animated.sequence([
      Animated.timing(sequenceAnimationValue, {
        toValue: 0.25,  // Fase de fade in mais longa
        duration: fadeInDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sequenceAnimationValue, {
        toValue: 0.75,  // Mantém a imagem nítida
        duration: effectDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sequenceAnimationValue, {
        toValue: 1.0,   // Fase de fade out
        duration: fadeOutDuration,
        useNativeDriver: true,
      }),
      Animated.timing(sequenceAnimationValue, {
        toValue: 1.0,
        duration: pauseDuration,
        useNativeDriver: true,
      }),
    ]);

    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = sequence;

    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused) {
        const nextIndex = (currentImageIndex + 1) % imageItems.length;
        setCurrentImageIndex(nextIndex);
        // Force restart animation even for single image
        if (imageItems.length === 1) {
          setTimeout(() => {
            if (isPlaying && !isPaused) {
              startAnimationCycle();
            }
          }, 10);
        }
      }
    });
  };

  const getAnimatedStyle = () => {
    const currentAnim = currentAnimationType.current;
    const inputRange = [0, 0.25, 0.75, 1.0];

    const opacity = sequenceAnimationValue.interpolate({
      inputRange: inputRange,
      outputRange: [1, 1, 1, 1],  // Mantém opacidade constante, blur faz o efeito
    });

    if (currentAnim === 'slide') {
      const isEvenIndex = currentImageIndex % 2 === 0;
      const startX = isEvenIndex ? -SCREEN_WIDTH : SCREEN_WIDTH;
      const endX = isEvenIndex ? SCREEN_WIDTH : -SCREEN_WIDTH;

      return {
        opacity: opacity,
        transform: [
          {
            translateX: sequenceAnimationValue.interpolate({
              inputRange: [0, 0.25, 0.75, 1.0],
              outputRange: [startX, 0, 0, endX],
            }),
          },
        ],
      };
    }

    if (currentAnim === 'flip') {
      const flipInputRange = [0, 0.25, 0.5, 0.75, 1.0];
      const flipOutputRange = ['0deg', '0deg', '180deg', '0deg', '0deg'];
      return {
        opacity: opacity,
        transform: [
          {
            rotateY: sequenceAnimationValue.interpolate({
              inputRange: flipInputRange,
              outputRange: flipOutputRange,
            }),
          },
        ],
      };
    }

    if (currentAnim === 'blur') {
      return {
        opacity: opacity,
      };
    }

    if (currentAnim === 'zoom') {
      const zoomInputRange = [0, 0.25, 0.5, 0.75, 1.0];
      const zoomOutputRange = [0.2, 1.0, 2.0, 1.0, 0.2];

      return {
        opacity: opacity,
        transform: [
          {
            scale: sequenceAnimationValue.interpolate({
              inputRange: zoomInputRange,
              outputRange: zoomOutputRange,
            }),
          },
        ],
      };
    }

    if (currentAnim === 'wave') {
      const waveInputRange = [0, 0.25, 0.4, 0.6, 0.75, 1.0];
      const waveOutputRange = [0, 0, -100, 100, 0, 0];

      return {
        opacity: opacity,
        transform: [
          {
            translateY: sequenceAnimationValue.interpolate({
              inputRange: waveInputRange,
              outputRange: waveOutputRange,
            }),
          },
        ],
      };
    }

    if (currentAnim === 'pulse') {
      const pulseInputRange = [
        0.0,   // início (fade in ainda não começou)
        0.1,   // imagem aparece no tamanho normal
        0.18,  // 1º pulso rápido (expande)
        0.22,  // 1º retorno rápido (contrai)
        0.32,  // 2º pulso rápido (expande)
        0.36,  // 2º retorno rápido (contrai)
        0.52,  // retorno lento até o normal
        0.60,  // 3º pulso rápido
        0.64,  // 3º retorno rápido
        0.74,  // 4º pulso rápido
        0.78,  // 4º retorno rápido
        0.94,  // retorno lento final até o normal
        0.97,
        1.0,
      ];

      const scaleOutputRange = [
        1.0,   // invisível no início não
        1.0,   // tamanho normal (início da animação visível)
        1.12,  // expande (1º pulso)
        1.0,   // contrai rápido
        1.12,  // expande (2º pulso)
        1.0,   // contrai rápido
        1.0,   // permanece normal durante o "descanso" lento
        1.12,  // expande (3º pulso)
        1.0,   // contrai rápido
        1.12,  // expande (4º pulso)
        1.0,   // contrai rápido
        1.0,   // mantém normal até o fade out
        1.12,   // fade out
        1.0,
      ];

      const opacityOutputRange = [
        1,     // invisível não
        1,     // visível
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
      ];

      return {
        opacity: sequenceAnimationValue.interpolate({
          inputRange: pulseInputRange,
        outputRange: opacityOutputRange,
         }),
        transform: [
              {
            scale: sequenceAnimationValue.interpolate({
              inputRange: pulseInputRange,
              outputRange: scaleOutputRange,
            }),
          },
        ],
      };
    }

    return {
      opacity: opacity,
    };
  };

  const getBlurAmount = () => {
    if (currentAnimationType.current !== 'blur') return 0;

    const value = sequenceAnimationValue.__getValue();
    
    // value vai de 0 → 0.25 → 0.75 → 1.0
    // Blur: Começa em 20 (totalmente blur), vai para 0 (nítida), volta para 20 (totalmente blur)
    
    if (value <= 0.25) {
      // Fase 1: De totalmente blur (20) para nítida (0)
      // value 0 → 0.25 = blur 20 → 0
      const progress = value / 0.25;  // 0 a 1
      return 20 - (progress * 20);    // 20 a 0
    } else if (value <= 0.75) {
      // Fase 2: Mantém nítida
      return 0;
    } else {
      // Fase 3: De nítida (0) para totalmente blur (20)
      // value 0.75 → 1.0 = blur 0 → 20
      const progress = (value - 0.75) / 0.25;  // 0 a 1
      return progress * 20;                     // 0 a 20
    }
  };

  const handleStart = () => {
    if (imageItems.length === 0) {
      setModalVisible(true);
      return;
    }
    setIsPlaying(true);
    setIsPaused(false);
    setShowSettings(false);
    setTimeRemaining(duration === -1 ? 0 : duration);
    setTotalElapsed(0);
    setCurrentImageIndex(0);
    sequenceAnimationValue.setValue(0);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused && animationRef.current) {
      animationRef.current.stop();
    } else {
      startAnimationCycle();
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setShowSettings(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) animationRef.current.stop();
    sequenceAnimationValue.setValue(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animationOptions: { type: AnimationType; icon: string; label: string }[] = [
    { type: 'fade', icon: 'opacity', label: 'Fade' },
    { type: 'slide', icon: 'swap-horiz', label: 'Deslizar' },
    { type: 'zoom', icon: 'zoom-in', label: 'Zoom' },
    { type: 'blur', icon: 'blur-on', label: 'Blur' },
    { type: 'wave', icon: 'waves', label: 'Onda' },
    { type: 'pulse', icon: 'favorite', label: 'Pulsar' },
    { type: 'flip', icon: 'flip', label: 'Virar' },
    { type: 'random', icon: 'shuffle', label: 'Aleatório' },
  ];

  const durationOptions: { value: DurationType; label: string }[] = [
    { value: 30, label: '30 segundos' },
    { value: 60, label: '1 minuto' },
    { value: 300, label: '5 minutos' },
    { value: -1, label: 'Sem parar' },
  ];

  const speedOptions: { value: SpeedType; label: string }[] = [
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

        {showSettings && (
          <ScrollView 
            style={styles.settingsContainer}
            showsVerticalScrollIndicator={false}
          >
            <SacredCard style={styles.settingsCard}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>
                Visualização do Vision Board
              </Text>
              <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>
                Escolha uma animação e duração para meditar com suas imagens
              </Text>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Tipo de Animação
                </Text>
                <View style={styles.optionsGrid}>
                  {animationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.type}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: selectedAnimation === option.type
                            ? colors.primary + '30'
                            : colors.surface,
                          borderColor: selectedAnimation === option.type
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedAnimation(option.type)}
                    >
                      <MaterialIcons
                        name={option.icon as any}
                        size={24}
                        color={selectedAnimation === option.type ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: selectedAnimation === option.type
                              ? colors.primary
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Duração
                </Text>
                <View style={styles.durationOptions}>
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.durationButton,
                        {
                          backgroundColor: duration === option.value
                            ? colors.accent + '30'
                            : colors.surface,
                          borderColor: duration === option.value
                            ? colors.accent
                            : colors.border,
                        },
                      ]}
                      onPress={() => setDuration(option.value)}
                    >
                      <Text
                        style={[
                          styles.durationLabel,
                          {
                            color: duration === option.value
                              ? colors.accent
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={handleStart}
              >
                <MaterialIcons name="play-arrow" size={24} color="white" />
                <Text style={styles.startButtonText}>Iniciar Visualização</Text>
              </TouchableOpacity>
            </SacredCard>

            <SacredCard style={styles.infoCard}>
              <MaterialIcons name="info-outline" size={24} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {imageItems.length === 0
                  ? 'Adicione imagens ao seu Vision Board para começar a visualização.'
                  : `${imageItems.length} ${imageItems.length === 1 ? 'imagem' : 'imagens'} encontrada${imageItems.length === 1 ? '' : 's'} no seu Vision Board.`}
              </Text>
            </SacredCard>
          </ScrollView>
        )}

        {isPlaying && imageItems.length > 0 && (
          <View style={styles.visualizationContainer}>
            <View style={styles.topControls}>
              {duration !== -1 && (
                <View style={[styles.timerContainer, { backgroundColor: colors.surface + 'CC' }]}>
                  <MaterialIcons name="timer" size={20} color={colors.primary} />
                  <Text style={[styles.timerText, { color: colors.text }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                </View>
              )}

              <View style={[styles.speedContainer, { backgroundColor: colors.surface + 'CC' }]}>
                <Text style={[styles.speedLabel, { color: colors.textSecondary }]}>
                  Velocidade:
                </Text>
                {speedOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.speedButton,
                      {
                        backgroundColor: speed === option.value
                          ? colors.primary
                          : 'transparent',
                      },
                    ]}
                    onPress={() => setSpeed(option.value)}
                  >
                    <Text
                      style={[
                        styles.speedButtonText,
                        {
                          color: speed === option.value
                            ? 'white'
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Animated.View 
              style={[
                styles.imageContainer, 
                getAnimatedStyle(),
              ]}
            >
              {imageItems[currentImageIndex]?.uri ? (
                <Image
                  source={{ uri: imageItems[currentImageIndex].uri }}
                  style={styles.fullImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={0}
                  blurRadius={currentAnimationType.current === 'blur' ? getBlurAmount() : 0}
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

            <View style={styles.bottomControls}>
              {duration !== -1 && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarBackground, { backgroundColor: colors.surface + '60' }]}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          backgroundColor: colors.primary,
                          width: `${progressPercentage}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}

              <View style={[styles.progressContainer, { backgroundColor: colors.surface + 'CC' }]}>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {currentImageIndex + 1} / {imageItems.length}
                </Text>
              </View>

              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.surface + 'CC' }]}
                  onPress={handlePause}
                >
                  <MaterialIcons 
                    name={isPaused ? "play-arrow" : "pause"} 
                    size={28} 
                    color={colors.primary} 
                  />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
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
  settingsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  settingsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - 80 - Spacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  durationOptions: {
    gap: Spacing.sm,
  },
  durationButton: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  visualizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
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
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  speedButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
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
  bottomControls: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
