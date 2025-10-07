import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
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

interface PositionedImage {
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
  
  const { items, loading } = useVisionBoard(cocreationId || '');

  // Available area for positioning (considering safe areas and header)
  const availableWidth = screenWidth - 40; // 20px padding on each side
  const availableHeight = screenHeight - insets.top - insets.bottom - 120; // Account for header and padding
  const headerHeight = 80;

  const [positionedImages, setPositionedImages] = useState<PositionedImage[]>([]);

  // Filter only images from vision board items
  const imageItems = useMemo(() => {
    return items.filter(item => item.type === 'image' && item.content);
  }, [items]);

  // Function to check if two rectangles overlap
  const rectanglesOverlap = useCallback((
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
    margin: number = 20
  ): boolean => {
    return !(
      rect1.x + rect1.width + margin < rect2.x ||
      rect2.x + rect2.width + margin < rect1.x ||
      rect1.y + rect1.height + margin < rect2.y ||
      rect2.y + rect2.height + margin < rect1.y
    );
  }, []);

  // Function to generate random position with collision detection
  const generateRandomPosition = useCallback((
    imageWidth: number, 
    imageHeight: number, 
    existingPositions: Array<{ x: number; y: number; width: number; height: number }>
  ): { x: number; y: number } => {
    const maxAttempts = 50;
    const margin = 15;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * (availableWidth - imageWidth - margin * 2) + margin;
      const y = Math.random() * (availableHeight - imageHeight - margin * 2) + margin + headerHeight;

      const newRect = { x, y, width: imageWidth, height: imageHeight };
      
      // Check collision with existing positions
      const hasCollision = existingPositions.some(existingRect => 
        rectanglesOverlap(newRect, existingRect, margin)
      );

      if (!hasCollision) {
        return { x, y };
      }
    }

    // If all attempts failed, return a random position (fallback)
    return {
      x: Math.random() * (availableWidth - imageWidth - margin * 2) + margin,
      y: Math.random() * (availableHeight - imageHeight - margin * 2) + margin + headerHeight,
    };
  }, [availableWidth, availableHeight, headerHeight, rectanglesOverlap]);

  // Function to calculate random positions for all images
  const calculateRandomPositions = useCallback(() => {
    if (imageItems.length === 0) {
      setPositionedImages([]);
      return;
    }

    const positioned: PositionedImage[] = [];
    const existingPositions: Array<{ x: number; y: number; width: number; height: number }> = [];

    imageItems.forEach((item, index) => {
      // Use responsive sizing for images
      const baseSize = Math.min(screenWidth * 0.25, screenHeight * 0.15, 140);
      const minSize = Math.min(screenWidth * 0.2, screenHeight * 0.12, 100);
      
      // Add some variation to image sizes (80% to 120% of base size)
      const sizeVariation = 0.8 + Math.random() * 0.4;
      const finalSize = Math.max(minSize, baseSize * sizeVariation);
      
      const imageWidth = item.width ? Math.min(item.width, finalSize) : finalSize;
      const imageHeight = item.height ? Math.min(item.height, finalSize) : finalSize;

      const position = generateRandomPosition(imageWidth, imageHeight, existingPositions);

      const positionedImage: PositionedImage = {
        id: item.id,
        content: item.content,
        width: imageWidth,
        height: imageHeight,
        x: position.x,
        y: position.y,
        animationDelay: index * 150, // Stagger animation by 150ms per image
      };

      positioned.push(positionedImage);
      existingPositions.push({
        x: position.x,
        y: position.y,
        width: imageWidth,
        height: imageHeight,
      });
    });

    setPositionedImages(positioned);
  }, [imageItems, screenWidth, screenHeight, generateRandomPosition]);

  // Recalculate positions when screen gains focus or when items change
  useFocusEffect(
    useCallback(() => {
      if (imageItems.length > 0) {
        // Small delay to ensure screen is fully focused
        const timer = setTimeout(calculateRandomPositions, 100);
        return () => clearTimeout(timer);
      }
    }, [imageItems, calculateRandomPositions])
  );

  // Initial calculation when items are first loaded
  useEffect(() => {
    if (imageItems.length > 0) {
      calculateRandomPositions();
    }
  }, [imageItems, calculateRandomPositions]);

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

          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.push(`/vision-board?cocreationId=${cocreationId}`)}
              style={[styles.editButton, { backgroundColor: colors.secondary + '20' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={20} color={colors.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={calculateRandomPositions}
              style={[styles.shuffleButton, { backgroundColor: colors.primary + '20' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shuffle" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vision Board Canvas */}
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
            <View style={styles.canvas}>
              {/* Ambient background pattern */}
              <View style={styles.ambientPattern}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.ambientDot,
                      {
                        backgroundColor: colors.primary + '15',
                        left: `${Math.random() * 90 + 5}%`,
                        top: `${Math.random() * 90 + 5}%`,
                      }
                    ]}
                  />
                ))}
              </View>

              {/* Vision Board Images */}
              {positionedImages.map((image) => (
                <AnimatedVisionImage
                  key={`${image.id}-${image.x}-${image.y}`} // Key includes position to trigger re-render
                  image={image}
                  colors={colors}
                />
              ))}
            </View>
          )}
        </View>

        {/* Inspiration Text */}
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

// Separate component for animated vision board images
const AnimatedVisionImage: React.FC<{
  image: PositionedImage;
  colors: any;
}> = ({ image, colors }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animation
    opacity.value = withDelay(
      image.animationDelay,
      withTiming(1, { duration: 800 })
    );
    scale.value = withDelay(
      image.animationDelay,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    translateY.value = withDelay(
      image.animationDelay,
      withSpring(0, { damping: 10, stiffness: 80 })
    );
  }, [image.animationDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.imageContainer,
        {
          left: image.x,
          top: image.y,
          width: image.width,
          height: image.height,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.imageFrame, { backgroundColor: colors.surface + '40' }]}>
        <Image
          source={{ uri: image.content }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
        
        {/* Subtle glow effect */}
        <View style={[styles.imageGlow, { backgroundColor: colors.primary + '20' }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    height: 80,
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
    gap: Spacing.sm,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  shuffleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Canvas Container
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
  
  // Ambient Pattern
  ambientPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  ambientDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  
  // Images
  imageContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  imageFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    zIndex: -1,
  },
  
  // States
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
  
  // Inspiration
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