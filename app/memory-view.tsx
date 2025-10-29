// app/memory-view.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase'; // Importa o supabase diretamente
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Importe para obter o usuário logado
import { LinearGradient } from 'expo-linear-gradient'; // Importa LinearGradient
import { MaterialIcons } from '@expo/vector-icons'; // Importa ícones
import { Image } from 'expo-image'; // Importa Image otimizada
import SacredCard from '@/components/ui/SacredCard'; // Importa o componente SacredCard
import { Spacing } from '@/constants/Colors'; // Importa constantes de espaçamento

const { width } = Dimensions.get('window');

export default function MemoryViewScreen() {
  const { colors } = useTheme();
  const { user, session } = useAuth(); // Obtém o usuário e a sessão logados
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();

  const [cocriacaoData, setCocriacaoData] = useState<any>(null); // Agora carregamos os dados principais da cocriação
  const [memoryData, setMemoryData] = useState<any>(null); // E os dados da memória gerada
  const [visionBoardItems, setVisionBoardItems] = useState<any[]>([]); // Armazena os itens do vision board
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); // Para o pull-to-refresh

  // Função para carregar todos os dados
  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log("memory-view.tsx - Carregando dados para memória, ID:", cocriacaoId);

      if (!user?.id) {
        throw new Error('Sessão expirada ou usuário não autenticado.');
      }
      if (!cocriacaoId) {
        throw new Error('ID da Cocriação ausente.');
      }

      // 1. Carregar dados principais da cocriação
      const { data: cocriacao, error: loadError } = await supabase
        .from('individual_cocriations')
        .select('title, why_reason, mental_code, memory_snapshot, status') // Seleciona campos principais
        .eq('id', cocriacaoId)
        .eq('user_id', user.id) // Garante que pertence ao usuário logado
        .single();

      console.log("memory-view.tsx - Resultado da consulta principal:", { cocriacao, loadError });

      if (loadError) {
        console.error("memory-view.tsx - Erro ao carregar dados principais da cocriação:", loadError);
        throw loadError;
      }

      if (!cocriacao) {
        console.error("memory-view.tsx - Cocriação NÃO encontrada, ID:", cocriacaoId, "pelo usuário:", user.id);
        // Tentativa de debug
        const { data: debugCocriacao, error: debugError } = await supabase
          .from('individual_cocriations')
          .select('title, why_reason, mental_code, memory_snapshot, status')
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

      if (!cocriacao.memory_snapshot) {
        throw new Error('Dados da Memória da Cocriação não encontrados no registro. A cocriação pode não ter sido concluída corretamente.');
      }

      // Armazena os dados principais e da memória
      setCocriacaoData(cocriacao);
      setMemoryData(cocriacao.memory_snapshot);

      // 2. Carregar os itens do Vision Board
      const { data: items, error: itemsError } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('cocreation_id', cocriacaoId)
        .order('created_at', { ascending: true }); // Ordena conforme criado

      if (itemsError) {
        console.error("memory-view.tsx - Erro ao carregar itens do Vision Board:", itemsError);
        // Não lança erro, apenas loga. Pode não haver itens.
        setVisionBoardItems([]);
      } else {
        setVisionBoardItems(items || []);
      }

      console.log("memory-view.tsx - Dados e itens do Vision Board carregados com sucesso.");

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

  if (loading && !refreshing) { // Mostra loading apenas na carga inicial
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Carregando sua Memória da Cocriação...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Erro: {error}</Text>
        <Text style={{ color: colors.text }}>Por favor, tente novamente.</Text>
      </View>
    );
  }

  if (!memoryData || !cocriacaoData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Nenhuma memória encontrada.</Text>
      </View>
    );
  }

  // --- Renderização da Memória ---
  return (
    <LinearGradient
      colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} // Gradiente de fundo
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Título da Cocriação */}
        <SacredCard glowing style={styles.titleCard}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>{cocriacaoData.title}</Text>
        </SacredCard>

        {/* O meu porquê */}
        {cocriacaoData.why_reason && (
          <SacredCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="sentiment-very-satisfied" size={24} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>O meu porquê:</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{cocriacaoData.why_reason}</Text>
          </SacredCard>
        )}

        {/* Código Mental */}
        {cocriacaoData.mental_code && (
          <SacredCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="code" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Código Mental:</Text>
            </View>
            <View style={styles.mentalCodeContainer}>
              <Text style={styles.mentalCodeText}>{cocriacaoData.mental_code}</Text>
            </View>
          </SacredCard>
        )}

        {/* Imagens do Vision Board */}
        {visionBoardItems.length > 0 && (
          <SacredCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="dashboard" size={24} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Imagens do meu Caminho:</Text>
            </View>
            <View style={styles.visionBoardContainer}>
              {visionBoardItems.map((item, index) => (
                item.type === 'image' && item.content ? (
                  <Image
                    key={index}
                    source={{ uri: item.content }} // A URL da imagem
                    style={styles.visionBoardImage}
                    contentFit="cover"
                  />
                ) : null
              ))}
            </View>
          </SacredCard>
        )}

        {/* Meu mantra mágico */}
        {memoryData.most_practiced_mantra && (
          <SacredCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="star" size={24} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Meu mantra mágico:</Text>
            </View>
            <Text style={[styles.mantraText, { color: colors.text }]}>
              "{memoryData.most_practiced_mantra.text_content}"
            </Text>
            <Text style={[styles.mantraSubtext, { color: colors.textMuted }]}>
              Praticado {memoryData.most_practiced_mantra.practice_count} vezes
            </Text>
          </SacredCard>
        )}

        {/* Minhas crenças principais */}
        {memoryData.affirmations && memoryData.affirmations.length > 0 && (
          <SacredCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas crenças principais:</Text>
            </View>
            {memoryData.affirmations.map((a: any, index: number) => (
              <Text key={`affirmation-${index}`} style={[styles.listItem, { color: colors.textSecondary }]}>
                • {a.content}
              </Text>
            ))}
          </SacredCard>
        )}

        {/* Minhas gratidões mais frequentes */}
        {memoryData.gratitudes && memoryData.gratitudes.length > 0 && (
          <SacredCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="favorite" size={24} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas gratidões mais frequentes:</Text>
            </View>
            {memoryData.gratitudes.map((g: any, index: number) => (
              <Text key={`gratitude-${index}`} style={[styles.listItem, { color: colors.textSecondary }]}>
                • {g.content}
              </Text>
            ))}
          </SacredCard>
        )}

        {/* Frase Final */}
        <SacredCard glowing style={styles.finalCard}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#FBBF24']} // Gradiente para a frase final
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finalPhraseGradient}
          >
            <Text style={styles.finalPhrase}>Agora JÁ É mesmo!</Text>
          </LinearGradient>
        </SacredCard>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' }]}>
            Esta é a sua Memória da Cocriação. Não é um ativo. Não é um token. É o testemunho silencioso do momento em que você disse: Já é. Guarde-a como um tesouro da alma.
          </Text>
        </View>
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
    paddingBottom: 100, // Espaço extra no final
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  titleCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  sectionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  mentalCodeContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Fundo sutil
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  mentalCodeText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FBBF24', // Cor dourada para destaque
  },
  visionBoardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  visionBoardImage: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 2, // Ajusta para 2 colunas com espaçamento
    height: 150,
    borderRadius: 8,
  },
  mantraText: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  mantraSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  finalCard: {
    marginVertical: Spacing.xl,
    alignItems: 'center',
  },
  finalPhraseGradient: {
    padding: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalPhrase: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
  },
  footer: {
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: 12,
    paddingHorizontal: Spacing.md,
  },
});