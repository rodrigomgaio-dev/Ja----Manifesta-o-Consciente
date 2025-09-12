
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { ENERGY_TYPES } from '@/services/types';
import { Spacing } from '@/constants/Colors';

export default function AlignmentRitualScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { circleId, token } = useLocalSearchParams<{ circleId: string; token: string }>();

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    alignment_feeling: '',
    personal_meaning: '',
    energy_type: '',
  });
  const [loading, setLoading] = useState(false);

  const questions = [
    {
      title: 'Você sente que este desejo também é seu?',
      subtitle: 'Conecte-se com a intenção do círculo',
      field: 'alignment_feeling' as keyof typeof responses,
      type: 'text',
      placeholder: 'Compartilhe como você se sente em relação a este propósito...',
    },
    {
      title: 'O que esta cocriação significa para você?',
      subtitle: 'Expresse o significado pessoal',
      field: 'personal_meaning' as keyof typeof responses,
      type: 'text',
      placeholder: 'Descreva o que esta jornada representa em sua vida...',
    },
    {
      title: 'Que energia você traz para este círculo?',
      subtitle: 'Escolha a energia que melhor representa você',
      field: 'energy_type' as keyof typeof responses,
      type: 'select',
      options: ENERGY_TYPES,
    },
  ];

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleInputChange = (field: keyof typeof responses, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    const currentValue = responses[currentQuestion.field];

    if (!currentValue.trim()) {
      showWebAlert('Campo Obrigatório', 'Por favor, responda esta pergunta antes de continuar.');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || !circleId) {
      showWebAlert('Erro', 'Informações de usuário ou círculo não encontradas.');
      return;
    }

    setLoading(true);

    try {
      // Join the circle
      const { error: joinError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: 'member',
          alignment_feeling: responses.alignment_feeling,
          personal_meaning: responses.personal_meaning,
          energy_type: responses.energy_type,
        });

      if (joinError) {
        console.error('Error joining circle:', joinError);
        showWebAlert('Erro', 'Não foi possível entrar no círculo. Tente novamente.');
        return;
      }

      // Mark invitation as used
      if (token) {
        await supabase
          .from('circle_invitations')
          .update({
            used_by: user.id,
            used_at: new Date().toISOString(),
          })
          .eq('invite_token', token);
      }

      showWebAlert(
        'Bem-vindo ao Círculo!',
        'Você agora faz parte deste círculo sagrado de cocriação.',
        () => {
          // Navigate to circle view (we'll implement this later)
          router.push('/(tabs)/circulos');
        }
      );
    } catch (error) {
      console.error('Unexpected error completing alignment:', error);
      showWebAlert('Erro Inesperado', 'Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.scrollView, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Ritual de Alinhamento
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Conecte-se com a energia do círculo
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              {questions.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep ? colors.primary : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {currentStep + 1} de {questions.length}
            </Text>
          </View>

          {/* Question Card */}
          <SacredCard glowing style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialIcons 
                name="auto-awesome" 
                size={32} 
                color={colors.primary} 
              />
              <Text style={[styles.questionTitle, { color: colors.text }]}>
                {currentQuestion.title}
              </Text>
              <Text style={[styles.questionSubtitle, { color: colors.textSecondary }]}>
                {currentQuestion.subtitle}
              </Text>
            </View>

            {currentQuestion.type === 'text' ? (
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={responses[currentQuestion.field]}
                onChangeText={(value) => handleInputChange(currentQuestion.field, value)}
                placeholder={currentQuestion.placeholder}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
            ) : (
              <View style={styles.optionsContainer}>
                {currentQuestion.options?.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: responses[currentQuestion.field] === option 
                          ? colors.primary + '20' 
                          : colors.surface,
                        borderColor: responses[currentQuestion.field] === option 
                          ? colors.primary 
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleInputChange(currentQuestion.field, option)}
                  >
                    <MaterialIcons
                      name={responses[currentQuestion.field] === option ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={20}
                      color={responses[currentQuestion.field] === option ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: responses[currentQuestion.field] === option ? colors.primary : colors.text,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </SacredCard>

          {/* Actions */}
          <View style={styles.actions}>
            {currentStep > 0 && (
              <SacredButton
                title="Voltar"
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
            <SacredButton
              title={currentStep === questions.length - 1 ? 'Entrar no Círculo' : 'Próxima'}
              onPress={handleNext}
              loading={loading}
              style={styles.nextButton}
            />
          </View>

          {/* Sacred Quote */}
          <SacredCard style={styles.quoteCard}>
            <Text style={[styles.quote, { color: colors.textSecondary }]}>
              "Quando nos alinhamos com uma intenção comum, criamos um campo sagrado 
              onde os milagres se tornam naturais."
            </Text>
          </SacredCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
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
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
  },
  questionCard: {
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  questionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    marginLeft: Spacing.md,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  quoteCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
