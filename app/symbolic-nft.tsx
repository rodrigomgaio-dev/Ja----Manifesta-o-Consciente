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
  
  // 🔑 Correção: leitura segura do parâmetro
  const { cocreationId } = useLocalSearchParams();
  const id = cocreationId as string;

  const { cocriations } = useIndividualCocriations();
  const { items: visionBoardItems } = useVisionBoardItems(id || '');
  const { practices } = useDailyPractices(id || '');

  const [cocriation, setCocriation] = useState<any>(null);
  const [symbolicHash, setSymbolicHash] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Seleção de conteúdo para a Memória
  const [selectedGratitudes, setSelectedGratitudes] = useState<string[]>([]);
  const [selectedMantra, setSelectedMantra] = useState<string | null>(null);
  const [selectedMeditation, setSelectedMeditation] = useState<string | null>(null);
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);

  // 🔑 Correção: usar 'id' em vez de 'cocreationId'
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

  const handleGenerateMemory = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  if (!cocriation) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  // Filtrar práticas por tipo
  const gratitudes = practices.filter(p => p.type === 'gratitude').slice(0, 3);
  const mantras = practices.filter(p => p.type === 'mantra').slice(0, 1);
  const meditations = practices.filter(p => p.type === 'meditation').slice(0, 1);
  const affirmations = practices.filter(p => p.type === 'affirmation').slice(0, 3);

  // Filtrar imagens do Vision Board
  const imageItems = visionBoardItems.filter(item => item.type === 'image' && item.content);
  const previewImages = imageItems.slice(0, 4);

  // Verifica se pelo menos um item foi selecionado
  const hasSelection =
    selectedGratitudes.length > 0 ||
    selectedMantra !== null ||
    selectedMeditation !== null ||
    selectedAffirmations.length > 0;

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Personalizar Memória de Cocriação
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="close" size={28} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Seções de Seleção */}
        {gratitudes.length > 0 && (
          <SacredCard style={styles.selectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Gratidões (até 3)
            </Text>
            {gratitudes.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.selectionItem,
                  { borderColor: selectedGratitudes.includes(g.id) ? colors.primary : colors.border }
                ]}
                onPress={() => {
                  if (selectedGratitudes.includes(g.id)) {
                    setSelectedGratitudes(prev => prev.filter(id => id !== g.id));
                  } else if (selectedGratitudes.length < 3) {
                    setSelectedGratitudes(prev => [...prev, g.id]);
                  }
                }}
              >
                <MaterialIcons
                  name={selectedGratitudes.includes(g.id) ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={selectedGratitudes.includes(g.id) ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.selectionText, { color: colors.text }]} numberOfLines={2}>
                  {g.title || g.content.substring(0, 60) + '...'}
                </Text>
              </TouchableOpacity>
            ))}
          </SacredCard>
        )}

        {mantras.length > 0 && (
          <SacredCard style={styles.selectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mantra
            </Text>
            {mantras.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.selectionItem,
                  { borderColor: selectedMantra === m.id ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedMantra(selectedMantra === m.id ? null : m.id)}
              >
                <MaterialIcons
                  name={selectedMantra === m.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={selectedMantra === m.id ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.selectionText, { color: colors.text }]} numberOfLines={2}>
                  {m.title || m.content.substring(0, 60) + '...'}
                </Text>
              </TouchableOpacity>
            ))}
          </SacredCard>
        )}

        {meditations.length > 0 && (
          <SacredCard style={styles.selectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Meditação
            </Text>
            {meditations.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.selectionItem,
                  { borderColor: selectedMeditation === m.id ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedMeditation(selectedMeditation === m.id ? null : m.id)}
              >
                <MaterialIcons
                  name={selectedMeditation === m.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={selectedMeditation === m.id ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.selectionText, { color: colors.text }]} numberOfLines={2}>
                  {m.title || m.content.substring(0, 60) + '...'}
                </Text>
              </TouchableOpacity>
            ))}
          </SacredCard>
        )}

        {affirmations.length > 0 && (
          <SacredCard style={styles.selectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Afirmações (até 3)
            </Text>
            {affirmations.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.selectionItem,
                  { borderColor: selectedAffirmations.includes(a.id) ? colors.primary : colors.border }
                ]}
                onPress={() => {
                  if (selectedAffirmations.includes(a.id)) {
                    setSelectedAffirmations(prev => prev.filter(id => id !== a.id));
                  } else if (selectedAffirmations.length < 3) {
                    setSelectedAffirmations(prev => [...prev, a.id]);
                  }
                }}
              >
                <MaterialIcons
                  name={selectedAffirmations.includes(a.id) ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={selectedAffirmations.includes(a.id) ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.selectionText, { color: colors.text }]} numberOfLines={2}>
                  {a.title || a.content.substring(0, 60) + '...'}
                </Text>
              </TouchableOpacity>
            ))}
          </SacredCard>
        )}

        {/* Pré-visualização */}
        <SacredCard style={styles.previewCard}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.lg }]}>
            Pré-visualização
          </Text>
          <MemoryPreview
            cocriation={cocriation}
            user={user}
            symbolicHash={symbolicHash}
            formatDate={formatDate}
            previewImages={previewImages}
            selectedGratitudes={selectedGratitudes}
            selectedMantra={selectedMantra}
            selectedMeditation={selectedMeditation}
            selectedAffirmations={selectedAffirmations}
            practices={practices}
            colors={colors}
          />
        </SacredCard>

        {/* Botão Gerar Memória */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            {
              backgroundColor: hasSelection ? colors.primary : colors.textMuted + '60',
            }
          ]}
          onPress={handleGenerateMemory}
          disabled={!hasSelection}
        >
          <MaterialIcons name="auto-awesome" size={24} color="white" />
          <Text style={styles.generateButtonText}>
            Gerar Minha Memória de Cocriação
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <SacredCard style={styles.infoCard}>
          <TouchableOpacity
            style={styles.infoHeader}
            onPress={() => setShowInfo(!showInfo)}
          >
            <MaterialIcons name="info" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Sobre sua Memória de Cocriação
            </Text>
            <MaterialIcons
              name={showInfo ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          {showInfo && (
            <View style={styles.infoContent}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Esta é a Memória de sua Cocriação — um registro vivo do momento 
                em que você reconheceu que tudo que desejou já era real.
              </Text>
            </View>
          )}
        </SacredCard>

        {/* Modal de Tela Cheia */}
        <Modal visible={isFullScreen} transparent={true} animationType="fade">
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
                previewImages={previewImages}
                selectedGratitudes={selectedGratitudes}
                selectedMantra={selectedMantra}
                selectedMeditation={selectedMeditation}
                selectedAffirmations={selectedAffirmations}
                practices={practices}
                colors={colors}
                isFullScreen={true}
              />
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </GradientBackground>
  );
}

