// app/symbolic-nft.tsx
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
import { useDailyPractices } from '@/hooks/useDailyPractices'; // Assumindo que existe
import { Spacing } from '@/constants/Colors';

export default function SymbolicNFTScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { cocriations } = useIndividualCocriations();
  const { items: visionBoardItems } = useVisionBoardItems(cocreationId || '');
  const { practices } = useDailyPractices(cocreationId || '');

  const [cocriation, setCocriation] = useState<any>(null);
  const [symbolicHash, setSymbolicHash] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Seleção de conteúdo para o NFT
  const [selectedGratitudes, setSelectedGratitudes] = useState<string[]>([]);
  const [selectedMantra, setSelectedMantra] = useState<string | null>(null);
  const [selectedMeditation, setSelectedMeditation] = useState<string | null>(null);
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);

  useEffect(() => {
    if (cocreationId) {
      const found = cocriations.find(c => c.id === cocreationId);
      if (found) {
        setCocriation(found);
        generateSymbolicHash(found);
      }
    }
  }, [cocreationId, cocriations]);

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

  const handleViewFullScreen = () => {
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

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Personalizar NFT Simbólico
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
            {gratitudes.map((g, i) => (
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
            {affirmations.map((a, i) => (
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

        {/* Preview do NFT */}
        <SacredCard style={styles.previewCard}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.lg }]}>
            Pré-visualização do NFT
          </Text>
          <NFTPreview
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

        {/* Botão Ver em Tela Cheia */}
        <TouchableOpacity