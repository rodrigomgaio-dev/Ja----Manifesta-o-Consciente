import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useCollectiveCircles } from '@/hooks/useCollectiveCircles';
import { Spacing } from '@/constants/Colors';

export default function PainelScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocriations, loading: loadingIndividual } = useIndividualCocriations();
  const { circles, loading: loadingCircles } = useCollectiveCircles();

  const activeCocriations = cocriations.filter(c => c.status === 'active');
  const activeCircles = circles.filter(c => c.status === 'active' || c.status === 'forming');

  const renderCocriation = (cocriation: any) => (
    <SacredCard
      key={cocriation.id}
      animated
      onPress={() => router.push(`/cocriacao-details?id=${cocriation.id}`)}
      style={styles.itemCard}
    >
        {cocriation.cover_image_url && (
          <Image 
            source={{ uri: cocriation.cover_image_url }} 
            style={styles.coverImage}
            contentFit="cover"
          />
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <MaterialIcons name="person" size={20} color={colors.primary} />
            <Text style={[styles.itemType, { color: colors.primary }]}>
              Individual
            </Text>
          </View>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {cocriation.title}
          </Text>
          {cocriation.mental_code && (
            <Text style={[styles.mentalCode, { color: colors.accent }]}>
              {cocriation.mental_code}
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>
              Ativa
            </Text>
          </View>
        </View>
      </SacredCard>
  );

  const renderCircle = (circle: any) => (
    <SacredCard
      key={circle.id}
      animated
      onPress={() => router.push(`/circle-details?id=${circle.id}`)}
      style={styles.itemCard}
    >
        {circle.cover_image_url && (
          <Image 
            source={{ uri: circle.cover_image_url }} 
            style={styles.coverImage}
            contentFit="cover"
          />
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <MaterialIcons name="group" size={20} color={colors.accent} />
            <Text style={[styles.itemType, { color: colors.accent }]}>
              Círculo
            </Text>
          </View>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {circle.title}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: circle.status === 'active' ? colors.primary + '20' : colors.secondary + '20'
          }]}>
            <Text style={[styles.statusText, { 
              color: circle.status === 'active' ? colors.primary : colors.secondary
            }]}>
              {circle.status === 'active' ? 'Ativo' : 'Formando'}
            </Text>
          </View>
        </View>
      </SacredCard>
  );

  const isLoading = loadingIndividual || loadingCircles;
  const hasItems = activeCocriations.length > 0 || activeCircles.length > 0;

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Painel
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Acompanhe todas as suas cocriações
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <SacredCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {activeCocriations.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Cocriações Ativas
            </Text>
          </SacredCard>
          
          <SacredCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {activeCircles.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Círculos Ativos
            </Text>
          </SacredCard>
        </View>

        {/* Content */}
        {isLoading ? (
          <SacredCard style={styles.loadingCard}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando suas cocriações...
            </Text>
          </SacredCard>
        ) : hasItems ? (
          <>
            {/* Individual Cocriations */}
            {activeCocriations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Minhas Cocriações
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/individual')}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>
                      Ver todas
                    </Text>
                  </TouchableOpacity>
                </View>
                {activeCocriations.map(renderCocriation)}
              </View>
            )}

            {/* Circles */}
            {activeCircles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Círculos de Cocriação
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/circulos')}>
                    <Text style={[styles.seeAll, { color: colors.accent }]}>
                      Ver todos
                    </Text>
                  </TouchableOpacity>
                </View>
                {activeCircles.map(renderCircle)}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="auto-awesome" 
              size={64} 
              color={colors.textMuted} 
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sua jornada começa aqui
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
              Crie sua primeira cocriação ou participe de um círculo para começar
            </Text>
          </View>
        )}
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
    fontSize: 32,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemCard: {
    marginBottom: Spacing.md,
  },
  coverImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: Spacing.md,
  },
  itemContent: {
    gap: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  mentalCode: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
