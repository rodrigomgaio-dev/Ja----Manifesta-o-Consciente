// app/completion-ritual.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useDailyPractices } from '@/hooks/useDailyPractices'; // Importa o hook atualizado
import { Spacing } from '@/constants/Colors';
import { supabase } from '@/services/supabase'; // Importa o supabase

const { width, height } = Dimensions.get('window');

export default function CompletionRitualScreen() {
  const { colors } = useTheme();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const { loadSingle } = useIndividualCocriations(); // Usa loadSingle do hook existente
  const { getRecentPractices, getMostPracticedMantra } = useDailyPractices(); // Usa as funções do hook atualizado

  // --- Estados para a lógica de conclusão ---
  const [loadingData, setLoadingData] = useState(true); // Controla o carregamento inicial dos dados
  const [memoryData, setMemoryData] = useState<any>(null); // Armazena os dados da memória
  const [isCompleting, setIsCompleting] = useState(false); // Controla o estado de "concluindo"

  // --- Estados para as animações (mantidos do original) ---
  const [step, setStep] = useState<'celebration' | 'realization'>('celebration');
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(50)).current;
  
  // Partículas
  const [particles, setParticles] = useState<any[]>([]);

  // --- Carregar dados iniciais ---
  useEffect(() => {
    if (!cocriacaoId) {
      Alert.alert('Erro', 'ID da Cocriação ausente.');
      return;
    }

    const loadData = async () => {
      try {
        // 1. Obter detalhes da cocriação
        const { data: cocriacao, error: loadError } = await loadSingle(cocriacaoId);
        if (loadError) throw loadError;
        if (!cocriacao) throw new Error('Cocriação não encontrada.');

        // 2. Obter práticas recentes e mantra mais praticado
        const [recentGratitudes, recentAffirmations, mostPracticedMantra] = await Promise.all([
          getRecentPractices(cocriacaoId, 'gratitude', 2),
          getRecentPractices(cocriacaoId, 'affirmation', 2),
          getMostPracticedMantra(cocriacaoId),
        ]);

        // 3. Montar o objeto memory_snapshot
        const newMemoryData = {
          title: cocriacao.title,
          intention: cocriacao.why_reason || '',
          start_date: cocriacao.created_at,
          completion_date: new Date().toISOString(),
          gratitudes: recentGratitudes,
          affirmations: recentAffirmations,
          most_practiced_mantra: mostPracticedMantra,
        };

        setMemoryData(newMemoryData);
        setLoadingData(false); // Dados carregados

        // Iniciar animações originais após carregar dados
        startCelebrationAnimation();
        createParticles();

        // Transição para tela de realização após animação de celebração
        setTimeout(() => {
          setStep('realization');
          startRealizationAnimation();
        }, 3000);

      } catch (err) {
        console.error('Erro ao carregar dados para a memória:', err);
        Alert.alert('Erro', `Falha ao carregar os dados: ${(err as Error).message}`);
        setLoadingData(false); // Garante que o loading pare em caso de erro
      }
    };

    loadData();
  }, [cocriacaoId, loadSingle, getRecentPractices, getMostPracticedMantra]);

  // --- Funções de Animação (mantidas do original) ---
  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      const particle = {
        id: i,
        x: Math.random() * width,
        y: height + Math.random() * 100,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 3000 + 2000,
        delay: Math.random() * 500,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
      };
      
      // Animar partícula subindo
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: -height - 100,
            duration: particle.duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      newParticles.push(particle);
    }
    setParticles(newParticles);
  };

  const startCelebrationAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startRealizationAnimation = () => {
    Animated.sequence([
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(subtitleSlideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // --- Função Atualizada para Concluir ---
  const handleViewMemory = async () => {
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

      // 2. Navegar para a tela da Memória de Cocriação
      // Opcional: Passar o ID é suficiente, a tela memory-view buscará os dados
      router.replace(`/memory-view?id=${cocriacaoId}`);

    } catch (err) {
      console.error('Erro ao concluir cocriação:', err);
      Alert.alert('Erro', `Falha ao concluir a Cocriação: ${(err as Error).message}`);
    } finally {
        setIsCompleting(false);
    }
  };

  // --- Renderização ---
  if (loadingData) {
    // Mostra um loading enquanto os dados estão sendo carregados
    // ou talvez uma tela de fundo mais sutil, mantendo o foco na animação principal
    // Para manter o estilo original, talvez não seja necessário um loading aqui
    // pois a animação de celebração já começa após o carregamento.
    // Vamos considerar que a animação de celebração é o feedback visual inicial.
    // Se quiser um loading explícito, descomente abaixo:
    /*
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Preparando sua Memória...</Text>
      </View>
    );
    */
   // Neste caso, a animação começa após o carregamento, então o loading é implícito.
   // Se o carregamento for longo, talvez valha a pena adicionar uma tela de splash temporária aqui.
   // Por enquanto, apenas renderizamos a animação de celebração, que começará quando loadingData for false.
   // Mas para evitar renderizar a animação antes de ter os dados, vamos manter a lógica de animação dentro do useEffect.
   // Portanto, enquanto loadingData é true, nada é renderizado explicitamente aqui.
   // A animação começa automaticamente após o useEffect terminar o carregamento.
   // Se o carregamento falhar, o Alert é mostrado e o useEffect não prossegue para as animações.
   // O código abaixo renderiza a animação de celebração imediatamente, o que é o comportamento desejado *após* os dados serem carregados.
   // Para alinhar com isso, o código de renderização permanece o mesmo, mas a lógica de iniciar animações está no useEffect.
   // O estado `step` controla o que é renderizado.
   // Se loadingData for true, e step ainda não tiver sido definido ou a animação não tiver começado, pode haver um breve momento vazio.
   // A maneira mais robusta é iniciar as animações apenas após o carregamento completo no useEffect.
   // O código abaixo assume que o useEffect já iniciou as animações.
  }

  if (step === 'celebration') {
    return (
      <LinearGradient
        colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']}
        style={styles.container}
      >
        {/* Partículas douradas */}
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                bottom: 0,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                transform: [{ translateY: particle.translateY }],
              },
            ]}
          >
            <MaterialIcons name="auto-awesome" size={particle.size} color="#FBBF24" />
          </Animated.View>
        ))}
        
        {/* Ícone central pulsante */}
        <Animated.View
          style={[
            styles.celebrationIcon,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#FBBF24']}
            style={styles.iconGradient}
          >
            <MaterialIcons name="celebration" size={80} color="white" />
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    );
  }

  // Tela de Realização (após a animação de celebração)
  return (
    <LinearGradient
      colors={['#6B46C1', '#8B5CF6', '#A855F7', '#EC4899', '#FBBF24']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.realizationContainer}>
        {/* Texto "Já é." */}
        <Animated.View
          style={[
            styles.mainTextContainer,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          <Text style={styles.mainText}>Já é.</Text>
        </Animated.View>
        
        {/* Subtitle deslizando */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: subtitleSlideAnim }],
            },
          ]}
        >
          <Text style={styles.subtitle}>Gratidão pela cocriação.</Text>
        </Animated.View>
        
        {/* Botão Ver Memória de Cocriação */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.nftButton}
            onPress={handleViewMemory}
            activeOpacity={0.8}
            disabled={isCompleting} // Desabilita o botão durante a conclusão
          >
            {isCompleting ? ( // Mostra loading no botão se estiver concluindo
                <View style={styles.nftButtonGradient}>
                    <ActivityIndicator size="small" color="white" />
                </View>
            ) : (
                <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.nftButtonGradient}
                >
                <MaterialIcons name="card-giftcard" size={24} color="white" />
                <Text style={styles.nftButtonText}>Ver minha Memória de Cocriação</Text>
                </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

// --- Estilos (mantidos do original) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  celebrationIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  realizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  mainTextContainer: {
    marginBottom: Spacing.xl * 2,
  },
  mainText: {
    fontSize: 72,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 8,
  },
  subtitleContainer: {
    marginBottom: Spacing.xl * 3,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  nftButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nftButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
  },
  nftButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
});