// app/memory-view.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions, RefreshControl, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

// Função para gerar valores aleatórios para colagem
const getRandomRotation = () => (Math.random() - 0.5) * 15; // -7.5 a 7.5 graus
const getRandomScale = () => 0.85 + Math.random() * 0.25; // 0.85 a 1.1
const getRandomOffsetX = () => (Math.random() - 0.5) * 15; // -7.5 a 7.5 px
const getRandomOffsetY = () => (Math.random() - 0.5) * 15; // -7.5 a 7.5 px

export default function MemoryViewScreen() {
  const { colors } = useTheme();
  const { user, session } = useAuth();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();

  const [cocriacaoData, setCocriacaoData] = useState<any>(null);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [visionBoardItems, setVisionBoardItems] = useState<any[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Sessão expirada ou usuário não autenticado.');
      if (!cocriacaoId) throw new Error('ID da Cocriação ausente.');

      // 1. Carregar dados principais da cocriação
      const { data: cocriacao, error: loadError } = await supabase
        .from('individual_cocriations')
        .select('title, why_reason, mental_code, memory_snapshot, cover_image_url, status')
        .eq('id', cocriacaoId)
        .eq('user_id', user.id)
        .single();

      if (loadError) throw loadError;
      if (!cocriacao) {
        const {  debugCocriacao, error: debugError } = await supabase
          .from('individual_cocriations')
          .select('title, why_reason, mental_code, memory_snapshot, cover_image_url, status')
          .eq('id', cocriacaoId)
          .single();

        if (debugCocriacao) {
            throw new Error('Sessão inválida. A memória não pertence ao usuário logado.');
        } else if (debugError) {
            throw new Error('Cocriação não encontrada. O ID pode estar incorreto ou a cocriação pode ter sido excluída.');
        } else {
             throw new Error('Cocriação não encontrada ou erro inesperado.');
        }
      }

      if (!cocriacao.memory_snapshot) {
        throw new Error('Dados da Memória da Cocriação não encontrados no registro. A cocriação pode não ter sido concluída corretamente.');
      }

      setCocriacaoData(cocriacao);
      setMemoryData(cocriacao.memory_snapshot);
      setCoverImageUrl(cocriacao.cover_image_url);

      // 2. Carregar os itens do Vision Board
      const {  items, error: itemsError } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('cocreation_id', cocriacaoId)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error("Erro ao carregar itens do Vision Board:", itemsError);
        setVisionBoardItems([]);
      } else {
        setVisionBoardItems(items || []);
      }

    } catch (err) {
      console.error('Erro geral ao carregar a memória da cocriação:', err);
      setError(`Falha ao carregar a memória: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cocriacaoId, user?.id, session?.user?.id]);

  const onRefresh = () => {
    loadData(true);
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Criando sua lembrança...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <Text style={[styles.errorText, { color: colors.error }]}>Erro: {error}</Text>
        <Text style={{ color: colors.text }}>Por favor, tente novamente.</Text>
      </LinearGradient>
    );
  }

  if (!memoryData || !cocriacaoData) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <Text style={{ color: colors.text }}>Nenhuma memória encontrada.</Text>
      </LinearGradient>
    );
  }

  // Filtra apenas imagens do Vision Board
  const visionBoardImages = visionBoardItems.filter(item => item.type === 'image' && item.content);

  // --- Renderização da Memória (Colagem de Conquista) ---
  return (
    <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Título Principal */}
        <Text style={[styles.mainTitle, { color: colors.text }]}>{cocriacaoData.title}</Text>

        {/* "O meu porquê" e Código Mental */}
        <View style={styles.infoSection}>
          {cocriacaoData.why_reason && (
            <View style={styles.infoItem}>
              <MaterialIcons name="sentiment-very-satisfied" size={20} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>O meu porquê: </Text>
                {cocriacaoData.why_reason}
              </Text>
            </View>
          )}
          {cocriacaoData.mental_code && (
            <View style={styles.infoItem}>
              <MaterialIcons name="code" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>Código Mental: </Text>
                <Text style={styles.mentalCodeHighlight}>{cocriacaoData.mental_code}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Imagem de Capa */}
        {coverImageUrl && (
          <View style={styles.coverImageContainer}>
            <Image
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
              contentFit="cover"
            />
          </View>
        )}

        {/* Colagem de Imagens do Vision Board */}
        {visionBoardImages.length > 0 && (
          <View style={styles.visionBoardCollageContainer}>
            <Text style={[styles.collageTitle, { color: colors.text }]}>Memórias Visuais:</Text>
            <View style={styles.visionBoardCollage}>
              {visionBoardImages.map((item, index) => {
                // Calcula posições para evitar sobreposição total e manter dentro dos limites
                const imgWidth = 100;
                const imgHeight = 100;
                const containerWidth = width * 0.8; // 80% da largura da tela
                const containerHeight = 300; // Altura fixa do container da colagem

                // Garante que a imagem fique dentro dos limites do container com margem
                const maxX = containerWidth - imgWidth - 10;
                const maxY = containerHeight - imgHeight - 10;

                const randomX = Math.min(maxX, Math.max(0, Math.random() * maxX));
                const randomY = Math.min(maxY, Math.max(0, Math.random() * maxY));

                return (
                  <Animated.View
                    key={item.id || index}
                    style={[
                      styles.collageImage,
                      {
                        transform: [
                          { rotate: `${getRandomRotation()}deg` },
                          { scale: getRandomScale() },
                          { translateX: getRandomOffsetX() },
                          { translateY: getRandomOffsetY() },
                        ],
                        // zIndex: index, // Removido zIndex para evitar sobreposição complexa
                        position: 'absolute',
                        left: randomX,
                        top: randomY,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: item.content }}
                      style={styles.collageImageContent}
                      contentFit="cover"
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        {/* Mantra, Afirmações, Gratidões */}
        <View style={styles.contentSection}>
          {memoryData.most_practiced_mantra && (
            <View style={styles.contentItem}>
              <MaterialIcons name="star" size={24} color={colors.warning} style={styles.contentIcon} />
              <View>
                <Text style={[styles.contentTitle, { color: colors.text }]}>Meu mantra mágico:</Text>
                <Text style={[styles.contentText, { color: colors.text }]}>
                  "{memoryData.most_practiced_mantra.text_content}"
                </Text>
                <Text style={[styles.contentSubtext, { color: colors.textMuted }]}>
                  Praticado {memoryData.most_practiced_mantra.practice_count} vezes
                </Text>
              </View>
            </View>
          )}

          {memoryData.affirmations && memoryData.affirmations.length > 0 && (
            <View style={styles.contentItem}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} style={styles.contentIcon} />
              <View>
                <Text style={[styles.contentTitle, { color: colors.text }]}>Minhas crenças principais:</Text>
                {memoryData.affirmations.map((a: any, index: number) => (
                  <Text key={`affirmation-${index}`} style={[styles.listItem, { color: colors.textSecondary }]}>
                    • {a.content}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {memoryData.gratitudes && memoryData.gratitudes.length > 0 && (
            <View style={styles.contentItem}>
              <MaterialIcons name="favorite" size={24} color={colors.error} style={styles.contentIcon} />
              <View>
                <Text style={[styles.contentTitle, { color: colors.text }]}>Minhas gratidões mais frequentes:</Text>
                {memoryData.gratitudes.map((g: any, index: number) => (
                  <Text key={`gratitude-${index}`} style={[styles.listItem, { color: colors.textSecondary }]}>
                    • {g.content}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Frase Final (Estilo Quadro de Conquista) */}
        <Text style={[styles.finalPhrase, { color: colors.primary }]}>Agora JÁ É mesmo!</Text>

        {/* Rodapé */}
        <Text style={[styles.footerText, { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xl }]}>
          Esta é a sua Memória da Cocriação. Não é um ativo. Não é um token. É o testemunho silencioso do momento em que você disse: Já é. Guarde-a como um tesouro da alma.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoSection: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  mentalCodeHighlight: {
    color: '#FBBF24',
    fontWeight: '700',
    letterSpacing: 1,
  },
  coverImageContainer: {
    width: '100%',
    maxWidth: 400,
    height: 200,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  visionBoardCollageContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  collageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  visionBoardCollage: {
    width: '80%', // 80% da largura do container pai
    height: 300,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center', // Centraliza o container da colagem
  },
  collageImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  collageImageContent: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.lg,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  contentIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  contentText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  contentSubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  // --- Estilo Atualizado para a Frase Final ---
  finalPhrase: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: Spacing.xl,
    letterSpacing: 1.5,
    // Removido o LinearGradient e estilos de botão
    // Adicionado leve sombreado para destaque
    textShadowColor: 'rgba(139, 92, 246, 0.5)', // Cor da sombra baseada nas cores do app
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // ---
  footerText: {
    fontSize: 12,
    paddingHorizontal: Spacing.md,
  },
});