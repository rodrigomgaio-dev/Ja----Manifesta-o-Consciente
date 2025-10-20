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
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
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
  mantram: 'Mantralização',
  affirmation: 'Afirmação',
};

// Helper function to check if current time is within schedule time window (±15 min)
const isScheduleAvailable = (schedule: any): boolean => {
  if (schedule.mode === 'flow') return true;
  if (schedule.time_type !== 'specific') return true;
  if (!schedule.specific_time) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Check if today is in the schedule days
  const scheduleDays = schedule.days_of_week || [0, 1, 2, 3, 4, 5, 6]; // null means daily
  if (!scheduleDays.includes(currentDay)) return false;

  // Parse schedule time (HH:MM format)
  const timeParts = schedule.specific_time.split(':');
  if (timeParts.length !== 2) return false;
  
  const scheduleHour = parseInt(timeParts[0], 10);
  const scheduleMinute = parseInt(timeParts[1], 10);
  
  if (isNaN(scheduleHour) || isNaN(scheduleMinute)) return false;
  
  const scheduleTimeInMinutes = scheduleHour * 60 + scheduleMinute;

  // Check if within ±15 minutes window
  const timeDiff = Math.abs(currentTimeInMinutes - scheduleTimeInMinutes);
  return timeDiff <= 15;
};

