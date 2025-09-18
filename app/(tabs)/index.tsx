import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, BorderRadius } from '@/constants/Colors';
import { router, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useRouter();

  // Handle circle invitation from URL parameters (web only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Add delay to ensure router is fully mounted
      const timer = setTimeout(() => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const circleInviteToken = urlParams.get('circleInviteToken');

          console.log('Home screen - checking for invite token:', circleInviteToken);

          if (circleInviteToken && navigation) {
            console.log('Redirecting to circle invite with token:', circleInviteToken);
            // Redirect internally to invitation screen
            router.replace({
              pathname: '/circle-invite/[token]',
              params: { token: circleInviteToken },
            });
          }
        } catch (error) {
          console.log('Navigation not ready yet or error:', error);
        }
      }, 100); // Wait 100ms for router to be ready

      return () => clearTimeout(timer);
    }
  }, [navigation]);

  const handleCreateIndividual = () => {
    router.push('/create-individual');
  };

  const handleCreateCircle = () => {
    router.push('/create-circle');
  };

  const handleGoToIndividual = () => {
    router.push('/(tabs)/individual');
  };

  const handleGoToCircles = () => {
    router.push('/(tabs)/circulos');
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Bem-vindo ao
          </Text>
          <Text style={[styles.appName, { color: colors.text }]}>
            Jaé
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Manifestação Consciente através da Presença
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Começar Jornada
          </Text>
          
          <SacredCard glowing style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons 
                name="person" 
                size={28} 
                color={colors.primary} 
              />
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Cocriação Individual
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Crie seu Vision Board e manifeste seus desejos em silêncio
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <SacredButton
                title="Nova Cocriação"
                onPress={handleCreateIndividual}
                size="sm"
                style={styles.cardButton}
              />
              <SacredButton
                title="Ver Minhas"
                onPress={handleGoToIndividual}
                variant="outline"
                size="sm"
                style={styles.cardButton}
              />
            </View>
          </SacredCard>
          
          <SacredCard style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons 
                name="group" 
                size={28} 
                color={colors.accent} 
              />
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Círculo de Cocriação
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Forme um círculo íntimo para manifestar juntos
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <SacredButton
                title="Criar Círculo"
                onPress={handleCreateCircle}
                variant="outline"
                size="sm"
                style={styles.cardButton}
              />
              <SacredButton
                title="Ver Meus"
                onPress={handleGoToCircles}
                variant="outline"
                size="sm"
                style={styles.cardButton}
              />
            </View>
          </SacredCard>
        </View>

        {/* Daily Practices */}
        <View style={styles.dailyPractices}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Práticas Diárias
          </Text>
          
          <View style={styles.practicesGrid}>
            {[
              { icon: 'favorite', title: 'Gratidão', color: colors.secondary },
              { icon: 'self-improvement', title: 'Meditação', color: colors.primary },
              { icon: 'record-voice-over', title: 'Mantrams', color: colors.accent },
              { icon: 'psychology', title: 'Afirmações', color: colors.primary },
            ].map((practice, index) => (
              <SacredCard key={index} style={styles.practiceCard}>
                <MaterialIcons 
                  name={practice.icon as any} 
                  size={24} 
                  color={practice.color} 
                />
                <Text style={[styles.practiceTitle, { color: colors.text }]}>
                  {practice.title}
                </Text>
              </SacredCard>
            ))}
          </View>
        </View>

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "A manifestação acontece no silêncio da presença, onde intenção e emoção se encontram."
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
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  greeting: {
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  appName: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  actionCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardButton: {
    flex: 1,
  },
  dailyPractices: {
    marginBottom: Spacing.xl,
  },
  practicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  practiceCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  practiceTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  quoteCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
});