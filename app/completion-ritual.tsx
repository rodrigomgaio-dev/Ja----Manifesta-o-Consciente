// app/completion-ritual.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
// Usando o hook existente
import { useIndividualCocriations } from '../hooks/useIndividualCocriations'; // Ajuste o caminho conforme necessário
// Usando o hook de práticas diárias (que precisa ser atualizado conforme a resposta anterior)
import { useDailyPractices } from '../hooks/useDailyPractices'; // Ajuste o caminho
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../app/services/supabase'; // Ajuste o caminho
import { useAuth } from '../contexts/AuthContext'; // Importa o contexto de autenticação
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

// --- Tipos ---
// Ajuste conforme o tipo IndividualCocriation definido em '@/services/types'
type Gratitude = {
  content: string;
  practiced_at: string; // Ajuste conforme o tipo real de practice_sessions
};

type Affirmation = {
  content: string;
  practiced_at: string; // Ajuste conforme o tipo real de practice_sessions
};

type Mantra = {
  id: string;
  name: string;
  text_content: string;
  practice_count: number; // Calculado ou armazenado
};

type MemorySnapshot = {
  title: string;
  intention: string; // ou why_reason
  start_date: string; // ou created_at
  completion_date: string;
  gratitudes: Gratitude[];
  affirmations: Affirmation[];
  most_practiced_mantra: Mantra | null;
};

