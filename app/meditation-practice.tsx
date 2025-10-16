import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
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

interface MeditationRecording {
  id: string;
  name: string;
  category: string;
  duration: number;
  timestamp: Date;
  uri: string;
}

const CATEGORIES = [
  { 
    label: 'Abundância', 
    value: 'abundance', 
    icon: '💰',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#60A5FA', '#93C5FD']
  },
  { 
    label: 'Amor', 
    value: 'love', 
    icon: '❤️',
    color: '#EC4899',
    gradient: ['#EC4899', '#F97316', '#FB923C']
  },
  { 
    label: 'Saúde', 
    value: 'health', 
    icon: '⭐',
    color: '#10B981',
    gradient: ['#10B981', '#3B82F6', '#06B6D4']
  },
  { 
    label: 'Sucesso', 
    value: 'success', 
    icon: '⚡',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706', '#B45309']
  },
];

const MEDITATION_SCRIPTS: Record<string, string[]> = {
  abundance: [
    'Respire profundamente e sinta a abundância fluindo através de você...\n\nVocê está completamente relaxado e receptivo à prosperidade infinita do universo...\n\nCada célula do seu corpo vibra com a frequência da abundância...\n\nVocê atrai dinheiro facilmente e naturalmente...\n\nSuas finanças crescem exponencialmente todos os dias...\n\nVocê é um ímã para oportunidades financeiras...\n\nSinta a gratidão pela riqueza que já existe em sua vida...',
    'Imagine-se envolto em uma luz dourada de prosperidade...\n\nEsta luz penetra cada aspecto da sua vida, trazendo abundância infinita...\n\nVocê vê suas contas bancárias crescendo...\n\nOportunidades de renda surgem de todas as direções...\n\nVocê se sente merecedor de toda esta abundância...\n\nA prosperidade é seu estado natural...',
  ],
  love: [
    'Respire fundo e conecte-se com o amor em seu coração...\n\nSinta seu coração se expandindo, irradiando amor incondicional...\n\nVocê é digno de amor profundo e verdadeiro...\n\nAmor flui para você de todas as direções...\n\nSeus relacionamentos são harmoniosos e amorosos...\n\nVocê atrai pessoas que te valorizam e respeitam...\n\nSinta-se completamente amado pelo universo...',
    'Visualize uma luz rosa preenchendo seu coração...\n\nEsta luz se expande, tocando todos ao seu redor...\n\nVocê irradia amor e compaixão...\n\nRelacionamentos saudáveis fluem naturalmente para sua vida...\n\nVocê se ama completamente e incondicionalmente...\n\nO amor é sua essência natural...',
  ],
  health: [
    'Respire profundamente e sinta a energia vital fluindo pelo seu corpo...\n\nCada respiração traz cura e renovação...\n\nSeu corpo é um templo sagrado, forte e vibrante...\n\nCada célula se regenera com perfeita saúde...\n\nVocê se sente energizado e vital...\n\nSeu sistema imunológico é forte e poderoso...\n\nVocê cuida do seu corpo com amor e gratidão...',
    'Imagine uma luz branca curativa envolvendo todo seu corpo...\n\nEsta luz dissolve qualquer desconforto ou desequilíbrio...\n\nSeu corpo retorna ao seu estado natural de saúde perfeita...\n\nVocê se sente leve, energizado e vibrante...\n\nCada sistema do seu corpo funciona em harmonia perfeita...\n\nSaúde radiante é seu estado natural...',
  ],
  success: [
    'Respire fundo e conecte-se com sua força interior...\n\nVocê é capaz de realizar qualquer objetivo...\n\nO sucesso flui naturalmente para você...\n\nCada ação que você toma cria resultados extraordinários...\n\nVocê está alinhado com seu propósito superior...\n\nOportunidades de sucesso aparecem constantemente...\n\nVocê merece todo o sucesso que conquista...',
    'Visualize-se alcançando seus objetivos mais elevados...\n\nSinta a satisfação da realização...\n\nVocê é um líder inspirador e visionário...\n\nSuas ações têm impacto positivo no mundo...\n\nO sucesso é inevitável em sua jornada...\n\nVocê está manifestando seus sonhos na realidade...',
  ],
};

