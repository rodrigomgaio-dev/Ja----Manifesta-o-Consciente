/* VisionBoardViewScreen.tsx
   Reescrito: justified layout + pinch/pan + performance improvements
   Requisitos: react-native-gesture-handler v2+, react-native-reanimated v2+, expo-image
*/

import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
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
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

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
  animationDelay: number;
}

/**
 * Justified layout algorithm:
 * Recebe lista de imagens com aspect ratios, largura do container e targetRowHeight.
 * Retorna PositionedItem[] e totalHeight
 */
function computeJustifiedLayout(
  images: { id: string; uri: string; width?: number; height?: number }[],
  containerWidth: number,
  targetRowHeight = 200,
  spacing = 8,
  padding = 12
) {
  if (!images || images.length === 0) return { items: [], totalHeight: 0 };

  const rows: {
    items: { id: string; uri: string; aspect: number }[];
    aspectSum: number;
  }[] = [];

  let currentRow: { items: { id: string; uri: string; aspect: number }[]; aspectSum: number } = {
    items: [],
    aspectSum: 0,
  };

  // Convert to aspect ratios (fallback to 1 if missing)
  const imgs = images.map((img) => {
    const w = img.width || 1;
    const h = img.height || 1;
    const aspect = Math.max(0.2, Math.min(5, w / h)); // clamp
    return { id: img.id, uri: img.uri, aspect };
  });

  const effectiveWidth = Math.max(100, containerWidth - padding * 2);

  for (const img of imgs) {
    currentRow.items.push(img);
    currentRow.aspectSum += img.aspect;

    // Calculate approximate row height if we include this item
    const rowHeight = (effectiveWidth - (currentRow.items.length - 1) * spacing) / currentRow.aspectSum;

    // If rowHeight is near target or smaller (images would be too tall otherwise), finalize row
    if (rowHeight < targetRowHeight * 1.25) {
      rows.push(currentRow);
      currentRow = { items: [], aspectSum: 0 };
    }
  }
  // push remainder
  if (currentRow.items.length > 0) rows.push(currentRow);

  // Now compute positions & sizes
  const items: PositionedItem[] = [];
  let cursorY = padding;
  let idx = 0;

  for (const row of rows) {
    const rowItemCount = row.items.length;
    const aspectSum = row.aspectSum;
    const rowHeight = Math.max(60, Math.min(targetRowHeight * 1.15, (effectiveWidth - (rowItemCount - 1) * spacing) / aspectSum));
    let cursorX = padding;

    for (const rItem of row.items) {
      const w = Math.round(rowHeight * rItem.aspect);
      const h = Math.round(rowHeight);

      items.push({
        id: rItem.id,
        uri: rItem.uri,
        width: w,
        height: h,
        x: cursorX,
        y: cursorY,
        animationDelay: idx * 60,
      });

      cursorX += w + spacing;
      idx++;
    }

    cursorY += rowHeight + spacing;
  }

  const totalHeight = cursorY + padding - spacing; // remove last spacing
  return { items, totalHeight };
}

/** Memoized image component to avoid re-renders */
const VisionImage = React.memo(function VisionImage({
  item,
  colors,
  onLoad,
}: {
  item: PositionedItem;
  colors: any;
  onLoad?: () => void;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.98);

  useEffect(() => {
    opacity.value = withDelay(item.animationDelay, withTiming(1, { duration: 450 }));
    scale.value = withDelay(item.animationDelay, withSpring(1, { damping: 12, stiffness: 120 }));
  }, [item.animationDelay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
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
      pointerEvents="box-none"
    >
      <View style={[styles.imageFrame, { backgroundColor: colors.surface + '40' }]}>
        <Image
          source={{ uri: item.uri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onLoad={() => onLoad && onLoad()}
          accessibilityLabel="vision-image"
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

  // Hook para buscar os itens do VisionBoard
  const { items: rawItems, loading } = useVisionBoard(cocreationId || '');

  const imageItemsRaw = useMemo(() => {
    return rawItems
      .filter((it) => it.type === 'image' && it.content)
      .map((it) => ({
        id: it.id,
        uri: it.content,
        width: it.width || undefined,
        height: it.height || undefined,
      }));
  }, [rawItems]);

  // Layout: compute justified layout for container width (use screen width; for web/landscape we can increase)
  const containerWidth = Math.max(300, screenWidth); // can tweak
  const targetRowHeight = Math.round(screenHeight * 0.22); // adaptive row height

  const { items: positionedItems, totalHeight } = useMemo(() => {
    const { items, totalHeight } = computeJustifiedLayout(
      imageItemsRaw,
      containerWidth,
      targetRowHeight,
      8,
      12
    );
    return { items, totalHeight };
  }, [imageItemsRaw, containerWidth, targetRowHeight]);

  // PINCH & PAN state (Reanimated shared values)
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const lastScale = useRef(1);
  const lastTrans = useRef({ x: 0, y: 0 });

  // Limit zoom
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 3;

  // Gesture: pinch + pan
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = lastScale.current * e.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      lastScale.current = scale.value;
      // small bounce to limits
      scale.value = withTiming(Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value)), { duration: 200 });
      lastScale.current = scale.value;
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      // no-op
    })
    .onUpdate((e) => {
      translationX.value = lastTrans.current.x + e.translationX;
      translationY.value = lastTrans.current.y + e.translationY;
    })
    .onEnd(() => {
      lastTrans.current = { x: translationX.value, y: translationY.value };
      // optional: add boundaries logic here to avoid panning too far
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedCanvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }));

  // zoom controls (header buttons)
  const handleZoom = useCallback((to: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, to));
    scale.value = withTiming(clamped, { duration: 350 });
    lastScale.current = clamped;
  }, []);

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
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Contemple suas manifestações
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => handleZoom(lastScale.current / 1.2)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="zoom-out" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleZoom(1);
                translationX.value = withTiming(0, { duration: 250 });
                translationY.value = withTiming(0, { duration: 250 });
                lastTrans.current = { x: 0, y: 0 };
              }}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="center-focus-strong" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleZoom(lastScale.current * 1.2)}
              style={[styles.zoomButton, { backgroundColor: colors.surface + '80' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="zoom-in" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas area */}
        <View style={styles.canvasContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textMuted} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando sua manifestação...</Text>
            </View>
          ) : positionedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyContent, { backgroundColor: colors.surface + '60' }]}>
                <MaterialIcons name="visibility" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Vision Board Vazio</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Não há imagens para visualizar ainda.{'\n'}Adicione elementos ao seu Vision Board primeiro.
                </Text>
              </View>
            </View>
          ) : (
            // GestureDetector ao redor do canvas para pinch+pan
            <GestureDetector gesture={composed}>
              <Animated.View style={[styles.canvasScrollArea]}>
                {/* container that will be zoomed/panned */}
                <Animated.View
                  style={[
                    {
                      width: containerWidth,
                      height: totalHeight,
                    },
                    animatedCanvasStyle,
                  ]}
                >
                  {/* Background optional */}
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} />

                  {positionedItems.map((it) => (
                    <VisionImage key={it.id} item={it} colors={colors} />
                  ))}
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          )}
        </View>

        {/* Inspiração */}
        {positionedItems.length > 0 && (
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
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  canvasScrollArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  imageContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  imageFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 0,
  },
  image: {
    width: '100%',
    height: '100%',
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
    maxWidth: 420,
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
