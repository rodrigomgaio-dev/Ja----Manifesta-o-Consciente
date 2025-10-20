import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

export default function CreateIndividualScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { createCocriation } = useIndividualCocriations();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mental_code: '',
    why_reason: '',
  });

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    console.log('Starting form submission...');
    console.log('Current user:', user);
    console.log('Form data:', formData);

    // Check authentication
    if (!user) {
      console.error('No user authenticated');
      showWebAlert('Erro de Autenticação', 'Você precisa estar logado para criar uma cocriação.');
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      showWebAlert('Erro', 'Por favor, informe o título da sua cocriação');
      return;
    }

    if (!formData.description.trim()) {
      showWebAlert('Erro', 'Por favor, descreva sua cocriação');
      return;
    }

    setLoading(true);

    try {
      console.log('Calling createCocriation...');
      
      const result = await createCocriation({
        title: formData.title.trim(),
        description: formData.description.trim(),
        mental_code: formData.mental_code.trim() || undefined,
        why_reason: formData.why_reason.trim() || undefined,
        cover_image_url: coverImage || undefined,
      });

      console.log('CreateCocriation result:', result);

      if (result.error) {
        console.error('Error from createCocriation:', result.error);
        
        // More specific error messages
        let errorMessage = 'Não foi possível criar sua cocriação. Tente novamente.';
        
        if (result.error.message) {
          if (result.error.message.includes('permission')) {
            errorMessage = 'Erro de permissão. Verifique se você está logado corretamente.';
          } else if (result.error.message.includes('network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = `Erro: ${result.error.message}`;
          }
        }
        
        showWebAlert('Erro ao Criar Cocriação', errorMessage);
      } else {
        console.log('Cocriation created successfully!');
        // Navigate to future letter creation
        router.push(`/future-letter?cocreationId=${result.data.id}`);
      }
    } catch (error) {
      console.error('Unexpected error in handleSubmit:', error);
      showWebAlert('Erro Inesperado', 'Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const selectCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showWebAlert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  // Show authentication error if not logged in
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
              Você precisa estar logado para criar uma cocriação.
            </Text>
            <SacredButton
              title="Fazer Login"
              onPress={() => router.push('/login')}
              style={styles.loginButton}
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

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
            <View style={styles.headerTop}>
              <SacredButton
                title="Cancelar"
                onPress={handleCancel}
                variant="outline"
                size="sm"
              />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Nova Cocriação
              </Text>
              <View style={{ width: 80 }} />
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Manifeste seus sonhos através da presença
            </Text>
          </View>

          {/* User Info Debug (remove in production) */}
          {__DEV__ && (
            <SacredCard style={styles.debugCard}>
              <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                Debug - Usuário: {user.email} (ID: {user.id})
              </Text>
            </SacredCard>
          )}

          {/* Form */}
          <SacredCard glowing style={styles.formCard}>
            <View style={styles.formSection}>
              <MaterialIcons 
                name="auto-awesome" 
                size={32} 
                color={colors.primary} 
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Defina sua Intenção
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Dê forma ao seu desejo com clareza e propósito
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Título da Cocriação *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Ex: Abundância Financeira, Relacionamento Sagrado..."
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Descrição *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Descreva detalhadamente o que você deseja manifestar..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Código Mental (Apelido)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.mental_code}
                onChangeText={(value) => handleInputChange('mental_code', value)}
                placeholder="Ex: PROSPERIDADE, AMOR_DIVINO, NOVA_ENERGIA..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={30}
              />
              <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                Um código especial que representa sua manifestação
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Seu Porquê (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.why_reason}
                onChangeText={(value) => handleInputChange('why_reason', value)}
                placeholder="Por que esta manifestação é importante para você? Qual o sentimento por trás deste desejo?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Imagem de Capa (Opcional)
              </Text>
              <TouchableOpacity
                style={[
                  styles.imageSelector,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={selectCoverImage}
              >
                {coverImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: coverImage }} style={styles.selectedImage} />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="edit" size={24} color="white" />
                      <Text style={styles.imageOverlayText}>Alterar Imagem</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons 
                      name="add-photo-alternate" 
                      size={48} 
                      color={colors.primary} 
                    />
                    <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                      Escolher Imagem de Capa
                    </Text>
                    <Text style={[styles.imageHint, { color: colors.textMuted }]}>
                      Esta imagem representará sua cocriação
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </SacredCard>

          {/* Próximos Passos */}
          <SacredCard style={styles.nextStepsCard}>
            <Text style={[styles.nextStepsTitle, { color: colors.text }]}>
              Após Criar sua Cocriação
            </Text>
            <View style={styles.stepsList}>
              {[
                'Criar seu Vision Board interativo',
                'Definir práticas diárias personalizadas',
                'Escrever sua carta para o futuro',
                'Acompanhar sua jornada com presença',
                'Celebrar de forma Inesquecível!',
              ].map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </SacredCard>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <SacredButton
              title="Criar Cocriação"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>

          {/* Sacred Quote */}
          <SacredCard style={styles.quoteCard}>
            <Text style={[styles.quote, { color: colors.textSecondary }]}>
              "Tudo o que você pode imaginar já existe no campo infinito das possibilidades. 
              A manifestação é simplesmente alinhar sua energia com essa realidade."
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
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
    marginBottom: Spacing.xl,
  },
  loginButton: {
    minWidth: 160,
  },
  debugCard: {
    marginBottom: Spacing.md,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  formSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sectionIcon: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },
  inputHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  nextStepsCard: {
    marginBottom: Spacing.lg,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitContainer: {
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginHorizontal: Spacing.md,
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
  imageSelector: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
  imageHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});