export default function CocreationMomentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { schedules, loading, refresh } = usePracticeSchedules(cocreationId || '');

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Reload when returning to screen
  useFocusEffect(
    useCallback(() => {
      if (cocreationId) {
        refresh();
      }
    }, [cocreationId, refresh])
  );

  const handleMomentPress = (schedule: any) => {
    router.push(`/jae-practice?cocreationId=${cocreationId}&scheduleId=${schedule.id}&mode=${schedule.mode}&practices=${schedule.practices?.join(',') || ''}`);
  };

  const handleConfigPress = () => {
    router.push(`/practice-schedule?cocreationId=${cocreationId}`);
  };

  const renderMomentCard = (schedule: any) => {
    const isAvailable = isScheduleAvailable(schedule);

    if (schedule.mode === 'flow') {
      return (
        <TouchableOpacity
          key={schedule.id}
          style={[
            styles.momentCard,
            { 
              backgroundColor: colors.surface + '80',
              borderColor: '#10B981' + '40',
              opacity: 1, // Always enabled
            }
          ]}
          onPress={() => handleMomentPress(schedule)}
          activeOpacity={0.7}
        >
          <View style={styles.momentHeader}>
            <View style={[styles.momentIcon, { backgroundColor: '#10B981' + '20' }]}>
              <MaterialIcons name="waves" size={28} color="#10B981" />
            </View>
            <View style={styles.momentInfo}>
              <Text style={[styles.momentTitle, { color: colors.text }]}>
                Deixar Fluir
              </Text>
              <Text style={[styles.momentSubtitle, { color: colors.textSecondary }]}>
                Sempre disponível
              </Text>
            </View>
            <View style={[styles.momentArrow, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="chevron-right" size={24} color="white" />
            </View>
          </View>

          <View style={styles.momentDetails}>
            <View style={styles.detailBadge}>
              <MaterialIcons name="all-inclusive" size={14} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Todas as práticas
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Routine mode
    const daysText = schedule.days_of_week 
      ? schedule.days_of_week.map((d: number) => DAYS_MAP[d]).join(', ')
      : 'Diário';

    let timeText = 'Flexível';
    if (schedule.time_type === 'specific' && schedule.specific_time) {
      // Format time as HH:MM
      const timeParts = schedule.specific_time.split(':');
      if (timeParts.length === 2) {
        const hour = timeParts[0].padStart(2, '0');
        const minute = timeParts[1].padStart(2, '0');
        timeText = `${hour}:${minute}`;
      } else {
        timeText = schedule.specific_time;
      }
    } else if (schedule.time_type) {
      timeText = TIME_TYPE_LABELS[schedule.time_type as keyof typeof TIME_TYPE_LABELS] || 'Flexível';
    }

    const practicesText = schedule.practices
      .map((p: string) => PRACTICE_LABELS[p] || p)
      .join(', ');

    return (
      <TouchableOpacity
        key={schedule.id}
        style={[
          styles.momentCard,
          { 
            backgroundColor: colors.surface + '80',
            borderColor: colors.primary + '40',
            opacity: isAvailable ? 1 : 0.5,
          }
        ]}
        onPress={() => isAvailable && handleMomentPress(schedule)}
        activeOpacity={isAvailable ? 0.7 : 1}
        disabled={!isAvailable}
      >
        <View style={styles.momentHeader}>
          <View style={[styles.momentIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="event-repeat" size={28} color={colors.primary} />
          </View>
          <View style={styles.momentInfo}>
            <Text style={[styles.momentTitle, { color: colors.text }]}>
              Rotina de Prática
            </Text>
            <Text style={[styles.momentSubtitle, { color: colors.textSecondary }]}>
              {isAvailable ? 'Disponível agora' : 'Fora do horário'}
            </Text>
          </View>
          {isAvailable && (
            <View style={[styles.momentArrow, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="chevron-right" size={24} color="white" />
            </View>
          )}
        </View>

        <View style={styles.momentDetails}>
          <View style={styles.detailBadge}>
            <MaterialIcons name="calendar-today" size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {daysText}
            </Text>
          </View>

          <View style={styles.detailBadge}>
            <MaterialIcons name="access-time" size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {timeText}
            </Text>
          </View>
        </View>

        <View style={styles.momentPractices}>
          <MaterialIcons name="spa" size={14} color={colors.textMuted} />
          <Text style={[styles.practicesText, { color: colors.textSecondary }]}>
            {practicesText}
          </Text>
        </View>

        {!isAvailable && schedule.time_type === 'specific' && (
          <View style={styles.unavailableNote}>
            <MaterialIcons name="info-outline" size={14} color={colors.warning} />
            <Text style={[styles.unavailableText, { color: colors.warning }]}>
              Disponível 15 min antes e depois do horário
            </Text>
          </View>
        )}
      </TouchableOpacity>
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
  const flowSchedule = schedules.find(s => s.mode === 'flow');
  const routineSchedules = schedules.filter(s => s.mode === 'routine');
  
  // Sort schedules: flow first, then routines
  const sortedSchedules = [
    ...(flowSchedule ? [flowSchedule] : []),
    ...routineSchedules
  ];

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Config Button */}
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

          <TouchableOpacity 
            style={[styles.configButton, { backgroundColor: colors.primary + '20' }]}
            onPress={handleConfigPress}
          >
            <MaterialIcons name="settings" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Momentos de Cocriação
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {schedules.length === 0 
              ? 'Configure seus momentos para começar'
              : 'Escolha um momento para praticar'}
          </Text>
        </View>

        {/* Empty State */}
        {schedules.length === 0 ? (
          <SacredCard style={styles.emptyCard}>
            <MaterialIcons name="spa" size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum momento configurado
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Configure seus momentos de cocriação para começar a praticar
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={handleConfigPress}
            >
              <Text style={styles.emptyButtonText}>Configurar Agora</Text>
            </TouchableOpacity>
          </SacredCard>
        ) : (
          <View style={styles.momentsContainer}>
            {sortedSchedules.map(schedule => renderMomentCard(schedule))}
          </View>
        )}

        {/* Info Card */}
        <SacredCard style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={32} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {schedules.length === 0 
              ? 'Configure momentos de cocriação para praticar regularmente e manifestar seus desejos.'
              : hasFlowMode
              ? 'O modo "Deixar Fluir" está sempre disponível. Rotinas específicas ficam disponíveis 15 minutos antes e depois do horário.'
              : 'Rotinas específicas ficam disponíveis 15 minutos antes e depois do horário configurado.'}
          </Text>
        </SacredCard>

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "A manifestação floresce na consistência da prática diária. 
            Cada momento é uma oportunidade de co-criar sua realidade."
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  configButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  momentsContainer: {
    marginBottom: Spacing.lg,
  },
  momentCard: {
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  momentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  momentInfo: {
    flex: 1,
  },
  momentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  momentSubtitle: {
    fontSize: 13,
  },
  momentArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  momentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 12,
  },
  momentPractices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  practicesText: {
    fontSize: 12,
    flex: 1,
  },
  unavailableNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.2)',
  },
  unavailableText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  infoCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.md,
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
