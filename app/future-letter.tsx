import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFutureLetter } from '@/hooks/useFutureLetter';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import SacredModal from '@/components/ui/SacredModal';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

export default function FutureLetterScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { createFutureLetter, loading } = useFutureLetter();
  const { updateCocriation } = useIndividualCocriations();

  const [letterData, setLetterData] = useState({
    title: '',
    content: `Querido eu do futuro,

Hoje estou plantando as sementes deste sonho no campo infinito das possibilidades. Sinto a emoção de saber que você já vive esta realidade que hoje crio com tanto amor.

Quando ler esta carta, saberá que cada momento de presença, cada respiração consciente e cada visualização foram sementes que floresceram na manifestação perfeita.

Obrigado(a) por ser a prova viva de que nossos sonhos se tornam realidade quando os criamos com o coração.

Já é!

Com amor e gratidão,
Eu do presente`,
  });

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });

  // Animation values
  const letterScale = useRef(new Animated.Value(1)).current;
  const letterOpacity = useRef(new Animated.Value(1)).current;
  const letterTranslateY = useRef(new Animated.Value(0)).current;
  const letterRotate = useRef(new Animated.Value(0)).current;

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: any[]
  ) => {
    setModalConfig({ title, message, type, buttons });
    setModalVisible(true);
  };

  const handleSaveLetter = async () => {
    if (!user) {
      showModal('Erro de Autenticação', 'Você precisa estar logado.', 'error');
      return;
    }

    if (!cocreationId) {
      showModal('Erro', 'ID da cocriação não encontrado.', 'error');
      return;
    }

    if (!letterData.content.trim()) {
      showModal('Erro', 'Por favor, escreva sua carta para o futuro.', 'error');
      return;
    }

    try {
      const result = await createFutureLetter({
        individual_cocreation_id: cocreationId,
        title: letterData.title.trim() || undefined,
        content: letterData.content.trim(),
      });

      if (result.error) {
        console.error('Error creating future letter:', result.error);
        showModal('Erro', 'Não foi possível salvar sua carta. Tente novamente.', 'error');
      } else {
        console.log('Future letter created successfully!');
        
        // Marcar carta como completa
        await updateCocriation(cocreationId, { 
          future_letter_completed: true 
        });
        
        setShowAnimation(true);
        startLetterAnimation();
      }
    } catch (error) {
      console.error('Unexpected error saving letter:', error);
      showModal('Erro Inesperado', 'Algo deu errado. Tente novamente.', 'error');
    }
  };

  const startLetterAnimation = () => {
    Animated.sequence([
      // Scale up slightly
      Animated.timing(letterScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Parallel animations: move up, rotate, and fade out
      Animated.parallel([
        Animated.timing(letterTranslateY, {
          toValue: -height,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(letterRotate, {
          toValue: 360,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(letterOpacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(letterScale, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setAnimationComplete(true);
      // Navigate to vision board after animation
      setTimeout(() => {
        router.replace(`/vision-board?cocreationId=${cocreationId}`);
      }, 500);
    });
  };

  const handleSkip = async () => {
    if (!cocreationId) return;
    
    // Marcar carta como completa ao pular
    await updateCocriation(cocreationId, { 
      future_letter_completed: true 
    });
    
    router.replace(`/vision-board?cocreationId=${cocreationId}`);
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
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
              Você precisa estar logado para criar uma carta ao futuro.
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  const letterAnimatedStyle = {
    transform: [
      { scale: letterScale },
      { translateY: letterTranslateY },
      { 
        rotate: letterRotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }) 
      },
    ],
    opacity: letterOpacity,
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Carta ao Futuro
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Escreva para o você que já conquistou este sonho
            </Text>
          </View>

          {/* Letter Card */}
          <Animated.View style={[styles.letterContainer, letterAnimatedStyle]}>
            <SacredCard glowing={showAnimation} style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <MaterialIcons 
                  name="mail" 
                  size={32} 
                  color={colors.primary} 
                />
                <Text style={[styles.letterTitle, { color: colors.text }]}>
                  Sua Mensagem para o Futuro
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Título (Opcional)
                </Text>
                <TextInput
                  style={[
                    styles.titleInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  value={letterData.title}
                  onChangeText={(value) => setLetterData(prev => ({ ...prev, title: value }))}
                  placeholder="Título da sua carta..."
                  placeholderTextColor={colors.textMuted}
                  maxLength={100}
                  editable={!showAnimation}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Sua Carta
                </Text>
                <TextInput
                  style={[
                    styles.contentInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  value={letterData.content}
                  onChangeText={(value) => setLetterData(prev => ({ ...prev, content: value }))}
                  placeholder="Escreva sua carta para o futuro..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={12}
                  textAlignVertical="top"
                  maxLength={2000}
                  editable={!showAnimation}
                />
              </View>

              {showAnimation && !animationComplete && (
                <View style={styles.animationOverlay}>
                  <MaterialIcons 
                    name="send" 
                    size={48} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.animationText, { color: colors.text }]}>
                    Enviando para o futuro...
                  </Text>
                </View>
              )}
            </SacredCard>
          </Animated.View>

          {/* Actions */}
          {!showAnimation && (
            <View style={styles.actions}>
              <SacredButton
                title="Não enviar Carta"
                onPress={handleSkip}
                variant="outline"
                style={styles.skipButton}
              />
              <SacredButton
                title="Enviar para o Futuro"
                onPress={handleSaveLetter}
                loading={loading}
                style={styles.saveButton}
              />
            </View>
          )}

          {/* Info */}
          <SacredCard style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              ✨ Sua carta será enviada para o futuro
            </Text>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              Esta carta ficará selada até você concluir sua cocriação. 
              No momento da conclusão, ela será revelada como uma celebração 
              da sua jornada de manifestação.
            </Text>
          </SacredCard>
        </View>
      </KeyboardAvoidingView>
      
      {/* Modal */}
      <SacredModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        buttons={modalConfig.buttons}
        onClose={() => setModalVisible(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  letterContainer: {
    marginBottom: Spacing.lg,
  },
  letterCard: {
    position: 'relative',
  },
  letterHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  letterTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  titleInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  contentInput: {
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 300,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 24,
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  animationText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  infoCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});