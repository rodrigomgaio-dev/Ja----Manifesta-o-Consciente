import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

const ALL_PRACTICES = [
  { 
    label: 'Gratidão', 
    value: 'gratitude', 
    icon: 'favorite',
    color: '#EC4899',
    gradient: ['#EC4899', '#F97316', '#FBBF24'],
    description: 'Celebre as bênçãos da sua vida'
  },
  { 
    label: 'Meditação', 
    value: 'meditation', 
    icon: 'self-improvement',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#EC4899'],
    description: 'Encontre paz no silêncio interior'
  },
  { 
    label: 'Mantram', 
    value: 'mantram', 
    icon: 'record-voice-over',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#8B5CF6'],
    description: 'Vibre com sons sagrados'
  },
  { 
    label: 'Afirmação', 
    value: 'affirmation', 
    icon: 'psychology',
    color: '#10B981',
    gradient: ['#10B981', '#3B82F6'],
    description: 'Reprograme sua mente consciente'
  },
];

export default function JaePracticeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId, scheduleId, mode, practices: practicesParam } = useLocalSearchParams<{ 
    cocreationId: string;
    scheduleId: string;
    mode: 'flow' | 'routine';
    practices?: string;
  }>();

  // Parse practices from route params
  const scheduledPractices = practicesParam ? practicesParam.split(',') : [];
  
  // Show all practices for "flow" mode, only scheduled practices for "routine" mode
  const availablePractices = mode === 'flow' 
    ? ALL_PRACTICES 
    : ALL_PRACTICES.filter(p => scheduledPractices.includes(p.value));

  const handlePracticeSelect = (practice: typeof ALL_PRACTICES[0]) => {
    switch (practice.value) {
      case 'gratitude':
        router.push(`/gratitude-practice?cocreationId=${cocreationId}`);
        break;
      case 'meditation':
        router.push(`/jae-meditation-list?cocreationId=${cocreationId}`);
        break;
      case 'mantram':
        router.push(`/jae-mantram-list?cocreationId=${cocreationId}`);
        break;
      case 'affirmation':
        router.push(`/jae-affirmation-list?cocreationId=${cocreationId}`);
        break;
    }
  };

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

        {/* Title */}
        <View style={styles.titleSection}>
          <View style={[styles.jaeLogoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.jaeLogoText}>Jaé</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Escolha sua Prática
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {mode === 'flow' 
              ? 'Pratique quando sentir a energia te chamar'
              : 'Práticas configuradas para esta rotina'}
          </Text>
        </View>

        {/* Practices Grid */}
        <View style={styles.practicesGrid}>
          {availablePractices.map((practice) => (
            <TouchableOpacity
              key={practice.value}
              style={styles.practiceCard}
              onPress={() => handlePracticeSelect(practice)}
              activeOpacity={0.8}
            >
              <SacredCard glowing style={[styles.practiceCardInner, { borderColor: practice.color + '40' }]}>
                <View style={[styles.practiceIcon, { backgroundColor: practice.color + '20' }]}>
                  <MaterialIcons name={practice.icon as any} size={40} color={practice.color} />
                </View>
                <Text style={[styles.practiceLabel, { color: colors.text }]}>
                  {practice.label}
                </Text>
                <Text style={[styles.practiceDescription, { color: colors.textSecondary }]}>
                  {practice.description}
                </Text>
                <View style={[styles.practiceArrow, { backgroundColor: practice.color }]}>
                  <MaterialIcons name="arrow-forward" size={20} color="white" />
                </View>
              </SacredCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <MaterialIcons name="auto-awesome" size={32} color={colors.primary} />
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "A prática diária é o caminho da manifestação. Escolha sua ferramenta e co-crie sua realidade."
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  jaeLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  jaeLogoText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
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
  practicesGrid: {
    marginBottom: Spacing.lg,
  },
  practiceCard: {
    marginBottom: Spacing.lg,
  },
  practiceCardInner: {
    alignItems: 'center',
    padding: Spacing.xl,
    position: 'relative',
    borderWidth: 2,
  },
  practiceIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  practiceLabel: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  practiceDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  practiceArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
  },
  quoteCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  quote: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.md,
  },
});
