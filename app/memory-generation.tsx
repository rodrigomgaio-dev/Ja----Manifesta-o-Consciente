// app/memory-generation.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useDailyPractices } from '@/hooks/useDailyPractices';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Importa o contexto de autenticação

export default function MemoryGenerationScreen() {
  const { colors } = useTheme();
  const { user } = useAuth(); // Obtém o usuário logado
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const { loadSingle } = useIndividualCocriations();
  const { getRecentPractices, getMostPracticedMantra } = useDailyPractices();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateAndSaveMemory = async () => {
      console.log("memory-generation.tsx - useEffect iniciado.");
      console.log("memory-generation.tsx - ID recebido:", cocriacaoId);
      console.log("memory-generation.tsx - Usuário logado:", user?.id);

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
        console.log("memory-generation.tsx - Iniciando carregamento da cocriação via loadSingle...");
        // 1. Obter detalhes da cocriação
        const {  cocriacao, error: loadError } = await loadSingle(cocriacaoId);
        console.log("memory-generation.tsx - Resultado de loadSingle:", { cocriacao, loadError });

        if (loadError) {
            console.error("memory-generation.tsx - Erro ao carregar cocriação para memória:", loadError);
            throw loadError;
        }
        if (!cocriacao) {
            console.error("memory-generation.tsx - Cocriação NÃO encontrada para ID:", cocriacaoId, "pelo usuário:", user.id);
            throw new Error('Cocriação não encontrada.');
        }

        console.log("memory-generation.tsx - Cocriação encontrada:", cocriacao.title);

        // 2. Obter práticas recentes e mantra mais praticado
        console.log("memory-generation.tsx - Buscando práticas recentes e mantra para memória...");
        const [recentGratitudes, recentAffirmations, mostPracticedMantra] = await Promise.all([
          getRecentPractices(cocriacaoId, 'gratitude', 2),
          getRecentPractices(cocriacaoId, 'affirmation', 2),
          getMostPracticedMantra(cocriacaoId),
        ]);

        console.log("memory-generation.tsx - Práticas obtidas. Gratidões:", recentGratitudes.length, "Afirmações:", recentAffirmations.length, "Mantra:", !!mostPracticedMantra);

        // 3. Montar o objeto memory_snapshot
        const memoryData = {
          title: cocriacao.title,
          intention: cocriacao.why_reason || '',
          start_date: cocriacao.created_at,
          completion_date: new Date().toISOString(),
          gratitudes: recentGratitudes,
          affirmations: recentAffirmations,
          most_practiced_mantra: mostPracticedMantra,
        };

        console.log("memory-generation.tsx - Dados da memória montados. Atualizando no Supabase...");

        // 4. Atualizar a cocriação no Supabase com status 'completed' e memory_snapshot
        const { error: updateError } = await supabase
          .from('individual_cocriations')
          .update({
            status: 'completed',
            completion_date: memoryData.completion_date,
            memory_snapshot: memoryData,
          })
          .eq('id', cocriacaoId)
          .eq('user_id', user.id); // Adiciona verificação de user_id na atualização também

        if (updateError) {
          console.error("memory-generation.tsx - Erro ao atualizar cocriação com memória:", updateError);
          throw updateError;
        }

        console.log("memory-generation.tsx - Cocriação atualizada com sucesso. Navegando para memory-view...");
        // 5. Navegar para a tela final da memória
        router.replace(`/memory-view?id=${cocriacaoId}`);

      } catch (err) {
        console.error('memory-generation.tsx - Erro na geração ou salvamento da memória:', err);
        setError(`Falha ao gerar ou salvar a memória: ${(err as Error).message}`);
        setLoading(false); // Garante que o loading pare em caso de erro
      }
    };

    generateAndSaveMemory();
  }, [cocriacaoId, user?.id, loadSingle, getRecentPractices, getMostPracticedMantra]); // Adiciona user?.id às dependências

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Gerando sua Memória da Cocriação...</Text>
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

  // Este estado não deveria ser alcançado se a navegação for bem-sucedida
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Processando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});