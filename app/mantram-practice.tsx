import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

interface MantramRecording {
  id: string;
  mantram: string;
  repetitions: number;
  duration: number;
  timestamp: Date;
  uri: string;
}

const SACRED_MANTRAMS = [
  {
    mantram: 'Om',
    description: 'O som primordial do universo',
    meaning: 'Representa a vibração cósmica original',
  },
  {
    mantram: 'Om Namah Shivaya',
    description: 'Reverência à consciência interior',
    meaning: 'Honro meu Eu Superior',
  },
  {
    mantram: 'Om Mani Padme Hum',
    description: 'A joia do lótus',
    meaning: 'Sabedoria e compaixão',
  },
  {
    mantram: 'So Ham',
    description: 'Eu sou Aquilo',
    meaning: 'União com o Todo',
  },
  {
    mantram: 'Om Shanti Shanti Shanti',
    description: 'Paz universal',
    meaning: 'Paz em todos os níveis do ser',
  },
  {
    mantram: 'Sat Nam',
    description: 'Verdade é minha identidade',
    meaning: 'Conexão com minha verdade essencial',
  },
];

export default function MantramPracticeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [customMantram, setCustomMantram] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<MantramRecording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [expandedMantram, setExpandedMantram] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      if (!customMantram.trim()) {
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) {
          clearInterval(interval);
        }
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const newRecording: MantramRecording = {
          id: Date.now().toString(),
          mantram: customMantram,
          repetitions: 0,
          duration: recordingDuration,
          timestamp: new Date(),
          uri,
        };

        setRecordings(prev => [newRecording, ...prev]);
        setCustomMantram('');
      }

      setRecording(null);
      setRecordingDuration(0);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playRecording = async (recordingItem: MantramRecording) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (playingId === recordingItem.id) {
        setPlayingId(null);
        setSound(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingItem.uri },
        { shouldPlay: true, isLooping: true }
      );

      setSound(newSound);
      setPlayingId(recordingItem.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const deleteRecording = (id: string) => {
    if (playingId === id && sound) {
      sound.unloadAsync();
      setPlayingId(null);
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
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

        {/* Title Header */}
        <View style={styles.titleHeader}>
          <MaterialIcons name="record-voice-over" size={48} color={colors.primary} />
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Momento de Mantralização
          </Text>
          <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
            Vibre com sons sagrados
          </Text>
        </View>

        {/* Power of Your Voice */}
        <SacredCard glowing style={styles.powerCard}>
          <MaterialIcons name="graphic-eq" size={40} color={colors.accent} />
          <Text style={[styles.powerTitle, { color: colors.text }]}>
            O Poder da Sua Voz nos Mantrams
          </Text>
          <Text style={[styles.powerText, { color: colors.textSecondary }]}>
            Quando você grava e repete seus próprios mantrams, você:
          </Text>
          
          <View style={styles.powerPoints}>
            <View style={styles.powerPoint}>
              <MaterialIcons name="vibration" size={24} color={colors.accent} />
              <View style={styles.powerPointText}>
                <Text style={[styles.powerPointTitle, { color: colors.text }]}>
                  Cria Ressonância Pessoal
                </Text>
                <Text style={[styles.powerPointDesc, { color: colors.textSecondary }]}>
                  Sua voz vibra em harmonia com seu campo energético
                </Text>
              </View>
            </View>

            <View style={styles.powerPoint}>
              <MaterialIcons name="repeat" size={24} color={colors.accent} />
              <View style={styles.powerPointText}>
                <Text style={[styles.powerPointTitle, { color: colors.text }]}>
                  Multiplica a Intenção
                </Text>
                <Text style={[styles.powerPointDesc, { color: colors.textSecondary }]}>
                  Cada repetição amplifica a energia do mantram
                </Text>
              </View>
            </View>

            <View style={styles.powerPoint}>
              <MaterialIcons name="auto-awesome" size={24} color={colors.accent} />
              <View style={styles.powerPointText}>
                <Text style={[styles.powerPointTitle, { color: colors.text }]}>
                  Acelera a Manifestação
                </Text>
                <Text style={[styles.powerPointDesc, { color: colors.textSecondary }]}>
                  Som + Intenção + Repetição = Transformação rápida
                </Text>
              </View>
            </View>
          </View>
        </SacredCard>

        {/* Sacred Mantrams Examples */}
        <SacredCard style={styles.mantramsList}>
          <Text style={[styles.mantramListTitle, { color: colors.text }]}>
            Mantrams Sagrados Tradicionais
          </Text>
          <Text style={[styles.mantramListSubtitle, { color: colors.textMuted }]}>
            Use como inspiração ou crie o seu próprio
          </Text>

          <View style={styles.mantramsGrid}>
            {SACRED_MANTRAMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mantramItem,
                  { 
                    backgroundColor: colors.surface + '60',
                    borderColor: colors.primary + '30',
                  }
                ]}
                onPress={() => setExpandedMantram(expandedMantram === index ? null : index)}
              >
                <View style={styles.mantramHeader}>
                  <Text style={[styles.mantramText, { color: colors.text }]}>
                    {item.mantram}
                  </Text>
                  <MaterialIcons 
                    name={expandedMantram === index ? 'expand-less' : 'expand-more'} 
                    size={24} 
                    color={colors.textMuted} 
                  />
                </View>
                {expandedMantram === index && (
                  <View style={styles.mantramDetails}>
                    <Text style={[styles.mantramDescription, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.mantramMeaning, { color: colors.textMuted }]}>
                      {item.meaning}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SacredCard>

        {/* Create Your Mantram */}
        <SacredCard glowing style={styles.recordCard}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>
            Grave Seu Próprio Mantram
          </Text>
          
          <Text style={[styles.recordSubtitle, { color: colors.textSecondary }]}>
            Escolha ou crie um mantram que ressoe com você. Repita-o várias vezes enquanto grava.
          </Text>

          <TextInput
            style={[
              styles.mantramInput,
              { 
                backgroundColor: colors.surface + '60',
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            value={customMantram}
            onChangeText={setCustomMantram}
            placeholder="Digite seu mantram aqui..."
            placeholderTextColor={colors.textMuted + '80'}
            maxLength={100}
          />

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.recordingText, { color: colors.text }]}>
                Gravando: {formatDuration(recordingDuration)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.recordButton}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!customMantram.trim() && !isRecording}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#EC4899', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientButton,
                (!customMantram.trim() && !isRecording) && styles.disabledButton
              ]}
            >
              <MaterialIcons 
                name={isRecording ? 'stop' : 'mic'} 
                size={32} 
                color="white" 
              />
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.recordHint, { color: colors.textMuted }]}>
            Dica: Repita seu mantram com intenção e foco. A repetição cria o poder.
          </Text>
        </SacredCard>

        {/* My Recordings */}
        {recordings.length > 0 && (
          <SacredCard style={styles.recordingsCard}>
            <Text style={[styles.recordingsTitle, { color: colors.text }]}>
              Meus Mantrams Gravados
            </Text>

            {recordings.map((item) => {
              const isPlaying = playingId === item.id;

              return (
                <View 
                  key={item.id}
                  style={[
                    styles.recordingItem,
                    { 
                      backgroundColor: colors.surface + '60',
                      borderLeftColor: colors.accent,
                    }
                  ]}
                >
                  <View style={styles.recordingInfo}>
                    <Text style={[styles.recordingMantram, { color: colors.text }]}>
                      {item.mantram}
                    </Text>
                    <Text style={[styles.recordingDuration, { color: colors.textSecondary }]}>
                      Duração: {formatDuration(item.duration)}
                    </Text>
                    <Text style={[styles.recordingTimestamp, { color: colors.textMuted }]}>
                      Gravado {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>

                  <View style={styles.recordingActions}>
                    <TouchableOpacity
                      style={[styles.playButton, { backgroundColor: colors.accent + '20' }]}
                      onPress={() => playRecording(item)}
                    >
                      <MaterialIcons 
                        name={isPlaying ? 'pause' : 'play-arrow'} 
                        size={28} 
                        color={colors.accent} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteRecording(item.id)}
                    >
                      <MaterialIcons 
                        name="delete-outline" 
                        size={24} 
                        color={colors.error} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </SacredCard>
        )}

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "O mantram é uma ferramenta de transformação. Quando você o repete com sua própria voz, você cria uma onda de vibração que reorganiza sua realidade."
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
  titleHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  powerCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  powerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  powerText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  powerPoints: {
    width: '100%',
    gap: Spacing.lg,
  },
  powerPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  powerPointText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  powerPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  powerPointDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  mantramsList: {
    marginBottom: Spacing.lg,
  },
  mantramListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  mantramListSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  mantramsGrid: {
    gap: Spacing.md,
  },
  mantramItem: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  mantramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mantramText: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  mantramDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  mantramDescription: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  mantramMeaning: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  recordCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  recordSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  mantramInput: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  recordButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  gradientButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  recordHint: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recordingsCard: {
    marginBottom: Spacing.lg,
  },
  recordingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  recordingItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingMantram: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  recordingDuration: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  recordingTimestamp: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
