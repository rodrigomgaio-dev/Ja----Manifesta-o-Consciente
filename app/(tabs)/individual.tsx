import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

export default function IndividualScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocriations, loading, createCocriation } = useIndividualCocriations();

  const handleCreateNew = async () => {
    // For now, create a sample cocreation - later we'll add a proper form
    const newCocriation = {
      title: 'Minha Nova Cocriação',
      description: 'Uma jornada de manifestação pessoal',
      mental_code: 'NOVA_ENERGIA',
      why_reason: 'Para expandir minha consciência e manifestar abundância'
    };

    const { data, error } = await createCocriation(newCocriation);
    if (error) {
      console.error('Error creating cocriation:', error);
    } else {
      console.log('Cocriation created successfully:', data);
    }
  };

  const renderCocriation = (cocriation: any) => (
    <SacredCard key={cocriation.id} style={styles.cocriationCard}>
      <View style={styles.cocriationHeader}>
        <View style={styles.cocriationInfo}>
          <Text style={[styles.cocriationTitle, { color: colors.text }]}>
            {cocriation.title}
          </Text>
          {cocriation.mental_code && (
            <Text style={[styles.mentalCode, { color: colors.primary }]}>
              {cocriation.mental_code}
            </Text>
          )}
          {cocriation.description && (
            <Text style={[styles.cocriationDescription, { color: colors.textSecondary }]}>
              {cocriation.description}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: cocriation.status === 'active' ? colors.primary + '20' : colors.success + '20' 
        }]}>
          <Text style={[styles.statusText, { 
            color: cocriation.status === 'active' ? colors.primary : colors.success 
          }]}>
            {cocriation.status === 'active' ? 'Ativa' : 'Concluída'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cocriationActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="dashboard" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Vision Board
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="self-improvement" size={20} color={colors.accent} />
          <Text style={[styles.actionText, { color: colors.accent }]}>
            Práticas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="mail-outline" size={20} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.secondary }]}>
            Carta
          </Text>
        </TouchableOpacity>
      </View>
    </SacredCard>
  );

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Cocriação Individual
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sua jornada pessoal de manifestação
          </Text>
        </View>

        {/* Create New */}
        <SacredCard glowing style={styles.createCard}>
          <View style={styles.createContent}>
            <MaterialIcons 
              name="add-circle-outline" 
              size={48} 
              color={colors.primary} 
            />
            <Text style={[styles.createTitle, { color: colors.text }]}>
              Nova Cocriação
            </Text>
            <Text style={[styles.createDescription, { color: colors.textSecondary }]}>
              Inicie uma nova jornada de manifestação com seu Vision Board personalizado
            </Text>
            <SacredButton
              title="Começar Agora"
              onPress={handleCreateNew}
              style={styles.createButton}
            />
          </View>
        </SacredCard>

        {/* My Cocriations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Minhas Cocriações
          </Text>
          
          {loading ? (
            <SacredCard style={styles.loadingCard}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Carregando suas cocriações...
              </Text>
            </SacredCard>
          ) : cocriations.length > 0 ? (
            cocriations.map(renderCocriation)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons 
                name="auto-awesome" 
                size={64} 
                color={colors.textMuted} 
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sua primeira jornada te espera
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                Crie sua primeira cocriação e comece a manifestar seus sonhos
              </Text>
            </View>
          )}
        </View>

        {/* Process Info */}
        <SacredCard style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Como Funciona
          </Text>
          <View style={styles.infoList}>
            {[
              'Defina seu título e descrição',
              'Escolha um código mental (apelido)',
              'Crie seu Vision Board interativo',
              'Defina práticas diárias personalizadas',
              'Escreva uma carta para o futuro',
              'Acompanhe sua jornada com presença',
            ].map((step, index) => (
              <View key={index} style={styles.infoItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepText}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
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
  createCard: {
    marginBottom: Spacing.xl,
  },
  createContent: {
    alignItems: 'center',
  },
  createTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  createDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  createButton: {
    minWidth: 160,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  cocriationCard: {
    marginBottom: Spacing.md,
  },
  cocriationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cocriationInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  cocriationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  mentalCode: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  cocriationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cocriationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  infoList: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});