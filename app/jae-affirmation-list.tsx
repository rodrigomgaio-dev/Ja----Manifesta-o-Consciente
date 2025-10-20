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
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Colors';
import { supabase } from '@/services/supabase';

interface Affirmation {
  id: string;
  text_content: string;
  category: string;
  created_at: string;
}

const CATEGORIES: Record<string, { color: string; icon: string }> = {
  abundance: { color: '#3B82F6', icon: '💰' },
  love: { color: '#EC4899', icon: '❤️' },
  health: { color: '#10B981', icon: '⭐' },
  success: { color: '#F59E0B', icon: '⚡' },
};

export default function JaeAffirmationListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();

  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [selectedAffirmationIds, setSelectedAffirmationIds] = useState<string[]>([]);
  const [cocreationTitle, setCocreationTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadAffirmations();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAffirmations();
    }, [cocreationId])
  );

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const loadAffirmations = async () => {
    try {
      // Load cocreation title
      const { data: cocreation, error: cocreationError } = await supabase
        .from('individual_cocriations')
        .select('title')
        .eq('id', cocreationId)
        .single();

      if (cocreationError) {
        console.error('Error loading cocreation:', cocreationError);
      } else {
        setCocreationTitle(cocreation?.title || '');
      }

      // Load ALL user affirmations
      const { data: allAffirmations, error: affirmationsError } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (affirmationsError) {
        console.error('Error loading affirmations:', affirmationsError);
        return;
      }

      // Load selected affirmations for this cocreation
      const { data: selectedLinks, error: linksError } = await supabase
        .from('cocreation_affirmations')
        .select('affirmation_id')
        .eq('cocreation_id', cocreationId);

      if (linksError) {
        console.error('Error loading affirmation links:', linksError);
      }

      setAffirmations(allAffirmations || []);
      setSelectedAffirmationIds((selectedLinks || []).map(link => link.affirmation_id));
    } catch (error) {
      console.error('Error loading affirmations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAffirmationSelection = async (affirmationId: string) => {
    const isSelected = selectedAffirmationIds.includes(affirmationId);

    try {
      if (isSelected) {
        // Remove from selection
        const { error } = await supabase
          .from('cocreation_affirmations')
          .delete()
          .eq('cocreation_id', cocreationId)
          .eq('affirmation_id', affirmationId);

        if (error) throw error;

        setSelectedAffirmationIds(prev => prev.filter(id => id !== affirmationId));
        showModal('Removida', 'Afirmação removida desta cocriação.', 'success');
      } else {
        // Add to selection
        const { error } = await supabase
          .from('cocreation_affirmations')
          .insert({
            cocreation_id: cocreationId,
            affirmation_id: affirmationId,
          });

        if (error) throw error;

        setSelectedAffirmationIds(prev => [...prev, affirmationId]);
        showModal('Adicionada', 'Afirmação adicionada a esta cocriação!', 'success');
      }
    } catch (error) {
      console.error('Error toggling affirmation selection:', error);
      showModal('Erro', 'Não foi possível atualizar a seleção.', 'error');
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays} dias`;
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
          <MaterialIcons name="psychology" size={48} color="#10B981" />
          <Text style={[styles.title, { color: colors.text }]}>
            Momento de Afirmação
          </Text>
        </View>

        {/* Cocreation Title */}
        {cocreationTitle && (
          <View style={styles.cocreationTitleContainer}>
            <Text style={[styles.cocreationTitle, { color: '#10B981' }]}>
              Cocriando {cocreationTitle}
            </Text>
          </View>
        )}

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Reprograme sua mente consciente
          </Text>
        </View>

        {/* Affirmations List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando...
            </Text>
          </View>
        ) : affirmations.length === 0 ? (
          <SacredCard glowing style={styles.emptyCard}>
            <MaterialIcons name="psychology" size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma afirmação criada
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Clique em "Criar Nova Afirmação" para começar
            </Text>
          </SacredCard>
        ) : (
          <View style={styles.affirmationsList}>
            {/* Selected Affirmations Section */}
            {selectedAffirmationIds.length > 0 ? (
              <View style={styles.selectedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  ⭐ Afirmações desta Cocriação
                </Text>
                {affirmations
                  .filter(a => selectedAffirmationIds.includes(a.id))
                  .map((affirmation) => {
                    const category = CATEGORIES[affirmation.category];
                    const displayColor = category?.color || colors.primary;

                    return (
                      <SacredCard key={affirmation.id} style={styles.affirmationCard}>
                        <View style={[styles.affirmationHeader, { borderLeftColor: displayColor }]}>
                          {/* Star Selection */}
                          <TouchableOpacity
                            style={styles.starButton}
                            onPress={() => toggleAffirmationSelection(affirmation.id)}
                          >
                            <MaterialIcons 
                              name="star" 
                              size={24} 
                              color="#F59E0B" 
                            />
                          </TouchableOpacity>

                          <View style={styles.affirmationInfo}>
                            {category?.icon && (
                              <Text style={styles.affirmationCategoryIcon}>{category.icon}</Text>
                            )}
                            <View style={styles.affirmationTextInfo}>
                              <Text style={[styles.affirmationText, { color: colors.text }]}>
                                {affirmation.text_content}
                              </Text>
                              <Text style={[styles.affirmationTimestamp, { color: colors.textMuted }]}>
                                Criada {formatTimestamp(affirmation.created_at)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </SacredCard>
                    );
                  })}
              </View>
            ) : (
              <SacredCard style={styles.emptySelectionCard}>
                <MaterialIcons name="info-outline" size={48} color={colors.primary} />
                <Text style={[styles.emptySelectionTitle, { color: colors.text }]}>
                  Nenhuma afirmação selecionada
                </Text>
                <Text style={[styles.emptySelectionDescription, { color: colors.textSecondary }]}>
                  Toque na estrela ao lado da afirmação para adicioná-la a esta cocriação
                </Text>
              </SacredCard>
            )}

            {/* Create New Button */}
            <View style={styles.createButtonContainer}>
              <SacredButton
                title="Criar Nova Afirmação"
                onPress={() => router.push(`/affirmations-practice?cocreationId=${cocreationId}&returnTo=jae`)}
                icon={<MaterialIcons name="add" size={20} color="white" />}
              />
            </View>

            {/* All Affirmations Section */}
            {affirmations.filter(a => !selectedAffirmationIds.includes(a.id)).length > 0 && (
              <View style={styles.allAffirmationsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Todas as Afirmações
                </Text>
                {affirmations
                  .filter(a => !selectedAffirmationIds.includes(a.id))
                  .map((affirmation) => {
                    const category = CATEGORIES[affirmation.category];
                    const displayColor = category?.color || colors.primary;

                    return (
                      <SacredCard key={affirmation.id} style={styles.affirmationCard}>
                        <View style={[styles.affirmationHeader, { borderLeftColor: displayColor }]}>
                          {/* Star Selection */}
                          <TouchableOpacity
                            style={styles.starButton}
                            onPress={() => toggleAffirmationSelection(affirmation.id)}
                          >
                            <MaterialIcons 
                              name="star-outline" 
                              size={24} 
                              color={colors.textMuted} 
                            />
                          </TouchableOpacity>

                          <View style={styles.affirmationInfo}>
                            {category?.icon && (
                              <Text style={styles.affirmationCategoryIcon}>{category.icon}</Text>
                            )}
                            <View style={styles.affirmationTextInfo}>
                              <Text style={[styles.affirmationText, { color: colors.text }]}>
                                {affirmation.text_content}
                              </Text>
                              <Text style={[styles.affirmationTimestamp, { color: colors.textMuted }]}>
                                Criada {formatTimestamp(affirmation.created_at)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </SacredCard>
                    );
                  })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <SacredModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
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
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  cocreationTitleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  cocreationTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  createButtonContainer: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySelectionCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptySelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySelectionDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  affirmationsList: {
    marginBottom: Spacing.xl,
  },
  selectedSection: {
    marginBottom: Spacing.xl,
  },
  allAffirmationsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  affirmationCard: {
    marginBottom: Spacing.sm,
    padding: 0,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    paddingVertical: Spacing.md,
    borderLeftWidth: 4,
  },
  starButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  affirmationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  affirmationCategoryIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  affirmationTextInfo: {
    flex: 1,
  },
  affirmationText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
  },
  affirmationTimestamp: {
    fontSize: 12,
  },
});
