import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { useDailyPractices } from '@/hooks/useDailyPractices';
import { Spacing } from '@/constants/Colors';

export default function SymbolicNFTScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Parâmetros da URL (incluindo seleções da tela de configuração)
  const { 
    cocreationId,
    selectedGratitudes,
    selectedMantra,
    selectedMeditation,
    selectedAffirmations 
  } = useLocalSearchParams();
  
  const id = cocreationId as string;

  const { cocriations } = useIndividualCocriations();
  const { items: visionBoardItems } = useVisionBoardItems(id || '');
  const { practices } = useDailyPractices(id || '');

  const [cocriation, setCocriation] = useState(null);
  const [symbolicHash, setSymbolicHash] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Parse das seleções dos parâmetros da URL
  const parsedSelectedGratitudes = selectedGratitudes ? JSON.parse(selectedGratitudes) : [];
  const parsedSelectedAffirmations = selectedAffirmations ? JSON.parse(selectedAffirmations) : [];
  const parsedSelectedMantra = selectedMantra || null;
  const parsedSelectedMeditation = selectedMeditation || null;

  useEffect(() => {
    if (id) {
      const found = cocriations.find(c => c.id === id);
      if (found) {
        setCocriation(found);
        generateSymbolicHash(found);
      }
    }
  }, [id, cocriations]);

  const generateSymbolicHash = (cocriation: any) => {
    const data = `${cocriation.id}${cocriation.title}${cocriation.created_at}${user?.id}`;
    const hash = Array.from(data)
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(16)
      .padStart(64, '0')
      .substring(0, 64);
    setSymbolicHash(`0x${hash.substring(0, 8)}...${hash.substring(56, 64)}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleClose = () => {
    router.replace('/(tabs)/individual');
  };

  const handleGoFullScreen = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  if (!cocriation) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Filtrar práticas pelos IDs selecionados
  const selectedGratitudePractices = practices.filter(p => 
    parsedSelectedGratitudes.includes(p.id) && p.type === 'gratitude'
  );
  const selectedMantraPractice = practices.find(p => 
    parsedSelectedMantra === p.id && p.type === 'mantra'
  );
  const selectedMeditationPractice = practices.find(p => 
    parsedSelectedMeditation === p.id && p.type === 'meditation'
  );
  const selectedAffirmationPractices = practices.filter(p => 
    parsedSelectedAffirmations.includes(p.id) && p.type === 'affirmation'
  );

  // Filtrar imagens do Vision Board
  const imageItems = visionBoardItems.filter(item => item.type === 'image' && item.content);

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="arrow-back-ios" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sua Memória de Cocriação</Text>
          <TouchableOpacity onPress={handleGoFullScreen}>
            <MaterialIcons name="fullscreen" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Memória Principal */}
          <SacredCard style={styles.memoryContainer}>
            <MemoryPreview
              cocriation={cocriation}
              user={user}
              symbolicHash={symbolicHash}
              formatDate={formatDate}
              imageItems={imageItems}
              selectedGratitudePractices={selectedGratitudePractices}
              selectedMantraPractice={selectedMantraPractice}
              selectedMeditationPractice={selectedMeditationPractice}
              selectedAffirmationPractices={selectedAffirmationPractices}
              colors={colors}
            />
          </SacredCard>

          {/* Info Card */}
          <TouchableOpacity
            onPress={() => setShowInfo(!showInfo)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <MaterialIcons name="info-outline" size={24} color={colors.text} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Sobre sua Memória</Text>
              <MaterialIcons
                name={showInfo ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={colors.text}
              />
            </View>
            {showInfo && (
              <View style={styles.infoContent}>
                <Text style={styles.infoText}>
                  Esta é a Memória de sua Cocriação — um registro vivo do momento
                  em que você reconheceu que tudo que desejou já era real.
                  {'\n\n'}
                  Não é um ativo. Não é um token. É o testemunho silencioso 
                  do momento em que você disse: "Já é."
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Botão Tela Cheia */}
          <SacredButton
            title="Ver em Tela Cheia"
            onPress={handleGoFullScreen}
            variant="outline"
            style={styles.fullScreenButton}
          />
        </ScrollView>

        {/* Modal de Tela Cheia */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isFullScreen}
          onRequestClose={handleCloseFullScreen}
        >
          <View style={styles.fullScreenOverlay}>
            <TouchableOpacity style={styles.fullScreenCloseButton} onPress={handleCloseFullScreen}>
              <MaterialIcons name="close" size={32} color="white" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.fullScreenContent}>
              <MemoryPreview
                cocriation={cocriation}
                user={user}
                symbolicHash={symbolicHash}
                formatDate={formatDate}
                imageItems={imageItems}
                selectedGratitudePractices={selectedGratitudePractices}
                selectedMantraPractice={selectedMantraPractice}
                selectedMeditationPractice={selectedMeditationPractice}
                selectedAffirmationPractices={selectedAffirmationPractices}
                colors={colors}
                isFullScreen={true}
              />
            </ScrollView>
          </View>
        </Modal>
      </View>
    </GradientBackground>
  );
}

// Componente de Preview da Memória
const MemoryPreview = ({
  cocriation,
  user,
  symbolicHash,
  formatDate,
  imageItems,
  selectedGratitudePractices,
  selectedMantraPractice,
  selectedMeditationPractice,
  selectedAffirmationPractices,
  colors,
  isFullScreen = false,
}: any) => {
  return (
    <LinearGradient
      colors={colors.gradientMemories || ['#8B5CF6', '#EC4899', '#F97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.memoryCard, isFullScreen && styles.memoryCardFullScreen]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Memória de Cocriação</Text>
        </View>

        {/* Título + Narrativa Final */}
        <View style={styles.titleSection}>
          <Text style={styles.cocriationTitle}>
            {cocriation.title}
          </Text>
          <View style={styles.narrativeSection}>
            <Text style={styles.narrativeText}>
              Esta é a sua Memória de Cocriação.
              {'\n'}Não é um ativo. Não é um token.
              {'\n'}É o testemunho silencioso do momento em que você disse:
              {'\n\n'}Já é.
              {'\n\n'}Guarde-a como um tesouro da alma.
            </Text>
            {cocriation.mental_code && (
              <View style={[styles.mentalCodeBadge, { backgroundColor: colors.accent || '#F97316' }]}>
                <Text style={styles.mentalCodeText}>{cocriation.mental_code}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Conteúdo Personalizado */}
        <View style={styles.customContent}>
          {selectedGratitudePractices.length > 0 && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeader}>Gratidões</Text>
              {selectedGratitudePractices.map((p) => (
                <Text key={p.id} style={styles.contentText}>• {p.content}</Text>
              ))}
            </View>
          )}
          {selectedMantraPractice && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeader}>Mantra</Text>
              <Text style={styles.contentText}>{selectedMantraPractice.content}</Text>
            </View>
          )}
          {selectedMeditationPractice && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeader}>Meditação</Text>
              <Text style={styles.contentText}>{selectedMeditationPractice.content}</Text>
            </View>
          )}
          {selectedAffirmationPractices.length > 0 && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeader}>Afirmações</Text>
              {selectedAffirmationPractices.map((p) => (
                <Text key={p.id} style={styles.contentText}>• {p.content}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Preview das Imagens */}
        {imageItems.length > 0 && (
          <View style={styles.imageGrid}>
            {imageItems.slice(0, 6).map((item, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: item.content }} style={styles.previewImage} />
              </View>
            ))}
            {imageItems.length > 6 && (
              <View style={styles.moreImagesItem}>
                <Text style={styles.moreImagesText}>+{imageItems.length - 6}</Text>
              </View>
            )}
          </View>
        )}

        {/* Informações */}
        <View style={styles.infoSection}>
          <Text style={styles.userText}>Por: {user?.full_name || 'Cocriador'}</Text>
          <Text style={styles.dateText}>
            Concluída em {formatDate(cocriation.completion_date || new Date().toISOString())}
          </Text>
        </View>

        {/* Hash Simbólico */}
        <View style={styles.hashSection}>
          <Text style={styles.hashLabel}>Hash Simbólico:</Text>
          <Text style={styles.hashValue}>{symbolicHash}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialIcons name="auto-awesome" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.footerText}>Jaé App</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  memoryContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContent: {
    marginTop: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
  },
  fullScreenButton: {
    marginBottom: Spacing.xl,
  },
  // Estilos da Memória
  memoryCard: {
    width: '100%',
    maxWidth: 360,
    minHeight: 600,
    borderRadius: 24,
    padding: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  memoryCardFullScreen: {
    width: '90%',
    maxWidth: 500,
    minHeight: 700,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  badgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cocriationTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  narrativeSection: {
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  narrativeText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.95)',
    fontStyle: 'italic',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  mentalCodeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  mentalCodeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  customContent: {
    marginBottom: Spacing.lg,
  },
  contentSection: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FBBF24',
    marginBottom: Spacing.xs,
  },
  contentText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  imageItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  userText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  hashSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  hashLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hashValue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  // Full Screen Modal
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
  },
  fullScreenContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
});