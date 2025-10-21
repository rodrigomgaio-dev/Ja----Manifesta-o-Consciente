import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

export default function EditIndividualScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cocriations, updateCocriation, loading, refresh } = useIndividualCocriations();

  const [cocriation, setCocriation] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mental_code: '',
    why_reason: '',
    cover_image_url: '',
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    onOk?: () => void;
  }>({ title: '', message: '', type: 'info' });

  useEffect(() => {
    if (id && cocriations.length > 0) {
      const foundCocriation = cocriations.find(c => c.id === id);
      if (foundCocriation) {
        setCocriation(foundCocriation);
        setFormData({
          title: foundCocriation.title || '',
          description: foundCocriation.description || '',
          mental_code: foundCocriation.mental_code || '',
          why_reason: foundCocriation.why_reason || '',
          cover_image_url: foundCocriation.cover_image_url || '',
        });
        setCoverImage(foundCocriation.cover_image_url || null);
      }
    }
  }, [id, cocriations]);

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    onOk?: () => void
  ) => {
    setModalConfig({ title, message, type, onOk });
    setModalVisible(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showModal('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.', 'warning');
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

  const handleSave = async () => {
    if (!user || !cocriation) {
      showModal('Erro', 'Informações necessárias não encontradas.', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showModal('Erro', 'Por favor, informe o título da cocriação', 'error');
      return;
    }

    if (!formData.description.trim()) {
      showModal('Erro', 'Por favor, descreva sua cocriação', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        mental_code: formData.mental_code.trim() || null,
        why_reason: formData.why_reason.trim() || null,
        cover_image_url: coverImage || null,
      };

      console.log('Saving cocriation updates:', updateData);

      const result = await updateCocriation(cocriation.id, updateData);

      if (result.error) {
        console.error('Error updating cocriation:', result.error);
        showModal('Erro', 'Não foi possível salvar as alterações. Tente novamente.', 'error');
      } else {
        console.log('Cocriation updated successfully');
        // Force a refresh to ensure cache is updated
        await refresh();
        showModal(
          'Sucesso',
          'Cocriação editada com sucesso.',
          'success',
          () => {
            // Small delay to ensure state is updated before navigation
            setTimeout(() => {
            router.back(); // Volta para a tela de detalhes
            }, 200);          
          }
        );

        {/* Esta alteração não funcionou 
        await refresh(); // Wait for cache to update
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        router.back(); // Now navigate
        // Show success message after navigation
        setTimeout(() => {
          // Success handled by details screen
        }, 300); */}
        
      }
    } catch (error) {
      console.error('Unexpected error updating cocriation:', error);
      showModal('Erro Inesperado', 'Algo deu errado. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading || !cocriation) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando cocriação...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

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
              Você precisa estar logado para editar uma cocriação.
            </Text>
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
                Editar Cocriação
              </Text>
              <View style={{ width: 80 }} />
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Atualize os detalhes da sua manifestação
            </Text>
          </View>

          {/* Form */}
          <SacredCard glowing style={styles.formCard}>
            <View style={styles.formSection}>
              <MaterialIcons 
                name="edit" 
                size={32} 
                color={colors.primary} 
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Atualize sua Intenção
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Refine os detalhes da sua cocriação
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

          {/* Save Button */}
          <View style={styles.submitContainer}>
            <SacredButton
              title="Salvar Alterações"
              onPress={handleSave}
              loading={isLoading}
              style={styles.submitButton}
            />
          </View>

          {/* Sacred Quote */}
          <SacredCard style={styles.quoteCard}>
            <Text style={[styles.quote, { color: colors.textSecondary }]}>
              "A manifestação é um processo vivo que pode ser refinado e aprimorado 
              conforme nossa consciência se expande."
            </Text>
          </SacredCard>
        </ScrollView>

        {/* Modal */}
        <SacredModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => {
            setModalVisible(false);
            if (modalConfig.onOk) {
              modalConfig.onOk();
            }
          }}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
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
});