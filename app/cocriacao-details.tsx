import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useVisionBoard } from '@/hooks/useVisionBoard'; // Certifique-se de que este hook retorna os itens
import { Spacing } from '@/constants/Colors';

export default function CocriacaoDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cocriations, deleteCocriation, loading, refresh } = useIndividualCocriations();
  // Agora usaremos o hook para obter os itens do VisionBoard
  const { items: visionBoardItems, loading: visionBoardLoading, refresh: refreshVisionBoard } = useVisionBoard(id || '');

  const [cocriation, setCocriation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Estado para saber se o VisionBoard está completo (baseado em alguma lógica)
  const [isVisionBoardCompleted, setIsVisionBoardCompleted] = useState(false);
  // Estado para saber se o VisionBoard foi iniciado (tem itens)
  const [isVisionBoardStarted, setIsVisionBoardStarted] = useState(false);

  // Atualizar cocriation quando cocriations array muda
  useEffect(() => {
    console.log('Cocriations updated, searching for id:', id);
    if (id && cocriations.length > 0) {
      const foundCocriation = cocriations.find(c => c.id === id);
      console.log('Found cocriation:', foundCocriation);
      setCocriation(foundCocriation);
      // Atualizar o estado de conclusão do VisionBoard com base no status da cocriação
      // Ajuste o nome do campo conforme seu banco de dados
      setIsVisionBoardCompleted(!!foundCocriation?.vision_board_completed); 
    }
  }, [id, cocriations]);

  // Atualizar estado de início do VisionBoard quando os itens mudam
  useEffect(() => {
    if (visionBoardItems) {
      setIsVisionBoardStarted(visionBoardItems.length > 0);
    }
  }, [visionBoardItems]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, refreshing data...');
      refresh();
      refreshVisionBoard(); // Certifique-se de que os dados do VisionBoard também são atualizados
    }, [refresh, refreshVisionBoard])
  );

  const showWebAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      const confirmed = confirm(`${title}: ${message}`);
      if (confirmed && buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleEdit = () => {
    router.push(`/edit-individual?id=${cocriation.id}`);
  };

  const handleDelete = () => {
    showWebAlert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta cocriação? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!cocriation) return;

    setIsDeleting(true);

    try {
      const result = await deleteCocriation(cocriation.id);
      
      if (result.error) {
        console.error('Error deleting cocriation:', result.error);
        showWebAlert('Erro', 'Não foi possível excluir a cocriação. Tente novamente.');
      } else {
        showWebAlert(
          'Sucesso',
          'Cocriação excluída com sucesso.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Unexpected error deleting cocriation:', error);
      showWebAlert('Erro Inesperado', 'Algo deu errado. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVisionBoard = () => {
    // Verifica se o VisionBoard está marcado como completo no status da cocriação
    if (isVisionBoardCompleted) {
      // Navega para a tela de visualização somente leitura
      router.push(`/vision-board-view?cocreationId=${cocriation.id}`);
    } else {
      // Navega para a tela de edição
      router.push(`/vision-board?cocreationId=${cocriation.id}`);
    }
  };

  const handleFutureLetter = () => {
    router.push(`/future-letter?cocreationId=${cocriation.id}`);
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando detalhes...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (!cocriation) {
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

  // Determinar o texto do subtitulo do botão VisionBoard
  let visionBoardStatusText = "Em construção";
  let visionBoardStatusColor = colors.warning || colors.textMuted; // Use uma cor de aviso se disponível

  if (isVisionBoardCompleted) {
    visionBoardStatusText = "✓ Finalizado";
    visionBoardStatusColor = colors.success;
  } else if (isVisionBoardStarted) {
     visionBoardStatusText = "Iniciado";
     visionBoardStatusColor = colors.primary; // Ou outra cor para "iniciado"
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
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleVisionBoard}
            >
              <MaterialIcons name="dashboard" size={24} color={colors.primary} />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Vision Board
                </Text>
                {/* Mostrar o status dinamicamente */}
                <Text style={[styles.actionSubtext, { color: visionBoardStatusColor }]}>
                  {visionBoardStatusText}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>

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