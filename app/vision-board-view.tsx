/* VisionBoardViewScreen.tsx
   Reescrito: layout tipo "collage" (aleatório denso + rotação suave + sobreposição sutil)
   Requisitos: react-native-gesture-handler v2+, react-native-reanimated v2+, expo-image
*/

import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import GradientBackground from '@/components/ui/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { Spacing } from '@/constants/Colors';

interface PositionedItem {
  id: string;
  uri: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  animationDelay: number;
}

/**
 * Gera um layout tipo colagem, com sobreposição leve e rotação aleatória
 */
function computeCollageLayout(
  images: { id: string; uri: string; width?: number; height?: number }[],
  containerWidth: number,
  containerHeight: number,
  spacing = 12
) {
  if (!images || images.length === 0) return { items: [], totalHeight: 0 };

  const items: PositionedItem[] = [];
  const usedSpots: { x: number; y: number; w: number; h: number }[] = [];

  const baseSize = Math.min(containerWidth, containerHeight) * 0.35;
  const minSize = baseSize * 0.6;
  const maxSize = baseSize * 1.2;

  let cursorY = spacing;

  images.forEach((img, idx) => {
    const aspect = (img.width || 1) / (img.height || 1);
    const size = Math.random() * (maxSize - minSize) + minSize;
    const w = aspect > 1 ? size : size * aspect;
    const h = aspect > 1 ? size / aspect : size;
    const rotation = (Math.random() - 0.5) * 12; // graus aleatórios (-6 a +6)

    // tentativa de posicionamento aleatório dentro do canvas
    let x = Math.random() * (containerWidth - w - spacing * 2) + spacing;
    let y = Math.random() * (containerHeight - h - spacing * 4) + spacing;

    // verificar sobreposição excessiva (ajuste se necessário)
    let tries = 0;
    while (
      usedSpots.some(
        (s) =>
          Math.abs(s.x - x) < (s.w + w) * 0.35 &&
          Math.abs(s.y - y) < (s.h + h) * 0.35
      ) &&
      tries < 10
    ) {
      x = Math.random() * (containerWidth - w - spacing * 2) + spacing;
      y = Math.random() * (containerHeight - h - spacing * 4) + spacing;
      tries++;
    }

    usedSpots.push({ x, y, w, h });

    items.push({
      id: img.id,
      uri: img.uri,
      width: w,
      height: h,
      x,
      y,
      rotation,
      animationDelay: idx * 80,
    });

    cursorY = Math.max(cursorY, y + h + spacing);
  });

  const totalHeight = Math.max(containerHeight, cursorY + spacing);
  return { items, totalHeight };
}

/** Memoized animated image component */
const VisionImage = React.memo(function VisionImage({
  item,
  colors,
}: {
  item: PositionedItem;
  colors: any;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withDelay(item.animationDelay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(item.animationDelay, withSpring(1, { damping: 10, stiffness: 100 }));
  }, [item.animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${item.rotation}deg` },
    ],
  }));

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
          source={{ uri: item.uri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      </View>
    </Animated.View>
  );
});

export default function VisionBoardViewScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { items: rawItems, loading } = useVisionBoard(cocreationId || '');

  const imageItems = useMemo(() => {
    return rawItems
      .filter((it) => it.type === 'image' && it.content)
      .map((it) => ({
        id: it.id,
        uri: it.content,
        width: it.width || undefined,
        height: it.height || undefined,
      }));
  }, [rawItems]);

  const containerWidth = screenWidth * 1.2;
  const containerHeight = screenHeight * 1.3;

  const { items: positionedItems, totalHeight } = useMemo(() => {
    return computeCollageLayout(imageItems, containerWidth, containerHeight);
  }, [imageItems, containerWidth, containerHeight]);

  // Zoom/pan logic
  const scale = useSharedValue(1);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const lastScale = useRef(1);
  const lastTrans = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.7;
  const MAX_SCALE = 2.8;

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = lastScale.current * e.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    })
    .onEnd(() => {
      lastScale.current = scale.value;
      scale.value = withTiming(Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value)), { duration: 200 });
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translationX.value = lastTrans.current.x + e.translationX;
      translationY.value = lastTrans.current.y + e.translationY;
    })
    .onEnd(() => {
      lastTrans.current = { x: translationX.value, y: translationY.value };
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedCanvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }));

  const handleZoom = useCallback(
    (to: number) => {
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, to));
      scale.value = withTiming(clamped, { duration: 300 });
      lastScale.current = clamped;
    },
    [scale]
  );

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Acesso Negado</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Você precisa estar logado para visualizar este Vision Board.
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface + '80' }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Colagem das suas manifestações
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => handleZoom(lastScale.current / 1.2)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
            >
              <MaterialIcons name="zoom-out" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleZoom(1);
                translationX.value = withTiming(0);
                translationY.value = withTiming(0);
                lastTrans.current = { x: 0, y: 0 };
              }}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
            >
              <MaterialIcons name="center-focus-strong" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleZoom(lastScale.current * 1.2)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
            >
              <MaterialIcons name="zoom-in" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas */}
        <View style={styles.canvasContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textMuted} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Carregando sua colagem...
              </Text>
            </View>
          ) : positionedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyContent, { backgroundColor: colors.surface + '60' }]}>
                <MaterialIcons name="visibility" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Vision Board Vazio</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Não há imagens para visualizar ainda. Adicione elementos ao seu Vision Board.
                </Text>
              </View>
            </View>
          ) : (
            <GestureDetector gesture={composed}>
              <Animated.View style={[styles.canvasScrollArea]}>
                <Animated.View
                  style={[
                    {
                      width: containerWidth,
                      height: totalHeight,
                    },
                    animatedCanvasStyle,
                  ]}
                >
                  {positionedItems.map((it) => (
                    <VisionImage key={it.id} item={it} colors={colors} />
                  ))}
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          )}
        </View>

        {positionedItems.length > 0 && (
          <View style={styles.inspirationContainer}>
            <Text style={[styles.inspirationText, { color: colors.textMuted }]}>
              ✨ Inspire-se. Visualize. Manifeste. ✨
            </Text>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerContent: { flex: 1, alignItems: 'center' },
  headerButtons: { flexDirection: 'row', gap: Spacing.xs },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  canvasContainer: { flex: 1, paddingHorizontal: 4, paddingVertical: 8 },
  canvasScrollArea: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  imageContainer: { position: 'absolute' },
  imageFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  image: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, marginTop: Spacing.lg, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginTop: Spacing.lg },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 24, fontWeight: '700', marginTop: Spacing.lg },
  errorText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  inspirationContainer: { padding: Spacing.lg, alignItems: 'center' },
  inspirationText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
});
