// app/memory-generation.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useDailyPractices } from '@/hooks/useDailyPractices';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function MemoryGenerationScreen() {
  const { colors } = useTheme();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const { loadSingle } = useIndividualCocriations();
  const { getRecentPractices, getMostPracticedMantra } = useDailyPractices();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateAndSaveMemory = async () => {
      if (!cocriacaoId) {
        setError('ID da Cocriação ausente.');
        setLoading(false);
        return;
      }

      try {
        console.log("Iniciando geração e salvamento da memória para cocriação:", cocriacaoId);

        // 1. Obter detalhes da cocriação
        const {  cocriacao, error: loadError } = await loadSingle(cocriacaoId);
        if (loadError) {
            console.error("Erro ao carregar cocriação para memória:", loadError);
            throw loadError;
        }
        if (!cocriacao) {
            console.error("Cocriação não encontrada para memória:", cocriacaoId);
            throw new Error('Cocriação não encontrada.');
        }

        // 2. Obter práticas recentes e mantra mais praticado
        console.log("Buscando práticas recentes e mantra para memória...");
        const [recentGratitudes, recentAffirmations, mostPracticedMantra] = await Promise.all([
          getRecentPractices(cocriacaoId, 'gratitude', 2),
          getRecentPractices(cocriacaoId, 'affirmation', 2),
          getMostPracticedMantra(cocriacaoId),
        ]);

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

        console.log("Dados da memória montados:", memoryData);

        // 4. Atualizar a cocriação no Supabase com status 'completed' e memory_snapshot
        console.log("Atualizando cocriação no Supabase com memória...");
        const { error: updateError } = await supabase
          .from('individual_cocriations')
          .update({
            status: 'completed',
            completion_date: memoryData.completion_date,
            memory_snapshot: memoryData,
          })
          .eq('id', cocriacaoId);

        if (updateError) {
          console.error("Erro ao atualizar cocriação com memória:", updateError);
          throw updateError;
        }

        console.log("Cocriação atualizada com sucesso. Navegando para memory-view...");
        // 5. Navegar para a tela final da memória
        router.replace(`/memory-view?id=${cocriacaoId}`);

      } catch (err) {
        console.error('Erro na geração ou salvamento da memória:', err);
        setError(`Falha ao gerar ou salvar a memória: ${(err as Error).message}`);
        setLoading(false); // Garante que o loading pare em caso de erro
      }
    };

    generateAndSaveMemory();
  }, [cocriacaoId, loadSingle, getRecentPractices, getMostPracticedMantra]);

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
