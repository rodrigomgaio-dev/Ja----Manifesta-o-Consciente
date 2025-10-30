// app/memory-view-simple.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { Image } from 'expo-image';
import { Spacing } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, SlideInRight, BounceIn, Loop, Sequence, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// --- Componente de Loading Emocional ---
const EmotionalLoading = ({ colors }: { colors: any }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: withRepeat(withTiming('360deg'), -1, 'RESTART') },
      ],
    };
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingIconContainer, animatedStyle]}>
        <MaterialIcons name="auto-awesome" size={48} color={colors.gold || '#FBBF24'} />
      </Animated.View>
      <Text style={[styles.loadingText, { color: colors.text, marginTop: Spacing.lg, fontSize: 16 }]}>
        Recriando sua memória...
      </Text>
    </View>
  );
};

// --- Componente de Confetes ---
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const confettiPieces = [];
  for (let i = 0; i < 50; i++) {
    const size = Math.random() * 10 + 5;
    const left = Math.random() * width;
    const color = ['#FBBF24', '#EC4899', '#8B5CF6', '#34D399', '#A78BFA'][Math.floor(Math.random() * 5)];
    const rotation = Math.random() * 360;
    const duration = Math.random() * 3000 + 3000; // 3 a 6 segundos

    const pieceStyle = {
      position: 'absolute' as 'absolute',
      top: -size,
      left: left,
      width: size,
      height: size,
      backgroundColor: color,
      transform: [{ rotate: `${rotation}deg` }],
      zIndex: 1000,
    };

    const animatedPieceStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { rotate: `${rotation}deg` },
          { translateY: withTiming(height + size, { duration: duration }) },
        ],
      };
    });

    confettiPieces.push(
      <Animated.View
        key={i}
        style={[pieceStyle, animatedPieceStyle]}
      />
    );
  }

  return <>{confettiPieces}</>;
};

