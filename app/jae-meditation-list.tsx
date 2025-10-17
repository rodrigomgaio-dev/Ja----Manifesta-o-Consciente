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
import { Audio } from 'expo-av';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Colors';
import { supabase } from '@/services/supabase';

interface Meditation {
  id: string;
  name: string;
  category: string;
  audio_url: string;
  duration: number;
  created_at: string;
}

const CATEGORIES: Record<string, { color: string; icon: string }> = {
  abundance: { color: '#3B82F6', icon: '💰' },
  love: { color: '#EC4899', icon: '❤️' },
  health: { color: '#10B981', icon: '⭐' },
  success: { color: '#F59E0B', icon: '⚡' },
};

const SILVER_COLOR = '#94A3B8';

export default function JaeMeditationListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();

  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [selectedMeditationIds, setSelectedMeditationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadMeditations();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeditations();
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

  const loadMeditations = async () => {
    try {
      // Load ALL user meditations
      const { data: allMeditations, error: meditationsError } = await supabase
        .from('meditations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (meditationsError) {
        console.error('Error loading meditations:', meditationsError);
        return;
      }

      // Load selected meditations for this cocreation
      const { data: selectedLinks, error: linksError } = await supabase
        .from('cocreation_meditations')
        .select('meditation_id')
        .eq('cocreation_id', cocreationId);

      if (linksError) {
        console.error('Error loading meditation links:', linksError);
      }

      setMeditations(allMeditations || []);
      setSelectedMeditationIds((selectedLinks || []).map(link => link.meditation_id));
    } catch (error) {
      console.error('Error loading meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeditationSelection = async (meditationId: string) => {
    const isSelected = selectedMeditationIds.includes(meditationId);

    try {
      if (isSelected) {
        // Remove from selection
        const { error } = await supabase
          .from('cocreation_meditations')
          .delete()
          .eq('cocreation_id', cocreationId)
          .eq('meditation_id', meditationId);

        if (error) throw error;

        setSelectedMeditationIds(prev => prev.filter(id => id !== meditationId));
        showModal('Removida', 'Meditação removida desta cocriação.', 'success');
      } else {
        // Add to selection
        const { error } = await supabase
          .from('cocreation_meditations')
          .insert({
            cocreation_id: cocreationId,
            meditation_id: meditationId,
          });

        if (error) throw error;

        setSelectedMeditationIds(prev => [...prev, meditationId]);
        showModal('Adicionada', 'Meditação adicionada a esta cocriação!', 'success');
      }
    } catch (error) {
      console.error('Error toggling meditation selection:', error);
      showModal('Erro', 'Não foi possível atualizar a seleção.', 'error');
    }
  };

  const playMeditation = async (meditation: Meditation) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (playingId === meditation.id) {
        setPlayingId(null);
        setSound(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: meditation.audio_url },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(meditation.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Failed to play meditation:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <MaterialIcons name="self-improvement" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Meditações
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Escolha uma meditação para praticar
          </Text>
        </View>

        {/* Info Card */}
        <SacredCard style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Toque na estrela para adicionar ou remover meditações desta cocriação
          </Text>
        </SacredCard>

        {/* Create New Button */}
        <View style={styles.createButtonContainer}>
          <SacredButton
            title="Gravar Nova Meditação"
            onPress={() => router.push(`/meditation-practice?cocreationId=${cocreationId}&returnTo=jae`)}
            icon={<MaterialIcons name="add" size={20} color="white" />}
          />
        </View>

        {/* Meditations List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando...
            </Text>
          </View>
        ) : meditations.length === 0 ? (
          <SacredCard glowing style={styles.emptyCard}>
            <MaterialIcons name="self-improvement" size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma meditação gravada
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Clique em "Gravar Nova Meditação" para começar
            </Text>
          </SacredCard>
        ) : (
          <View style={styles.meditationsList}>
            {meditations.map((meditation) => {
              const isPlaying = playingId === meditation.id;
              const isSelected = selectedMeditationIds.includes(meditation.id);
              const category = CATEGORIES[meditation.category];
              const displayColor = category?.color || SILVER_COLOR;

              return (
                <SacredCard key={meditation.id} style={styles.meditationCard}>
                  <View style={[styles.meditationHeader, { borderLeftColor: displayColor }]}>
                    {/* Star Selection */}
                    <TouchableOpacity
                      style={styles.starButton}
                      onPress={() => toggleMeditationSelection(meditation.id)}
                    >
                      <MaterialIcons 
                        name={isSelected ? 'star' : 'star-outline'} 
                        size={32} 
                        color={isSelected ? '#F59E0B' : colors.textMuted} 
                      />
                    </TouchableOpacity>

                    <View style={styles.meditationInfo}>
                      <Text style={styles.meditationCategoryIcon}>{category?.icon}</Text>
                      <View style={styles.meditationTextInfo}>
                        <Text style={[styles.meditationName, { color: colors.text }]}>
                          {meditation.name}
                        </Text>
                        <Text style={[styles.meditationDuration, { color: colors.textSecondary }]}>
                          {formatDuration(meditation.duration)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.playButton, { backgroundColor: displayColor + '20' }]}
                      onPress={() => playMeditation(meditation)}
                    >
                      <MaterialIcons 
                        name={isPlaying ? 'pause' : 'play-arrow'} 
                        size={28} 
                        color={displayColor} 
                      />
                    </TouchableOpacity>
                  </View>
                </SacredCard>
              );
            })}
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
  meditationsList: {
    marginBottom: Spacing.xl,
  },
  meditationCard: {
    marginBottom: Spacing.lg,
    padding: 0,
  },
  meditationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  starButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  meditationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meditationCategoryIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  meditationTextInfo: {
    flex: 1,
  },
  meditationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  meditationDuration: {
    fontSize: 14,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
