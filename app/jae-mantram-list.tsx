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
import { Audio } from 'expo-av';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
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
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playRepetitions, setPlayRepetitions] = useState<number>(1);
  const [currentRepetition, setCurrentRepetition] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    loadMantrams();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadMantrams = async () => {
    try {
      const { data, error } = await supabase
        .from('mantrams')
        .select('*')
        .eq('user_id', user?.id)
        .eq('cocreation_id', cocreationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading mantrams:', error);
      } else {
        setMantrams(data || []);
      }
    } catch (error) {
      console.error('Error loading mantrams:', error);
    } finally {
      setLoading(false);
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
          <MaterialIcons name="record-voice-over" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Mantrams
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Escolha um mantram para praticar
          </Text>
        </View>

        {/* Create New Button */}
        <View style={styles.createButtonContainer}>
          <SacredButton
            title="Gravar Novo Mantram"
            onPress={() => router.push(`/mantram-practice?cocreationId=${cocreationId}&returnTo=jae`)}
            icon={<MaterialIcons name="add" size={20} color="white" />}
          />
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
            {mantrams.map((mantram) => {
              const isPlaying = playingId === mantram.id;
              const category = CATEGORIES[mantram.category];
              const displayColor = category?.color || colors.accent;

              return (
                <SacredCard key={mantram.id} style={styles.mantramCard}>
                  <View style={[styles.mantramHeader, { borderLeftColor: displayColor }]}>
                    <View style={styles.mantramInfo}>
                      <Text style={styles.mantramCategoryIcon}>{category?.icon}</Text>
                      <View style={styles.mantramTextInfo}>
                        <Text style={[styles.mantramName, { color: colors.text }]}>
                          {mantram.name}
                        </Text>
                        <Text style={[styles.mantramDuration, { color: colors.textSecondary }]}>
                          {formatDuration(mantram.duration)}
                        </Text>
                      </View>
                    </View>

                    {isPlaying ? (
                      <View style={styles.playingControls}>
                        <Text style={[styles.repetitionInfo, { color: colors.text }]}>
                          {playRepetitions === -1 ? '∞ Loop' : `${currentRepetition}/${playRepetitions}`}
                        </Text>
                        <TouchableOpacity
                          style={[styles.stopButton, { backgroundColor: colors.error + '20' }]}
                          onPress={stopPlayback}
                        >
                          <MaterialIcons name="stop" size={28} color={colors.error} />
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
                              size={18} 
                              color={displayColor}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
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
  mantramsList: {
    marginBottom: Spacing.xl,
  },
  mantramCard: {
    marginBottom: Spacing.lg,
    padding: 0,
  },
  mantramHeader: {
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  mantramInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mantramCategoryIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  mantramTextInfo: {
    flex: 1,
  },
  mantramName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  mantramDuration: {
    fontSize: 14,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repetitionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  repetitionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