export default function MeditationPracticeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [meditationName, setMeditationName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<MeditationRecording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);

  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);
  const currentScripts = selectedCategory ? (MEDITATION_SCRIPTS[selectedCategory] || []) : [];

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
      if (!meditationName.trim()) {
        Alert.alert(
          'Nome Obrigatório',
          'Por favor, dê um nome para sua meditação.',
          [{ text: 'OK' }]
        );
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissão Necessária',
          'Por favor, permita o acesso ao microfone para gravar sua meditação.',
          [{ text: 'OK' }]
        );
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

      // Update duration every second
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
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const newRecording: MeditationRecording = {
          id: Date.now().toString(),
          name: meditationName,
          category: selectedCategory || 'general',
          duration: recordingDuration,
          timestamp: new Date(),
          uri,
        };

        setRecordings(prev => [newRecording, ...prev]);
        setMeditationName('');
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

  const playRecording = async (recordingItem: MeditationRecording) => {
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
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(recordingItem.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const deleteRecording = (id: string) => {
    Alert.alert(
      'Excluir Meditação',
      'Deseja realmente excluir esta gravação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            if (playingId === id && sound) {
              sound.unloadAsync();
              setPlayingId(null);
            }
            setRecordings(prev => prev.filter(r => r.id !== id));
          },
        },
      ]
    );
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
          <MaterialIcons name="self-improvement" size={48} color={colors.primary} />
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Momento de Meditação
          </Text>
          <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
            Encontre paz no silêncio interior
          </Text>
        </View>

        {/* Power of Your Voice */}
        <SacredCard glowing style={styles.powerCard}>
          <MaterialIcons name="mic" size={40} color={colors.primary} />
          <Text style={[styles.powerTitle, { color: colors.text }]}>
            O Poder da Sua Própria Voz
          </Text>
          <Text style={[styles.powerText, { color: colors.textSecondary }]}>
            Quando você grava sua própria meditação guiada, três forças se multiplicam:
          </Text>
          
          <View style={styles.powerPoints}>
            <View style={styles.powerPoint}>
              <MaterialIcons name="record-voice-over" size={24} color={colors.accent} />
              <View style={styles.powerPointText}>
                <Text style={[styles.powerPointTitle, { color: colors.text }]}>
                  O Poder de Falar
                </Text>
                <Text style={[styles.powerPointDesc, { color: colors.textSecondary }]}>
                  Sua voz materializa a intenção em vibração física
                </Text>
              </View>
            </View>

            <View style={styles.powerPoint}>
              <MaterialIcons name="hearing" size={24} color={colors.accent} />
              <View style={styles.powerPointText}>
                <Text style={[styles.powerPointTitle, { color: colors.text }]}>
                  A Clareza de Ouvir
                </Text>
                <Text style={[styles.powerPointDesc, { color: colors.textSecondary }]}>
                  Sua mente aceita mais facilmente sua própria voz
                </Text>
              </View>
            </View>

            <View style={styles.powerPoint}>
              <MaterialIcons name="auto-awesome" size={24} color={colors.accent} />
              <View style={styles.powerPointText}>
                <Text style={[styles.powerPointTitle, { color: colors.text }]}>
                  A Intenção Multiplicada
                </Text>
                <Text style={[styles.powerPointDesc, { color: colors.textSecondary }]}>
                  Criar + Falar + Ouvir = Manifestação Acelerada
                </Text>
              </View>
            </View>
          </View>
        </SacredCard>

        {/* Category Selection */}
        <SacredCard glowing style={styles.categoryCard}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            Escolha uma categoria para ver exemplos
          </Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category.value 
                      ? category.color + '30' 
                      : colors.surface + '80',
                    borderColor: selectedCategory === category.value 
                      ? category.color 
                      : colors.border,
                    borderWidth: selectedCategory === category.value ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === category.value ? null : category.value)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: selectedCategory === category.value ? colors.text : colors.textSecondary }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SacredCard>

        {/* Meditation Scripts */}
        {selectedCategory && (
        <SacredCard style={styles.scriptsCard}>
          <View style={styles.scriptsHeader}>
            <Text style={styles.scriptsIcon}>{currentCategory?.icon}</Text>
            <Text style={[styles.scriptsTitle, { color: colors.text }]}>
              Exemplos de Meditação - {currentCategory?.label}
            </Text>
          </View>

          <Text style={[styles.scriptsSubtitle, { color: colors.textMuted }]}>
            Use estes textos como inspiração para gravar sua meditação guiada
          </Text>

          <View style={styles.scriptsList}>
            {currentScripts.map((script, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.scriptItem,
                  { 
                    backgroundColor: colors.surface + '60',
                    borderColor: currentCategory?.color + '30',
                  }
                ]}
                onPress={() => setExpandedScript(expandedScript === index ? null : index)}
              >
                <View style={styles.scriptHeader}>
                  <Text style={[styles.scriptNumber, { color: currentCategory?.color }]}>
                    Script {index + 1}
                  </Text>
                  <MaterialIcons 
                    name={expandedScript === index ? 'expand-less' : 'expand-more'} 
                    size={24} 
                    color={colors.textMuted} 
                  />
                </View>
                {expandedScript === index && (
                  <Text style={[styles.scriptText, { color: colors.textSecondary }]}>
                    {script}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SacredCard>
        )}

        {/* Recording Controls */}
        <SacredCard glowing style={styles.recordCard}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>
            Grave Sua Meditação Guiada
          </Text>

          <TextInput
            style={[
              styles.nameInput,
              { 
                backgroundColor: colors.surface + '60',
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            value={meditationName}
            onChangeText={setMeditationName}
            placeholder="Nome da Meditação *"
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
            disabled={!meditationName.trim() && !isRecording}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#DC2626'] : currentCategory?.gradient || ['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
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
            Dica: Leia o script escolhido com calma e intenção
          </Text>
        </SacredCard>

        {/* My Recordings */}
        {recordings.length > 0 && (
          <SacredCard style={styles.recordingsCard}>
            <Text style={[styles.recordingsTitle, { color: colors.text }]}>
              Minhas Meditações Gravadas
            </Text>

            {recordings.map((item) => {
              const category = CATEGORIES.find(c => c.value === item.category);
              const isPlaying = playingId === item.id;

              return (
                <View 
                  key={item.id}
                  style={[
                    styles.recordingItem,
                    { 
                      backgroundColor: colors.surface + '60',
                      borderLeftColor: category?.color,
                    }
                  ]}
                >
                  <View style={styles.recordingInfo}>
                    <View style={styles.recordingHeader}>
                      <Text style={styles.recordingCategoryIcon}>{category?.icon}</Text>
                      <Text style={[styles.recordingCategory, { color: colors.text }]}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={[styles.recordingSubtitle, { color: colors.textSecondary }]}>
                      {category?.label}
                    </Text>
                    <Text style={[styles.recordingDuration, { color: colors.textSecondary }]}>
                      Duração: {formatDuration(item.duration)}
                    </Text>
                    <Text style={[styles.recordingTimestamp, { color: colors.textMuted }]}>
                      Gravada {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>

                  <View style={styles.recordingActions}>
                    <TouchableOpacity
                      style={[styles.playButton, { backgroundColor: category?.color + '20' }]}
                      onPress={() => playRecording(item)}
                    >
                      <MaterialIcons 
                        name={isPlaying ? 'pause' : 'play-arrow'} 
                        size={28} 
                        color={category?.color} 
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
            "Sua voz carrega sua essência. Quando você ouve suas próprias palavras de manifestação, seu subconsciente reconhece a verdade e acelera a criação."
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
    fontSize: 22,
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
  categoryCard: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryButton: {
    width: '47%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  scriptsCard: {
    marginBottom: Spacing.lg,
  },
  scriptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scriptsIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  scriptsTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scriptsSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  scriptsList: {
    gap: Spacing.md,
  },
  scriptItem: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptNumber: {
    fontSize: 15,
    fontWeight: '600',
  },
  scriptText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  recordCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: 20,
    fontWeight: '600',
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
  nameInput: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.lg,
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
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recordingCategoryIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  recordingCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordingSubtitle: {
    fontSize: 13,
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
