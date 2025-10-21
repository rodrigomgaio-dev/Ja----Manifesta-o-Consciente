import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  // Importa cocriations do hook - esta é a fonte de verdade do cache
  const { cocriations, deleteCocriation, loadSingle, updateCocriation } = useIndividualCocriations();
  const { getFutureLetter } = useFutureLetter();

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

  // Carregar cocriação específica do cache ou banco
  const loadCocriation = useCallback(async () => {
    if (!id) return;

    // Primeiro, tenta do cache (cocriations do hook)
    const cached = cocriations.find(c => c.id === id);
    if (cached) {
      console.log('Cocriation found in updated cache (from hook):', cached);
      setCocriation(cached);
      
      // Verificar se existe carta enviada
      if (cached.future_letter_completed) {
        const letterResult = await getFutureLetter(id);
        setHasLetterSent(!!letterResult.data);
      }
      return;
    }

    // Se não está no cache do hook, carrega do banco (fallback)
    console.log('Loading cocriation from database (fallback):', id);
    setIsLoading(true);
    const result = await loadSingle(id);
    if (result.data) {
      setCocriation(result.data);
      
      // Verificar se existe carta enviada
      if (result.data.future_letter_completed) {
        const letterResult = await getFutureLetter(id);
        setHasLetterSent(!!letterResult.data);
      }
    }
    setIsLoading(false);
  }, [id, cocriations, loadSingle, getFutureLetter]); // Importante: cocriations como dependência

  // Carregar ao montar
  useEffect(() => {
    loadCocriation();
  }, [loadCocriation]);

  // --- useFocusEffect PARA VERIFICAR CACHE ATUALIZADO ---
  // Esta é a parte crucial: ao voltar da edição, verifica o cache atualizado
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, checking for updated cocriation in cache.');
      // Ao voltar da tela de edição, o hook useIndividualCocriations
      // deve ter sido atualizado pelo refresh().
      // Procuramos a cocriação atualizada no cache do hook.
      if (id) {
        const updatedFromCache = cocriations.find(c => c.id === id);
        if (updatedFromCache && JSON.stringify(updatedFromCache) !== JSON.stringify(cocriation)) {
             console.log('Found updated cocriation in cache, updating local state.');
             setCocriation(updatedFromCache);
             // Opcional: verificar carta futura novamente se necessário
             if (updatedFromCache.future_letter_completed && !hasLetterSent) {
                 getFutureLetter(id).then(result => {
                     setHasLetterSent(!!result.data);
                 });
             }
        } else if (!updatedFromCache && !cocriation) {
            // Caso extremo: cocriação foi excluída enquanto estava na tela de edição
            console.log('Cocriation not found in cache anymore, reloading initial data.');
            loadCocriation(); // Tenta carregar novamente (pode do banco)
        }
        // Se updatedFromCache === cocriation, não faz nada (referência ou conteúdo iguais)
      }
    }, [id, cocriations, cocriation, hasLetterSent, getFutureLetter, loadCocriation]) // Dependências importantes
  );
  // --- FIM useFocusEffect ---

  // ... (restante das funções, como showModal, handleEdit, handleDelete, etc., permanecem as mesmas) ...
  const showModal = (...) {...}
  const handleEdit = () => {...}
  const handleDelete = () => {...}
  const confirmDelete = async () => {...}
  const handleVisionBoard = () => {...}
  const handleFutureLetter = () => {...}
  const canToggleStatus = (cocriation: any) => {...}
  const handleToggleStatus = async () => {...}

  // ... (restante do código JSX e styles permanecem os mesmos) ...

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
            onPress={() => router.push('/(tabs)/individual')}
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

        {/* Vision Board Visualization Button - Destacado no Topo */}
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

        {/* Main Info */}
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
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          )}
        </SacredCard>

        {/* Quick Actions */}
        <SacredCard style={styles.actionsCard}>
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

            {/* Carta ao Futuro - só mostra se não estiver completa */}
            {!cocriation.future_letter_completed && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleFutureLetter}
              >
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
            
            {/* Carta enviada - apenas informativo */}
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

        {/* Celebration */}
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
            onPress={() => showModal(
              'Em Desenvolvimento',
              'A funcionalidade de conclusão será implementada em breve.',
              'info'
            )}
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