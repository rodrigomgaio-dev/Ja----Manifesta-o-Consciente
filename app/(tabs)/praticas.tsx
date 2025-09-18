import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, BorderRadius } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function PraticasScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const practices = [
    {
      icon: 'favorite',
      title: 'Gratidão',
      description: 'Cultive a gratidão em seu coração',
      color: colors.secondary,
      duration: '5-10 min',
    },
    {
      icon: 'self-improvement',
      title: 'Meditação',
      description: 'Encontre paz no silêncio interior',
      color: colors.primary,
      duration: '10-20 min',
    },
    {
      icon: 'record-voice-over',
      title: 'Mantrams',
      description: 'Vibre com sons sagrados',
      color: colors.accent,
      duration: '5-15 min',
    },
    {
      icon: 'psychology',
      title: 'Afirmações',
      description: 'Reprograme sua mente consciente',
      color: colors.primary,
      duration: '5-10 min',
    },
  ];

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Práticas Diárias
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Eleve sua vibração através da presença
          </Text>
        </View>

        {/* Today's Intention */}
        <SacredCard glowing style={styles.intentionCard}>
          <Text style={[styles.intentionTitle, { color: colors.text }]}>
            Intenção do Dia
          </Text>
          <Text style={[styles.intentionText, { color: colors.textSecondary }]}>
            "Hoje me conecto com minha essência divina e manifesto a partir do amor"
          </Text>
          <SacredButton
            title="Definir Nova Intenção"
            onPress={() => {}}
            variant="outline"
            size="sm"
            style={styles.intentionButton}
          />
        </SacredCard>

        {/* Practices Grid */}
        <View style={styles.practicesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Escolha sua Prática
          </Text>
          
          <View style={styles.practicesGrid}>
            {practices.map((practice, index) => (
              <SacredCard key={index} style={styles.practiceCard}>
                <View style={styles.practiceHeader}>
                  <MaterialIcons 
                    name={practice.icon as any} 
                    size={32} 
                    color={practice.color} 
                  />
                  <Text style={[styles.practiceTitle, { color: colors.text }]}>
                    {practice.title}
                  </Text>
                </View>
                <Text style={[styles.practiceDescription, { color: colors.textSecondary }]}>
                  {practice.description}
                </Text>
                <Text style={[styles.practiceDuration, { color: colors.textMuted }]}>
                  {practice.duration}
                </Text>
                <SacredButton
                  title="Praticar"
                  onPress={() => {}}
                  size="sm"
                  style={styles.practiceButton}
                />
              </SacredCard>
            ))}
          </View>
        </View>

        {/* Sacred Reminders */}
        <SacredCard style={styles.remindersCard}>
          <Text style={[styles.remindersTitle, { color: colors.text }]}>
            Lembretes Sagrados
          </Text>
          <View style={styles.remindersList}>
            {[
              'Práticas não requerem notificações externas',
              'O silêncio é seu maior aliado',
              'A consistência supera a duração',
              'Cada momento é uma oportunidade de presença',
              'Sua intenção é mais poderosa que técnica',
            ].map((reminder, index) => (
              <View key={index} style={styles.reminderItem}>
                <MaterialIcons 
                  name="auto-awesome" 
                  size={16} 
                  color={colors.primary} 
                />
                <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
                  {reminder}
                </Text>
              </View>
            ))}
          </View>
        </SacredCard>

        {/* Integration Option */}
        <SacredCard style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <MaterialIcons 
              name="event" 
              size={28} 
              color={colors.accent} 
            />
            <View style={styles.integrationText}>
              <Text style={[styles.integrationTitle, { color: colors.text }]}>
                Integração com Calendário
              </Text>
              <Text style={[styles.integrationDescription, { color: colors.textSecondary }]}>
                Opcional: sincronize horários com Google Calendar
              </Text>
            </View>
          </View>
          <SacredButton
            title="Configurar"
            onPress={() => {}}
            variant="outline"
            size="sm"
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
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  intentionCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  intentionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  intentionText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  intentionButton: {
    alignSelf: 'center',
  },
  practicesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  practicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  practiceCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  practiceHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  practiceDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  practiceDuration: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  practiceButton: {
    minWidth: 80,
  },
  remindersCard: {
    marginBottom: Spacing.lg,
  },
  remindersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  remindersList: {
    gap: Spacing.md,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  integrationCard: {
    marginBottom: Spacing.xl,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  integrationText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  integrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  integrationDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});