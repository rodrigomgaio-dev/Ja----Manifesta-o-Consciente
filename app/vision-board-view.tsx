import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet, // <-- Importação adicional necessária
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
import { BlurView } from 'expo-blur';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useVisionBoardItems, BoardElement } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnimationType = 'fade' | 'slide' | 'zoom' | 'blur' | 'wave' | 'pulse' | 'flip' | 'random';
type DurationType = 30 | 60 | 300 | -1; // -1 para sem parar
type SpeedType = 0.5 | 1 | 1.5 | 2; // Multiplicadores de velocidade

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

  // Usar apenas um Animated.Value para controlar toda a sequência
  const sequenceAnimationValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentAnimationType = useRef<Exclude<AnimationType, 'random'>>('fade');

  // Filtrar apenas imagens e garantir que têm URI válida
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

  // Função para iniciar o ciclo completo de transição + efeito
  const startAnimationCycle = () => {
    // Garantir que o valor da animação esteja em 0 no início
    sequenceAnimationValue.setValue(0);

    const currentAnim = selectedAnimation === 'random' 
      ? getRandomAnimation() 
      : selectedAnimation;

    currentAnimationType.current = currentAnim;

    // Calcular a duração base para cada etapa da sequência
    const baseFadeDuration = 500; // Duração base do fade (ms)
    const baseEffectDuration = 3000; // Duração base do efeito específico (ms)
    const basePauseDuration = 500; // Pausa após o fade in antes do efeito (ms)

    // Aplicar fator de velocidade a cada etapa
    const fadeDuration = baseFadeDuration / speed;
    const effectDuration = baseEffectDuration / speed;
    const pauseDuration = basePauseDuration / speed;

    // Definir os ranges de interpolação para a sequência completa
    // Fade Out (0 -> 0.2), Pausa Invisível (0.2 -> 0.22), Fade In (0.22 -> 0.42), Pausa Visível (0.42 -> 0.45), Efeito (0.45 -> 1)
    const inputRange = [0, 0.2, 0.22, 0.42, 0.45, 1];
    
    // Definir a sequência de animações
    let sequence: Animated.CompositeAnimation;

    switch (currentAnim) {
      case 'fade':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2, // 20% da pausa total
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8, // 80% da pausa total
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'slide':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'zoom':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'blur':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true, // Usar false se blurRadius for manipulado via interpolação
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true, // Usar false se blurRadius for manipulado via interpolação
          }),
        ]);
        break;
      case 'wave':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'pulse':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
        break;
      case 'flip':
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
        break;
      default:
        // Caso padrão, mesmo que 'fade'
        sequence = Animated.sequence([
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.2, // Fade Out completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.22, // Pausa invisível
            duration: pauseDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.42, // Fade In completo
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 0.45, // Pausa visível
            duration: pauseDuration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(sequenceAnimationValue, {
            toValue: 1, // Efeito completo
            duration: effectDuration,
            useNativeDriver: true,
          }),
        ]);
    }

    // Armazenar a animação em andamento
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = sequence;

    // Iniciar a animação
    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused) {
        // A sequência completa terminou, mudar para a próxima imagem
        setCurrentImageIndex(prev => (prev + 1) % imageItems.length);
        // O useEffect detectará a mudança em currentImageIndex e chamará startAnimationCycle novamente
      }
    });
  };

  // Função para obter o estilo animado baseado no sequenceAnimationValue
  const getAnimatedStyle = () => {
    const currentAnim = currentAnimationType.current;

    // Definir os ranges de interpolação com base na sequência acima
    // Fade Out (0 -> 0.2), Pausa Invisível (0.2 -> 0.22), Fade In (0.22 -> 0.42), Pausa Visível (0.42 -> 0.45), Efeito (0.45 -> 1)
    const inputRange = [0, 0.2, 0.22, 0.42, 0.45, 1];

    // Opacidade: 1 -> 0 (fade out) -> 0 (pausa invisível) -> 1 (fade in) -> 1 (pausa visível) -> 1 (efeito)
    const opacity = sequenceAnimationValue.interpolate({
      inputRange: inputRange,
      outputRange: [1, 0, 0, 1, 1, 1], // Mantém opacidade 1 após fade in
    });

    const styles: { [key in Exclude<AnimationType, 'random'>]: any } = {
      fade: {
        opacity: sequenceAnimationValue.interpolate({
          inputRange: inputRange,
          outputRange: [1, 0, 0, 1, 1, 0.4], // Exemplo: fade out, fade in, efeito de fade parcial
        }),
      },
      slide: {
        opacity: opacity, // Usar a opacidade calculada acima
        transform: [
          {
            translateX: sequenceAnimationValue.interpolate({
              inputRange: inputRange,
              outputRange: [0, -SCREEN_WIDTH * 0.8, -SCREEN_WIDTH * 0.8, 0, 0, SCREEN_WIDTH * 0.8], // Exemplo: entra da direita, sai para a direita
            }),
          },
        ],
      },
      zoom: {
        opacity: opacity, // Usar a opacidade calculada acima
        transform: [
          {
            scale: sequenceAnimationValue.interpolate({
              inputRange: inputRange,
              outputRange: [1, 0.3, 0.3, 1, 1, 1.8], // Exemplo: entra pequena, cresce, depois efeito de zoom extra
            }),
          },
        ],
      },
      blur: {
        opacity: opacity, // Usar a opacidade calculada acima
        // Blur será aplicado via blurRadius na Image, não via estilo diretamente
      },
      wave: {
        opacity: opacity, // Usar a opacidade calculada acima
        transform: [
          {
            translateY: sequenceAnimationValue.interpolate({
              inputRange: inputRange,
              outputRange: [0, 0, 0, 0, 0, -100], // Exemplo: efeito de onda no final
            }),
          },
          {
            scale: sequenceAnimationValue.interpolate({
              inputRange: inputRange,
              outputRange: [1, 1, 1, 1, 1, 1.15], // Exemplo: efeito de onda no final
            }),
          },
        ],
      },
      pulse: {
        opacity: opacity, // Usar a opacidade calculada acima
        transform: [
          {
            scale: sequenceAnimationValue.interpolate({
              inputRange: inputRange,
              outputRange: [1, 1, 1, 1, 1, 1.2], // Exemplo: efeito de pulso no final
            }),
          },
        ],
      },
      flip: {
        opacity: opacity, // Usar a opacidade calculada acima
        transform: [
          {
            rotateY: sequenceAnimationValue.interpolate({
              inputRange: inputRange,
              outputRange: ['0deg', '0deg', '0deg', '0deg', '0deg', '360deg'], // Exemplo: efeito de flip no final
            }),
          },
        ],
      },
    };

    return styles[currentAnim];
  };

  // Função para obter a quantidade de blur com base no sequenceAnimationValue e na velocidade
  const getBlurAmount = () => {
    if (currentAnimationType.current !== 'blur') return 0;

    const value = sequenceAnimationValue.__getValue();
    // Supondo que o efeito de blur ocorra na parte final da sequência (0.45 -> 1)
    if (value < 0.45) return 0; // Sem blur durante fade out/in e pausas

    // Normalizar o valor para a parte específica do blur (0.45 -> 1)
    const normalizedValue = (value - 0.45) / (1 - 0.45); // Vai de 0 a 1

    // Aplicar a interpolação para o efeito de blur
    // 0 (no início do efeito) -> 10 (máximo) -> 0 (no final do efeito)
    if (normalizedValue <= 0.5) {
      return 10 - (normalizedValue * 2 * 10); // De 10 para 0 (metade do efeito)
    } else {
      return (normalizedValue - 0.5) * 2 * 10; // De 0 para 10 (metade do efeito)
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
    sequenceAnimationValue.setValue(0); // Resetar o valor da animação principal
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
            {/* Timer and Speed Controls */}
            <View style={styles.topControls}>
              {duration !== -1 && (
                <View style={[styles.timerContainer, { backgroundColor: colors.surface + 'CC' }]}>
                  <MaterialIcons name="timer" size={20} color={colors.primary} />
                  <Text style={[styles.timerText, { color: colors.text }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                </View>
              )}

              {/* Speed Control */}
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

            {/* Animated Image */}
            {/* Remover o fadeValue do estilo e aplicar opacidade via getAnimatedStyle */}
            <Animated.View 
              style={[
                styles.imageContainer, 
                getAnimatedStyle(),
                // { opacity: fadeValue } // <-- REMOVIDO
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

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
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

              {/* Progress Text */}
              <View style={[styles.progressContainer, { backgroundColor: colors.surface + 'CC' }]}>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {currentImageIndex + 1} / {imageItems.length}
                </Text>
              </View>

              {/* Control Buttons */}
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