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

interface Mantram {
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
  health: { color: '#10B981', icon: '🌿' },
  success: { color: '#F59E0B', icon: '🌟' },
};

const REPETITION_OPTIONS = [
  { label: '1x', value: 1, icon: 'looks-one' },
  { label: '3x', value: 3, icon: 'looks-3' },
  { label: '7x', value: 7, icon: 'looks-7' },
  { label: '∞', value: -1, icon: 'all-inclusive' },
];

export default function JaeMantramListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();

  const [mantrams, setMantrams] = useState<Mantram[]>([]);
  const [selectedMantramIds, setSelectedMantramIds] = useState<string[]>([]);
  const [cocreationTitle, setCocreationTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playRepetitions, setPlayRepetitions] = useState<number>(1);
  const [currentRepetition, setCurrentRepetition] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadMantrams();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMantrams();
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

  const loadMantrams = async () => {
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

      // Load ALL user mantrams
      const { data: allMantrams, error: mantramsError } = await supabase
        .from('mantrams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (mantramsError) {
        console.error('Error loading mantrams:', mantramsError);
        return;
      }

      // Load selected mantrams for this cocreation
      const { data: selectedLinks, error: linksError } = await supabase
        .from('cocreation_mantrams')
        .select('mantram_id')
        .eq('cocreation_id', cocreationId);

      if (linksError) {
        console.error('Error loading mantram links:', linksError);
      }

      setMantrams(allMantrams || []);
      setSelectedMantramIds((selectedLinks || []).map(link => link.mantram_id));
    } catch (error) {
      console.error('Error loading mantrams:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMantramSelection = async (mantramId: string) => {
    const isSelected = selectedMantramIds.includes(mantramId);

    try {
      if (isSelected) {
        // Remove from selection
        const { error } = await supabase
          .from('cocreation_mantrams')
          .delete()
          .eq('cocreation_id', cocreationId)
          .eq('mantram_id', mantramId);

        if (error) throw error;

        setSelectedMantramIds(prev => prev.filter(id => id !== mantramId));
        showModal('Removido', 'Mantram removido desta cocriação.', 'success');
      } else {
        // Add to selection
        const { error } = await supabase
          .from('cocreation_mantrams')
          .insert({
            cocreation_id: cocreationId,
            mantram_id: mantramId,
          });

        if (error) throw error;

        setSelectedMantramIds(prev => [...prev, mantramId]);
        showModal('Adicionado', 'Mantram adicionado a esta cocriação!', 'success');
      }
    } catch (error) {
      console.error('Error toggling mantram selection:', error);
      showModal('Erro', 'Não foi possível atualizar a seleção.', 'error');
    }
  };

  const playMantram = async (mantram: Mantram, repetitions: number) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (playingId === mantram.id && playRepetitions === repetitions) {
        setPlayingId(null);
        setSound(null);
        setCurrentRepetition(0);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: mantram.audio_url },
        { shouldPlay: true, isLooping: repetitions === -1 }
      );

      setSound(newSound);
      setPlayingId(mantram.id);
      setPlayRepetitions(repetitions);
      setCurrentRepetition(1);

      if (repetitions > 0) {
        let currentRep = 1;
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            currentRep++;
            if (currentRep <= repetitions) {
              setCurrentRepetition(currentRep);
              newSound.replayAsync();
            } else {
              setPlayingId(null);
              setSound(null);
              setCurrentRepetition(0);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to play mantram:', error);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    setPlayingId(null);
    setSound(null);
    setCurrentRepetition(0);
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
          <MaterialIcons name="record-voice-over" size={48} color="#3B82F6" />
          <Text style={[styles.title, { color: colors.text }]}>
            Momento de Mantralização
          </Text>
        </View>

        {/* Cocreation Title */}
        {cocreationTitle && (
          <View style={styles.cocreationTitleContainer}>
            <Text style={[styles.cocreationTitle, { color: '#3B82F6' }]}>
              Cocriando {cocreationTitle}
            </Text>
          </View>
        )}

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Vibre com sons sagrados
          </Text>
        </View>

        {/* Mantrams List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando...
            </Text>
          </View>
        ) : mantrams.length === 0 ? (
          <SacredCard glowing style={styles.emptyCard}>
            <MaterialIcons name="record-voice-over" size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum mantram gravado
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Clique em "Gravar Novo Mantram" para começar
            </Text>
          </SacredCard>
        ) : (
          <View style={styles.mantramsList}>
            {/* Selected Mantrams Section */}
            {selectedMantramIds.length > 0 ? (
              <View style={styles.selectedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  ⭐ Mantrams desta Cocriação
                </Text>
                {mantrams
                  .filter(m => selectedMantramIds.includes(m.id))
                  .map((mantram) => {
                    const isPlaying = playingId === mantram.id;
                    const category = CATEGORIES[mantram.category];
                    const displayColor = category?.color || colors.accent;

                    return (
                      <SacredCard key={mantram.id} style={styles.mantramCard}>
                        <View style={[styles.mantramHeader, { borderLeftColor: displayColor }]}>
                          {/* Star Selection */}
                          <TouchableOpacity
                            style={styles.starButton}
                            onPress={() => toggleMantramSelection(mantram.id)}
                          >
                            <MaterialIcons 
                              name="star" 
                              size={24} 
                              color="#F59E0B" 
                            />
                          </TouchableOpacity>

                          <View style={styles.mantramContent}>
                            <View style={styles.mantramInfo}>
                              {category?.icon && (
                                <Text style={styles.mantramCategoryIcon}>{category.icon}</Text>
                              )}
                              <View style={styles.mantramTextInfo}>
                                <Text style={[styles.mantramName, { color: colors.text }]} numberOfLines={1}>
                                  {mantram.name}
                                </Text>
                                <Text style={[styles.mantramDuration, { color: colors.textSecondary }]}>
                                  {formatDuration(mantram.duration)}
                                </Text>
                              </View>
                            </View>

                            {/* Playback Controls */}
                            {isPlaying ? (
                              <View style={styles.playingControls}>
                                <Text style={[styles.repetitionInfo, { color: colors.text }]}>
                                  {playRepetitions === -1 ? '∞ Loop' : `${currentRepetition}/${playRepetitions}`}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.stopButton, { backgroundColor: colors.error + '20' }]}
                                  onPress={stopPlayback}
                                >
                                  <MaterialIcons name="stop" size={20} color={colors.error} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View style={styles.repetitionButtons}>
                                {REPETITION_OPTIONS.map((option) => (
                                  <TouchableOpacity
                                    key={option.value}
                                    style={[
                                      styles.repetitionButton,
                                      { backgroundColor: displayColor + '20' }
                                    ]}
                                    onPress={() => playMantram(mantram, option.value)}
                                  >
                                    <MaterialIcons 
                                      name={option.icon as any} 
                                      size={16} 
                                      color={displayColor}
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
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
                  Nenhum mantram selecionado
                </Text>
                <Text style={[styles.emptySelectionDescription, { color: colors.textSecondary }]}>
                  Toque na estrela ao lado do mantram para adicioná-lo a esta cocriação
                </Text>
              </SacredCard>
            )}

            {/* Create New Button */}
            <View style={styles.createButtonContainer}>
              <SacredButton
                title="Gravar Novo Mantram"
                onPress={() => router.push(`/mantram-practice?cocreationId=${cocreationId}&returnTo=jae`)}
                icon={<MaterialIcons name="add" size={20} color="white" />}
              />
            </View>

            {/* All Mantrams Section */}
            {mantrams.filter(m => !selectedMantramIds.includes(m.id)).length > 0 && (
              <View style={styles.allMantramsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Todos os Mantrams
                </Text>
                {mantrams
                  .filter(m => !selectedMantramIds.includes(m.id))
                  .map((mantram) => {
                    const isPlaying = playingId === mantram.id;
                    const category = CATEGORIES[mantram.category];
                    const displayColor = category?.color || colors.accent;

                    return (
                      <SacredCard key={mantram.id} style={styles.mantramCard}>
                        <View style={[styles.mantramHeader, { borderLeftColor: displayColor }]}>
                          {/* Star Selection */}
                          <TouchableOpacity
                            style={styles.starButton}
                            onPress={() => toggleMantramSelection(mantram.id)}
                          >
                            <MaterialIcons 
                              name="star-outline" 
                              size={24} 
                              color={colors.textMuted} 
                            />
                          </TouchableOpacity>

                          <View style={styles.mantramContent}>
                            <View style={styles.mantramInfo}>
                              {category?.icon && (
                                <Text style={styles.mantramCategoryIcon}>{category.icon}</Text>
                              )}
                              <View style={styles.mantramTextInfo}>
                                <Text style={[styles.mantramName, { color: colors.text }]} numberOfLines={1}>
                                  {mantram.name}
                                </Text>
                                <Text style={[styles.mantramDuration, { color: colors.textSecondary }]}>
                                  {formatDuration(mantram.duration)}
                                </Text>
                              </View>
                            </View>

                            {/* Playback Controls */}
                            {isPlaying ? (
                              <View style={styles.playingControls}>
                                <Text style={[styles.repetitionInfo, { color: colors.text }]}>
                                  {playRepetitions === -1 ? '∞ Loop' : `${currentRepetition}/${playRepetitions}`}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.stopButton, { backgroundColor: colors.error + '20' }]}
                                  onPress={stopPlayback}
                                >
                                  <MaterialIcons name="stop" size={20} color={colors.error} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View style={styles.repetitionButtons}>
                                {REPETITION_OPTIONS.map((option) => (
                                  <TouchableOpacity
                                    key={option.value}
                                    style={[
                                      styles.repetitionButton,
                                      { backgroundColor: displayColor + '20' }
                                    ]}
                                    onPress={() => playMantram(mantram, option.value)}
                                  >
                                    <MaterialIcons 
                                      name={option.icon as any} 
                                      size={16} 
                                      color={displayColor}
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
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
  mantramsList: {
    marginBottom: Spacing.xl,
  },
  selectedSection: {
    marginBottom: Spacing.xl,
  },
  allMantramsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  mantramCard: {
    marginBottom: Spacing.sm,
    padding: 0,
  },
  mantramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderLeftWidth: 4,
  },
  starButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  mantramContent: {
    flex: 1,
  },
  mantramInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mantramCategoryIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  mantramTextInfo: {
    flex: 1,
  },
  mantramName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  mantramDuration: {
    fontSize: 12,
  },
  playingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repetitionInfo: {
    fontSize: 14,
    fontWeight: '600',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repetitionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  repetitionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
