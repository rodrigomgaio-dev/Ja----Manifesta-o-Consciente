// app/memory-generation.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDailyPractices } from '@/hooks/useDailyPractices'; // Mantém apenas as funções de práticas
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Importa o contexto de autenticação

export default function MemoryGenerationScreen() {
  const { colors } = useTheme();
  const { user, session } = useAuth(); // Obtém o usuário e a sessão logados
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const { getRecentPractices, getMostPracticedMantra } = useDailyPractices(); // Usa as funções do hook atualizado

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateAndSaveMemory = async () => {
      console.log("memory-generation.tsx - useEffect iniciado.");
      console.log("memory-generation.tsx - ID recebido:", cocriacaoId);
      console.log("memory-generation.tsx - Usuário logado:", user?.id);
      console.log("memory-generation.tsx - Session ID:", session?.user?.id); // Verifica se o ID do usuário na sessão bate

      if (!user?.id) {
          setError('Sessão expirada ou usuário não autenticado. Por favor, faça login novamente.');
          setLoading(false);
          return;
      }

      if (!cocriacaoId) {
        setError('ID da Cocriação ausente.');
        setLoading(false);
        return;
      }

      try {
        console.log("memory-generation.tsx - Iniciando carregamento direto da cocriação...");
        // 1. Obter detalhes da cocriação DIRETAMENTE do Supabase
        const {  cocriacao, error: loadError } = await supabase
          .from('individual_cocriations')
          .select('*')
          .eq('id', cocriacaoId)
          .eq('user_id', user.id) // Garante que pertence ao usuário logado
          .single(); // Espera um único resultado

        console.log("memory-generation.tsx - Resultado da consulta direta:", { cocriacao, loadError });

        if (loadError) {
            console.error("memory-generation.tsx - Erro ao carregar cocriação DIRETO para memória:", loadError);
            // Pode ser um erro de permissão, timeout, etc.
            throw loadError;
        }
        if (!cocriacao) {
            console.error("memory-generation.tsx - Cocriação DIRETA NÃO encontrada para ID:", cocriacaoId, "pelo usuário:", user.id);
            // Opcional: Tentar carregar *sem* user_id para debug (NÃO FAÇA ISSO em produção)
            const {  debugCocriacao, error: debugError } = await supabase
              .from('individual_cocriations')
              .select('*')
              .eq('id', cocriacaoId)
              .single();

            if (debugCocriacao) {
                console.warn("memory-generation.tsx - DEBUG: Cocriação encontrada, mas NÃO pertence ao usuário logado. Proprietário:", debugCocriacao.user_id, "Usuário logado:", user.id);
                // Se a cocriação existe mas para outro user_id, é um problema de sessão.
                setError('Sessão inválida. A cocriação não pertence ao usuário logado. Por favor, recarregue a página ou faça login novamente.');
            } else if (debugError) {
                console.warn("memory-generation.tsx - DEBUG: Erro ao tentar carregar sem user_id:", debugError);
                // Se nem sem user_id funciona, pode ser um problema de ID ou banco.
                setError('Cocriação não encontrada. O ID pode estar incorreto ou a cocriação pode ter sido excluída.');
            } else {
                 // debugCocriacao é null e debugError é null, o que é improvável mas possível.
                 setError('Cocriação não encontrada ou erro inesperado.');
            }
            setLoading(false); // Para o loading se a cocriação não for encontrada
            return; // Sai da função para não continuar o processo
        }

        console.log("memory-generation.tsx - Cocriação DIRETA encontrada:", cocriacao.title);

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
        // A mensagem de erro já foi definida no bloco if (!cocriacao) acima, ou será uma falha genérica de update.
        if (!error) { // Se o erro não foi definido no bloco if (!cocriacao)
             setError(`Falha ao gerar ou salvar a memória: ${(err as Error).message}`);
        }
        setLoading(false); // Garante que o loading pare em caso de erro genérico também
      }
    };

    generateAndSaveMemory();
  }, [cocriacaoId, user?.id, session?.user?.id, getRecentPractices, getMostPracticedMantra]); // Adiciona session?.user?.id às dependências

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
        {/* Botão opcional para recarregar a sessão ou voltar */}
        <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()} // Ou uma função para recarregar a sessão
        >
            <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Exemplo de cor
    borderRadius: 5,
  }
});