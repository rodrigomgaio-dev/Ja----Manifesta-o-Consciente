// app/memory-view.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Importe se necessário para validação

export default function MemoryViewScreen() {
  const { colors } = useTheme();
  const { user } = useAuth(); // Validação opcional
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const { loadSingle } = useIndividualCocriations(); // Usando loadSingle para obter dados completos

  const [memoryData, setMemoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemory = async () => {
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
        // Carrega a cocriação completa, incluindo o memory_snapshot
        const {  cocriacao, error: loadError } = await loadSingle(cocriacaoId);

        if (loadError) {
          console.error("Erro ao carregar memória:", loadError);
          throw loadError;
        }

        if (!cocriacao) {
          throw new Error('Cocriação não encontrada.');
        }

        if (!cocriacao.memory_snapshot) {
          throw new Error('Memória da Cocriação não encontrada. A cocriação pode não ter sido concluída corretamente.');
        }

        setMemoryData(cocriacao.memory_snapshot);
        console.log("Memória carregada:", cocriacao.memory_snapshot);
      } catch (err) {
        console.error('Erro ao carregar a memória da cocriação:', err);
        setError(`Falha ao carregar a memória: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMemory();
  }, [cocriacaoId, user?.id, loadSingle]);

  if (loading) {
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

  if (!memoryData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Nenhuma memória encontrada.</Text>
      </View>
    );
  }

  // --- Renderização da Memória ---
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background, padding: 20 }]}>
      <Text style={[styles.title, { color: colors.text }]}>{memoryData.title}</Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        De: {new Date(memoryData.start_date).toLocaleDateString('pt-BR')} | Até: {new Date(memoryData.completion_date).toLocaleDateString('pt-BR')}
      </Text>

      {/* Seção de Gratidões */}
      {memoryData.gratitudes && memoryData.gratitudes.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Gratidões Finais</Text>
          {memoryData.gratitudes.map((g: any, index: number) => (
            <Text key={`gratitude-${index}`} style={[styles.memoryItem, { color: colors.textSecondary }]}>
              • {g.content}
            </Text>
          ))}
        </View>
      )}

      {/* Seção de Afirmações */}
      {memoryData.affirmations && memoryData.affirmations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Afirmações que Me Sustentaram</Text>
          {memoryData.affirmations.map((a: any, index: number) => (
            <Text key={`affirmation-${index}`} style={[styles.memoryItem, { color: colors.textSecondary }]}>
              • {a.content}
            </Text>
          ))}
        </View>
      )}

      {/* Seção de Mantra */}
      {memoryData.most_practiced_mantra && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meu Mantra de Coração</Text>
          <Text style={[styles.mantraName, { color: colors.text }]}>{memoryData.most_practiced_mantra.name}</Text>
          <Text style={[styles.mantraText, { color: colors.textSecondary }]}>
            "{memoryData.most_practiced_mantra.text_content}"
          </Text>
          <Text style={[styles.mantraCount, { color: colors.textMuted }]}>
            Praticado {memoryData.most_practiced_mantra.practice_count} vezes
          </Text>
        </View>
      )}

      {/* Frase Final */}
      <Text style={[styles.finalPhrase, { color: colors.primary }]}>Já é.</Text>

      <Text style={[styles.footer, { color: colors.textMuted, fontStyle: 'italic', marginTop: 30, textAlign: 'center' }]}>
        Esta é a sua Memória da Cocriação. Não é um ativo. Não é um token. É o testemunho silencioso do momento em que você disse: Já é. Guarde-a como um tesouro da alma.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    // justifyContent: 'center', // Removido para permitir scroll
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fundo sutil
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.3)', // Cor da borda sutil
    paddingBottom: 5,
  },
  memoryItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  mantraName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  mantraText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  mantraCount: {
    fontSize: 14,
  },
  finalPhrase: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 20,
    alignSelf: 'flex-start',
    paddingLeft: 10,
  },
  footer: {
    fontSize: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  }
});
