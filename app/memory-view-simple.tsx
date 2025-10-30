// app/memory-view-simple.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { Image } from 'expo-image';
import { Spacing } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function MemoryViewSimpleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id: cocriacaoId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

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
      <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: Spacing.lg, fontSize: 16 }}>Recriando sua memória...</Text>
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

  // --- Renderização da Memória com Animações ---
  return (
    <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#4a2c6e']} style={styles.container}>
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

        {/* Grade de Imagens do Vision Board */}
        {visionBoardItems.length > 0 && (
          <Animated.View entering={FadeInUp.delay(1000).springify()} style={styles.visionBoardSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="collections" size={24} color="#EC4899" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Imagens da Manifestação</Text>
            </View>
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

        {/* Mensagem de Gratidão */}
        <Animated.View entering={FadeIn.delay(2000).duration(1500)} style={styles.gratitudeSection}>
          <MaterialIcons name="spa" size={48} color="#FBBF24" />
          <Text style={[styles.gratitudeText, { color: colors.text }]}>Gratidão!</Text>
          <Text style={[styles.gratitudeSubtext, { color: colors.textMuted }]}>
            Por ter cocriado esta realidade com o universo
          </Text>
        </Animated.View>

        {/* "JÁ É!" Final */}
        <Animated.View entering={ZoomIn.delay(2200).springify()}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#FBBF24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jaEContainer}
          >
            <Text style={styles.jaEText}>JÁ É!</Text>
          </LinearGradient>
        </Animated.View>

        {/* Mensagem Final */}
        <Animated.View entering={FadeIn.delay(2400).duration(1500)} style={styles.footerMessage}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Esta memória é um testemunho silencioso do momento em que você disse: Já é. 
            Guarde-a como um tesouro da alma e lembre-se sempre de que você é um cocriador consciente.
          </Text>
        </Animated.View>

        {/* Botão para Voltar */}
        <Animated.View entering={FadeInUp.delay(2600).springify()} style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/completed-cocreations')}
          >
            <MaterialIcons name="arrow-back" size={20} color="white" />
            <Text style={styles.backButtonText}>Voltar às Cocriações</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.createNewButton}
            onPress={() => router.push('/(tabs)/individual')}
          >
            <MaterialIcons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.createNewText, { color: colors.primary }]}>Criar Nova Cocriação</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>
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
  gratitudeSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl * 2,
    paddingVertical: Spacing.xl,
  },
  gratitudeText: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  gratitudeSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
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
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    maxWidth: 400,
    gap: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 28,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 28,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
