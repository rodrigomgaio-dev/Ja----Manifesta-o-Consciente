// app/vision-board-editor/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import GradientBackground from '@/components/ui/GradientBackground';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

// Sacred emojis for selection
const SACRED_EMOJIS = [
  '✨', '💫', '🌟', '⭐', '💖', '💜', '🤍', '💎',
  '🙏', '🕉️', '☯️', '🔮', '🕯️', '🪷', '🌸', '🌺',
  '🦋', '🕊️', '🌈', '☀️', '🌙', '🌊', '🌳', '🍃',
  '💰', '🏆', '👑', '🎯', '🎨', '📿', '🧘‍♀️', '🧘‍♂️'
];

interface DraggableItemProps {
  item: any;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  zIndex: number;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onUpdate,
  onDelete,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  zIndex,
}) => {
  const { colors } = useTheme();
  
  // Animated values
  const translateX = useSharedValue(item.position_x || 50);
  const translateY = useSharedValue(item.position_y || 50);
  const liftScale = useSharedValue(1);
  const itemScale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Item dimensions
  const itemWidth = useSharedValue(item.width || 120);
  const itemHeight = useSharedValue(item.height || 120);
  const aspectRatio = (item.width || 120) / (item.height || 120);

  // Initialize position and fade in
  useEffect(() => {
    translateX.value = item.position_x || 50;
    translateY.value = item.position_y || 50;
    itemWidth.value = item.width || 120;
    itemHeight.value = item.height || 120;
    
    // Fade in animation
    opacity.value = withTiming(1, { duration: 300 });
  }, [item.position_x, item.position_y, item.width, item.height]);

  // Pan gesture handler for dragging
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
      
      // Lift effect
      liftScale.value = withSpring(1.05);
      rotation.value = withSpring(2);
      
      // Select item
      runOnJS(onSelect)(item.id);
    },
    onActive: (event, context: any) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      // Constrain to canvas bounds
      const maxX = Math.max(0, Math.min(translateX.value, canvasWidth - itemWidth.value));
      const maxY = Math.max(0, Math.min(translateY.value, canvasHeight - itemHeight.value));
      translateX.value = maxX;
      translateY.value = maxY;
      
      // Drop effect
      liftScale.value = withSpring(1);
      rotation.value = withSpring(0);
      
      // Update position in database
      runOnJS(onUpdate)(item.id, {
        position_x: Number(translateX.value),
        position_y: Number(translateY.value),
      });
    },
  });

  // Pinch gesture handler for resizing (images only) - maintains aspect ratio
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startW = itemWidth.value;
      context.startH = itemHeight.value;
    },
    onActive: (event, context: any) => {
      if (item.type === 'image') {
        const scale = Math.max(0.5, Math.min(event.scale, 3));
        itemScale.value = scale;
        
        const newWidth = context.startW * scale;
        const newHeight = newWidth / aspectRatio; // Maintain aspect ratio
        
        // Limit size to reasonable bounds and canvas bounds
        const clampedW = Math.max(40, Math.min(newWidth, canvasWidth - translateX.value));
        const clampedH = Math.max(40, Math.min(newHeight, canvasHeight - translateY.value));
        
        itemWidth.value = clampedW;
        itemHeight.value = clampedH;
      }
    },
    onEnd: () => {
      if (item.type === 'image') {
        // Update size in database
        runOnJS(onUpdate)(item.id, {
          width: Number(itemWidth.value),
          height: Number(itemHeight.value),
        });
      }
      itemScale.value = 1;
    },
  });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: liftScale.value * itemScale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
      zIndex: zIndex,
      width: itemWidth.value,
      height: itemHeight.value,
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    return {
      borderWidth: isSelected ? 2 : 0,
      borderColor: colors.primary,
      borderRadius: 12,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <Animated.View style={animatedStyle}>
        {/* Delete button */}
        {isSelected && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}

        {/* Resize handles for images */}
        {isSelected && item.type === 'image' && (
          <>
            <View style={[styles.resizeHandle, styles.resizeHandleTopLeft, { backgroundColor: colors.primary }]} />
            <View style={[styles.resizeHandle, styles.resizeHandleTopRight, { backgroundColor: colors.primary }]} />
            <View style={[styles.resizeHandle, styles.resizeHandleBottomLeft, { backgroundColor: colors.primary }]} />
            <View style={[styles.resizeHandle, styles.resizeHandleBottomRight, { backgroundColor: colors.primary }]} />
          </>
        )}

        {/* Item content */}
        {item.type === 'image' ? (
          <PinchGestureHandler onGestureEvent={pinchGestureHandler} enabled={item.type === 'image'}>
            <Animated.View style={[{ flex: 1 }, borderStyle]}>
              <Animated.View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                <Image 
                  source={{ uri: item.content }} 
                  style={styles.itemContent}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </Animated.View>
            </Animated.View>
          </PinchGestureHandler>
        ) : item.type === 'text' ? (
          <Animated.View style={[{ flex: 1 }, borderStyle]}>
            <Animated.View style={[styles.textItemContainer, { backgroundColor: colors.primary + 'DD' }]}>
              <Text style={[styles.textItemContent, { color: 'white' }]} numberOfLines={3}>
                {item.content}
              </Text>
            </Animated.View>
          </Animated.View>
        ) : item.type === 'emoji' ? (
          <Animated.View style={[{ flex: 1 }, borderStyle]}>
            <Animated.View style={[styles.emojiItemContainer, { backgroundColor: colors.surface + 'BB' }]}>
              <Text style={styles.emojiItemContent}>{item.content}</Text>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default function VisionBoardEditorScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const { items, loading, addItem, updateItem, deleteItem, refresh } = useVisionBoardItems(cocreationId || '');

  // Canvas dimensions - fits within screen
  const canvasWidth = screenWidth * 0.95;
  const canvasHeight = screenHeight * 0.7;

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemZIndices, setItemZIndices] = useState<{ [key: string]: number }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });
  const [visionBoardSaved, setVisionBoardSaved] = useState(false);

  // Zoom controls
  const zoom = useSharedValue(1);
  const canvasTranslateX = useSharedValue(0);
  const canvasTranslateY = useSharedValue(0);

  // Initialize z-indices
  useEffect(() => {
    const newZIndices: { [key: string]: number } = {};
    items.forEach((item, index) => {
      newZIndices[item.id] = index + 1;
    });
    setItemZIndices(newZIndices);
    
    // Se já tem itens, considera como salvo
    if (items.length > 0) {
      setVisionBoardSaved(true);
    }
  }, [items]);

  const showModal = useCallback((
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: any[]
  ) => {
    setModalConfig({ title, message, type, buttons });
    setModalVisible(true);
  }, []);

  // Find empty position with collision detection
  const findEmptyPosition = useCallback((itemWidth: number, itemHeight: number) => {
    const margin = 20;
    const maxAttempts = 50;
    const visibleWidth = canvasWidth - 40;
    const visibleHeight = canvasHeight - 40;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = margin + Math.random() * (visibleWidth - itemWidth - margin * 2);
      const y = margin + Math.random() * (visibleHeight - itemHeight - margin * 2);
      
      // Check collision with existing items
      const hasCollision = items.some(existingItem => {
        const exX = existingItem.position_x || 0;
        const exY = existingItem.position_y || 0;
        const exW = existingItem.width || 120;
        const exH = existingItem.height || 120;
        
        return !(x > exX + exW + 15 || 
                 x + itemWidth + 15 < exX || 
                 y > exY + exH + 15 || 
                 y + itemHeight + 15 < exY);
      });
      
      if (!hasCollision) {
        return { x, y };
      }
    }
    
    // Fallback: random position
    return {
      x: margin + Math.random() * (visibleWidth - itemWidth - margin * 2),
      y: margin + Math.random() * (visibleHeight - itemHeight - margin * 2),
    };
  }, [items, canvasWidth, canvasHeight]);

  const handleAddImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showModal('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const itemSize = Math.min(screenWidth * 0.35, 150);
        const position = findEmptyPosition(itemSize, itemSize);
        
        const newItem = {
          type: 'image' as const,
          content: result.assets[0].uri,
          description: 'Imagem do Vision Board',
          position_x: position.x,
          position_y: position.y,
          width: itemSize,
          height: itemSize,
        };

        console.log("[VisionBoardEditor] Preparando para chamar addItem com:", newItem);
        
        const response = await addItem(newItem);
        if (response.error) {
          console.error("[VisionBoardEditor] Erro do Supabase:", response.error);
          showModal('Erro', 'Não foi possível adicionar a imagem.', 'error');
        } else {
          console.log('[VisionBoardEditor] Imagem adicionada com sucesso!');
          
          // Set z-index for new item
          const maxZ = Math.max(...Object.values(itemZIndices), 0);
          setItemZIndices(prev => ({ ...prev, [response.data.id]: maxZ + 1 }));
        }
      } catch (error) {
        console.error('Error adding image:', error);
        showModal('Erro', 'Algo deu errado ao adicionar a imagem.', 'error');
      }
    }
    setShowAddModal(false);
  }, [findEmptyPosition, addItem, showModal, screenWidth, itemZIndices]);

  const handleAddText = useCallback(async () => {
    if (!textInput.trim()) {
      showModal('Erro', 'Por favor, digite um texto.', 'error');
      return;
    }

    try {
      const itemWidth = Math.min(screenWidth * 0.45, 180);
      const itemHeight = Math.min(screenWidth * 0.25, 100);
      const position = findEmptyPosition(itemWidth, itemHeight);
      
      const newItem = {
        type: 'text' as const,
        content: textInput.trim(),
        description: 'Texto personalizado',
        position_x: position.x,
        position_y: position.y,
        width: itemWidth,
        height: itemHeight,
      };

      console.log("Tentando adicionar texto:", newItem);
      
      const response = await addItem(newItem);
      if (response.error) {
        console.error('Error adding text:', response.error);
        showModal('Erro', 'Não foi possível adicionar o texto.', 'error');
      } else {
        setTextInput('');
        setShowTextModal(false);
        
        // Set z-index for new item
        const maxZ = Math.max(...Object.values(itemZIndices), 0);
        setItemZIndices(prev => ({ ...prev, [response.data.id]: maxZ + 1 }));
      }
    } catch (error) {
      console.error('Error adding text:', error);
      showModal('Erro', 'Algo deu errado ao adicionar o texto.', 'error');
    }
  }, [textInput, findEmptyPosition, addItem, showModal, screenWidth, itemZIndices]);

  const handleAddEmoji = useCallback(async (emoji: string) => {
    try {
      const itemSize = Math.min(screenWidth * 0.2, 80);
      const position = findEmptyPosition(itemSize, itemSize);
      
      const newItem = {
        type: 'emoji' as const,
        content: emoji,
        description: 'Símbolo sagrado',
        position_x: position.x,
        position_y: position.y,
        width: itemSize,
        height: itemSize,
      };

      console.log("Adicionando emoji:", newItem);
      
      const response = await addItem(newItem);
      if (response.error) {
        console.error('Error adding emoji:', response.error);
        showModal('Erro', 'Não foi possível adicionar o emoji.', 'error');
      } else {
        setShowEmojiModal(false);
        
        // Set z-index for new item
        const maxZ = Math.max(...Object.values(itemZIndices), 0);
        setItemZIndices(prev => ({ ...prev, [response.data.id]: maxZ + 1 }));
      }
    } catch (error) {
      console.error('Error adding emoji:', error);
      showModal('Erro', 'Algo deu errado ao adicionar o emoji.', 'error');
    }
  }, [findEmptyPosition, addItem, showModal, screenWidth, itemZIndices]);

  const handleUpdateItem = useCallback(async (id: string, updates: any) => {
    try {
      console.log(`Atualizando item ${id} com:`, updates);
      
      const response = await updateItem(id, updates);
      if (response.error) {
        console.error('Error updating item:', response.error);
        showModal('Erro', 'Não foi possível atualizar o item.', 'error');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showModal('Erro', 'Algo deu errado ao atualizar o item.', 'error');
    }
  }, [updateItem, showModal]);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      console.log(`Excluindo item ${id}`);
      
      const response = await deleteItem(id);
      if (response.error) {
        console.error('Error deleting item:', response.error);
        showModal('Erro', 'Não foi possível excluir o item.', 'error');
      } else {
        setSelectedItemId(null);
        
        // Remove from z-indices
        setItemZIndices(prev => {
          const newZIndices = { ...prev };
          delete newZIndices[id];
          return newZIndices;
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showModal('Erro', 'Algo deu errado ao excluir o item.', 'error');
    }
  }, [deleteItem, showModal]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(prev => prev === id ? null : id);
    
    // Bring to front
    const maxZ = Math.max(...Object.values(itemZIndices), 0);
    setItemZIndices(prev => ({ ...prev, [id]: maxZ + 1 }));
  }, [itemZIndices]);

  const canvasAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: canvasTranslateX.value },
        { translateY: canvasTranslateY.value },
        { scale: zoom.value },
      ],
    };
  });

  const handleComplete = useCallback(() => {
    if (items.length === 0) {
      showModal(
        'Vision Board Vazio',
        'Adicione pelo menos um elemento ao seu Vision Board antes de concluir.',
        'warning'
      );
      return;
    }

    setModalVisible(false);
    setVisionBoardSaved(true);
    
    setTimeout(() => {
      showModal(
        'Vision Board Finalizado!',
        'Utilize-o para visualizar durante suas práticas e sentir que JÁ É.',
        'success'
      );
      
      setTimeout(() => {
        router.push(`/cocriacao-details?id=${cocreationId}`);
      }, 1500);
    }, 300);
  }, [items, showModal, cocreationId]);

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Acesso Negado
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/cocriacao-details?id=${cocreationId}`)}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Manifeste conscientemente
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.primary }]}
              onPress={handleComplete}
            >
              <MaterialIcons name="check" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Canvas Container */}
          <View style={styles.canvasWrapper}>
            <ScrollView
              style={styles.canvasScrollView}
              contentContainerStyle={{
                width: canvasWidth,
                height: canvasHeight,
              }}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              maximumZoomScale={2}
              minimumZoomScale={0.5}
              bounces={false}
            >
              <Animated.View 
                style={[
                  styles.canvas, 
                  { 
                    backgroundColor: colors.surface + '15',
                    width: canvasWidth,
                    height: canvasHeight,
                  },
                  canvasAnimatedStyle
                ]}
              >
                {/* Background grid */}
                <View style={styles.gridPattern}>
                  {Array.from({ length: Math.ceil(canvasHeight / 40) }).map((_, row) => (
                    <View key={`row-${row}`} style={styles.gridRow}>
                      {Array.from({ length: Math.ceil(canvasWidth / 40) }).map((_, col) => (
                        <View 
                          key={`dot-${row}-${col}`} 
                          style={[styles.gridDot, { backgroundColor: colors.border + '25' }]} 
                        />
                      ))}
                    </View>
                  ))}
                </View>

                {/* Vision Board Items */}
                {items.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    isSelected={selectedItemId === item.id}
                    onSelect={handleSelectItem}
                    zIndex={itemZIndices[item.id] || 1}
                  />
                ))}

                {/* Empty state */}
                {items.length === 0 && (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyStateContent, { backgroundColor: colors.surface + '80' }]}>
                      <MaterialIcons name="auto-awesome" size={48} color={colors.textMuted} />
                      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                        Canvas Sagrado
                      </Text>
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                        Comece a criar sua manifestação{'\n'}
                        Toque nos botões para adicionar elementos
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </View>

          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialIcons name="add-photo-alternate" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowTextModal(true)}
            >
              <MaterialIcons name="text-fields" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowEmojiModal(true)}
            >
              <MaterialIcons name="emoji-emotions" size={24} color="white" />
            </TouchableOpacity>


          </View>

          {/* Add Element Modal */}
          <Modal visible={showAddModal} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Adicionar Elemento
                    </Text>
                    
                    <View style={styles.modalBody}>
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => handleAddImage()}
                      >
                        <MaterialIcons name="image" size={24} color={colors.primary} />
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          Imagem
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => setShowTextModal(true)}
                      >
                        <MaterialIcons name="text-fields" size={24} color={colors.secondary} />
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          Texto
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => setShowEmojiModal(true)}
                      >
                        <MaterialIcons name="sentiment-satisfied" size={24} color={colors.accent} />
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          Emoji
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => {
                          showModal('Em breve', 'Funcionalidade de Sticker estará disponível em breve.', 'info');
                          setShowAddModal(false);
                        }}
                      >
                        <MaterialIcons name="auto-awesome" size={24} color={colors.accent} />
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          Sticker
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.closeModalButton, { backgroundColor: colors.textMuted }]}
                      onPress={() => setShowAddModal(false)}
                    >
                      <Text style={styles.modalButtonText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Text Input Modal */}
          <Modal visible={showTextModal} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowTextModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={[styles.textModalContent, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Texto Sagrado
                    </Text>
                    
                    <TextInput
                      style={[
                        styles.textInput, 
                        { 
                          backgroundColor: colors.background, 
                          color: colors.text,
                          borderColor: colors.border
                        }
                      ]}
                      value={textInput}
                      onChangeText={setTextInput}
                      placeholder="Digite sua intenção, sonho ou afirmação..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={4}
                      autoFocus
                      maxLength={100}
                    />
                    
                    <Text style={[styles.charCount, { color: colors.textMuted }]}>
                      {textInput.length}/100 caracteres
                    </Text>
                    
                    <View style={styles.textModalActions}>
                      <TouchableOpacity
                        style={[styles.textModalButton, { backgroundColor: colors.textMuted }]}
                        onPress={() => {
                          setTextInput('');
                          setShowTextModal(false);
                        }}
                      >
                        <Text style={styles.textModalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.textModalButton, 
                          { backgroundColor: textInput.trim() ? colors.primary : colors.textMuted }
                        ]}
                        onPress={handleAddText}
                        disabled={!textInput.trim()}
                      >
                        <Text style={styles.textModalButtonText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Emoji Selection Modal */}
          <Modal visible={showEmojiModal} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={() => setShowEmojiModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={[styles.emojiModalContent, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Símbolos Sagrados
                    </Text>
                    
                    <ScrollView style={styles.emojiScrollView}>
                      <View style={styles.emojiGrid}>
                        {SACRED_EMOJIS.map((emoji, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.emojiButton, { backgroundColor: colors.background }]}
                            onPress={() => handleAddEmoji(emoji)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.emojiButtonText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    
                    <TouchableOpacity
                      style={[styles.closeModalButton, { backgroundColor: colors.textMuted }]}
                      onPress={() => setShowEmojiModal(false)}
                    >
                      <Text style={styles.modalButtonText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Sacred Modal */}
          <SacredModal
            visible={modalVisible}
            title={modalConfig.title}
            message={modalConfig.message}
            type={modalConfig.type}
            buttons={modalConfig.buttons}
            onClose={() => setModalVisible(false)}
          />
        </View>
      </GradientBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 1000,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  headerActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  
  // Canvas Container
  canvasWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  canvasScrollView: {
    flex: 1,
    borderRadius: 16,
  },
  canvas: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
  },
  
  // Background grid
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  gridDot: {
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
  },
  
  // Vision Board Items
  deleteButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  resizeHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1000,
  },
  resizeHandleTopLeft: { top: -6, left: -6 },
  resizeHandleTopRight: { top: -6, right: -6 },
  resizeHandleBottomLeft: { bottom: -6, left: -6 },
  resizeHandleBottomRight: { bottom: -6, right: -6 },
  itemContent: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  textItemContainer: {
    flex: 1,
    borderRadius: 12,
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textItemContent: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  emojiItemContainer: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiItemContent: {
    fontSize: 32,
  },
  
  // Empty State
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -140 }, { translateY: -80 }],
  },
  emptyStateContent: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    width: 280,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Floating Actions
  floatingActions: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    zIndex: 100,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  
  // Modals - Geral
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.xl,
    borderRadius: 24,
  },
  textModalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: Spacing.lg,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalCloseButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: Spacing.lg,
  },
  
  // Text Modal
  textInput: {
    borderRadius: 16,
    padding: Spacing.lg,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  textModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  textModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  textModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Emoji Modal
  emojiModalContent: {
    width: '95%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: Spacing.lg,
    borderRadius: 24,
  },
  emojiScrollView: {
    maxHeight: 350,
    marginBottom: Spacing.lg,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emojiButtonText: {
    fontSize: 28,
  },
  closeModalButton: {
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
