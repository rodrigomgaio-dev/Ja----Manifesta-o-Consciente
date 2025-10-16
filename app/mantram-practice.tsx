import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Colors';
import { supabase } from '@/services/supabase';

interface Mantram {
  id: string;
  name: string;
  text_content?: string;
  category: string;
  audio_url: string;
  duration: number;
  created_at: string;
}

const CATEGORIES = [
  { 
    label: 'Abundância', 
    value: 'abundance', 
    icon: '💰',
    color: '#3B82F6'
  },
  { 
    label: 'Saúde', 
    value: 'health', 
    icon: '🌿',
    color: '#10B981'
  },
  { 
    label: 'Amor', 
    value: 'love', 
    icon: '❤️',
    color: '#EC4899'
  },
  { 
    label: 'Sucesso', 
    value: 'success', 
    icon: '🌟',
    color: '#F59E0B'
  },
];

const MANTRAM_EXAMPLES: Record<string, Array<{ type: string; mantram: string; meaning: string }>> = {
  abundance: [
    {
      type: 'Tradicional (sânscrito)',
      mantram: 'Om Shrim Mahalakshmyai Namah',
      meaning: 'Eu me conecto com a energia da Deusa Lakshmi, divindade da prosperidade, riqueza e abundância.',
    },
    {
      type: 'Moderno / Afirmação',
      mantram: 'A abundância flui para mim com facilidade, em todas as áreas da minha vida.',
      meaning: '',
    },
    {
      type: 'Neutro / Universal',
      mantram: 'Sou um canal aberto para a generosidade do universo. Recebo com gratidão.',
      meaning: '',
    },
  ],
  health: [
    {
      type: 'Tradicional (sânscrito)',
      mantram: 'Om Asato Ma Sad Gamaya',
      meaning: 'Do não-real (doença, ilusão) leve-me ao real (saúde, verdade). (Trecho do mantra Pavamana, dos Upanishads)',
    },
    {
      type: 'Moderno / Afirmação',
      mantram: 'Meu corpo é saudável, forte e cheio de vitalidade. Cada célula irradia bem-estar.',
      meaning: '',
    },
    {
      type: 'Neutro / Universal',
      mantram: 'A cura flui através de mim. Estou em harmonia com a vida.',
      meaning: '',
    },
  ],
  love: [
    {
      type: 'Tradicional (sânscrito)',
      mantram: 'Om Kamadevaya Namah',
      meaning: 'Saúdo Kamadeva, a energia divina do amor, desejo e conexão. (Usado com respeito e intenção pura)',
    },
    {
      type: 'Moderno / Afirmação',
      mantram: 'Sou digno(a) de amor verdadeiro. Atraio relacionamentos saudáveis, respeitosos e amorosos.',
      meaning: '',
    },
    {
      type: 'Neutro / Universal',
      mantram: 'O amor me envolve, me preenche e se expande através de mim.',
      meaning: '',
    },
  ],
  success: [
    {
      type: 'Tradicional (sânscrito)',
      mantram: 'Om Gan Ganapataye Namah',
      meaning: 'Invoco Ganesha, o removedor de obstáculos e deus do sucesso e novos começos.',
    },
    {
      type: 'Moderno / Afirmação',
      mantram: 'Estou alinhado(a) com meu propósito. Meus esforços geram resultados poderosos e significativos.',
      meaning: '',
    },
    {
      type: 'Neutro / Universal',
      mantram: 'O sucesso me encontra onde eu estou, porque ajo com integridade, foco e coragem.',
      meaning: '',
    },
  ],
};

const REPETITION_OPTIONS = [
  { label: '1x', value: 1, icon: 'looks-one' },
  { label: '3x', value: 3, icon: 'looks-3' },
  { label: '7x', value: 7, icon: 'looks-7' },
  { label: '∞', value: -1, icon: 'all-inclusive' },
];

