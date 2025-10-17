import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeSchedules } from '@/hooks/usePracticeSchedules';
import { Spacing } from '@/constants/Colors';

const DAYS_MAP = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIME_TYPE_LABELS = {
  specific: 'Horário específico',
  wake_up: 'Ao Acordar',
  before_sleep: 'Antes de Dormir',
  flexible: 'Flexível',
};

const PRACTICE_LABELS: Record<string, string> = {
  gratitude: 'Gratidão',
  meditation: 'Meditação',
  mantram: 'Mantram',
  affirmation: 'Afirmação',
};

export default function PracticeScheduleListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { schedules, loading, deleteSchedule, refresh } = usePracticeSchedules(cocreationId || '');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });

  // Recarregar quando retorna ao foco
  useFocusEffect(
    useCallback(() => {
      if (cocreationId) {
        refresh();
      }
    }, [cocreationId, refresh])
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

  const handleCreateNew = () => {
    router.push(`/practice-schedule-form?cocreationId=${cocreationId}`);
  };

  const handleEdit = (scheduleId: string) => {
    router.push(`/practice-schedule-form?cocreationId=${cocreationId}&scheduleId=${scheduleId}`);
  };

  const handleDelete = (scheduleId: string, mode: string) => {
    showModal(
      'Confirmar Exclusão',
      mode === 'flow' 
        ? 'Deseja remover o modo "Deixar Fluir"? Você poderá configurar novamente depois.'
        : 'Tem certeza que deseja excluir esta rotina de prática?',
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
          onPress: async () => {
            setModalVisible(false);
            const result = await deleteSchedule(scheduleId);
            if (result.error) {
              showModal('Erro', 'Não foi possível excluir. Tente novamente.', 'error');
            } else {
              showModal('Sucesso', 'Excluído com sucesso.', 'success');
            }
          },
        },
      ]
    );
  };

  const renderScheduleCard = (schedule: any) => {
    if (schedule.mode === 'flow') {
      return (
        <SacredCard key={schedule.id} glowing style={styles.scheduleCard}>
          <View style={styles.cardHeaderActions}>
            <TouchableOpacity 
              style={[styles.headerActionIcon, { backgroundColor: colors.primary + '20' }]}
              onPress={() => handleEdit(schedule.id)}
            >
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerActionIcon, { backgroundColor: colors.error + '20' }]}
              onPress={() => handleDelete(schedule.id, 'flow')}
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleIconContainer}>
              <MaterialIcons name="water-drop" size={28} color={colors.primary} />
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={[styles.scheduleTitle, { color: colors.text }]}>
                Deixar Fluir
              </Text>
              <Text style={[styles.scheduleDescription, { color: colors.textSecondary }]}>
                Pratique quando sentir a energia te chamar
              </Text>
            </View>
          </View>

          {/* Jaé Button */}
          <TouchableOpacity
            style={[styles.jaeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/jae-practice?cocreationId=${cocreationId}&scheduleId=${schedule.id}&mode=flow`)}
          >
            <Text style={styles.jaeButtonText}>Jaé</Text>
          </TouchableOpacity>
        </SacredCard>
      );
    }

    // Routine mode
    const daysText = schedule.days_of_week 
      ? schedule.days_of_week.map((d: number) => DAYS_MAP[d]).join(', ')
      : 'Diário';

    const timeText = schedule.time_type === 'specific' && schedule.specific_time
      ? schedule.specific_time
      : TIME_TYPE_LABELS[schedule.time_type as keyof typeof TIME_TYPE_LABELS] || 'Flexível';

    const practicesText = schedule.practices
      .map((p: string) => PRACTICE_LABELS[p] || p)
      .join(', ');

    const durationText = [];
    if (schedule.duration_hours) durationText.push(`${schedule.duration_hours}h`);
    if (schedule.duration_minutes) durationText.push(`${schedule.duration_minutes}min`);

    return (
      <SacredCard key={schedule.id} style={styles.scheduleCard}>
        <View style={styles.cardHeaderActions}>
          <TouchableOpacity 
            style={[styles.headerActionIcon, { backgroundColor: colors.primary + '20' }]}
            onPress={() => handleEdit(schedule.id)}
          >
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerActionIcon, { backgroundColor: colors.error + '20' }]}
            onPress={() => handleDelete(schedule.id, 'routine')}
          >
            <MaterialIcons name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleIconContainer}>
            <MaterialIcons name="event-repeat" size={28} color={colors.accent} />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={[styles.scheduleTitle, { color: colors.text }]}>
              Rotina de Prática
            </Text>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={16} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {daysText}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {timeText}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="spa" size={16} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {practicesText}
            </Text>
          </View>

          {durationText.length > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="timer" size={16} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {durationText.join(' ')}
              </Text>
            </View>
          )}
        </View>

        {/* Jaé Button */}
        <TouchableOpacity
          style={[styles.jaeButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/jae-practice?cocreationId=${cocreationId}&scheduleId=${schedule.id}&mode=routine&practices=${schedule.practices.join(',')}`)}
        >
          <Text style={styles.jaeButtonText}>Jaé</Text>
        </TouchableOpacity>
      </SacredCard>
    );
  };

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

  const hasFlowMode = schedules.some(s => s.mode === 'flow');
  const routineSchedules = schedules.filter(s => s.mode === 'routine');

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
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Momentos de Cocriação
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {schedules.length === 0 
              ? 'Configure como deseja praticar'
              : 'Suas práticas configuradas'}
          </Text>
        </View>

        {/* Empty State */}
        {schedules.length === 0 && (
          <SacredCard glowing style={styles.emptyCard}>
            <MaterialIcons name="spa" size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Configure seus Momentos
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Escolha entre deixar fluir ou criar uma rotina de práticas diárias
            </Text>
            <SacredButton
              title="Começar"
              onPress={handleCreateNew}
              style={styles.emptyButton}
            />
          </SacredCard>
        )}

        {/* Schedules List */}
        {schedules.length > 0 && (
          <>
            <View style={styles.schedulesContainer}>
              {schedules.map(schedule => renderScheduleCard(schedule))}
            </View>

            {/* Add New Button */}
            {!hasFlowMode && (
              <View style={styles.addButtonContainer}>
                <SacredButton
                  title="Adicionar Nova Rotina"
                  onPress={handleCreateNew}
                  icon={<MaterialIcons name="add" size={20} color="white" />}
                />
              </View>
            )}

            {/* Info if Flow Mode */}
            {hasFlowMode && (
              <SacredCard style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={24} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  No modo "Deixar Fluir", você pode adicionar rotinas específicas quando quiser criar uma estrutura mais definida.
                </Text>
                {routineSchedules.length === 0 && (
                  <SacredButton
                    title="Criar Rotina"
                    onPress={handleCreateNew}
                    variant="outline"
                    style={styles.infoButton}
                  />
                )}
              </SacredCard>
            )}
          </>
        )}

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "A manifestação floresce na consistência da prática diária,
            seja ela fluida ou estruturada."
          </Text>
        </SacredCard>
      </ScrollView>

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
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
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
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  schedulesContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scheduleCard: {
    padding: Spacing.md,
    position: 'relative',
  },
  cardHeaderActions: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.xs,
    zIndex: 1,
  },
  headerActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  scheduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  scheduleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  scheduleDetails: {
    gap: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },

  addButtonContainer: {
    marginBottom: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoButton: {
    marginTop: Spacing.sm,
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
  jaeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  jaeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
