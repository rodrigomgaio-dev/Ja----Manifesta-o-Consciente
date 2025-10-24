import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
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

  const handleDownload = () => {
    Alert.alert(
      'Salvar seu Certificado',
      'Para guardar este momento sagrado, tire um print da tela:\n\n• Android: pressione os botões **Volume + Liga/Desliga** ao mesmo tempo.\n• iOS: pressione **Lateral + Volume +**.',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Compartilhar',
          onPress: handleShare,
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const message = `Meu NFT Simbólico de Cocriação: "${cocriation?.title}"\n\nJá é!\n\nGerado no Jaé App — cocriação consciente.`;
      await Sharing.shareAsync('', { dialogTitle: 'Compartilhar NFT Simbólico', mimeType: 'text/plain', ...Platform.OS === 'ios' ? { subject: 'Meu NFT Simbólico' } : {} });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar.');
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

  // Filtrar apenas imagens do Vision Board
  const imageItems = visionBoardItems.filter(item => item.type === 'image' && item.content);
  const previewImages = imageItems.slice(0, 4); // Máximo de 4

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

        {/* Certificado */}
        <View style={styles.certificateContainer}>
          <LinearGradient
            colors={['#1a0b2e', '#2d1b4e', '#4a2c6e', '#6B46C1']}
            style={styles.certificateCard}
          >
            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>CERTIFICADO DE COCRIAÇÃO</Text>
            </View>

            {/* Frase Central */}
            <View style={styles.mainContent}>
              <Text style={styles.mainText}>Já é.</Text>
              <Text style={styles.subtitle}>Gratidão pela cocriação.</Text>
            </View>

            {/* Título e Código Mental */}
            <View style={styles.titleSection}>
              <Text style={styles.cocriationTitle}>{cocriation.title}</Text>
              {cocriation.mental_code && (
                <View style={[styles.mentalCodeBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.mentalCodeText}>{cocriation.mental_code}</Text>
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
                {previewImages.length < 4 &&
                  Array.from({ length: 4 - previewImages.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={[styles.imageItem, styles.emptyImageItem]}>
                      <MaterialIcons name="image" size={24} color="rgba(255,255,255,0.2)" />
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
        </View>

        {/* Ações */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <MaterialIcons name="download" size={24} color="white" />
            <Text style={styles.actionButtonText}>Salvar (Print)</Text>
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
                Este é um certificado emocional da sua conquista. Representa sua jornada de cocriação e pode ser guardado como lembrança sagrada.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                Para criar um NFT real, você pode usar esta imagem como base em plataformas como OpenSea ou Rarible.
              </Text>
            </View>
          )}
        </SacredCard>

        {/* Botão Final */}
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
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
  certificateContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  certificateCard: {
    width: '100%',
    maxWidth: 360,
    minHeight: 520,
    borderRadius: 24,
    padding: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mainText: {
    fontSize: 64,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
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
    marginBottom: Spacing.sm,
  },
  mentalCodeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  mentalCodeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  imageItem: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyImageItem: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
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