export default function MantramPracticeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId, circleId } = useLocalSearchParams<{ 
    cocreationId?: string; 
    circleId?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mantramName, setMantramName] = useState('');
  const [mantramText, setMantramText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mantrams, setMantrams] = useState<Mantram[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playRepetitions, setPlayRepetitions] = useState<number>(1);
  const [currentRepetition, setCurrentRepetition] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [expandedExample, setExpandedExample] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ title: '', message: '', type: 'info' });

  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);
  const currentExamples = selectedCategory ? (MANTRAM_EXAMPLES[selectedCategory] || []) : [];

  useEffect(() => {
    loadMantrams();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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
      const query = supabase
        .from('mantrams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (cocreationId) {
        query.eq('cocreation_id', cocreationId);
      } else if (circleId) {
        query.eq('circle_id', circleId);
      } else {
        query.is('cocreation_id', null).is('circle_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading mantrams:', error);
        return;
      }

      setMantrams(data || []);
    } catch (error) {
      console.error('Error loading mantrams:', error);
    }
  };

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
      if (!mantramName.trim()) {
        showModal('Nome Obrigatório', 'Por favor, dê um nome para seu mantram.', 'warning');
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        showModal(
          'Permissão Necessária',
          'Por favor, permita o acesso ao microfone para gravar seu mantram.',
          'warning'
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
      showModal('Erro', 'Não foi possível iniciar a gravação.', 'error');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      setLoading(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri) {
        await uploadMantram(uri);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      showModal('Erro', 'Não foi possível salvar a gravação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadMantram = async (uri: string) => {
    try {
      // Read file
      const response = await fetch(uri);
      const blob = await response.blob();
      
      let fileData: Blob | ArrayBuffer;
      if (Platform.OS === 'web') {
        fileData = blob;
      } else {
        // Convert blob to ArrayBuffer for mobile
        const reader = new FileReader();
        fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        });
      }

      // Upload to storage
      const fileName = `${user?.id}/${Date.now()}.m4a`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mantrams')
        .upload(fileName, fileData, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('mantrams')
        .getPublicUrl(fileName);

      // Save to database
      const mantramData: any = {
        user_id: user?.id,
        name: mantramName,
        text_content: mantramText.trim() || null,
        category: selectedCategory || 'general',
        audio_url: urlData.publicUrl,
        duration: recordingDuration,
      };

      if (cocreationId) {
        mantramData.cocreation_id = cocreationId;
      } else if (circleId) {
        mantramData.circle_id = circleId;
      }

      const { error: dbError } = await supabase
        .from('mantrams')
        .insert(mantramData);

      if (dbError) {
        throw dbError;
      }

      showModal('Sucesso', 'Mantram gravado e salvo com sucesso!', 'success');
      setMantramName('');
      setMantramText('');
      await loadMantrams();
    } catch (error) {
      console.error('Error uploading mantram:', error);
      showModal('Erro', 'Não foi possível salvar o mantram.', 'error');
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
      showModal('Erro', 'Não foi possível reproduzir o mantram.', 'error');
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

  const deleteMantram = async (mantram: Mantram) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Deseja realmente excluir este mantram?');
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Excluir Mantram',
        'Deseja realmente excluir este mantram?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              await performDelete(mantram);
            },
          },
        ]
      );
      return;
    }
    await performDelete(mantram);
  };

  const performDelete = async (mantram: Mantram) => {
    try {
      if (playingId === mantram.id && sound) {
        await sound.unloadAsync();
        setPlayingId(null);
      }

      const { error } = await supabase
        .from('mantrams')
        .delete()
        .eq('id', mantram.id);

      if (error) {
        throw error;
      }

      await loadMantrams();
      showModal('Sucesso', 'Mantram excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Error deleting mantram:', error);
      showModal('Erro', 'Não foi possível excluir o mantram.', 'error');
    }
  };

  const copyExampleText = (text: string) => {
    setMantramText(text);
    showModal('Texto Copiado', 'O texto do mantram foi copiado para o campo de edição.', 'success');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        {/* Examples by Category */}
        {selectedCategory && (
        <SacredCard style={styles.examplesCard}>
          <View style={styles.examplesHeader}>
            <Text style={styles.examplesIcon}>{currentCategory?.icon}</Text>
            <Text style={[styles.examplesTitle, { color: colors.text }]}>
              Mantrams de {currentCategory?.label}
            </Text>
          </View>

          <Text style={[styles.examplesSubtitle, { color: colors.textMuted }]}>
            Toque em um exemplo para copiar o texto
          </Text>

          <View style={styles.examplesList}>
            {currentExamples.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.exampleItem,
                  { 
                    backgroundColor: colors.surface + '60',
                    borderColor: currentCategory?.color + '30',
                  }
                ]}
                onPress={() => {
                  if (expandedExample === index) {
                    copyExampleText(example.mantram);
                  } else {
                    setExpandedExample(index);
                  }
                }}
              >
                <View style={styles.exampleHeader}>
                  <Text style={[styles.exampleType, { color: currentCategory?.color }]}>
                    {example.type}
                  </Text>
                  <MaterialIcons 
                    name={expandedExample === index ? 'expand-less' : 'expand-more'} 
                    size={24} 
                    color={colors.textMuted} 
                  />
                </View>
                <Text style={[styles.exampleMantram, { color: colors.text }]}>
                  {example.mantram}
                </Text>
                {(expandedExample === index && example.meaning !== '') ? (
                  <Text style={[styles.exampleMeaning, { color: colors.textSecondary }]}>
                    {example.meaning}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              📝 Dicas para usar os mantras:
            </Text>
            <View style={styles.tipsList}>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • Repita diariamente, preferencialmente em momentos de calma (manhã ou noite)
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • Sinta as palavras — não apenas recite, mas conecte-se com a emoção por trás delas
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • Use 1 mantra por vez por alguns dias ou semanas para fortalecer sua intenção
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • Combine com respiração consciente ou meditação para potencializar o efeito
              </Text>
            </View>
          </View>
        </SacredCard>
        )}

        {/* Create Your Mantram */}
        <SacredCard glowing style={styles.recordCard}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>
            Grave Seu Próprio Mantram
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
            value={mantramName}
            onChangeText={setMantramName}
            placeholder="Nome do Mantram *"
            placeholderTextColor={colors.textMuted + '80'}
            maxLength={100}
          />

          <TextInput
            style={[
              styles.textInput,
              { 
                backgroundColor: colors.surface + '60',
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            value={mantramText}
            onChangeText={setMantramText}
            placeholder="Texto do mantram (opcional - para ler enquanto grava)"
            placeholderTextColor={colors.textMuted + '80'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />

          {isRecording ? (
            <View style={styles.recordingIndicator}>
              <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.recordingText, { color: colors.text }]}>
                Gravando: {formatDuration(recordingDuration)}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.recordButton}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={loading || (!mantramName.trim() && !isRecording)}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#DC2626'] : currentCategory?.color ? [currentCategory.color, currentCategory.color + 'CC'] : ['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientButton,
                (loading || (!mantramName.trim() && !isRecording)) && styles.disabledButton
              ]}
            >
              <MaterialIcons 
                name={isRecording ? 'stop' : 'mic'} 
                size={32} 
                color="white" 
                style={{ marginRight: Spacing.md }}
              />
              <Text style={styles.recordButtonText}>
                {loading ? 'Salvando...' : isRecording ? 'Parar e Salvar' : 'Iniciar Gravação'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.recordHint, { color: colors.textMuted }]}>
            Dica: Repita seu mantram com intenção e foco. A repetição cria o poder.
          </Text>
        </SacredCard>

        {/* My Mantrams */}
        {mantrams.length > 0 ? (
          <SacredCard style={styles.mantramsCard}>
            <Text style={[styles.mantramsTitle, { color: colors.text }]}>
              Meus Mantrams Gravados
            </Text>

            {mantrams.map((mantram) => {
              const isPlaying = playingId === mantram.id;
              const category = CATEGORIES.find(c => c.value === mantram.category);

              return (
                <View 
                  key={mantram.id}
                  style={[
                    styles.mantramItem,
                    { 
                      backgroundColor: colors.surface + '60',
                      borderLeftColor: category?.color || colors.accent,
                    }
                  ]}
                >
                  <View style={styles.mantramInfo}>
                    <View style={styles.mantramHeader}>
                      <Text style={styles.mantramCategoryIcon}>{category?.icon}</Text>
                      <Text style={[styles.mantramName, { color: colors.text }]}>
                        {mantram.name}
                      </Text>
                    </View>
                    {mantram.text_content ? (
                      <Text style={[styles.mantramText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {mantram.text_content}
                      </Text>
                    ) : null}
                    <Text style={[styles.mantramDuration, { color: colors.textMuted }]}>
                      Duração: {formatDuration(mantram.duration)} • {formatTimestamp(mantram.created_at)}
                    </Text>
                  </View>

                  {/* Repetition Options */}
                  <View style={styles.controlsContainer}>
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
                              { backgroundColor: category?.color ? category.color + '20' : colors.accent + '20' }
                            ]}
                            onPress={() => playMantram(mantram, option.value)}
                          >
                            <MaterialIcons 
                              name={option.icon as any} 
                              size={20} 
                              color={category?.color || colors.accent}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.repetitionLabel, { color: category?.color || colors.accent }]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteMantram(mantram)}
                  >
                    <MaterialIcons 
                      name="delete-outline" 
                      size={24} 
                      color={colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </SacredCard>
        ) : null}

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "O mantram é uma ferramenta de transformação. Quando você o repete com sua própria voz, você cria uma onda de vibração que reorganiza sua realidade."
          </Text>
        </SacredCard>
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
  },
  powerPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
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
    marginHorizontal: -Spacing.xs,
  },
  categoryButton: {
    width: '47%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  examplesCard: {
    marginBottom: Spacing.lg,
  },
  examplesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  examplesIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  examplesSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  examplesList: {
    marginBottom: Spacing.lg,
  },
  exampleItem: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exampleType: {
    fontSize: 13,
    fontWeight: '600',
  },
  exampleMantram: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  exampleMeaning: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  tipsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tipsList: {
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.sm,
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
  nameInput: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  textInput: {
    width: '100%',
    minHeight: 100,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    marginBottom: Spacing.lg,
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
  mantramsCard: {
    marginBottom: Spacing.lg,
  },
  mantramsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  mantramItem: {
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  controlsContainer: {
    width: '100%',
  },
  mantramInfo: {
    marginBottom: Spacing.md,
  },
  mantramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  mantramCategoryIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  mantramName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  mantramText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  mantramDuration: {
    fontSize: 12,
  },
  playingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.sm,
    marginHorizontal: -Spacing.xs / 2,
  },
  repetitionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs / 2,
  },
  repetitionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
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
