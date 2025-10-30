// app/memory-view-simple.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { Image } from 'expo-image';
import { Spacing } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, SlideInRight, BounceIn, useAnimatedStyle, useSharedValue, withTiming, withRepeat, withSequence, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// --- Componente de Confetes ---
const ConfettiPiece = ({ left, duration, size, color, onFinish }: { left: number, duration: number, size: number, color: string, onFinish: () => void }) => {
  const translateY = useSharedValue(-size); // Começa acima da tela
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Animação de queda com rotação
    translateY.value = withTiming(height + size, { duration }, () => runOnJS(onFinish)()); // Move para fora da tela inferiormente
    rotate.value = withRepeat(withTiming(360, { duration: duration / 2 }), -1, 'RESTART'); // Rotaciona continuamente
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          left,
          width: size,
          height: size,
          backgroundColor: color,
        },
      ]}
    />
  );
};

export default function MemoryViewSimpleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [cocriacao, setCocriacao] = useState<any>(null);
  const [mantras, setMantras] = useState<any[]>([]);
  const [afirmacoes, setAfirmacoes] = useState<any[]>([]);
  const [visionBoardItems, setVisionBoardItems] = useState<any[]>([]);
  const [futureLetter, setFutureLetter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<any[]>([]);

  useEffect(() => {
    // Verificar se está vindo da tela completion-ritual
    // NOTA: O código original usava 'fromCompletion', mas a navegação foi atualizada para 'cameFromRitual'
    // Precisamos alinhar isso. Vamos assumir que o parâmetro correto é 'cameFromRitual'
    // Se você estiver usando a versão antiga do completion-ritual, ajuste o parâmetro abaixo
    const params = useLocalSearchParams();
    const cameFromRitual = params.cameFromRitual; // Verifique o nome do parâmetro enviado
    if (cameFromRitual === 'true') {
      setShowConfetti(true);
      createConfetti();
      setTimeout(() => setShowConfetti(false), 5000);
    }

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
        // 1. Carregar dados principais da cocriação (título, código mental, imagem de capa, porquê, descrição)
        const { data: cocriacaoData, error: cocriacaoError } = await supabase
          .from('individual_cocriations')
          .select('title, mental_code, cover_image_url, why_reason, description')
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

        // 5. Carregar Carta para o Futuro
        const { data: letterData, error: letterError } = await supabase
          .from('future_letters')
          .select('title, content, is_revealed')
          .eq('individual_cocreation_id', cocriacaoId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (letterError && letterError.code !== 'PGRST116') throw letterError;

        // Atualiza os estados com os dados carregados
        setCocriacao(cocriacaoData);
        setMantras(mantrasData || []);
        setAfirmacoes(afirmacoesData || []);
        setVisionBoardItems(vbItemsData || []);
        setFutureLetter(letterData || null);

      } catch (err) {
        console.error('Erro ao carregar dados da memória:', err);
        setError(`Falha ao carregar a memória: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMemoryData();
  }, [cocriacaoId, user?.id]); // Removi 'fromCompletion' se não for um parâmetro real recebido

  const createConfetti = () => {
    const pieces = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        left: Math.random() * width,
        duration: Math.random() * 3000 + 2000, // 2 a 5 segundos
        delay: Math.random() * 1000, // Delay inicial aleatório
        size: Math.random() * 10 + 5, // Tamanho entre 5 e 15
        color: ['#FBBF24', '#8B5CF6', '#EC4899', '#34D399'][Math.floor(Math.random() * 4)],
      });
    }
    setConfettiPieces(pieces);
  };

  const handleConfettiFinish = (id: number) => {
    setConfettiPieces(prev => prev.filter(piece => piece.id !== id));
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <Animated.View entering={FadeIn.duration(1000)} style={styles.loadingContainer}>
          <Animated.View entering={ZoomIn.delay(200).springify()}>
            <MaterialIcons name="auto-awesome" size={64} color="#FBBF24" />
          </Animated.View>
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando memória...</Text>
          <Animated.View entering={FadeIn.delay(500)} style={styles.loadingSubtext}>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>Um momento de gratidão</Text>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Ops! {error}</Text>
        <TouchableOpacity
          style={styles.gratitudeButton}
          onPress={() => router.push('/completed-cocreations')}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={styles.gratitudeButtonGradient}
          >
            <MaterialIcons name="favorite" size={24} color="white" />
            <Text style={styles.gratitudeButtonText}>Gratidão</Text>
          </LinearGradient>
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
          style={[styles.gratitudeButton, { marginTop: Spacing.xl }]}
          onPress={() => router.push('/completed-cocreations')}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={styles.gratitudeButtonGradient}
          >
            <MaterialIcons name="favorite" size={24} color="white" />
            <Text style={styles.gratitudeButtonText}>Gratidão</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // --- Renderização da Memória com Animações ---
  return (
    <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
      {/* Confetes caindo */}
      {showConfetti && confettiPieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          left={piece.left}
          duration={piece.duration}
          size={piece.size}
          color={piece.color}
          onFinish={() => handleConfettiFinish(piece.id)}
        />
      ))}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Memória de Cocriação</Text>
        </Animated.View>

        {/* Separador visual */}
        <View style={styles.separator} />

        {/* Título Principal */}
        <Animated.Text 
          entering={FadeInUp.delay(400).springify()} 
          style={[styles.title, { color: colors.text }]}
        >
          {cocriacao.title}
        </Animated.Text>

        {/* Código Mental */}
        {cocriacao.mental_code && (
          <Animated.Text entering={ZoomIn.delay(600).springify()} style={styles.mentalCode}>
            {cocriacao.mental_code}
          </Animated.Text>
        )}

        {/* Descrição */}
        {cocriacao.description && (
          <Animated.Text entering={FadeInUp.delay(700).springify()} style={[styles.description, { color: colors.textSecondary }]}>
            {cocriacao.description}
          </Animated.Text>
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

        {/* Grade de Imagens do Vision Board */}
        {visionBoardItems.length > 0 && (
          <Animated.View entering={FadeInUp.delay(1000).springify()} style={styles.visionBoardSection}>
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

        {/* Animação de Carta Chegando */}
        {futureLetter && (
          <Animated.View
            entering={SlideInDown.delay(1900).springify()} // Animação de entrada para simbolizar a carta chegando
            style={styles.letterSection}
          >
            <TouchableOpacity
              style={styles.letterContainer}
              onPress={() => setShowLetterModal(true)}
            >
              <MaterialIcons name="mail" size={64} color="#FBBF24" />
              <Text style={[styles.letterTitle, { color: colors.text }]}>Carta para o Futuro</Text>
              <Text style={[styles.letterSubtitle, { color: colors.textMuted }]}>Toque para abrir</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* "Já é !" Final com estilo do Home */}
        <Animated.View entering={ZoomIn.delay(2000).springify()} style={styles.jaEContainer}>
          <Text style={styles.jaEText}>Já é !</Text>
        </Animated.View>

        {/* Mensagem Final */}
        <Animated.View entering={FadeIn.delay(2200).duration(1500)} style={styles.footerMessage}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Esta memória é um testemunho silencioso do momento em que você disse: Já é. 
            Guarde-a como um tesouro da alma e lembre-se sempre de que você é um cocriador consciente.
          </Text>
        </Animated.View>

        {/* Botão Gratidão */}
        <Animated.View entering={FadeInUp.delay(2400).springify()} style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.gratitudeButton}
            onPress={() => router.push('/completed-cocreations')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.gratitudeButtonGradient}
            >
              <MaterialIcons name="favorite" size={24} color="white" />
              <Text style={styles.gratitudeButtonText}>Gratidão</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>

      {/* Modal da Carta */}
      <Modal
        visible={showLetterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLetterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.springify()} style={styles.modalContent}>
            <LinearGradient
              colors={['#2d1b4e', '#4a2c6e']}
              style={styles.modalGradient}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLetterModal(false)}
              >
                <MaterialIcons name="close" size={28} color="white" />
              </TouchableOpacity>
              
              <MaterialIcons name="mail-outline" size={48} color="#FBBF24" style={{ marginBottom: Spacing.lg }} />
              
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {futureLetter?.title || 'Carta para o Futuro'}
              </Text>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  {futureLetter?.content}
                </Text>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
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
  confettiPiece: {
    position: 'absolute',
    top: 0, // Começa acima da tela (ajustado via translateY)
    borderRadius: 2,
    transform: [{ rotate: '45deg' }], // Formato de diamante
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  loadingSubtext: {
    marginTop: Spacing.sm,
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
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: Spacing.xl,
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
  mentalCode: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
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
  visionBoardSection: {
    width: '100%',
    maxWidth: 600,
    marginBottom: Spacing.xl,
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
  letterSection: {
    width: '100%',
    maxWidth: 400,
    marginVertical: Spacing.xl,
    alignItems: 'center',
  },
  letterContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: Spacing.md,
  },
  letterTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  letterSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  jaEContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl * 2,
  },
  jaEText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#D4AF37', // Cor dourada do Jaé
    textAlign: 'center',
    letterSpacing: 6,
  },
  footerMessage: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 320,
  },
  gratitudeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    padding: Spacing.sm,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 1,
  },
  modalScroll: {
    width: '100%',
    maxHeight: 400,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});