export default function MemoryViewSimpleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id: cocriacaoId, cameFromRitual } = useLocalSearchParams<{ id: string, cameFromRitual?: string }>(); // Recebe parâmetro opcional

  const [cocriacao, setCocriacao] = useState<any>(null);
  const [mantras, setMantras] = useState<any[]>([]);
  const [afirmacoes, setAfirmacoes] = useState<any[]>([]);
  const [visionBoardItems, setVisionBoardItems] = useState<any[]>([]);
  const [futureLetter, setFutureLetter] = useState<any>(null); // Armazena a carta
  const [showLetterModal, setShowLetterModal] = useState(false); // Controla o modal da carta
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false); // Controla a animação de confetes
  const insets = useSafeAreaInsets();

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
        // 1. Carregar dados principais da cocriação (título, código mental, imagem de capa, porquê, status da carta)
        const {  cocriacaoData, error: cocriacaoError } = await supabase
          .from('individual_cocriations')
          .select('title, mental_code, cover_image_url, why_reason, future_letter_completed') // Adiciona future_letter_completed
          .eq('id', cocriacaoId)
          .eq('user_id', user.id) // Garante que pertence ao usuário logado
          .single();

        if (cocriacaoError) throw cocriacaoError;
        if (!cocriacaoData) throw new Error('Cocriação não encontrada.');

        // 2. Carregar Carta para o Futuro (se marcada como concluída)
        let loadedFutureLetter = null;
        if (cocriacaoData.future_letter_completed) {
          const {  letterData, error: letterError } = await supabase
            .from('future_letters') // Assumindo que é a tabela correta
            .select('title, content') // Seleciona título e conteúdo
            .eq('cocreation_id', cocriacaoId)
            .eq('user_id', user.id)
            .single();

          if (letterError) {
            console.error("Erro ao carregar carta para o futuro:", letterError);
            // Pode continuar mesmo sem a carta
          } else {
            loadedFutureLetter = letterData;
          }
        }

        // 3. Carregar Mantras associados à cocriação
        const { data: mantrasData, error: mantrasError } = await supabase
          .from('daily_practices')
          .select('content, title') // Seleciona o conteúdo ou título do mantra
          .eq('cocreation_id', cocriacaoId)
          .eq('type', 'mantra')
          .eq('user_id', user.id);

        if (mantrasError) throw mantrasError;

        // 4. Carregar Afirmações associadas à cocriação
        const {  afirmacoesData, error: afirmacoesError } = await supabase
          .from('daily_practices')
          .select('content, title') // Seleciona o conteúdo ou título da afirmação
          .eq('cocreation_id', cocriacaoId)
          .eq('type', 'affirmation')
          .eq('user_id', user.id);

        if (afirmacoesError) throw afirmacoesError;

        // 5. Carregar Imagens do Vision Board associadas à cocriação
        const { data: vbItemsData, error: vbError } = await supabase
          .from('vision_board_items')
          .select('content') // Seleciona a URL da imagem
          .eq('cocreation_id', cocriacaoId)
          .eq('type', 'image');

        if (vbError) throw vbError;

        // Atualiza os estados com os dados carregados
        setCocriacao(cocriacaoData);
        setFutureLetter(loadedFutureLetter);
        setMantras(mantrasData || []);
        setAfirmacoes(afirmacoesData || []);
        setVisionBoardItems(vbItemsData || []);

        // Ativa confetes se veio da tela de ritual
        if (cameFromRitual === 'true') { // Verifica o parâmetro
            setShowConfetti(true);
            // Desativa os confetes após 5 segundos
            setTimeout(() => setShowConfetti(false), 5000);
        }

      } catch (err) {
        console.error('Erro ao carregar dados da memória:', err);
        setError(`Falha ao carregar a memória: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMemoryData();
  }, [cocriacaoId, user?.id, cameFromRitual]); // Adiciona cameFromRitual às dependências

  if (loading) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <EmotionalLoading colors={colors} />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Ops! {error}</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/completed-cocreations')}
        >
          <Text style={styles.backButtonText}>Voltar às Cocriações</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (!cocriacao) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <MaterialIcons name="image-not-supported" size={64} color={colors.textMuted} />
        <Text style={{ color: colors.text, marginTop: Spacing.lg }}>Nenhuma memória encontrada.</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary, marginTop: Spacing.xl }]}
          onPress={() => router.push('/completed-cocreations')}
        >
          <Text style={styles.backButtonText}>Voltar às Cocriações</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // --- Funções ---
  const handleOpenLetter = () => {
    if (futureLetter) {
        setShowLetterModal(true);
    }
  };

  const handleCloseLetter = () => {
    setShowLetterModal(false);
  };

  // --- Renderização da Memória com Animações ---
  return (
    <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
      {/* Animação de Confetes */}
      <Confetti show={showConfetti} />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brilhos de fundo */}
        <Animated.View entering={FadeIn.duration(2000)} style={styles.sparkle1} />
        <Animated.View entering={FadeIn.duration(2500)} style={styles.sparkle2} />
        <Animated.View entering={FadeIn.duration(3000)} style={styles.sparkle3} />

        {/* Cabeçalho emocional */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.headerContainer}>
          <MaterialIcons name="auto-awesome" size={48} color="#FBBF24" />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Memória de Cocriação</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Um registro emocional da sua jornada de manifestação
          </Text>
        </Animated.View>

        {/* Título Principal */}
        <Animated.Text 
          entering={FadeInUp.delay(400).springify()} 
          style={[styles.title, { color: colors.text }]}
        >
          {cocriacao.title}
        </Animated.Text>

        {/* Separador Visual */}
        <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.divider}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)', 'rgba(251, 191, 36, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerGradient}
          />
        </Animated.View>

        {/* Código Mental */}
        {cocriacao.mental_code && (
          <Animated.View entering={ZoomIn.delay(600).springify()}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mentalCodeBadge}
            >
              <Text style={styles.mentalCode}>{cocriacao.mental_code}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Imagem de Capa */}
        {cocriacao.cover_image_url && (
          <Animated.View entering={FadeIn.delay(800).duration(1000)} style={styles.coverImageContainer}>
            <Image
              source={{ uri: cocriacao.cover_image_url }}
              style={styles.coverImage}
              contentFit="cover"
            />
            <View style={styles.imageOverlay} />
          </Animated.View>
        )}

        {/* Carta para o Futuro (se existir) */}
        {cocriacao.future_letter_completed && (
          <Animated.View entering={BounceIn.delay(900).duration(1000)} style={styles.letterContainer}>
            <TouchableOpacity onPress={handleOpenLetter} activeOpacity={0.7}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#FBBF24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.letterGradient}
              >
                <MaterialIcons name="mail" size={32} color="white" />
                <Text style={styles.letterText}>Receber Carta para o Futuro</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Grade de Imagens do Vision Board (sem título) */}
        {visionBoardItems.length > 0 && (
          <Animated.View entering={FadeInUp.delay(1000).springify()} style={styles.visionBoardSection}>
            {/* Título removido */}
            <View style={styles.visionBoardGrid}>
              {visionBoardItems.map((item, index) => (
                item.content && (
                  <Animated.View
                    key={index}
                    entering={SlideInRight.delay(1200 + index * 100).springify()}
                  >
                    <Image
                      source={{ uri: item.content }}
                      style={styles.visionBoardImage}
                      contentFit="cover"
                    />
                  </Animated.View>
                )
              ))}
            </View>
          </Animated.View>
        )}

        {/* "O meu porquê" */}
        {cocriacao.why_reason && (
          <Animated.View entering={FadeInUp.delay(1400).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="favorite" size={24} color="#F87171" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>O meu porquê</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {cocriacao.why_reason}
            </Text>
          </Animated.View>
        )}

        {/* Mantras Mágicos */}
        {mantras.length > 0 && (
          <Animated.View entering={FadeInUp.delay(1600).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="auto-fix-high" size={24} color="#A78BFA" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mantras Mágicos</Text>
            </View>
            {mantras.map((mantra, index) => (
              <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                ✦ {mantra.content || mantra.title}
              </Text>
            ))}
          </Animated.View>
        )}

        {/* Crenças Principais */}
        {afirmacoes.length > 0 && (
          <Animated.View entering={FadeInUp.delay(1800).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="check-circle" size={24} color="#34D399" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Crenças Principais</Text>
            </View>
            {afirmacoes.map((afirmacao, index) => (
              <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                ✦ {afirmacao.content || afirmacao.title}
              </Text>
            ))}
          </Animated.View>
        )}

        {/* "JÁ É!" Final */}
        <Animated.View entering={ZoomIn.delay(2000).springify()}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#FBBF24']} // Gradiente como o Jaé
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jaEContainer}
          >
            <Text style={styles.jaEText}>JÁ É !</Text> {/* Espaçamento extra conforme solicitado */}
          </LinearGradient>
        </Animated.View>

        {/* Botão "Gratidão" */}
        <Animated.View entering={FadeInUp.delay(2200).springify()} style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.gratitudeButton}
            onPress={() => router.push('/completed-cocreations')} // Navega para onde for apropriado
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.gratitudeButtonGradient}
            >
              <MaterialIcons name="card-giftcard" size={24} color="white" />
              <Text style={styles.gratitudeButtonText}>Gratidão</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Mensagem Final (abaixo do botão) */}
        <Animated.View entering={FadeIn.delay(2400).duration(1500)} style={styles.footerMessage}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Esta memória é um testemunho silencioso do momento em que você disse: Já é. 
            Guarde-a como um tesouro da alma e lembre-se sempre de que você é um cocriador consciente.
          </Text>
        </Animated.View>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>

      {/* Modal da Carta para o Futuro */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLetterModal}
        onRequestClose={handleCloseLetter}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {futureLetter?.title || "Carta para o Futuro"}
              </Text>
              <TouchableOpacity onPress={handleCloseLetter} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                {futureLetter?.content || "Conteúdo da carta não encontrado."}
              </Text>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  // Brilhos de fundo
  sparkle1: {
    position: 'absolute',
    top: 100,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    opacity: 0.6,
  },
  sparkle2: {
    position: 'absolute',
    top: 300,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    opacity: 0.5,
  },
  sparkle3: {
    position: 'absolute',
    top: 500,
    right: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    opacity: 0.4,
  },
  // Cabeçalho
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  divider: {
    width: '80%',
    height: 2,
    marginVertical: Spacing.md,
  },
  dividerGradient: {
    flex: 1,
  },
  mentalCodeBadge: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    marginBottom: Spacing.xl,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  mentalCode: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    color: 'white',
    textAlign: 'center',
  },
  coverImageContainer: {
    width: '100%',
    maxWidth: 400,
    height: 240,
    marginBottom: Spacing.xl,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
  },
  letterContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  letterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 28,
    gap: Spacing.md,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  letterText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  visionBoardSection: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.xl,
  },
  visionBoardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  visionBoardImage: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    height: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  section: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  listItem: {
    fontSize: 16,
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  jaEContainer: {
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.xl * 1.5,
    borderRadius: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
    marginBottom: Spacing.xl,
  },
  jaEText: {
    fontSize: 56,
    fontWeight: '900', // Mantido o mesmo fontWeight do Jaé
    color: 'white',
    textAlign: 'center',
    letterSpacing: 4, // Espaçamento entre letras
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gratitudeButton: {
    // Estilo similar ao botão da completion-ritual.tsx
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: 320,
    marginBottom: Spacing.lg, // Espaçamento antes da mensagem final
  },
  gratitudeButtonGradient: {
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
  gratitudeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  footerMessage: {
    paddingHorizontal: Spacing.lg,
    // marginBottom: Spacing.xl, // Removido, pois agora vem após o botão
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center', // Centraliza o botão
    // gap: Spacing.md, // Removido, pois só tem um botão agora
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    // Pode adicionar bordas ou fundo se quiser
  },
  loadingText: {
    // Estilo do texto de loading
  },
  // --- Estilos do Modal ---
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro semi-transparente
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1, // Faz o título ocupar o espaço restante
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalBody: {
    flex: 1,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
  },
});