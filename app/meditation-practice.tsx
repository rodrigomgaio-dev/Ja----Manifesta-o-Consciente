import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

interface Meditation {
  id: string;
  name: string;
  category: string;
  audio_url: string;
  duration: number;
  created_at: string;
}

const SILVER_GRADIENT = ['#94A3B8', '#CBD5E1', '#E2E8F0'];

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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId, circleId } = useLocalSearchParams<{ 
    cocreationId?: string; 
    circleId?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [meditationName, setMeditationName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({ title: '', message: '', type: 'info' });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ title: '', message: '', onConfirm: () => {} });

  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);
  const currentScripts = selectedCategory ? (MEDITATION_SCRIPTS[selectedCategory] || []) : [];

  useEffect(() => {
    loadMeditations();
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

  const loadMeditations = async () => {
    try {
      const query = supabase
        .from('meditations')
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
        console.error('Error loading meditations:', error);
        return;
      }

      setMeditations(data || []);
    } catch (error) {
      console.error('Error loading meditations:', error);
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
      if (!meditationName.trim()) {
        showModal('Nome Obrigatório', 'Por favor, dê um nome para sua meditação.', 'warning');
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        showModal(
          'Permissão Necessária',
          'Por favor, permita o acesso ao microfone para gravar sua meditação.',
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
        await uploadMeditation(uri);
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

  const uploadMeditation = async (uri: string) => {
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
        .from('meditations')
        .upload(fileName, fileData, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('meditations')
        .getPublicUrl(fileName);

      // Save to database
      const meditationData: any = {
        user_id: user?.id,
        name: meditationName,
        category: selectedCategory || 'general',
        audio_url: urlData.publicUrl,
        duration: recordingDuration,
      };

      if (cocreationId) {
        meditationData.cocreation_id = cocreationId;
      } else if (circleId) {
        meditationData.circle_id = circleId;
      }

      const { error: dbError } = await supabase
        .from('meditations')
        .insert(meditationData);

      if (dbError) {
        throw dbError;
      }

      showModal('Sucesso', 'Meditação gravada e salva com sucesso!', 'success');
      setMeditationName('');
      await loadMeditations();
    } catch (error) {
      console.error('Error uploading meditation:', error);
      showModal('Erro', 'Não foi possível salvar a meditação.', 'error');
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
      showModal('Erro', 'Não foi possível reproduzir a meditação.', 'error');
    }
  };

  const deleteMeditation = (meditation: Meditation) => {
    setConfirmModalConfig({
      title: 'Confirmar Exclusão',
      message: 'Deseja realmente excluir esta meditação?',
      onConfirm: () => performDelete(meditation),
    });
    setConfirmModalVisible(true);
  };

  const performDelete = async (meditation: Meditation) => {
    setConfirmModalVisible(false);
    try {
      if (playingId === meditation.id && sound) {
        await sound.unloadAsync();
        setPlayingId(null);
      }

      const { error } = await supabase
        .from('meditations')
        .delete()
        .eq('id', meditation.id);

      if (error) {
        throw error;
      }

      await loadMeditations();
      showModal('Sucesso', 'Meditação excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Error deleting meditation:', error);
      showModal('Erro', 'Não foi possível excluir a meditação.', 'error');
    }
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
            Escolha uma categoria para a sua meditação e veja exemplos
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
        <SacredCard style={styles.recordCard}>
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
              colors={isRecording ? ['#EF4444', '#DC2626'] : currentCategory?.gradient || SILVER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientButton,
                (loading || (!meditationName.trim() && !isRecording)) && styles.disabledButton
              ]}
            >
              <MaterialIcons 
                name={isRecording ? 'stop' : 'mic'} 
                size={32} 
                color="white" 
              />
              <Text style={styles.recordButtonText}>
                {loading ? 'Salvando...' : isRecording ? 'Parar e Salvar' : 'Iniciar Gravação'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.recordHint, { color: colors.textMuted }]}>
            Dica: Leia o script escolhido com calma e intenção
          </Text>
        </SacredCard>

        {/* My Meditations */}
        {meditations.length > 0 && (
          <SacredCard style={styles.recordingsCard}>
            <Text style={[styles.recordingsTitle, { color: colors.text }]}>
              Minhas Meditações Gravadas
            </Text>

            {meditations.map((meditation) => {
              const category = CATEGORIES.find(c => c.value === meditation.category);
              const isPlaying = playingId === meditation.id;

              return (
                <View 
                  key={meditation.id}
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
                        {meditation.name}
                      </Text>
                    </View>
                    <Text style={[styles.recordingSubtitle, { color: colors.textSecondary }]}>
                      {category?.label}
                    </Text>
                    <Text style={[styles.recordingDuration, { color: colors.textSecondary }]}>
                      Duração: {formatDuration(meditation.duration)}
                    </Text>
                    <Text style={[styles.recordingTimestamp, { color: colors.textMuted }]}>
                      Gravada {formatTimestamp(meditation.created_at)}
                    </Text>
                  </View>

                  <View style={styles.recordingActions}>
                    <TouchableOpacity
                      style={[styles.playButton, { backgroundColor: category?.color + '20' }]}
                      onPress={() => playMeditation(meditation)}
                    >
                      <MaterialIcons 
                        name={isPlaying ? 'pause' : 'play-arrow'} 
                        size={28} 
                        color={category?.color} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteMeditation(meditation)}
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

        {/* Tips Card */}
        <SacredCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="tips-and-updates" size={32} color={colors.primary} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              Dicas Para Suas Meditações
            </Text>
          </View>

          {/* Gravação Section */}
          <View style={styles.tipsSection}>
            <Text style={[styles.tipsSectionTitle, { color: colors.text }]}>
              📹 Como Gravar
            </Text>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Prepare-se em silêncio</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Antes de gravar, sente-se por alguns minutos em quietude. Respire com calma e conecte-se com a intenção clara da sua manifestação (ex: paz interior, coragem, abundância consciente).
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Escolha o que incluir no áudio</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Você pode começar com uma breve preparação ("Sente-se confortavelmente… relaxe todos os músculos…") ou deixar isso para antes de apertar play — o que sentir mais alinhado à sua prática.{"\n\n"}
                Use palavras simples, suaves e afirmativas, sempre voltadas à presença e à confiança no que deseja, como se já fosse seu.{"\n\n"}
                Inclua silêncios: deixe trechos de 1 a 5 minutos sem fala, para que você possa mergulhar na experiência, sentir a intenção e permitir que a manifestação se alinhe em silêncio.
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Finalize com cuidado</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Termine com frases que convidem ao retorno suave:{"\n"}
                "Aos poucos, traga sua atenção de volta ao corpo… lentamente, movimente suas mãos... seus pés... perceba como se sente… sinta sendo seu. Já é!"
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Grave com naturalidade</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Use o gravador do seu celular, em um ambiente tranquilo. Fale devagar, como se sussurrasse para si mesmo(a). Não precisa ser perfeito — o que importa é a verdade da sua intenção.
              </Text>
            </View>
          </View>

          {/* Meditação Section */}
          <View style={styles.tipsSection}>
            <Text style={[styles.tipsSectionTitle, { color: colors.text }]}>
              🧘 Como Usar as Gravações
            </Text>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Escolha um momento sagrado</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Reserve um tempo diário — mesmo que breve — em que você possa estar totalmente presente, sem interrupções.
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Ouça com atenção plena</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Use fones de ouvido, sente-se ou deite-se com conforto, e deixe sua voz guiá-lo(a). Durante os silêncios, apenas esteja e sinta-se vivendo sua nova realidade. É nesse momento que a sua intenção se alinha com a sua vibração e te leva cada vez mais perto do que já deveria ser.
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Repita com consistência</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Use a mesma gravação por alguns dias ou semanas. A repetição suave fortalece o alinhamento entre sua mente, coração e o que deseja para a sua vida.
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Confie no silêncio</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Lembre-se: a manifestação não acontece só nas palavras, mas no espaço entre elas. Sua presença é o solo onde tudo floresce.
              </Text>
            </View>
          </View>

          <View style={[styles.tipsFooter, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.tipsFooterText, { color: colors.text }]}>
              ✨ A sua voz é o caminho mais íntimo de retornar a si mesmo(a).
            </Text>
          </View>
        </SacredCard>

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "Sua voz carrega sua essência. Quando você ouve suas próprias palavras de manifestação, seu subconsciente reconhece a verdade e acelera a criação."
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

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
              {confirmModalConfig.title}
            </Text>
            <Text style={[styles.confirmModalMessage, { color: colors.textSecondary }]}>
              {confirmModalConfig.message}
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, { backgroundColor: colors.surface }]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={[styles.confirmModalButtonText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, { backgroundColor: colors.primary }]}
                onPress={confirmModalConfig.onConfirm}
              >
                <Text style={[styles.confirmModalButtonText, { color: 'white' }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    textAlign: 'center',
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
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
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
  tipsCard: {
    marginBottom: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: Spacing.md,
    flex: 1,
  },
  tipsSection: {
    marginBottom: Spacing.xl,
  },
  tipsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  tipItem: {
    marginBottom: Spacing.lg,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  tipsFooter: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  tipsFooterText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  confirmModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