// --- Componente ---
export default function CompletionRitualScreen() {
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();

  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showMemory, setShowMemory] = useState(false); // Controla a revelação dos elementos
  const [memoryData, setMemoryData] = useState<MemorySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Hooks ---
  const { loadSingle } = useIndividualCocriations(); // Usa a função existente
  const { user } = useAuth(); // Pode ser necessário para o hook useDailyPractices
  const { getRecentPractices, getMostPracticedMantra } = useDailyPractices(user); // Passa o usuário se necessário

  // --- Carregar dados iniciais ---
  useEffect(() => {
    const loadData = async () => {
      if (!cocriacaoId) {
        setError('ID da Cocriação ausente.');
        setLoading(false);
        return;
      }
      try {
        // 1. Obter detalhes da cocriação usando a função do hook existente
        const { data: cocriacao, error: loadError } = await loadSingle(cocriacaoId);
        if (loadError) {
          throw loadError;
        }
        if (!cocriacao) {
          throw new Error('Cocriação não encontrada.');
        }

        // 2. Obter práticas recentes e mantra mais praticado
        const [recentGratitudes, recentAffirmations, mostPracticedMantra] = await Promise.all([
          getRecentPractices(cocriacaoId, 'gratitude', 2),
          getRecentPractices(cocriacaoId, 'affirmation', 2),
          getMostPracticedMantra(cocriacaoId),
        ]);

        // 3. Montar o objeto memory_snapshot
        const newMemoryData: MemorySnapshot = {
          title: cocriacao.title,
          intention: cocriacao.why_reason || '', // Ajuste conforme o nome real do campo no banco/types
          start_date: cocriacao.created_at, // Ajuste conforme o nome real do campo no banco/types
          completion_date: new Date().toISOString(), // Data atual no momento da conclusão
          gratitudes: recentGratitudes,
          affirmations: recentAffirmations,
          most_practiced_mantra: mostPracticedMantra,
        };

        setMemoryData(newMemoryData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados para a memória:', err);
        setError(`Falha ao carregar os dados: ${(err as Error).message}`);
        setLoading(false);
      }
    };

    loadData();
  }, [cocriacaoId, loadSingle, getRecentPractices, getMostPracticedMantra]);

  // --- Função para concluir a cocriação ---
  const handleConcludeCocriacao = async () => {
    if (!cocriacaoId || !memoryData) {
      Alert.alert('Erro', 'Dados insuficientes para concluir.');
      return;
    }

    setIsCompleting(true);
    try {
      // 1. Atualizar a cocriação no Supabase com status 'completed' e memory_snapshot
      const { error: updateError } = await supabase
        .from('individual_cocriations') // Substitua pelo nome real da sua tabela
        .update({
          status: 'completed', // Ajuste o status final conforme necessário
          completion_date: memoryData.completion_date,
          memory_snapshot: memoryData, // O objeto completo é salvo como JSON
        })
        .eq('id', cocriacaoId);

      if (updateError) {
        throw updateError;
      }

      // 2. Revelar a memória gerada
      setShowMemory(true);
      // Opcional: Navegar automaticamente após um delay, ou esperar o botão
    } catch (err) {
      console.error('Erro ao concluir cocriação:', err);
      Alert.alert('Erro', `Falha ao concluir a Cocriação: ${(err as Error).message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  // --- Funções de navegação ---
  const handleViewMemory = () => {
    if (cocriacaoId) {
      router.push(`/memory-view?id=${cocriacaoId}`);
    }
  };

  // --- Renderização ---
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Preparando sua Memória...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!memoryData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro: Dados da memória não carregados.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Animação Inicial */}
        <Animated.View entering={FadeIn.duration(1500)}>
          <Text style={styles.title}>Cerimônia de Conclusão</Text>
          <Text style={styles.subtitle}>Você está prestes a selar esta Cocriação.</Text>
        </Animated.View>

        {/* Botão de Conclusão */}
        {!showMemory && (
          <Animated.View
            entering={FadeInUp.delay(500).duration(1000)}
            style={styles.conclusionButtonContainer}
          >
            <TouchableOpacity
              style={styles.conclusionButton}
              onPress={handleConcludeCocriacao}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.conclusionButtonText}>Concluir Cocriação</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Revelação da Memória */}
        {showMemory && (
          <Animated.View
            entering={FadeIn.delay(1000).duration(1500)}
            style={styles.memoryContainer}
          >
            <Text style={styles.memoryTitle}>{memoryData.title}</Text>
            <Text style={styles.memoryIntro}>Esta é a sua Memória da Cocriação.</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minhas Gratidões Finais</Text>
              {memoryData.gratitudes.length > 0 ? (
                memoryData.gratitudes.map((g, index) => (
                  <Text key={index} style={styles.memoryItem}>
                    • {g.content}
                  </Text>
                ))
              ) : (
                <Text style={styles.memoryItem}>Nenhuma gratidão registrada.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Afirmações que Me Sustentaram</Text>
              {memoryData.affirmations.length > 0 ? (
                memoryData.affirmations.map((a, index) => (
                  <Text key={index} style={styles.memoryItem}>
                    • {a.content}
                  </Text>
                ))
              ) : (
                <Text style={styles.memoryItem}>Nenhuma afirmação registrada.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meu Mantra de Coração</Text>
              {memoryData.most_practiced_mantra ? (
                <>
                  <Text style={styles.mantraName}>{memoryData.most_practiced_mantra.name}</Text>
                  <Text style={styles.mantraText}>"{memoryData.most_practiced_mantra.text_content}"</Text>
                  <Text style={styles.mantraCount}>
                    Praticado {memoryData.most_practiced_mantra.practice_count} vezes
                  </Text>
                </>
              ) : (
                <Text style={styles.memoryItem}>Nenhum mantra praticado.</Text>
              )}
            </View>

            <Text style={styles.finalPhrase}>Já é.</Text>

            <TouchableOpacity style={styles.viewMemoryButton} onPress={handleViewMemory}>
              <Text style={styles.viewMemoryButtonText}>Ver Minha Memória</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8', // Fundo suave
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  conclusionButtonContainer: {
    marginVertical: 20,
  },
  conclusionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  conclusionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memoryContainer: {
    width: '100%',
    maxWidth: 600, // Limite de largura para telas maiores
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  memoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  memoryIntro: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  memoryItem: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  mantraName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  mantraText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  mantraCount: {
    fontSize: 14,
    color: '#888',
  },
  finalPhrase: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4A90E2',
    marginVertical: 20,
    alignSelf: 'flex-start',
    paddingLeft: 10,
  },
  viewMemoryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    elevation: 3, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  viewMemoryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});