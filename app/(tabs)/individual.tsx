import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

export default function IndividualScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocriations, loading, updateCocriation } = useIndividualCocriations();

  // Filtrar apenas cocriações não concluídas
  const activeCocriations = cocriations.filter(c => c.status !== 'completed');

  useEffect(() => {
    // Verificar e atualizar status das cocriações
    activeCocriations.forEach(async (cocriation) => {
      if (cocriation.status === 'defining') {
        // Verificar se todos os requisitos estão completos
        if (
          cocriation.vision_board_completed &&
          cocriation.practice_schedule_completed &&
          cocriation.future_letter_completed
        ) {
          // Atualizar status para active
          await updateCocriation(cocriation.id, { status: 'active' });
        }
      }
    });
  }, [cocriations]);

  const handleCreateNew = () => {
    router.push('/create-individual');
  };

  const renderCocriation = (cocriation: any) => {
    const isDefining = cocriation.status === 'defining';
    
    return (
      <SacredCard 
        key={cocriation.id}
        animated
        onPress={() => router.push(`/cocriacao-details?id=${cocriation.id}`)}
        style={styles.cocriationCard}
      >
        {cocriation.cover_image_url && (
          <Image 
            source={{ uri: cocriation.cover_image_url }} 
            style={styles.coverImage}
            contentFit="cover"
          />
        )}
        
        <View style={styles.cocriationContent}>
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
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: cocriation.status === 'active' ? colors.success + '20' : colors.warning + '20'
            }]}>
              <Text style={[styles.statusText, { 
                color: cocriation.status === 'active' ? colors.success : colors.warning
              }]}>
                {cocriation.status === 'active' ? 'Ativa' : 'Definindo'}
              </Text>
            </View>
          </View>

          {/* Mostrar itens pendentes/completos apenas no status "defining" */}
          {isDefining && (
            <View style={styles.progressSection}>
              <Text style={[styles.progressTitle, { color: colors.textSecondary }]}>
                Itens para Completar:
              </Text>
              <View style={styles.progressItems}>
                <View style={styles.progressItem}>
                  <MaterialIcons 
                    name={cocriation.vision_board_completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={20} 
                    color={cocriation.vision_board_completed ? colors.success : colors.textMuted}
                  />
                  <Text style={[
                    styles.progressText, 
                    { color: cocriation.vision_board_completed ? colors.success : colors.textMuted }
                  ]}>
                    Vision Board
                  </Text>
                </View>
                
                <View style={styles.progressItem}>
                  <MaterialIcons 
                    name={cocriation.practice_schedule_completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={20} 
                    color={cocriation.practice_schedule_completed ? colors.success : colors.textMuted}
                  />
                  <Text style={[
                    styles.progressText, 
                    { color: cocriation.practice_schedule_completed ? colors.success : colors.textMuted }
                  ]}>
                    Momentos de Cocriação
                  </Text>
                </View>
                
                <View style={styles.progressItem}>
                  <MaterialIcons 
                    name={cocriation.future_letter_completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={20} 
                    color={cocriation.future_letter_completed ? colors.success : colors.textMuted}
                  />
                  <Text style={[
                    styles.progressText, 
                    { color: cocriation.future_letter_completed ? colors.success : colors.textMuted }
                  ]}>
                    Carta ao Futuro
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Mostrar apenas Momentos de Cocriação quando ativa */}
          {!isDefining && (
            <View style={styles.activeActions}>
              <TouchableOpacity 
                style={styles.activeActionButton}
                onPress={() => router.push(`/practice-schedule?cocreationId=${cocriation.id}`)}
              >
                <MaterialIcons name="self-improvement" size={20} color={colors.primary} />
                <Text style={[styles.activeActionText, { color: colors.primary }]}>
                  Momentos de Cocriação
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SacredCard>
    );
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Minhas Cocriações
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Vision Board e práticas pessoais
          </Text>
        </View>

        {/* Botão Criar Nova (apenas quando houver cocriações) */}
        {!loading && activeCocriations.length > 0 && (
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              style={[styles.createSmallButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateNew}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.createSmallButtonText}>Nova Cocriação</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create New Card (apenas quando NÃO houver cocriações) */}
        {!loading && activeCocriations.length === 0 && (
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
        )}

        {/* My Cocriations */}
        <View style={styles.section}>
          {loading ? (
            <SacredCard style={styles.loadingCard}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Carregando suas cocriações...
              </Text>
            </SacredCard>
          ) : activeCocriations.length > 0 ? (
            activeCocriations.map(renderCocriation)
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
        {activeCocriations.length === 0 && (
          <SacredCard style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Como Funciona
            </Text>
            <View style={styles.infoList}>
              {[
                'Defina seu título e descrição',
                'Escolha um código mental (apelido)',
                'Crie seu Vision Board interativo',
                'Configure seus Momentos de Cocriação',
                'Escreva uma carta para o futuro (ou não)',
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
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  createButtonContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  createSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  createSmallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  cocriationCard: {
    marginBottom: Spacing.md,
    padding: 0,
  },
  coverImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cocriationContent: {
    padding: Spacing.lg,
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
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  progressItems: {
    gap: Spacing.sm,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  activeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  activeActionText: {
    fontSize: 14,
    fontWeight: '600',
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
