// app/vision-board-view.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnimationType = 'fade' | 'slide' | 'zoom' | 'rotate' | 'wave' | 'pulse' | 'flip' | 'random';
type DurationType = 30 | 60 | 300 | -1; // -1 para sem parar

export default function VisionBoardViewScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  
  const { items, loading, addItem, updateItem, deleteItem, refresh } = useVisionBoardItems(cocreationId || '');

  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('fade');
  const [duration, setDuration] = useState<DurationType>(60);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  // Valores animados
  const animationValue = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).rotate = useRef(new Animated.Value(0)).current;

  // Refs para timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrar apenas imagens
  const imageItems = items.filter(item => item.type === 'image' && item.content);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (imageTimerRef.current) clearInterval(imageTimerRef.current);
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  // Controlar reprodução
  useEffect(() => {
    if (isPlaying && imageItems.length > 0) {
      startVisualization();
    } else {
      stopVisualization();
    }
    
    return () => {
      stopVisualization();
    };
  }, [isPlaying, imageItems.length]);

  // Iniciar visualização
  const startVisualization = () => {
    if (duration !== -1) {
      setTimeRemaining(duration);
      startTimer();
    }
    startImageRotation();
  };

  // Parar visualização
  const stopVisualization = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (imageTimerRef.current) clearInterval(imageTimerRef.current);
    if (animationRef.current) clearTimeout(animationRef.current);
    
    // Resetar animações
    opacity.setValue(1);
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    rotate.setValue(0);
    animationValue.setValue(0);
  };

  // Iniciar timer de duração
  const startTimer = () => {
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

  // Iniciar rotação de imagens
  const startImageRotation = () => {
    if (imageTimerRef.current) clearInterval(imageTimerRef.current);
    
    // Iniciar com a primeira imagem
    if (imageItems.length > 0) {
      setCurrentImageIndex(0);
      animateTransition(0);
    }
    
    // Mudar imagem após o tempo de animação
    const animationDuration = getAnimationDuration();
    imageTimerRef.current = setInterval(() => {
      setCurrentImageIndex(prev => {
        const next = (prev + 1) % imageItems.length;
        animateTransition(next);
        return next;
      });
    }, animationDuration + 2000); // 2 segundos entre animações
  };

  // Obter duração da animação
  const getAnimationDuration = () => {
    switch (selectedAnimation) {
      case 'fade': return 4000;
      case 'slide': return 4000;
      case 'zoom': return 4000;
      case 'rotate': return 4000;
      case 'wave': return 3000;
      case 'pulse': return 1600;
      case 'flip': return 4000;
      default: return 4000;
    }
  };

  // Animar transição entre imagens
  const animateTransition = (nextIndex: number) => {
    // Resetar valores
    opacity.setValue(1);
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    rotate.setValue(0);
    
    const currentAnim = selectedAnimation === 'random' 
      ? getRandomAnimation() 
      : selectedAnimation;
    
    const duration = getAnimationDuration();
    
    // Executar animação apropriada
    switch (currentAnim) {
      case 'fade':
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 'slide':
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 'zoom':
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 'rotate':
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 360,
            duration: duration,
            useNativeDriver: true,
          })
        ).start();
        break;
        
      case 'wave':
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -20,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration / 4,
            useNativeDriver: true,
          }),
        ]).start();
        break;
        
      case 'pulse':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;
        
      case 'flip':
        Animated.sequence([
          Animated.timing(rotate, {
            toValue: 180,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 360,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  };

  // Obter animação aleatória
  const getRandomAnimation = (): AnimationType => {
    const animations: AnimationType[] = ['fade', 'slide', 'zoom', 'rotate', 'wave', 'pulse', 'flip'];
    return animations[Math.floor(Math.random() * animations.length)];
  };

  // Estilo animado da imagem
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  // Manipuladores de eventos
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
    stopVisualization();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Acesso Negado
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="hourglass-empty" size={48} color={colors.textMuted} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando sua manifestação...
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
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: colors.surface + '80' }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Vision Board
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Contemple suas manifestações
            </Text>
          </View>

          {isPlaying && (
            <TouchableOpacity 
              onPress={handleStop}
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              activeOpacity={0.8}
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
            contentContainerStyle={styles.settingsContent}
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
                  {[
                    { type: 'fade', icon: 'opacity', label: 'Fade' },
                    { type: 'slide', icon: 'swap-horiz', label: 'Deslizar' },
                    { type: 'zoom', icon: 'zoom-in', label: 'Zoom' },
                    { type: 'rotate', icon: 'rotate-right', label: 'Rotação' },
                    { type: 'wave', icon: 'waves', label: 'Onda' },
                    { type: 'pulse', icon: 'favorite', label: 'Pulsar' },
                    { type: 'flip', icon: 'flip', label: 'Virar' },
                    { type: 'random', icon: 'shuffle', label: 'Aleatório' },
                  ].map((option) => (
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
                      onPress={() => setSelectedAnimation(option.type as AnimationType)}
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
                  {[
                    { value: 30, label: '30 segundos' },
                    { value: 60, label: '1 minuto' },
                    { value: 300, label: '5 minutos' },
                    { value: -1, label: 'Sem parar' },
                  ].map((option) => (
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
                      onPress={() => setDuration(option.value as DurationType)}
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
              <SacredButton
                title="Iniciar Visualização"
                onPress={handleStart}
                style={styles.startButton}
                disabled={imageItems.length === 0}
              />
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
            <Animated.View 
              style={[
                styles.imageContainer, 
                animatedImageStyle
              ]}
            >
              <Image 
                source={{ uri: imageItems[currentImageIndex]?.content }} 
                style={styles.image}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={300}
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

        {/* Empty State */}
        {!isPlaying && imageItems.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyStateContent, { backgroundColor: colors.surface + '80' }]}>
              <MaterialIcons name="visibility" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Vision Board Vazio
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Não há imagens para visualizar ainda.{'\n'}
                Adicione elementos ao seu Vision Board primeiro.
              </Text>
            </View>
          </View>
        )}

        {/* Inspiration Text */}
        {imageItems.length > 0 && (
          <View style={styles.inspirationContainer}>
            <Text style={[styles.inspirationText, { color: colors.textMuted }]}>
              ✨ Observe. Sinta. Manifeste conscientemente. ✨
            </Text>
          </View>
        )}

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="info" size={48} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Vision Board Vazio
              </Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Adicione imagens ao seu Vision Board antes de iniciar a visualização.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 1000,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: 'italic',
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
  
  // Settings
  settingsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  settingsContent: {
    paddingBottom: Spacing.xl,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  settingsDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4,
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
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    marginTop: Spacing.lg,
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
  
  // Visualization
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
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
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
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateContent: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Inspiration
  inspirationContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  inspirationText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});