// Componente de Preview da Memória
const MemoryPreview = ({
  cocriation,
  user,
  symbolicHash,
  formatDate,
  previewImages,
  selectedGratitudes,
  selectedMantra,
  selectedMeditation,
  selectedAffirmations,
  practices,
  colors,
  isFullScreen = false,
}: any) => {
  const getPracticeById = (id: string) => practices.find(p => p.id === id);

  return (
    <LinearGradient
      colors={['#1a0b2e', '#2d1b4e', '#4a2c6e', '#6B46C1']}
      style={[styles.memoryCard, isFullScreen && styles.memoryCardFullScreen]}
    >
      {/* Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Memória de Cocriação</Text>
      </View>

      {/* Título + Narrativa Final */}
      <View style={styles.titleSection}>
        <Text style={styles.cocriationTitle}>{cocriation.title}</Text>

        <View style={styles.narrativeSection}>
          <Text style={styles.narrativeText}>
            Esta é a sua Memória de Cocriação.
            {"\n"}Não é um ativo. Não é um token.
            {"\n"}É o testemunho silencioso do momento em que você disse:
            {"\n\n"}Já é.
            {"\n\n"}Guarde-a como um tesouro da alma.
          </Text>
        </View>

        {cocriation.mental_code && (
          <View style={[styles.mentalCodeBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.mentalCodeText}>{cocriation.mental_code}</Text>
          </View>
        )}
      </View>

      {/* Conteúdo Personalizado */}
      <View style={styles.customContent}>
        {selectedGratitudes.length > 0 && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionHeader}>Gratidões</Text>
            {selectedGratitudes.map(id => {
              const p = getPracticeById(id);
              return p ? <Text key={id} style={styles.contentText}>• {p.content}</Text> : null;
            })}
          </View>
        )}

        {selectedMantra && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionHeader}>Mantra</Text>
            <Text style={styles.contentText}>
              {getPracticeById(selectedMantra)?.content}
            </Text>
          </View>
        )}

        {selectedMeditation && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionHeader}>Meditação</Text>
            <Text style={styles.contentText}>
              {getPracticeById(selectedMeditation)?.content}
            </Text>
          </View>
        )}

        {selectedAffirmations.length > 0 && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionHeader}>Afirmações</Text>
            {selectedAffirmations.map(id => {
              const p = getPracticeById(id);
              return p ? <Text key={id} style={styles.contentText}>• {p.content}</Text> : null;
            })}
          </View>
        )}
      </View>

      {/* Preview das Imagens */}
      {previewImages.length > 0 && (
        <View style={styles.imageGrid}>
          {previewImages.map((item, index) => (
            <View key={index} style={styles.imageItem}>
              <Image
                source={{ uri: item.content }}
                style={styles.previewImage}
                contentFit="cover"
              />
            </View>
          ))}
        </View>
      )}

      {/* Informações */}
      <View style={styles.infoSection}>
        <Text style={styles.userText}>
          Por: {user?.full_name || 'Cocriador'}
        </Text>
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
        <MaterialIcons name="auto-awesome" size={16} color="rgba(251, 191, 36, 0.8)" />
        <Text style={styles.footerText}>Jaé App</Text>
      </View>
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
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  selectionCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  selectionText: {
    fontSize: 14,
    marginLeft: Spacing.md,
    flex: 1,
  },
  previewCard: {
    marginBottom: Spacing.lg,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  infoContent: {
    marginTop: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
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