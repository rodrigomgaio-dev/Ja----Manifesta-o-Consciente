import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import GradientBackground from '@/components/ui/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { Spacing } from '@/constants/Colors';

interface PositionedItem {
  id: string;
  content: string;
  width: number;
  height: number;
  x: number;
  y: number;
  animationDelay: number;
}

export default function VisionBoardViewScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Hook para buscar os itens do VisionBoard
  const { items: rawItems, loading } = useVisionBoard(cocreationId || '');

  // Filtrar apenas as imagens
  const imageItems = useMemo(() => {
    return rawItems.filter(item => item.type === 'image' && item.content);
  }, [rawItems]);

  // --- Configurações do Canvas ---
  // Tamanho do canvas (pode ser maior que a tela para permitir navegação)
  // Vamos calcular um tamanho baseado no número de imagens e um tamanho médio
  const canvasPadding = 100; // Espaço extra ao redor do conteúdo
  const minCanvasSize = Math.max(screenWidth, screenHeight) * 1.5; // Tamanho mínimo

  // --- Cálculo de Posicionamento Denso ---
  const positionedItems = useMemo(() => {
    if (imageItems.length === 0) {
      return [];
    }

    // Tamanho médio das imagens
    const baseImageSize = Math.min(screenWidth * 0.3, screenHeight * 0.25, 180);
    const minImageSize = baseImageSize * 0.6;
    const maxImageSize = baseImageSize * 1.4;

    // Espaçamento entre imagens
    const spacing = 10;

    // Variáveis para calcular o tamanho do canvas
    let canvasWidth = minCanvasSize;
    let canvasHeight = minCanvasSize;
    let currentX = canvasPadding;
    let currentY = canvasPadding;
    let rowHeight = 0; // Altura da linha atual sendo preenchida

    const items: PositionedItem[] = [];
    imageItems.forEach((item, index) => {
      // Calcular tamanho da imagem
      const sizeVariation = 0.8 + Math.random() * 0.4; // Entre 80% e 120%
      const finalSize = Math.max(minImageSize, Math.min(maxImageSize, baseImageSize * sizeVariation));

      const imageWidth = item.width ? Math.min(item.width, finalSize) : finalSize;
      const imageHeight = item.height ? Math.min(item.height, finalSize) : finalSize;

      // Verificar se a imagem cabe na linha atual
      if (currentX + imageWidth > canvasWidth - canvasPadding) {
        // Não cabe, pular para a próxima linha
        currentX = canvasPadding;
        currentY += rowHeight + spacing;
        rowHeight = 0; // Resetar altura da linha
      }

      // Atualizar a altura da linha atual
      rowHeight = Math.max(rowHeight, imageHeight);

      // Posicionar a imagem
      items.push({
        id: item.id,
        content: item.content,
        width: imageWidth,
        height: imageHeight,
        x: currentX,
        y: currentY,
        animationDelay: index * 100, // Stagger
      });

      // Atualizar coordenadas para a próxima imagem
      currentX += imageWidth + spacing;

      // Atualizar o tamanho do canvas conforme necessário
      canvasWidth = Math.max(canvasWidth, currentX + canvasPadding);
      canvasHeight = Math.max(canvasHeight, currentY + imageHeight + canvasPadding);
    });

    return items;
  }, [imageItems, screenWidth, screenHeight]);

  // --- Funções de Navegação ---
  const handleZoomIn = (scrollViewRef: React.RefObject<ScrollView>) => {
    // Simplesmente aumentar o zoom em um fator
    // Isso requer um estado ou ref para o zoom atual, que o ScrollView não fornece diretamente
    // Para um controle mais preciso, uma biblioteca como react-native-gesture-handler seria necessária
    // Por enquanto, vamos apenas centralizar o scroll em um ponto
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const handleZoomOut = (scrollViewRef: React.RefObject<ScrollView>) => {
    // Voltar ao zoom padrão
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const handleResetView = (scrollViewRef: React.RefObject<ScrollView>) => {
    // Centralizar e resetar zoom
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Acesso Negado
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Você precisa estar logado para visualizar este Vision Board.
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  const scrollViewRef = React.createRef<ScrollView>();

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface + '80' }]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Vision Board
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Contemple suas manifestações
            </Text>
          </View>

          {/* Botões de Zoom */}
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => handleZoomOut(scrollViewRef)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="zoom-out" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleResetView(scrollViewRef)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="center-focus-strong" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleZoomIn(scrollViewRef)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="zoom-in" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas com ScrollView para Zoom e Arraste */}
        <View style={styles.canvasContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={48} color={colors.textMuted} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Carregando sua manifestação...
              </Text>
            </View>
          ) : imageItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyContent, { backgroundColor: colors.surface + '60' }]}>
                <MaterialIcons name="visibility" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Vision Board Vazio
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Não há imagens para visualizar ainda.{'\n'}
                  Adicione elementos ao seu Vision Board primeiro.
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.canvasContent}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              maximumZoomScale={3}
              minimumZoomScale={0.5}
              // scrollEnabled={true} // Habilita arraste
              // zoomEnabled={true} // Habilita zoom (não funciona exatamente como no iOS, mas permite double-tap)
              // Para controle preciso de zoom, seria necessário react-native-gesture-handler
            >
              {/* Fundo Interativo - Gradiente Dinâmico (opcional) */}
              {/* <LinearGradient
                colors={[
                  colors.surface + '20',
                  colors.primary + '10',
                  colors.accent + '10',
                  colors.surface + '20',
                ]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              /> */}

              {/* Imagens posicionadas */}
              {positionedItems.map((item) => (
                <AnimatedVisionImage
                  key={`${item.id}-${item.x}-${item.y}`} // Key inclui posição para re-render
                  item={item}
                  colors={colors}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Inspiração */}
        {imageItems.length > 0 && (
          <View style={styles.inspirationContainer}>
            <Text style={[styles.inspirationText, { color: colors.textMuted }]}>
              ✨ Observe. Sinta. Manifeste conscientemente. ✨
            </Text>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

// Componente para cada imagem posicionada com animação
const AnimatedVisionImage: React.FC<{
  item: PositionedItem;
  colors: any;
}> = ({ item, colors }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Animação de entrada
    opacity.value = withDelay(
      item.animationDelay,
      withTiming(1, { duration: 600 })
    );
    scale.value = withDelay(
      item.animationDelay,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
  }, [item.animationDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.imageContainer,
        {
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.imageFrame, { backgroundColor: colors.surface + '40' }]}>
        <Image
          source={{ uri: item.content }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
        {/* Brilho opcional */}
        <View style={[styles.imageGlow, { backgroundColor: colors.primary + '20' }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: 'italic',
  },
  canvasContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  canvasContent: {
    // O tamanho real do conteúdo será definido pelo layout das imagens
    // Este estilo é aplicado ao conteúdo interno do ScrollView
  },
  imageContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  imageFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    padding: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 13,
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyContent: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inspirationContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  inspirationText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});