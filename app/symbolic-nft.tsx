// app/symbolic-nft.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Colors';

export default function SymbolicNFTScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { cocriations } = useIndividualCocriations();
  
  const [cocriation, setCocriation] = useState<any>(null);
  const [symbolicHash, setSymbolicHash] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const nftCardRef = useRef<View>(null);

  useEffect(() => {
    if (cocreationId) {
      const found = cocriations.find(c => c.id === cocreationId);
      if (found) {
        setCocriation(found);
        // Gerar hash simbólico
        generateSymbolicHash(found);
      }
    }
  }, [cocreationId, cocriations]);

  const generateSymbolicHash = (cocriation: any) => {
    // Gerar um hash simbólico baseado nos dados da cocriação
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

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Solicitar permissão
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir o acesso à galeria para salvar a imagem.'
        );
        setIsDownloading(false);
        return;
      }

      // Capturar a view como imagem
      if (nftCardRef.current) {
        const uri = await captureRef(nftCardRef, {
          format: 'png',
          quality: 1,
        });

        // Salvar na galeria
        await MediaLibrary.createAssetAsync(uri);

        if (Platform.OS === 'web') {
          alert('NFT Simbólico salvo com sucesso!');
        } else {
          Alert.alert(
            'Sucesso!',
            'Seu NFT Simbólico foi salvo na galeria.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error downloading NFT:', error);
      Alert.alert('Erro', 'Não foi possível salvar a imagem. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (nftCardRef.current) {
        const uri = await captureRef(nftCardRef, {
          format: 'png',
          quality: 1,
        });

        if (Platform.OS === 'web') {
          // No web, apenas mostrar mensagem
          alert('Compartilhamento disponível apenas em dispositivos móveis.');
        } else {
          await Share.share({
            message: `Meu NFT Simbólico de Cocriação: ${cocriation?.title}`,
            url: uri,
          });
        }
      }
    } catch (error) {
      console.error('Error sharing NFT:', error);
    }
  };

  const handleClose = () => {
    router.replace('/(tabs)/individual');
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
        <View style={styles.nftContainer}>
          <View ref={nftCardRef} collapsable={false}>
            <LinearGradient
              colors={['#1a0b2e', '#2d1b4e', '#4a2c6e', '#6B46C1']}
              style={styles.nftCard}
            >
              {/* Background Pattern */}
              <View style={styles.backgroundPattern}>
                <MaterialIcons name="auto-awesome" size={200} color="rgba(139, 92, 246, 0.1)" />
              </View>

              {/* Header Badge */}
              <View style={styles.nftBadge}>
                <Text style={styles.nftBadgeText}>COCRIAÇÃO</Text>
              </View>

              {/* Main Content */}
              <View style={styles.nftMainContent}>
                <View style={styles.nftIconContainer}>
                  <MaterialIcons name="verified" size={60} color="#FBBF24" />
                </View>

                <Text style={styles.nftTitle}>{cocriation.title}</Text>
                
                {cocriation.mental_code && (
                  <Text style={styles.nftMentalCode}>{cocriation.mental_code}</Text>
                )}
              </View>

              {/* Completion Info */}
              <View style={styles.nftInfo}>
                <View style={styles.nftInfoRow}>
                  <MaterialIcons name="person" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nftInfoText}>
                    {user?.full_name || user?.email?.split('@')[0] || 'Cocriador'}
                  </Text>
                </View>

                <View style={styles.nftInfoRow}>
                  <MaterialIcons name="calendar-today" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nftInfoText}>
                    {formatDate(cocriation.completion_date || new Date().toISOString())}
                  </Text>
                </View>
              </View>

              {/* Quote */}
              <View style={styles.nftQuote}>
                <Text style={styles.nftQuoteText}>
                  "Cocriado com intenção, emoção e presença."
                </Text>
              </View>

              {/* Hash */}
              <View style={styles.nftHash}>
                <Text style={styles.nftHashLabel}>Hash Simbólico:</Text>
                <Text style={styles.nftHashValue}>{symbolicHash}</Text>
              </View>

              {/* Footer */}
              <View style={styles.nftFooter}>
                <MaterialIcons name="auto-awesome" size={16} color="rgba(251, 191, 36, 0.8)" />
                <Text style={styles.nftFooterText}>Jaé App</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <MaterialIcons 
              name={isDownloading ? 'hourglass-empty' : 'download'} 
              size={24} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {isDownloading ? 'Salvando...' : 'Baixar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={24} color="white" />
            <Text style={styles.actionButtonText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <SacredCard style={styles.infoCard}>
          <TouchableOpacity
            style={styles.infoHeader}
            onPress={() => setShowInfo(!showInfo)}
          >
            <MaterialIcons name="info" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              O que é um NFT Simbólico?
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
                Este NFT Simbólico é um certificado emocional da sua conquista. 
                Ele representa sua jornada de cocriação e pode ser guardado como 
                uma lembrança significativa.
              </Text>
              
              <View style={styles.infoSection}>
                <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
                  Como criar um NFT real?
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Você pode usar esta imagem para criar um NFT real em plataformas 
                  blockchain como OpenSea, Rarible ou outras. Basta fazer upload da 
                  imagem salva e seguir o processo de criação (minting) da plataforma.
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
                  Principais plataformas:
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • OpenSea (opensea.io){'\n'}
                  • Rarible (rarible.com){'\n'}
                  • Mintable (mintable.app){'\n'}
                  • Foundation (foundation.app)
                </Text>
              </View>
            </View>
          )}
        </SacredCard>

        {/* Navigation Button */}
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.success }]}
          onPress={handleClose}
        >
          <MaterialIcons name="check-circle" size={24} color="white" />
          <Text style={styles.completeButtonText}>Concluir e Ver Minhas Cocriações</Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  nftContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  nftCard: {
    width: 340,
    minHeight: 480,
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    opacity: 0.3,
  },
  nftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    marginBottom: Spacing.xl,
  },
  nftBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  nftMainContent: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  nftIconContainer: {
    marginBottom: Spacing.lg,
  },
  nftTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  nftMentalCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 2,
  },
  nftInfo: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  nftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nftInfoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  nftQuote: {
    marginBottom: Spacing.lg,
  },
  nftQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  nftHash: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  nftHashLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nftHashValue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  nftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  nftFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  actionButtonText: {
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
  },
  infoContent: {
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoSection: {
    gap: Spacing.sm,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
