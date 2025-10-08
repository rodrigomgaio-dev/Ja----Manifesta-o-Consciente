// app/vision-board-editor/components/EditorElement.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { BoardElement } from '../types/boardTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditorElementProps {
  element: BoardElement;
  isSelected: boolean;
  onSelect: () => void;
  onTransform: (transforms: Partial<Pick<BoardElement, 'position_x' | 'position_y' | 'width' | 'height' | 'rotation'>>) => void;
  onDelete: () => void;
}

const EditorElement: React.FC<EditorElementProps> = ({
  element,
  isSelected,
  onSelect,
  onTransform,
  onDelete,
}) => {
  // Valores compartilhados para animações e gestos
  const translateX = useSharedValue(element.x);
  const translateY = useSharedValue(element.y);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(element.rotation || 0);
  const width = useSharedValue(element.width);
  const height = useSharedValue(element.height);

  // Estado para contexto do gesto
  const context = useSharedValue({ x: 0, y: 0 });
  const resizeContext = useSharedValue({ width: 0, height: 0, x: 0, y: 0 });

  // Atualizar valores compartilhados quando o elemento mudar (externamente)
  useAnimatedReaction(
    () => ({
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      width: element.width,
      height: element.height,
    }),
    (current, previous) => {
      if (previous === null) return;
      if (current.x !== previous.x) translateX.value = current.x;
      if (current.y !== previous.y) translateY.value = current.y;
      if (current.rotation !== previous.rotation) rotate.value = current.rotation;
      if (current.width !== previous.width) width.value = current.width;
      if (current.height !== previous.height) height.value = current.height;
    }
  );

  // Estilo animado principal
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}rad` },
        { scale: scale.value },
      ],
      width: width.value,
      height: height.value,
      zindex: element.zindex || 0,
    };
  });

  // Estilo para o handle de redimensionamento
  const resizeHandleStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: 20,
      height: 20,
      backgroundColor: '#007AFF',
      borderRadius: 10,
      bottom: -10,
      right: -10,
      zindex: 1000,
    };
  });

  // --- Gestos ---

  // 1. Gesto de Arrasto (Pan)
  const dragGesture = Gesture.Pan()
    .enabled(isSelected)
    .onBegin(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX;
      translateY.value = context.value.y + event.translationY;
    })
    .onEnd(() => {
      // Aplicar mola ao soltar
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
      
      // Atualizar estado no componente pai
      runOnJS(onTransform)({
        x: translateX.value,
        y: translateY.value,
      });
    });

  // 2. Gesto de Redimensionamento (Pan no handle)
  const resizeGesture = Gesture.Pan()
    .enabled(isSelected)
    .onBegin(() => {
      resizeContext.value = {
        width: width.value,
        height: height.value,
        x: translateX.value,
        y: translateY.value,
      };
    })
    .onUpdate((event) => {
      // Calcular novo tamanho com limite mínimo
      const newWidth = Math.max(50, resizeContext.value.width + event.translationX);
      const newHeight = Math.max(50, resizeContext.value.height + event.translationY);
      
      width.value = newWidth;
      height.value = newHeight;
    })
    .onEnd(() => {
      // Aplicar mola
      width.value = withSpring(width.value);
      height.value = withSpring(height.value);
      
      // Atualizar estado no componente pai
      runOnJS(onTransform)({
        width: width.value,
        height: height.value,
      });
    });

  // 3. Gesto de Rotação (Rotation)
  const rotateGesture = Gesture.Rotation()
    .enabled(isSelected)
    .onUpdate((event) => {
      rotate.value = (element.rotation || 0) + event.rotation;
    })
    .onEnd(() => {
      // Aplicar mola
      rotate.value = withSpring(rotate.value);
      
      // Atualizar estado no componente pai
      runOnJS(onTransform)({
        rotation: rotate.value,
      });
    });

  // 4. Gesto de Pinça (Pinch) para Escala
  const pinchGesture = Gesture.Pinch()
    .enabled(isSelected)
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      // Aplicar mola
      scale.value = withSpring(1);
    });

  // Combinar gestos simultâneos
  const gesture = Gesture.Simultaneous(
    dragGesture,
    rotateGesture,
    pinchGesture
  );

  // --- Renderização ---

  const renderContent = () => {
    switch (element.type) {
      case 'image':
        return (
          <Image
            source={{ uri: element.uri }}
            style={styles.image}
            contentFit="cover"
          />
        );
      case 'text':
        return (
          <View style={styles.textContainer}>
            <Text style={[styles.text, { fontSize: element.fontSize, color: element.color }]}>
              {element.content}
            </Text>
          </View>
        );
      case 'emoji':
        return (
          <View style={styles.emojiContainer}>
            <Text style={[styles.emoji, { fontSize: element.fontSize }]}>
              {element.char}
            </Text>
          </View>
        );
      case 'sticker':
        return (
          <Image
            source={{ uri: element.uri }}
            style={styles.sticker}
            contentFit="contain"
          />
        );
      default:
        return null;
    }
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.container, animatedStyle, { left: element.x, top: element.y }]}
        onTouchStart={(e) => {
          e.stopPropagation(); // Impedir que o evento chegue ao ScrollView
          onSelect();
        }}
      >
        {renderContent()}
        {isSelected && (
          <>
            {/* Borda de seleção */}
            <View style={styles.selectionBorder} pointerEvents="none" />
            
            {/* Handle de redimensionamento */}
            <GestureDetector gesture={resizeGesture}>
              <Animated.View style={resizeHandleStyle} />
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emojiContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  sticker: {
    width: '100%',
    height: '100%',
  },
  selectionBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    pointerEvents: 'none', // Ignorar toques na borda
  },
});

export default EditorElement;
