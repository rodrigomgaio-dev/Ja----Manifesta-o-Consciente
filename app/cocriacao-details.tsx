// app/cocriacao-details.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

export default function CocriacaoDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cocriations, deleteCocriation, loadSingle } = useIndividualCocriations();

  const [cocriation, setCocriation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });

  // Carregar cocriação específica do cache ou banco
  const loadCocriation = useCallback(async () => {
    if (!id) return;

    // Primeiro, tenta do cache
    const cached = cocriations.find(c => c.id === id);
    if (cached) {
      console.log('Cocriation found in cache:', cached);
      setCocriation(cached);
      return;
    }

    // Se não está no cache, carrega do banco
    console.log('Loading cocriation from database:', id);
    setIsLoading(true);
    const result = await loadSingle(id);
    if (result.data) {
      setCocriation(result.data);
    }
    setIsLoading(false);
  }, [id, cocriations, loadSingle]);

  // Carregar ao montar e quando cocriations muda
  useEffect(() => {
    loadCocriation();
  }, [loadCocriation]);

  // Recarregar quando retorna ao foco (apenas se necessário)
  useFocusEffect(
    useCallback(() => {
      // Apenas recarrega se a cocriação já existe no cache
      // Isso evita carregamentos desnecessários
      if (id && cocriations.some(c => c.id === id)) {
        loadCocriation();
      }
    }, [id, cocriations.length])
  );

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: any[]
  ) => {
    setModalConfig({ title, message, type, buttons });
    setModalVisible(true);
  };

  const handleEdit = () => {
    router.push(`/edit-individual?id=${cocriation.id}`);
  };

  const handleDelete = () => {
    showModal(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta cocriação? Esta ação não pode ser desfeita.',
      'warning',
      [
        {
          text: 'Cancelar',
          variant: 'outline',
          onPress: () => {},
        },
        {
          text: 'Excluir',
          variant: 'danger',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!cocriation) return;

    setIsDeleting(true);
    setModalVisible(false);

    try {
      const result = await deleteCocriation(cocriation.id);
      
      if (result.error) {
        console.error('Error deleting cocriation:', result.error);
        showModal(
          'Erro',
          'Não foi possível excluir a cocriação. Tente novamente.',
          'error'
        );
        setIsDeleting(false);
      } else {
        // Redireciona imediatamente após exclusão bem-sucedida
        router.replace('/(tabs)/individual');
        // Aguarda um momento e então mostra o modal de sucesso
        setTimeout(() => {
          showModal(
            'Sucesso',
            'Cocriação excluída com sucesso.',
            'success'
          );
        }, 300);
      }
    } catch (error) {
      console.error('Unexpected error deleting cocriation:', error);
      showModal(
        'Erro Inesperado',
        'Algo deu errado. Tente novamente.',
        'error'
      );
      setIsDeleting(false);
    }
  };

  // --- FUNÇÃO CRÍTICA ALTERADA ---
  const handleVisionBoard = () => {
    console.log("Abrindo Vision Board para cocreationId:", cocriation?.id);
    
    // Verifica se o VisionBoard está marcado como completo no status da cocriação
    // NOTA: Certifique-se de que o campo no seu banco de dados seja 'vision_board_completed'.
    // Se for diferente (ex: 'status' === 'completed'), ajuste a condição abaixo.
    if (cocriation?.vision_board_completed) {
      console.log("Vision Board está COMPLETO. Indo para visualização.");
      // Navega para a tela de visualização somente leitura
      router.push(`/vision-board-view?cocreationId=${cocriation.id}`);
    } else {
      console.log("Vision Board NÃO está completo. Indo para o EDITOR.");
      // Navega para o NOVO editor
      router.push(`/vision-board-editor?cocreationId=${cocriation.id}`);
    }
  };
  // --- FIM DA FUNÇÃO CRÍTICA ---

  const handleFutureLetter = () => {
    router.push(`/future-letter?cocreationId=${cocriation.id}`);
  };

  // Mostrar loading apenas enquanto carrega
  if (isLoading && !cocriation) {
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

  // Mostrar erro apenas se não houver cocriação e não estiver deletando
  if (!isLoading && !cocriation && !isDeleting) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Cocriação não encontrada
            </Text>
            <SacredButton
              title="Voltar"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

  // Se estiver deletando ou não houver cocriação, não renderiza nada
  if (!cocriation) {
    return null;
  }

  // Determinar o texto do subtitulo do botão VisionBoard
  let visionBoardStatusText = "Em construção";
  let visionBoardStatusColor = colors.warning || colors.textMuted;

  if (cocriation?.vision_board_completed) {
    visionBoardStatusText = "✓ Finalizado";
    visionBoardStatusColor = colors.success;
  } else if (cocriation?.vision_board_items_count && cocriation.vision_board_items_count > 0) {
     visionBoardStatusText = "Iniciado";
     visionBoardStatusColor = colors.primary;
  }

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
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

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}
              onPress={handleEdit}
            >
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cover Image */}
        {cocriation.cover_image_url && (
          <SacredCard style={styles.coverCard}>
            <Image 
              source={{ uri: cocriation.cover_image_url }} 
              style={styles.coverImage}
              contentFit="cover"
            />
          </SacredCard>
        )}

        {/* Main Info */}
        <SacredCard glowing style={styles.mainCard}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              {cocriation.title}
            </Text>
            
            {cocriation.mental_code && (
              <View style={[styles.mentalCodeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.mentalCodeText}>
                  {cocriation.mental_code}
                </Text>
              </View>
            )}

            <View style={[styles.statusBadge, { 
              backgroundColor: cocriation.status === 'active' ? colors.primary + '20' : 
                             cocriation.status === 'paused' ? colors.secondary + '20' : colors.success + '20' 
            }]}>
              <Text style={[styles.statusText, { 
                color: cocriation.status === 'active' ? colors.primary : 
                      cocriation.status === 'paused' ? colors.secondary : colors.success 
              }]}>
                {cocriation.status === 'active' ? 'Ativa' : 
                 cocriation.status === 'paused' ? 'Pausada' : 'Concluída'}
              </Text>
            </View>
          </View>

          {cocriation.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Descrição
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {cocriation.description}
              </Text>
            </View>
          )}

          {cocriation.why_reason && (
            <View style={styles.whySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Seu Porquê
              </Text>
              <Text style={[styles.whyText, { color: colors.textSecondary }]}>
                {cocriation.why_reason}
              </Text>
            </View>
          )}

          <View style={styles.dateSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Criada em
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(cocriation.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </SacredCard>

        {/* Quick Actions */}
        <SacredCard style={styles.actionsCard}>
          <Text style={[styles.actionsTitle, { color: colors.text }]}>
            Ações Rápidas
          </Text>
          
          <View style={styles.actionsList}>
            {/* --- BOTÃO VISION BOARD ALTERADO --- */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleVisionBoard} // Chama a função atualizada
            >
              <MaterialIcons name="dashboard" size={24} color={colors.primary} />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Vision Board
                </Text>
                <Text style={[styles.actionSubtext, { color: visionBoardStatusColor }]}>
                  {visionBoardStatusText}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {/* --- FIM DO BOTÃO VISION BOARD --- */}

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleFutureLetter}
            >
              <MaterialIcons name="mail-outline" size={24} color={colors.secondary} />
              <Text style={[styles.actionText, { color: colors.secondary }]}>
                Carta ao Futuro
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="self-improvement" size={24} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.accent }]}>
                Práticas Diárias
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </SacredCard>

        {/* Statistics */}
        <SacredCard style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Estatísticas
          </Text>
          
          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {Math.ceil((new Date().getTime() - new Date(cocriation.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias ativa
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.accent} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                NFT será gerado na conclusão
              </Text>
            </View>
          </View>
        </SacredCard>

        {/* Danger Zone */}
        <SacredCard style={styles.dangerCard}>
          <Text style={[styles.dangerTitle, { color: colors.error }]}>
            Zona de Perigo
          </Text>
          <Text style={[styles.dangerDescription, { color: colors.textSecondary }]}>
            A exclusão desta cocriação é permanente e não pode ser desfeita.
          </Text>
          <SacredButton
            title={isDeleting ? "Excluindo..." : "Excluir Cocriação"}
            onPress={handleDelete}
            loading={isDeleting}
            variant="outline"
            style={[styles.deleteButton, { borderColor: colors.error }]}
          />
        </SacredCard>

        {/* Modal */}
        <SacredModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          buttons={modalConfig.buttons}
          onClose={() => setModalVisible(false)}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverCard: {
    marginBottom: Spacing.lg,
    padding: 0,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  mainCard: {
    marginBottom: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  mentalCodeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginBottom: Spacing.sm,
  },
  mentalCodeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: Spacing.lg,
  },
  whySection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  whyText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  dateSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  dateText: {
    fontSize: 14,
  },
  actionsCard: {
    marginBottom: Spacing.lg,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  actionsList: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  statsList: {
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: Spacing.md,
  },
  dangerCard: {
    marginBottom: Spacing.xl,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  dangerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
});
