import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  
  // Separar cocriações por status
  const activeOnes = activeCocriations.filter(c => c.status === 'active');
  const inactiveOnes = activeCocriations.filter(c => c.status === 'inactive');
  const definingOnes = activeCocriations.filter(c => c.status === 'defining');

  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  useEffect(() => {
    // Verificar e atualizar status das cocriações
    activeCocriations.forEach(async (cocriation) => {
      if (cocriation.status === 'defining') {
        // Verificar se todos os requisitos estão completos (exceto carta ao futuro)
        const visionBoardDone = cocriation.vision_board_completed;
        const scheduleDone = cocriation.practice_schedule_completed;
        const letterStatus = cocriation.future_letter_completed;

        // Se Vision Board e Schedule estão completos
        if (visionBoardDone && scheduleDone) {
          // Se a carta foi enviada (true) ou não enviada (false), ativa a cocriação
          if (letterStatus === true || letterStatus === false) {
            await updateCocriation(cocriation.id, { status: 'active' });
          }
        }
      }
    });
  }, [cocriations]);

  const handleCreateNew = () => {
    router.push('/create-individual');
  };



  const renderCocriation = (cocriation: any) => {
    const isDefining = cocriation.status === 'defining';
    const isActive = cocriation.status === 'active';
    const isInactive = cocriation.status === 'inactive';
    const letterNotSent = cocriation.future_letter_completed === false;
    
    return (
      <SacredCard 
        key={cocriation.id}
        animated
        onPress={() => router.push(`/cocriacao-details?id=${cocriation.id}`)}
        style={[
          styles.cocriationCard,
          isActive && styles.activeCard
        ]}
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
            <View style={styles.statusContainer}>
              {/* Warning icon for letter not sent on active cocreation */}
              {isActive && letterNotSent && (
                <TouchableOpacity 
                  style={styles.warningIconContainer}
                  onPress={() => setTooltipVisible(tooltipVisible === cocriation.id ? null : cocriation.id)}
                >
                  <MaterialIcons name="info" size={20} color={colors.warning} />
                  {tooltipVisible === cocriation.id && (
                    <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
                      <Text style={[styles.tooltipText, { color: colors.warning }]}>
                        Carta ao Futuro não foi enviada
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
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
                    name={cocriation.future_letter_completed === true ? 'check-circle' : cocriation.future_letter_completed === false ? 'cancel' : 'radio-button-unchecked'}
                    size={20} 
                    color={cocriation.future_letter_completed === true ? colors.success : cocriation.future_letter_completed === false ? colors.warning : colors.textMuted}
                  />
                  <Text style={[
                    styles.progressText, 
                    { color: cocriation.future_letter_completed === true ? colors.success : cocriation.future_letter_completed === false ? colors.warning : colors.textMuted }
                  ]}>
                    Carta ao Futuro{cocriation.future_letter_completed === false ? ' (não enviada)' : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Mostrar Momentos de Cocriação quando ativa - Design Místico */}
          {!isDefining && !isInactive && (
            <TouchableOpacity 
              style={styles.mysticMomentButton}
              onPress={() => router.push(`/cocreation-moments?cocreationId=${cocriation.id}`)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)', 'rgba(251, 191, 36, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mysticGradient}
              >
                <View style={styles.mysticIconContainer}>
                  <MaterialIcons name="auto-awesome" size={28} color="#FBBF24" />
                </View>
                <View style={styles.mysticTextContainer}>
                  <Text style={[styles.mysticTitle, { color: colors.text }]}>
                    Momentos de Cocriação
                  </Text>
                  <Text style={[styles.mysticSubtitle, { color: colors.textSecondary }]}>
                    Pratique e manifeste sua realidade
                  </Text>
                </View>
                <View style={styles.mysticArrow}>
                  <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
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
            <>
              {/* Cocriações Ativas */}
              {activeOnes.length > 0 && (
                <View style={styles.sectionGroup}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="stars" size={24} color="#F59E0B" />
                    <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                      Cocriações Ativas
                    </Text>
                  </View>
                  {activeOnes.map(renderCocriation)}
                </View>
              )}
              
              {/* Cocriações Inativas */}
              {inactiveOnes.length > 0 && (
                <View style={styles.sectionGroup}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="pause-circle-outline" size={24} color={colors.textMuted} />
                    <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                      Cocriações Inativas
                    </Text>
                  </View>
                  {inactiveOnes.map(renderCocriation)}
                </View>
              )}
              
              {/* Cocriações em Definição */}
              {definingOnes.length > 0 && (
                <View style={styles.sectionGroup}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="edit" size={24} color={colors.warning} />
                    <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                      Em Definição
                    </Text>
                  </View>
                  {definingOnes.map(renderCocriation)}
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
                'Defina o que deseja Cocriar',
                'Crie seu Vision Board interativo',
                'Planeje seus Momentos de Cocriação',
                'Envia uma carta para o seu EU do futuro',
                'Mantenha-se Presente e firme na sua Cocriação',
                'Celebre sua Cocriação de forma Inesqecível',
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
  activeCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warningIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.sm,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '500',
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
  sectionGroup: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  sectionHeaderText: {
    fontSize: 18,
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
  mysticMomentButton: {
    marginTop: Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mysticGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  mysticIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  mysticTextContainer: {
    flex: 1,
  },
  mysticTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  mysticSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  mysticArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
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
