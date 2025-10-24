// app/symbolic-nft.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

export default function SymbolicNFTScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { cocriations } = useIndividualCocriations();
  const { items: visionBoardItems } = useVisionBoardItems(cocreationId || '');

  const [cocriation, setCocriation] = useState<any>(null);
  const [symbolicHash, setSymbolicHash] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Precisamos de permissão para salvar a imagem na galeria.');
        return;
      }
      alert('Funcionalidade de download será implementada com react-native-view-shot');
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Erro ao baixar o NFT');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌟 Cocriação Realizada!\n\n"${cocriation?.title}"\n\nCocriado com intenção, emoção e presença.\n\nHash: ${symbolicHash}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
            NFT Simbólico
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="close" size={28} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* NFT Card */}
        <SacredCard style={styles.nftCard}>
          <LinearGradient
            colors={['rgba(147, 51, 234, 0.1)', 'rgba(168, 85, 247, 0.05)']}
            style={styles.nftGradient}
          >
            {/* Vision Board Preview */}
            {previewImages.length > 0 && (
              <View style={styles.visionBoardPreview}>
                <View style={styles.imageGrid}>
                  {previewImages.slice(0, 4).map((item, index) => (
                    <Image
                      key={item.id}
                      source={{ uri: item.content }}
                      style={[
                        styles.gridImage,
                        previewImages.length === 1 && styles.singleImage,
                      ]}
                      contentFit="cover"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Title */}
            <Text style={[styles.nftTitle, { color: colors.text }]}>
              {cocriation.title}
            </Text>

            {/* Mental Code */}
            {cocriation.mental_code && (
              <Text style={[styles.mentalCode, { color: colors.primary }]}>
                {cocriation.mental_code}
              </Text>
            )}

            {/* Date */}
            <Text style={[styles.completionDate, { color: colors.textMuted }]}>
              Concluído em {formatDate(cocriation.completion_date || cocriation.created_at)}
            </Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Manifesto */}
            <Text style={[styles.manifestoText, { color: colors.textMuted }]}>
              "Cocriado com intenção, emoção e presença."
            </Text>

            {/* Hash */}
            <View style={styles.hashContainer}>
              <Text style={[styles.hashLabel, { color: colors.textMuted }]}>
                Hash Simbólico:
              </Text>
              <Text style={[styles.hashValue, { color: colors.primary }]}>
                {symbolicHash}
              </Text>
            </View>

            {/* Owner */}
            <View style={styles.ownerContainer}>
              <MaterialIcons name="person" size={16} color={colors.textMuted} />
              <Text style={[styles.ownerText, { color: colors.textMuted }]}>
                {user?.email || 'Cocriador'}
              </Text>
            </View>
          </LinearGradient>
        </SacredCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleViewFullScreen}
          >
            <MaterialIcons name="fullscreen" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Ver em Tela Cheia
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleDownload}
          >
            <MaterialIcons name="download" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Baixar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Compartilhar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: colors.surface }]}
          onPress={() => setShowInfo(!showInfo)}
        >
          <View style={styles.infoHeader}>
            <MaterialIcons name="info-outline" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              O que é um NFT Simbólico?
            </Text>
            <MaterialIcons
              name={showInfo ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textMuted}
            />
          </View>

          {showInfo && (
            <View style={styles.infoContent}>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Este é um certificado emocional da sua jornada de cocriação. Ele existe
                como um atestado de presença e intenção.
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted, marginTop: Spacing.md }]}>
                Você pode baixar esta imagem e, se desejar, criar um NFT real em uma
                blockchain através de plataformas como OpenSea, Rarible ou outras.
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted, marginTop: Spacing.md }]}>
                O hash simbólico foi gerado localmente e não está registrado em blockchain.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Full Screen Modal */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        onRequestClose={handleCloseFullScreen}
      >
        <GradientBackground>
          <View style={[styles.fullScreenContainer, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseFullScreen}
            >
              <MaterialIcons name="close" size={32} color={colors.text} />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={styles.fullScreenContent}
              showsVerticalScrollIndicator={false}
            >
              <LinearGradient
                colors={['rgba(147, 51, 234, 0.1)', 'rgba(168, 85, 247, 0.05)']}
                style={styles.fullScreenNFT}
              >
                {/* Vision Board Preview */}
                {previewImages.length > 0 && (
                  <View style={styles.fullScreenVisionBoard}>
                    <View style={styles.imageGrid}>
                      {previewImages.slice(0, 4).map((item, index) => (
                        <Image
                          key={item.id}
                          source={{ uri: item.content }}
                          style={[
                            styles.gridImage,
                            previewImages.length === 1 && styles.singleImage,
                          ]}
                          contentFit="cover"
                        />
                      ))}
                    </View>
                  </View>
                )}

                <Text style={[styles.fullScreenTitle, { color: colors.text }]}>
                  {cocriation.title}
                </Text>

                {cocriation.mental_code && (
                  <Text style={[styles.fullScreenMentalCode, { color: colors.primary }]}>
                    {cocriation.mental_code}
                  </Text>
                )}

                <Text style={[styles.fullScreenDate, { color: colors.textMuted }]}>
                  Concluído em {formatDate(cocriation.completion_date || cocriation.created_at)}
                </Text>

                <View style={[styles.fullScreenDivider, { backgroundColor: colors.border }]} />

                <Text style={[styles.fullScreenManifesto, { color: colors.textMuted }]}>
                  "Cocriado com intenção, emoção e presença."
                </Text>

                <View style={styles.fullScreenHashContainer}>
                  <Text style={[styles.fullScreenHashLabel, { color: colors.textMuted }]}>
                    Hash Simbólico:
                  </Text>
                  <Text style={[styles.fullScreenHashValue, { color: colors.primary }]}>
                    {symbolicHash}
                  </Text>
                </View>

                <View style={styles.fullScreenOwnerContainer}>
                  <MaterialIcons name="person" size={20} color={colors.textMuted} />
                  <Text style={[styles.fullScreenOwnerText, { color: colors.textMuted }]}>
                    {user?.email || 'Cocriador'}
                  </Text>
                </View>
              </LinearGradient>
            </ScrollView>
          </View>
        </GradientBackground>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nftCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    overflow: 'hidden',
  },
  nftGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  visionBoardPreview: {
    width: '100%',
    marginBottom: Spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridImage: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 1,
  },
  nftTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  mentalCode: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  completionDate: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: Spacing.lg,
  },
  manifestoText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  hashContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  hashLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  hashValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ownerText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  fullScreenContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: Spacing.xs,
  },
  fullScreenContent: {
    padding: Spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  fullScreenNFT: {
    padding: Spacing.xl * 1.5,
    borderRadius: 24,
    alignItems: 'center',
  },
  fullScreenVisionBoard: {
    width: '100%',
    marginBottom: Spacing.xl * 1.5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fullScreenTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  fullScreenMentalCode: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  fullScreenDate: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  fullScreenDivider: {
    width: '100%',
    height: 2,
    marginVertical: Spacing.xl,
  },
  fullScreenManifesto: {
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  fullScreenHashContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  fullScreenHashLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  fullScreenHashValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  fullScreenOwnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fullScreenOwnerText: {
    fontSize: 16,
  },
});
