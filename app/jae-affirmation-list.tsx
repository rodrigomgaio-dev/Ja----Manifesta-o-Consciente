import React, { useState, useEffect } from 'react';
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
import SacredButton from '@/components/ui/SacredButton';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAffirmations();
  }, []);

  const loadAffirmations = async () => {
    try {
      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('cocreation_id', cocreationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading affirmations:', error);
      } else {
        setAffirmations(data || []);
      }
    } catch (error) {
      console.error('Error loading affirmations:', error);
    } finally {
      setLoading(false);
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
          <MaterialIcons name="psychology" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Afirmações
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Suas afirmações poderosas
          </Text>
        </View>

        {/* Create New Button */}
        <View style={styles.createButtonContainer}>
          <SacredButton
            title="Criar Nova Afirmação"
            onPress={() => router.push(`/affirmations-practice?cocreationId=${cocreationId}&returnTo=jae`)}
            icon={<MaterialIcons name="add" size={20} color="white" />}
          />
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
            {affirmations.map((affirmation) => {
              const category = CATEGORIES[affirmation.category];
              const displayColor = category?.color || colors.primary;

              return (
                <SacredCard key={affirmation.id} style={styles.affirmationCard}>
                  <View style={[styles.affirmationHeader, { borderLeftColor: displayColor }]}>
                    <Text style={styles.affirmationCategoryIcon}>{category?.icon}</Text>
                    <View style={styles.affirmationTextInfo}>
                      <Text style={[styles.affirmationText, { color: colors.text }]}>
                        {affirmation.text_content}
                      </Text>
                      <Text style={[styles.affirmationTimestamp, { color: colors.textMuted }]}>
                        Criada {formatTimestamp(affirmation.created_at)}
                      </Text>
                    </View>
                  </View>
                </SacredCard>
              );
            })}
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
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  createButtonContainer: {
    marginBottom: Spacing.xl,
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
  affirmationsList: {
    marginBottom: Spacing.xl,
  },
  affirmationCard: {
    marginBottom: Spacing.lg,
    padding: 0,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  affirmationCategoryIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  affirmationTextInfo: {
    flex: 1,
  },
  affirmationText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  affirmationTimestamp: {
    fontSize: 12,
  },
});
