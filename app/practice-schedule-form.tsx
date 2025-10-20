import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeSchedules } from '@/hooks/usePracticeSchedules';
import { Spacing } from '@/constants/Colors';

const DAYS_OF_WEEK = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const PRACTICES = [
  { label: 'Gratidão', value: 'gratitude', icon: 'favorite' },
  { label: 'Meditação', value: 'meditation', icon: 'self-improvement' },
  { label: 'Mantralização', value: 'mantram', icon: 'music-note' },
  { label: 'Afirmação', value: 'affirmation', icon: 'psychology' },
];

const TIME_TYPES = [
  { label: 'Escolher horário', value: 'specific', icon: 'access-time' },
  { label: 'Ao Acordar', value: 'wake_up', icon: 'wb-sunny' },
  { label: 'Antes de Dormir', value: 'before_sleep', icon: 'bedtime' },
  { label: 'Flexível', value: 'flexible', icon: 'schedule' },
];

export default function PracticeScheduleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId, scheduleId } = useLocalSearchParams<{ cocreationId: string; scheduleId?: string }>();
  const { loading, createSchedule, updateSchedule, loadSingle } = usePracticeSchedules(cocreationId || '');

  const [schedule, setSchedule] = useState<any>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  const [mode, setMode] = useState<'flow' | 'routine'>('flow');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [timeType, setTimeType] = useState<'specific' | 'wake_up' | 'before_sleep' | 'flexible'>('flexible');
  const [specificTime, setSpecificTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });

  // Load existing schedule if editing
  useEffect(() => {
    if (scheduleId) {
      loadExistingSchedule();
    }
  }, [scheduleId]);

  const loadExistingSchedule = async () => {
    if (!scheduleId) return;

    setIsLoadingSchedule(true);
    const result = await loadSingle(scheduleId);
    if (result.data) {
      setSchedule(result.data);
    }
    setIsLoadingSchedule(false);
  };

  useEffect(() => {
    if (schedule) {
      setMode(schedule.mode);
      
      if (schedule.mode === 'routine') {
        if (schedule.days_of_week) {
          setSelectedDays(schedule.days_of_week);
          setIsDailyMode(false);
        } else {
          setIsDailyMode(true);
        }
        
        setTimeType(schedule.time_type || 'flexible');
        
        if (schedule.specific_time) {
          const [hours, minutes] = schedule.specific_time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes));
          setSpecificTime(date);
        }
        
        setSelectedPractices(schedule.practices || []);
        
        if (schedule.duration_hours) {
          setDurationHours(schedule.duration_hours.toString());
        }
        
        if (schedule.duration_minutes) {
          setDurationMinutes(schedule.duration_minutes.toString());
        }
      }
    }
  }, [schedule]);

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: any[]
  ) => {
    setModalConfig({ title, message, type, buttons });
    setModalVisible(true);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const togglePractice = (practice: string) => {
    setSelectedPractices(prev =>
      prev.includes(practice) ? prev.filter(p => p !== practice) : [...prev, practice]
    );
  };

  const handleSave = async () => {
    if (mode === 'routine') {
      if (selectedPractices.length === 0) {
        showModal('Erro', 'Selecione pelo menos uma prática.', 'error');
        return;
      }

      if (!isDailyMode && selectedDays.length === 0) {
        showModal('Erro', 'Selecione pelo menos um dia da semana ou escolha "Diário".', 'error');
        return;
      }
    }

    setIsSaving(true);

    try {
      const scheduleData = {
        mode,
        days_of_week: mode === 'routine' ? (isDailyMode ? null : selectedDays) : null,
        time_type: mode === 'routine' ? timeType : null,
        specific_time: mode === 'routine' && timeType === 'specific' 
          ? `${specificTime.getHours().toString().padStart(2, '0')}:${specificTime.getMinutes().toString().padStart(2, '0')}`
          : null,
        practices: mode === 'routine' ? selectedPractices : [],
        duration_hours: durationHours ? parseInt(durationHours) : null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
      };

      let result;
      if (schedule) {
        result = await updateSchedule(schedule.id, scheduleData);
      } else {
        result = await createSchedule(scheduleData);
      }

      if (result.error) {
        console.error('Error saving schedule:', result.error);
        showModal('Erro', 'Não foi possível salvar o agendamento. Tente novamente.', 'error');
      } else {
        showModal(
          'Sucesso',
          mode === 'flow' 
            ? 'Modo Fluir ativado. Pratique quando sentir a energia te chamar.'
            : 'Rotina de práticas configurada com sucesso!',
          'success',
          [{
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }]
        );
      }
    } catch (error) {
      console.error('Unexpected error saving schedule:', error);
      showModal('Erro Inesperado', 'Algo deu errado. Tente novamente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };



  if (loading || isLoadingSchedule) {
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


        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            {schedule ? 'Editar Momento' : 'Novo Momento'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Configure suas práticas diárias
          </Text>
        </View>

        {/* Mode Selection */}
        <SacredCard glowing style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Escolha seu Modo
          </Text>

          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                {
                  backgroundColor: mode === 'flow' ? colors.primary + '20' : colors.surface,
                  borderColor: mode === 'flow' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setMode('flow')}
            >
              <MaterialIcons 
                name="water-drop" 
                size={32} 
                color={mode === 'flow' ? colors.primary : colors.textMuted} 
              />
              <Text style={[
                styles.modeTitle, 
                { color: mode === 'flow' ? colors.primary : colors.text }
              ]}>
                Deixar Fluir
              </Text>
              <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                Pratique quando sentir a energia te chamar
              </Text>
              {mode === 'flow' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={24} 
                  color={colors.primary} 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                {
                  backgroundColor: mode === 'routine' ? colors.primary + '20' : colors.surface,
                  borderColor: mode === 'routine' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setMode('routine')}
            >
              <MaterialIcons 
                name="event-repeat" 
                size={32} 
                color={mode === 'routine' ? colors.primary : colors.textMuted} 
              />
              <Text style={[
                styles.modeTitle, 
                { color: mode === 'routine' ? colors.primary : colors.text }
              ]}>
                Criar Rotina
              </Text>
              <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                Agende práticas regulares com horários
              </Text>
              {mode === 'routine' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={24} 
                  color={colors.primary} 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </SacredCard>

        {/* Routine Configuration */}
        {mode === 'routine' && (
          <>
            {/* Days Selection */}
            <SacredCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Dias da Semana
              </Text>

              <TouchableOpacity
                style={[
                  styles.dailyButton,
                  {
                    backgroundColor: isDailyMode ? colors.primary + '20' : colors.surface,
                    borderColor: isDailyMode ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setIsDailyMode(!isDailyMode);
                  if (!isDailyMode) {
                    setSelectedDays([]);
                  }
                }}
              >
                <MaterialIcons 
                  name="calendar-today" 
                  size={20} 
                  color={isDailyMode ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.dailyButtonText, 
                  { color: isDailyMode ? colors.primary : colors.text }
                ]}>
                  Diário (Todos os dias)
                </Text>
                {isDailyMode && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {!isDailyMode && (
                <View style={styles.daysGrid}>
                  {DAYS_OF_WEEK.map(day => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: selectedDays.includes(day.value) 
                            ? colors.primary 
                            : colors.surface,
                          borderColor: selectedDays.includes(day.value) 
                            ? colors.primary 
                            : colors.border,
                          shadowColor: selectedDays.includes(day.value) ? colors.primary : 'transparent',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: selectedDays.includes(day.value) ? 0.4 : 0,
                          shadowRadius: 8,
                          elevation: selectedDays.includes(day.value) ? 8 : 0,
                        },
                      ]}
                      onPress={() => toggleDay(day.value)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        { color: selectedDays.includes(day.value) ? 'white' : colors.text }
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </SacredCard>

            {/* Time Type Selection */}
            <SacredCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Horário
              </Text>

              <View style={styles.timeTypeGrid}>
                {TIME_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.timeTypeButton,
                      {
                        backgroundColor: timeType === type.value ? colors.primary + '30' : colors.surface,
                        borderColor: timeType === type.value ? colors.primary : colors.border,
                        borderWidth: timeType === type.value ? 2 : 1,
                        shadowColor: timeType === type.value ? colors.primary : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: timeType === type.value ? 0.3 : 0,
                        shadowRadius: 8,
                        elevation: timeType === type.value ? 8 : 0,
                      },
                    ]}
                    onPress={() => setTimeType(type.value as any)}
                  >
                    <MaterialIcons 
                      name={type.icon as any} 
                      size={24} 
                      color={timeType === type.value ? colors.primary : colors.textMuted} 
                    />
                    <Text style={[
                      styles.timeTypeText,
                      { color: timeType === type.value ? colors.primary : colors.text }
                    ]}>
                      {type.label}
                    </Text>
                    {timeType === type.value && (
                      <MaterialIcons 
                        name="check-circle" 
                        size={20} 
                        color={colors.primary} 
                        style={styles.timeTypeCheck}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {timeType === 'specific' && (
                <View style={styles.timePickerContainer}>
                  <TouchableOpacity
                    style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <MaterialIcons name="access-time" size={20} color={colors.primary} />
                    <Text style={[styles.timePickerText, { color: colors.text }]}>
                      {specificTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={specificTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowTimePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          setSpecificTime(selectedDate);
                        }
                      }}
                    />
                  )}
                </View>
              )}
            </SacredCard>

            {/* Practices Selection */}
            <SacredCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Práticas *
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Escolha pelo menos uma prática
              </Text>

              <View style={styles.practicesGrid}>
                {PRACTICES.map(practice => (
                  <TouchableOpacity
                    key={practice.value}
                    style={[
                      styles.practiceButton,
                      {
                        backgroundColor: selectedPractices.includes(practice.value) 
                          ? colors.primary + '30' 
                          : colors.surface,
                        borderColor: selectedPractices.includes(practice.value) 
                          ? colors.primary 
                          : colors.border,
                        borderWidth: selectedPractices.includes(practice.value) ? 2 : 1,
                        shadowColor: selectedPractices.includes(practice.value) ? colors.primary : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: selectedPractices.includes(practice.value) ? 0.4 : 0,
                        shadowRadius: 8,
                        elevation: selectedPractices.includes(practice.value) ? 8 : 0,
                      },
                    ]}
                    onPress={() => togglePractice(practice.value)}
                  >
                    <MaterialIcons 
                      name={practice.icon as any} 
                      size={28} 
                      color={selectedPractices.includes(practice.value) ? colors.primary : colors.textMuted} 
                    />
                    <Text style={[
                      styles.practiceText,
                      { color: selectedPractices.includes(practice.value) ? colors.primary : colors.text }
                    ]}>
                      {practice.label}
                    </Text>
                    {selectedPractices.includes(practice.value) && (
                      <MaterialIcons 
                        name="check-circle" 
                        size={20} 
                        color={colors.primary} 
                        style={styles.practiceCheck}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </SacredCard>

            {/* Duration */}
            <SacredCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Duração (Opcional)
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Tempo estimado de prática
              </Text>

              <View style={styles.durationContainer}>
                <View style={styles.durationInput}>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
                    ]}
                    value={durationHours}
                    onChangeText={setDurationHours}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                    horas
                  </Text>
                </View>

                <View style={styles.durationInput}>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
                    ]}
                    value={durationMinutes}
                    onChangeText={setDurationMinutes}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                    minutos
                  </Text>
                </View>
              </View>
            </SacredCard>
          </>
        )}

        {/* Save Button */}
        <View style={styles.submitContainer}>
          <SacredButton
            title={isSaving ? "Salvando..." : "Confirmar"}
            onPress={handleSave}
            loading={isSaving}
          />
        </View>

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
  deleteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modeContainer: {
    gap: Spacing.md,
  },
  modeOption: {
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  dailyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  dailyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeTypeGrid: {
    gap: Spacing.md,
  },
  timeTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    position: 'relative',
  },
  timeTypeText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.md,
    flex: 1,
  },
  timeTypeCheck: {
    marginLeft: Spacing.sm,
  },
  timePickerContainer: {
    marginTop: Spacing.lg,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
  },
  timePickerText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  practicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  practiceButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
    minHeight: 100,
    justifyContent: 'center',
  },
  practiceText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  practiceCheck: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
  durationContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  durationInput: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
  },
  durationLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  submitContainer: {
    marginBottom: Spacing.lg,
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
