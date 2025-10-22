// app/cocriacao-details.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'; // Importando useFocusEffect
import { LinearGradient } from 'expo-linear-gradient';
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
import { useFutureLetter } from '@/hooks/useFutureLetter';
import { Spacing } from '@/constants/Colors';

export default function CocriacaoDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Importa funções do hook
  const { cocriations, deleteCocriation, loadSingle, updateCocriation } = useIndividualCocriations();
  const { getFutureLetter } = useFutureLetter();

  // Estados locais
  const [cocriation, setCocriation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLetterSent, setHasLetterSent] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });

  // --- LÓGICA DE CARREGAMENTO SIMPLIFICADA E OTIMIZADA ---
  /**
   * Carrega os dados da cocriação.
   * 1. Busca no cache local do hook (`cocriations`).
   * 2. Se não encontrar, busca no banco (`loadSingle`).
   * 3. Verifica carta futura se necessário.
   * Esta função é memoizada para evitar re-criações desnecessárias.
   */
  const loadCocriationData = useCallback(async (cocreationId: string) => {
    if (!cocreationId) return;

    console.log(`[CocriacaoDetails] Attempting to load cocreation ID: ${cocreationId}`);
    setIsLoading(true);
    setHasLetterSent(false); // Resetar estado da carta

    try {
      // 1. TENTATIVA NO CACHE DO HOOK
      const cachedCocriation = cocriations.find(c => c.id === cocreationId);
      if (cachedCocriation) {
        console.log(`[CocriacaoDetails] Found in hook cache:`, cachedCocriation);
        setCocriation(cachedCocriation);

        // Verificar carta futura se estiver marcada como completa
        if (cachedCocriation.future_letter_completed) {
          console.log(`[CocriacaoDetails] Future letter marked complete, checking status...`);
          const letterResult = await getFutureLetter(cocreationId);
          setHasLetterSent(!!letterResult.data);
          console.log(`[CocriacaoDetails] Future letter status checked:`, !!letterResult.data);
        }
        return; // Encontrou e processou, fim.
      }

      // 2. FALLBACK PARA BANCO DE DADOS
      console.log(`[CocriacaoDetails] Not in cache, loading from database...`);
      const dbResult = await loadSingle(cocreationId);
      if (dbResult.data) {
        console.log(`[CocriacaoDetails] Loaded from database:`, dbResult.data);
        setCocriation(dbResult.data);

        // Verificar carta futura se estiver marcada como completa
        if (dbResult.data.future_letter_completed) {
          console.log(`[CocriacaoDetails] DB: Future letter marked complete, checking status...`);
          const letterResult = await getFutureLetter(cocreationId);
          setHasLetterSent(!!letterResult.data);
          console.log(`[CocriacaoDetails] DB: Future letter status checked:`, !!letterResult.data);
        }
      } else {
        console.warn(`[CocriacaoDetails] Cocreation not found in database.`);
        setCocriation(null);
      }
    } catch (error) {
      console.error('[CocriacaoDetails] Unexpected error loading ', error);
      // Considerar mostrar um erro na UI aqui se necessário
      setCocriation(null);
    } finally {
      setIsLoading(false);
      console.log(`[CocriacaoDetails] Finished loading attempt.`);
    }
  }, [cocriations, loadSingle, getFutureLetter]); // Dependências estáveis esperadas

  // --- CARREGAMENTO INICIAL (APENAS UMA VEZ NA MONTAGEM) ---
  // useEffect para carregar os dados quando o componente é montado e o ID muda.
  useEffect(() => {
    console.log(`[CocriacaoDetails useEffect - Mount] Triggered. ID: ${id}`);
    if (id) {
      loadCocriationData(id);
    } else {
      console.warn(`[CocriacaoDetails useEffect - Mount] No ID provided.`);
      setIsLoading(false);
      setCocriation(null);
    }
  }, [id, loadCocriationData]); // Roda apenas quando 'id' ou 'loadCocriationData' mudarem

  // --- useFocusEffect: FORÇAR RE-CRIAÇÃO AO GANHAR FOCO ---
  // Esta é a parte crucial para resolver o problema de múltiplos re-renders
  // ao voltar da tela de edição (Cancelar) ou da lista.
  // Em vez de tentar recarregar dados na instância antiga, substituímos
  // a instância por uma nova, garantindo um estado limpo.
  useFocusEffect(
    useCallback(() => {
      console.log("[CocriacaoDetails useFocusEffect] Screen focused. Forcing recreation via replace.");
      // Força uma "recriação" da tela ao ganhar foco.
      // Isso substitui a instância atual (mesmo que seja a mesma tela) por uma nova,
      // evitando qualquer estado residual ou problema de re-renderização da instância antiga.
      // router.replace mantém os parâmetros da URL.
      if (id) {
          router.replace({ pathname: '/cocriacao-details', params: { id: id as string } });
      }
    }, [id]) // Dependência crítica: id
  );
  // --- FIM DO useFocusEffect ---

  // --- FUNÇÕES AUXILIARES/UI ---
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
        { text: 'Cancelar', variant: 'outline', onPress: () => {} },
        { text: 'Excluir', variant: 'danger', onPress: confirmDelete },
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
        console.error('[CocriacaoDetails] Error deleting:', result.error);
        showModal('Erro', 'Não foi possível excluir a cocriação. Tente novamente.', 'error');
        setIsDeleting(false);
      } else {
        router.replace('/(tabs)/individual');
        setTimeout(() => {
          showModal('Sucesso', 'Cocriação excluída com sucesso.', 'success');
        }, 300);
      }
    } catch (error) {
      console.error('[CocriacaoDetails] Unexpected delete error:', error);
      showModal('Erro Inesperado', 'Algo deu errado. Tente novamente.', 'error');
      setIsDeleting(false);
    }
  };

  const handleVisionBoard = () => {
    router.push(`/vision-board?cocreationId=${cocriation.id}`);
  };

  const handleFutureLetter = () => {
    router.push(`/future-letter?cocreationId=${cocriation.id}&from=details`);
  };

  const canToggleStatus = (c: any) => {
    return c.vision_board_completed && c.practice_schedule_completed &&
           (c.future_letter_completed === true || c.future_letter_completed === false);
  };

  const handleToggleStatus = async () => {
    if (!cocriation || isTogglingStatus) return;
    setIsTogglingStatus(true);
    const newStatus = cocriation.status === 'active' ? 'inactive' : 'active';
    const result = await updateCocriation(cocriation.id, { status: newStatus });
    if (result.error) {
      showModal('Erro', 'Não foi possível alterar o status. Tente novamente.', 'error');
    } else {
      setCocriation(prev => ({ ...prev, status: newStatus }));
    }
    setIsTogglingStatus(false);
  };
  // --- FIM DAS FUNÇÕES AUXILIARES/UI ---

  // --- RENDERIZAÇÃO CONDICIONAL ---
  // Loading State (só enquanto carrega e não tem dados)
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

  // Error State (não está carregando, não tem cocriação e não está deletando)
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

  // Null State (está deletando ou cocriation é null por outro motivo)
  if (!cocriation) {
    return null;
  }

  // Determinar status do Vision Board para exibição
  let visionBoardStatusText = "Em construção";
  let visionBoardStatusColor = colors.warning || colors.textMuted;
  if (cocriation?.vision_board_completed) {
    visionBoardStatusText = "✓ Finalizado";
    visionBoardStatusColor = colors.success;
  } else if (cocriation?.vision_board_items_count && cocriation.vision_board_items_count > 0) {
    visionBoardStatusText = "Iniciado";
    visionBoardStatusColor = colors.primary;
  }

  // --- RENDERIZAÇÃO PRINCIPAL ---
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
            onPress={() => router.push('/(tabs)/individual')} // Volta direto para a lista
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

        {/* Vision Board Visualization Button */}
        {cocriation.vision_board_completed && (
          <TouchableOpacity
            style={styles.visionBoardViewButton}
            onPress={() => router.push(`/vision-board-view?cocreationId=${cocriation.id}`)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.9)', 'rgba(236, 72, 153, 0.9)', 'rgba(251, 191, 36, 0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.visionBoardGradient}
            >
              <View style={styles.visionBoardIconContainer}>
                <MaterialIcons name="visibility" size={32} color="white" />
              </View>
              <View style={styles.visionBoardTextContainer}>
                <Text style={styles.visionBoardTitle}>
                  Visualizar Vision Board
                </Text>
                <Text style={styles.visionBoardSubtitle}>
                  Medite com suas imagens em animações místicas
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Main Info Card */}
        <SacredCard glowing style={styles.mainCard}>
          {/* Toggle Status */}
          {canToggleStatus(cocriation) && (
            <View style={styles.toggleSection}>
              <View style={styles.toggleInfo}>
                <MaterialIcons
                  name={cocriation.status === 'active' ? 'check-circle' : 'pause-circle-outline'}
                  size={24}
                  color={cocriation.status === 'active' ? colors.success : colors.textMuted}
                />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>
                    {cocriation.status === 'active' ? 'Cocriação Ativa' : 'Cocriação Inativa'}
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    {cocriation.status === 'active'
                      ? 'Momentos de cocriação estão disponíveis'
                      : 'Ative para liberar os momentos de cocriação'}
                  </Text>
                </View>
              </View>
              <Switch
                value={cocriation.status === 'active'}
                onValueChange={handleToggleStatus}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={cocriation.status === 'active' ? colors.success : colors.textMuted}
                ios_backgroundColor={colors.border}
                disabled={isTogglingStatus}
              />
            </View>
          )}

          {/* Title & Mental Code */}
          <View style={styles.compactHeader}>
            <View style={styles.compactTitleSection}>
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
            </View>
          </View>

          {/* Expand/Collapse Button */}
          {(cocriation.description || cocriation.why_reason) && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                {isExpanded ? 'Ver menos' : 'Ver mais'}
              </Text>
              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
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
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          )}
        </SacredCard>

        {/* Quick Actions Card */}
        <SacredCard style={styles.actionsCard}>
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionButton} onPress={handleVisionBoard}>
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

            {!cocriation.future_letter_completed && (
              <TouchableOpacity style={styles.actionButton} onPress={handleFutureLetter}>
                <MaterialIcons name="mail-outline" size={24} color={colors.secondary} />
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionText, { color: colors.secondary }]}>
                    Carta ao Futuro
                  </Text>
                  <Text style={[styles.actionSubtext, { color: colors.textMuted }]}>
                    Escreva para seu futuro
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {cocriation.future_letter_completed && hasLetterSent && (
              <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                <MaterialIcons name="mail" size={24} color={colors.success} />
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionText, { color: colors.success }]}>
                    Carta ao Futuro Enviada
                  </Text>
                  <Text style={[styles.actionSubtext, { color: colors.textMuted }]}>
                    Será revelada na conclusão
                  </Text>
                </View>
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
              </View>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/practice-schedule?cocreationId=${cocriation.id}`)}
            >
              <MaterialIcons name="self-improvement" size={24} color={colors.accent} />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionText, { color: colors.accent }]}>
                  Momentos de Cocriação
                </Text>
                <Text style={[styles.actionSubtext, { color: colors.textMuted }]}>
                  Configure suas práticas
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </SacredCard>

        {/* Stats Card */}
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

        {/* Celebration Card */}
        <SacredCard glowing style={styles.celebrationCard}>
          <View style={styles.celebrationHeader}>
            <MaterialIcons name="celebration" size={48} color={colors.primary} />
            <Text style={[styles.celebrationTitle, { color: colors.text }]}>
              Celebração
            </Text>
          </View>
          <Text style={[styles.celebrationDescription, { color: colors.textSecondary }]}>
            Quando sentir que sua cocriação já é real e todos os seus objetivos foram alcançados,
            você pode concluir esta jornada e receber seu NFT simbólico de conquista.
          </Text>
          <SacredButton
            title="Concluir Cocriação"
            onPress={() => showModal('Em Desenvolvimento', 'A funcionalidade de conclusão será implementada em breve.', 'info')}
            style={styles.celebrationButton}
            icon={<MaterialIcons name="check-circle" size={20} color="white" />}
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

// --- ESTILOS (mantidos os mesmos) ---
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
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  compactTitleSection: {
    flex: 1,
    marginRight: Spacing.md,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    height: 28,
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
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  expandedContent: {
    marginTop: Spacing.lg,
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
  actionButtonDisabled: {
    opacity: 0.7,
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
  celebrationCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  celebrationDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  celebrationButton: {
    minWidth: 200,
  },
  visionBoardViewButton: {
    marginBottom: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  visionBoardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 16,
  },
  visionBoardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  visionBoardTextContainer: {
    flex: 1,
  },
  visionBoardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  visionBoardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
});