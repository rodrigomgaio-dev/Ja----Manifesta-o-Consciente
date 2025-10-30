// app/memory-view-simple.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { Image } from 'expo-image';
import { Spacing } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function MemoryViewSimpleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();

  const [cocriacao, setCocriacao] = useState<any>(null);
  const [mantras, setMantras] = useState<any[]>([]);
  const [afirmacoes, setAfirmacoes] = useState<any[]>([]);
  const [visionBoardItems, setVisionBoardItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemoryData = async () => {
      if (!user?.id) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }
      if (!cocriacaoId) {
        setError('ID da Cocriação ausente.');
        setLoading(false);
        return;
      }

      try {
        // 1. Carregar dados principais da cocriação (título, código mental, imagem de capa, porquê)
        const { data: cocriacaoData, error: cocriacaoError } = await supabase
          .from('individual_cocriations')
          .select('title, mental_code, cover_image_url, why_reason')
          .eq('id', cocriacaoId)
          .eq('user_id', user.id) // Garante que pertence ao usuário logado
          .single();

        if (cocriacaoError) throw cocriacaoError;
        if (!cocriacaoData) throw new Error('Cocriação não encontrada.');

        // 2. Carregar Mantras associados à cocriação
        const { data: mantrasData, error: mantrasError } = await supabase
          .from('daily_practices')
          .select('content, title') // Seleciona o conteúdo ou título do mantra
          .eq('cocreation_id', cocriacaoId)
          .eq('type', 'mantra')
          .eq('user_id', user.id);

        if (mantrasError) throw mantrasError;

        // 3. Carregar Afirmações associadas à cocriação
        const { data: afirmacoesData, error: afirmacoesError } = await supabase
          .from('daily_practices')
          .select('content, title') // Seleciona o conteúdo ou título da afirmação
          .eq('cocreation_id', cocriacaoId)
          .eq('type', 'affirmation')
          .eq('user_id', user.id);

        if (afirmacoesError) throw afirmacoesError;

        // 4. Carregar Imagens do Vision Board associadas à cocriação
        const { data: vbItemsData, error: vbError } = await supabase
          .from('vision_board_items')
          .select('content') // Seleciona a URL da imagem
          .eq('cocreation_id', cocriacaoId)
          .eq('type', 'image');

        if (vbError) throw vbError;

        // Atualiza os estados com os dados carregados
        setCocriacao(cocriacaoData);
        setMantras(mantrasData || []);
        setAfirmacoes(afirmacoesData || []);
        setVisionBoardItems(vbItemsData || []);

      } catch (err) {
        console.error('Erro ao carregar dados da memória:', err);
        setError(`Falha ao carregar a memória: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMemoryData();
  }, [cocriacaoId, user?.id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Carregando sua memória...</Text>
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

  if (!cocriacao) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Nenhuma memória encontrada.</Text>
      </View>
    );
  }

  // --- Renderização da Memória ---
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background, padding: Spacing.lg }]}>
      {/* Título (sem label) */}
      <Text style={[styles.title, { color: colors.text }]}>{cocriacao.title}</Text>

      {/* Código Mental (sem label) */}
      {cocriacao.mental_code && (
        <Text style={[styles.mentalCode, { color: '#FBBF24' }]}>{cocriacao.mental_code}</Text>
      )}

      {/* Imagem de Capa */}
      {cocriacao.cover_image_url && (
        <Image
          source={{ uri: cocriacao.cover_image_url }}
          style={styles.coverImage}
          contentFit="cover"
        />
      )}

      {/* Grade de Imagens do Vision Board */}
      {visionBoardItems.length > 0 && (
        <View style={styles.visionBoardGridContainer}>
          <View style={styles.visionBoardGrid}>
            {visionBoardItems.map((item, index) => (
              item.content && ( // Verifica se a URL da imagem existe
                <Image
                  key={index}
                  source={{ uri: item.content }}
                  style={styles.visionBoardImage}
                  contentFit="cover"
                />
              )
            ))}
          </View>
        </View>
      )}

      {/* "O meu porquê:" */}
      {cocriacao.why_reason && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>O meu porquê:</Text>
          <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{cocriacao.why_reason}</Text>
        </View>
      )}

      {/* "Meus mantras mágicos:" */}
      {mantras.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meus mantras mágicos:</Text>
          {mantras.map((mantra, index) => (
            <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
              • {mantra.content || mantra.title} {/* Usa content ou title */}
            </Text>
          ))}
        </View>
      )}

      {/* "Minhas crenças principais:" */}
      {afirmacoes.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas crenças principais:</Text>
          {afirmacoes.map((afirmacao, index) => (
            <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
              • {afirmacao.content || afirmacao.title} {/* Usa content ou title */}
            </Text>
          ))}
        </View>
      )}

      {/* "Gratidão!" */}
      <Text style={[styles.gratitudeText, { color: colors.text }]}>Gratidão!</Text>

      {/* "JÁ É !" com estilo especial */}
      <Text style={[styles.jaEText, { color: colors.primary }]}>JÁ É !</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  mentalCode: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  coverImage: {
    width: '100%',
    maxWidth: 400,
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  visionBoardGridContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  visionBoardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  visionBoardImage: {
    width: (width * 0.8 - Spacing.sm * 2) / 3, // 3 colunas
    height: (width * 0.8 - Spacing.sm * 2) / 3, // Altura quadrada
    borderRadius: 8,
  },
  section: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  gratitudeText: {
    fontSize: 20,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  jaEText: {
    fontSize: 48,
    fontWeight: '900', // Use o mesmo fontWeight do Jaé da Home Screen se souber
    textAlign: 'center',
    letterSpacing: 2,
  },
});
