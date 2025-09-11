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
import { useCollectiveCircles } from '@/hooks/useCollectiveCircles';
import { Spacing } from '@/constants/Colors';

export default function CreateCircleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { createCircle, createInvitation } = useCollectiveCircles();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    personal_message: '',
    max_members: 13,
  });

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [audioInvitation, setAudioInvitation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    console.log('Starting circle creation...');
    console.log('Current user:', user);
    console.log('Form data:', formData);

    if (!user) {
      console.error('No user authenticated');
      showWebAlert('Erro de Autenticação', 'Você precisa estar logado para criar um círculo.');
      return;
    }

    if (!formData.title.trim()) {
      showWebAlert('Erro', 'Por favor, informe o título do círculo');
      return;
    }

    if (!formData.description.trim()) {
      showWebAlert('Erro', 'Por favor, descreva o propósito do círculo');
      return;
    }

    setLoading(true);

    try {
      console.log('Calling createCircle...');
      
      const result = await createCircle({
        title: formData.title.trim(),
        description: formData.description.trim(),
        personal_message: formData.personal_message.trim() || undefined,
        cover_image_url: coverImage || undefined,
        audio_invitation_url: audioInvitation || undefined,
        max_members: formData.max_members,
      });

      console.log('CreateCircle result:', result);

      if (result.error) {
        console.error('Error from createCircle:', result.error);
        
        let errorMessage = 'Não foi possível criar seu círculo. Tente novamente.';
        
        if (result.error.message) {
          if (result.error.message.includes('permission')) {
            errorMessage = 'Erro de permissão. Verifique se você está logado corretamente.';
          } else if (result.error.message.includes('network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = `Erro: ${result.error.message}`;
          }
        }
        
        showWebAlert('Erro ao Criar Círculo', errorMessage);
      } else {
        console.log('Circle created successfully!');
        
        // Create invitation link
        const inviteResult = await createInvitation(result.data.id);
        
        if (inviteResult.error) {
          console.error('Error creating invitation:', inviteResult.error);
          showWebAlert('Círculo Criado', 'Círculo criado com sucesso, mas houve erro ao gerar convite.');
          router.push('/(tabs)/circulos');
        } else {
          // Navigate to circle details with invitation
          showWebAlert(
            'Círculo Criado!',
            'Seu círculo foi criado com sucesso! Agora você pode convidar pessoas.',
            () => {
              router.push(`/circle-details?id=${result.data.id}&token=${inviteResult.data.invite_token}`);
            }
          );
        }
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

  const recordAudio = () => {
    // TODO: Implementar gravação de áudio
    showWebAlert('Em Desenvolvimento', 'A gravação de áudio será implementada em breve.');
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
              Você precisa estar logado para criar um círculo.
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
                Novo Círculo
              </Text>
              <View style={{ width: 80 }} />
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Forme um círculo íntimo para manifestar juntos
            </Text>
          </View>

          {/* Form */}
          <SacredCard glowing style={styles.formCard}>
            <View style={styles.formSection}>
              <MaterialIcons 
                name="group-add" 
                size={32} 
                color={colors.primary} 
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Defina o Propósito Coletivo
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Crie um espaço sagrado para manifestação em grupo
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Título do Círculo *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Ex: Abundância Coletiva, Paz Mundial..."
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Descrição do Propósito *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Descreva detalhadamente o que vocês desejam manifestar juntos..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Mensagem Pessoal de Convite (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                value={formData.personal_message}
                onChangeText={(value) => handleInputChange('personal_message', value)}
                placeholder="Escreva uma mensagem especial para seus convidados..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Número Máximo de Membros
              </Text>
              <View style={styles.memberSelector}>
                {[7, 9, 11, 13].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.memberOption,
                      { 
                        backgroundColor: formData.max_members === num ? colors.primary : colors.surface,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => handleInputChange('max_members', num)}
                  >
                    <Text style={[
                      styles.memberOptionText,
                      { color: formData.max_members === num ? 'white' : colors.text }
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                Recomendamos grupos íntimos de até 13 pessoas
              </Text>
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
                      Uma imagem que represente o propósito do círculo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Convite em Áudio (Opcional)
              </Text>
              <TouchableOpacity
                style={[
                  styles.audioSelector,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={recordAudio}
              >
                <MaterialIcons 
                  name={audioInvitation ? "mic" : "mic-none"} 
                  size={32} 
                  color={colors.accent} 
                />
                <Text style={[styles.audioText, { color: colors.textSecondary }]}>
                  {audioInvitation ? 'Áudio Gravado' : 'Gravar Convite em Áudio'}
                </Text>
                <Text style={[styles.audioHint, { color: colors.textMuted }]}>
                  Grave uma mensagem pessoal para seus convidados
                </Text>
              </TouchableOpacity>
            </View>
          </SacredCard>

          {/* Sacred Principles */}
          <SacredCard style={styles.principlesCard}>
            <Text style={[styles.principlesTitle, { color: colors.text }]}>
              Princípios do Círculo Sagrado
            </Text>
            <View style={styles.principlesList}>
              {[
                { icon: 'volume-off', text: 'Silêncio: Sem chats ou notificações' },
                { icon: 'favorite', text: 'Intimidade: Grupos pequenos e íntimos' },
                { icon: 'schedule', text: 'Presença: Momentos sincronizados' },
                { icon: 'how-to-vote', text: 'Consenso: Decisões coletivas' },
                { icon: 'auto-awesome', text: 'Intenção: Foco no propósito comum' },
              ].map((principle, index) => (
                <View key={index} style={styles.principleItem}>
                  <MaterialIcons 
                    name={principle.icon as any} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.principleText, { color: colors.textSecondary }]}>
                    {principle.text}
                  </Text>
                </View>
              ))}
            </View>
          </SacredCard>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <SacredButton
              title="Criar Círculo"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>

          {/* Sacred Quote */}
          <SacredCard style={styles.quoteCard}>
            <Text style={[styles.quote, { color: colors.textSecondary }]}>
              "Quando duas ou mais pessoas se reúnem com uma intenção comum, 
              criam um campo de energia que multiplica a força da manifestação."
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
  memberSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  memberOption: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  memberOptionText: {
    fontSize: 16,
    fontWeight: '600',
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
  audioSelector: {
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
  audioHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  principlesCard: {
    marginBottom: Spacing.lg,
  },
  principlesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  principlesList: {
    gap: Spacing.md,
  },
  principleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  principleText: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.md,
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
});