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
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useVisionBoardItems, BoardElement } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnimationType = 'fade' | 'slide' | 'zoom' | 'rotate' | 'wave' | 'pulse' | 'flip' | 'random';
type DurationType = 30 | 60 | 300 | -1; // -1 para sem parar

export default function VisionBoardViewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { items, loading } = useVisionBoardItems(cocreationId || '');

  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('fade');
  const [duration, setDuration] = useState<DurationType>(60);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const animationValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrar apenas imagens
  const imageItems = items.filter(item => item.type === 'image') as any[];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (imageTimerRef.current) clearInterval(imageTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && imageItems.length > 0) {
      startAnimation();
      startTimer();
      startImageRotation();
    } else {
      stopAnimation();
      if (timerRef.current) clearInterval(timerRef.current);
      if (imageTimerRef.current) clearInterval(imageTimerRef.current);
    }
  }, [isPlaying, selectedAnimation, currentImageIndex]);

  const startTimer = () => {
    if (duration === -1) return; // Sem parar
    
    setTimeRemaining(duration);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startImageRotation = () => {
    if (imageTimerRef.current) clearInterval(imageTimerRef.current);
    
    // Mudar imagem a cada 5 segundos
    imageTimerRef.current = setInterval(() => {
      setCurrentImageIndex(prev => {
        const next = (prev + 1) % imageItems.length;
        return next;
      });
    }, 5000);
  };

  const getRandomAnimation = (): AnimationType => {
    const animations: AnimationType[] = ['fade', 'slide', 'zoom', 'rotate', 'wave', 'pulse', 'flip'];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  const startAnimation = () => {
    animationValue.setValue(0);
    
    const currentAnim = selectedAnimation === 'random' 
      ? getRandomAnimation() 
      : selectedAnimation;

    const animations: { [key in Exclude<AnimationType, 'random'>]: Animated.CompositeAnimation } = {
      fade: Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      slide: Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ),
      zoom: Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      rotate: Animated.loop(
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ),
      wave: Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
      pulse: Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
      flip: Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    };

    animations[currentAnim].start();
  };

  const stopAnimation = () => {
    animationValue.stopAnimation();
    animationValue.setValue(0);
  };

  const handleStart = () => {
    if (imageItems.length === 0) {
      setModalVisible(true);
      return;
    }
    setIsPlaying(true);
    setShowSettings(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setShowSettings(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (imageTimerRef.current) clearInterval(imageTimerRef.current);
  };

  const getAnimatedStyle = () => {
    const currentAnim = selectedAnimation === 'random' 
      ? getRandomAnimation() 
      : selectedAnimation;

    const styles: { [key in Exclude<AnimationType, 'random'>]: any } = {
      fade: {
        opacity: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        }),
      },
      slide: {
        transform: [{
          translateX: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
          }),
        }],
      },
      zoom: {
        transform: [{
          scale: animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.3, 1],
          }),
        }],
      },
      rotate: {
        transform: [{
          rotate: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        }],
      },
      wave: {
        transform: [
          {
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20],
            }),
          },
          {
            scale: animationValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.05, 1],
            }),
          },
        ],
      },
      pulse: {
        transform: [{
          scale: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          }),
        }],
        opacity: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }),
      },
      flip: {
        transform: [{
          rotateY: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        }],
      },
    };

    return styles[currentAnim];
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
    { type: 'rotate', icon: 'rotate-right', label: 'Rotação' },
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

          {isPlaying && (
            <TouchableOpacity 
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              onPress={handleStop}
            >
              <MaterialIcons name="stop" size={20} color="white" />
              <Text style={styles.stopButtonText}>Parar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Panel */}
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

              {/* Animation Selection */}
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

              {/* Duration Selection */}
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

              {/* Start Button */}
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={handleStart}
              >
                <MaterialIcons name="play-arrow" size={24} color="white" />
                <Text style={styles.startButtonText}>Iniciar Visualização</Text>
              </TouchableOpacity>
            </SacredCard>

            {/* Info */}
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

        {/* Visualization Display */}
        {isPlaying && imageItems.length > 0 && (
          <View style={styles.visualizationContainer}>
            {/* Timer Display */}
            {duration !== -1 && (
              <View style={[styles.timerContainer, { backgroundColor: colors.surface + '90' }]}>
                <MaterialIcons name="timer" size={20} color={colors.primary} />
                <Text style={[styles.timerText, { color: colors.text }]}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            )}

            {/* Animated Image */}
            <Animated.View style={[styles.imageContainer, getAnimatedStyle()]}>
              <Image
                source={{ uri: imageItems[currentImageIndex].uri }}
                style={styles.fullImage}
                contentFit="contain"
              />
            </Animated.View>

            {/* Progress Indicator */}
            <View style={[styles.progressContainer, { backgroundColor: colors.surface + '90' }]}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {currentImageIndex + 1} / {imageItems.length}
              </Text>
            </View>
          </View>
        )}

        {/* Modal */}
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
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  timerContainer: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
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
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  progressContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
