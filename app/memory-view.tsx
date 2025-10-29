// app/memory-view.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Spacing } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function MemoryViewScreen() {
  const { colors } = useTheme();
  const { user, session } = useAuth();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();

  const [cocriacaoData, setCocriacaoData] = useState<any>(null);
  const [memoryData, setMemoryData] = useState<any>(null); // Ainda pode conter dados antigos, mas não usaremos gratidões
  const [visionBoardItems, setVisionBoardItems] = useState<any[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [mantras, setMantras] = useState<any[]>([]); // Armazena mantras da cocriação
  const [afirmacoes, setAfirmacoes] = useState<any[]>([]); // Armazena afirmações da cocriação
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      console.log("memory-view.tsx - Iniciando carregamento, ID:", cocriacaoId);

      if (!user?.id) throw new Error('Sessão expirada ou usuário não autenticado.');
      if (!cocriacaoId) throw new Error('ID da Cocriação ausente.');

      // 1. Carregar dados principais da cocriação e memory_snapshot
      const {  cocriacao, error: loadError } = await supabase
        .from('individual_cocriations')
        .select('title, why_reason, mental_code, memory_snapshot, cover_image_url, status')
        .eq('id', cocriacaoId)
        .eq('user_id', user.id)
        .single();

      console.log("memory-view.tsx - Resultado da consulta principal:", { cocriacao, loadError });

      if (loadError) throw loadError;
      if (!cocriacao) {
        const {  debugCocriacao, error: debugError } = await supabase
          .from('individual_cocriations')
          .select('title, why_reason, mental_code, memory_snapshot, cover_image_url, status')
          .eq('id', cocriacaoId)
          .single();

        if (debugCocriacao) {
            console.warn("memory-view.tsx - DEBUG: Cocriação encontrada, mas NÃO pertence ao usuário logado. Proprietário:", debugCocriacao.user_id, "Usuário logado:", user.id);
            throw new Error('Sessão inválida. A memória não pertence ao usuário logado.');
        } else if (debugError) {
            console.warn("memory-view.tsx - DEBUG: Erro ao tentar carregar sem user_id:", debugError);
            throw new Error('Cocriação não encontrada. O ID pode estar incorreto ou a cocriação pode ter sido excluída.');
        } else {
             throw new Error('Cocriação não encontrada ou erro inesperado.');
        }
      }

      // Armazena os dados principais e da memória
      setCocriacaoData(cocriacao);
      setMemoryData(cocriacao.memory_snapshot); // Pode conter dados antigos, exceto gratidões
      setCoverImageUrl(cocriacao.cover_image_url);

      console.log("memory-view.tsx - Dados principais e memória carregados. memoryData:", cocriacao.memory_snapshot);

      // 2. Carregar os itens do Vision Board (apenas imagens)
      const {  items, error: itemsError } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('cocreation_id', cocriacaoId)
        .eq('type', 'image') // Filtra apenas imagens
        .order('created_at', { ascending: true });

      console.log("memory-view.tsx - Itens do Vision Board (imagens) carregados:", items, "Erro:", itemsError);

      if (itemsError) {
        console.error("memory-view.tsx - Erro ao carregar itens do Vision Board:", itemsError);
        setVisionBoardItems([]);
      } else {
        setVisionBoardItems(items || []);
      }

      // 3. Carregar Mantras associados à cocriação
      const {  mantrasData, error: mantrasError } = await supabase
        .from('daily_practices') // Assumindo que mantras são práticas diárias
        .select('*')
        .eq('cocreation_id', cocriacaoId)
        .eq('type', 'mantra')
        .eq('user_id', user.id); // Garante que pertence ao usuário logado

      console.log("memory-view.tsx - Mantras carregados:", mantrasData, "Erro:", mantrasError);

      if (mantrasError) {
        console.error("memory-view.tsx - Erro ao carregar mantras:", mantrasError);
        setMantras([]);
      } else {
        setMantras(mantrasData || []); // Garante array mesmo que data seja null
      }

      // 4. Carregar Afirmações associadas à cocriação
      const {  afirmacoesData, error: afirmacoesError } = await supabase
        .from('daily_practices') // Assumindo que afirmações são práticas diárias
        .select('*')
        .eq('cocreation_id', cocriacaoId)
        .eq('type', 'affirmation')
        .eq('user_id', user.id); // Garante que pertence ao usuário logado

      console.log("memory-view.tsx - Afirmações carregadas:", afirmacoesData, "Erro:", afirmacoesError);

      if (afirmacoesError) {
        console.error("memory-view.tsx - Erro ao carregar afirmações:", afirmacoesError);
        setAfirmacoes([]); // Garante array vazio em caso de erro
      } else {
        // --- CORREÇÃO AQUI ---
        // Verifica se afirmacoesData é um array antes de tentar iterar
        if (Array.isArray(afirmacoesData)) {
          // Seleciona até 3 afirmações aleatórias
          const shuffledAfirmacoes = [...afirmacoesData].sort(() => 0.5 - Math.random());
          setAfirmacoes(shuffledAfirmacoes.slice(0, 3));
        } else {
          console.warn("memory-view.tsx - afirmacoesData não é um array:", afirmacoesData);
          setAfirmacoes([]); // Define como array vazio se não for um array
        }
        // ---
      }

    } catch (err) {
      console.error('memory-view.tsx - Erro geral ao carregar a memória da cocriação:', err);
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

  // --- Renderização da Memória (Versão Refinada) ---
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

        {/* Grade de Imagens do Vision Board */}
        {visionBoardItems.length > 0 && (
          <View style={styles.visionBoardGridContainer}>
            <Text style={[styles.gridTitle, { color: colors.text }]}>Memórias Visuais:</Text>
            <View style={styles.visionBoardGrid}>
              {visionBoardItems.map((item, index) => (
                <View key={item.id || `img-${index}`} style={styles.gridItemImageContainer}>
                  <Image
                    source={{ uri: item.content }}
                    style={styles.gridItemImage}
                    contentFit="cover"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mantra e Afirmações (Carregados do banco de dados) */}
        <View style={styles.contentSection}>
          {/* Mantra (qualquer um) */}
          {mantras.length > 0 && (
            <View style={styles.contentItem}>
              <MaterialIcons name="star" size={24} color={colors.warning} style={styles.contentIcon} />
              <View>
                <Text style={[styles.contentTitle, { color: colors.text }]}>Meu mantra mágico:</Text>
                <Text style={[styles.contentText, { color: colors.text }]}>
                  "{mantras[0].content || mantras[0].title}" {/* Usa 'content' ou 'title' dependendo do seu schema */}
                </Text>
              </View>
            </View>
          )}

          {/* Afirmações (até 3) */}
          {afirmacoes.length > 0 && (
            <View style={styles.contentItem}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} style={styles.contentIcon} />
              <View>
                <Text style={[styles.contentTitle, { color: colors.text }]}>Minhas crenças principais:</Text>
                {afirmacoes.map((a, index) => (
                  <Text key={`affirmation-${index}`} style={[styles.listItem, { color: colors.textSecondary }]}>
                    • {a.content || a.title} {/* Usa 'content' ou 'title' dependendo do seu schema */}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Frase Final (Estilo Quadro de Conquista - Melhorado) */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#FBBF24']} // Gradiente para a frase final
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.finalPhraseGradient}
        >
          <Text style={styles.finalPhrase}>Agora JÁ É mesmo!</Text>
        </LinearGradient>

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
  // --- Estilo para a Grade de Imagens ---
  visionBoardGridContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  visionBoardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  gridItemImageContainer: {
    // Ajusta o tamanho da imagem para caber mais na tela
    width: (width * 0.8 - Spacing.sm * 2) / 3, // 3 colunas com espaçamento
    height: (width * 0.8 - Spacing.sm * 2) / 3, // Altura quadrada
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  // ---
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
  finalPhraseGradient: {
    padding: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    // Borda sutil para contraste com o gradiente
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  finalPhrase: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
  },
  // ---
  footerText: {
    fontSize: 12,
    paddingHorizontal: Spacing.md,
  },
});