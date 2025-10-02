import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  Platform,
  useWindowDimensions,
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
  interpolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import GradientBackground from '@/components/ui/GradientBackground';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoard } from '@/hooks/useVisionBoard';
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
  const scale = useSharedValue(1);
  const itemScale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Item dimensions
  const itemWidth = useSharedValue(item.width || 120);
  const itemHeight = useSharedValue(item.height || 120);

  // Initialize position and fade in
  useEffect(() => {
    translateX.value = item.position_x || 50;
    translateY.value = item.position_y || 50;
    itemWidth.value = item.width || 120;
    itemHeight.value = item.height || 120;
    
    // Fade in animation
    opacity.value = withTiming(1, { duration: 300 });
  }, [item.position_x, item.position_y, item.width, item.height]);

  // Pan gesture handler
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
      
      // Lift effect
      scale.value = withSpring(1.05);
      rotation.value = withSpring(2);
      
      // Select item
      runOnJS(onSelect)(item.id);
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      // Constrain to canvas bounds
      translateX.value = Math.max(0, Math.min(translateX.value, canvasWidth - itemWidth.value));
      translateY.value = Math.max(0, Math.min(translateY.value, canvasHeight - itemHeight.value));
      
      // Drop effect
      scale.value = withSpring(1);
      rotation.value = withSpring(0);
      
      // Update position in database
      runOnJS(onUpdate)(item.id, {
        position_x: translateX.value,
        position_y: translateY.value,
      });
    },
  });

  // Pinch gesture handler for resizing (images only)
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      itemScale.value = 1;
    },
    onActive: (event) => {
      if (item.type === 'image') {
        const newScale = Math.max(0.5, Math.min(event.scale, 3));
        itemScale.value = newScale;
        
        const newWidth = (item.width || 120) * newScale;
        const newHeight = (item.height || 120) * newScale;
        
        itemWidth.value = newWidth;
        itemHeight.value = newHeight;
      }
    },
    onEnd: () => {
      if (item.type === 'image') {
        // Update size in database
        runOnJS(onUpdate)(item.id, {
          width: itemWidth.value,
          height: itemHeight.value,
        });
      }
      itemScale.value = 1;
    },
  });

  // Tap gesture handler
  const tapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      runOnJS(onSelect)(item.id);
    },
  });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
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
        <PinchGestureHandler onGestureEvent={pinchGestureHandler} enabled={item.type === 'image'}>
          <Animated.View style={[{ flex: 1 }, borderStyle]}>
            <TapGestureHandler onGestureEvent={tapGestureHandler}>
              <Animated.View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
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
                {item.type === 'image' && (
                  <Image 
                    source={{ uri: item.content }} 
                    style={styles.itemContent}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                )}
                
                {item.type === 'text' && (
                  <View style={[styles.textItemContainer, { backgroundColor: colors.primary + 'DD' }]}>
                    <Text style={[styles.textItemContent, { color: 'white' }]} numberOfLines={3}>
                      {item.content}
                    </Text>
                  </View>
                )}
                
                {item.type === 'emoji' && (
                  <View style={[styles.emojiItemContainer, { backgroundColor: colors.surface + 'BB' }]}>
                    <Text style={styles.emojiItemContent}>{item.content}</Text>
                  </View>
                )}
              </Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

export default function VisionBoardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const { items, loading, addItem, updateItem, deleteItem, refresh } = useVisionBoard(cocreationId || '');

  // Responsive canvas size
  const canvasWidth = screenWidth * 1.8;
  const canvasHeight = screenHeight * 1.2;

  // State
  const [showTextModal, setShowTextModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemZIndices, setItemZIndices] = useState<{ [key: string]: number }>({});

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
  }, [items]);

  const showAlert = useCallback((title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (confirm(`${title}: ${message}`)) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: onConfirm },
      ]);
    }
  }, []);

  // Find empty position with collision detection
  const findEmptyPosition = useCallback((itemWidth: number, itemHeight: number) => {
    const margin = 20;
    const maxAttempts = 100;
    const visibleWidth = screenWidth - 40;
    const visibleHeight = screenHeight * 0.5;
    
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
  }, [items, screenWidth, screenHeight]);

  const handleAddImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
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

        const response = await addItem(newItem);
        if (response.error) {
          showAlert('Erro', 'Não foi possível adicionar a imagem.');
        } else {
          setHasUnsavedChanges(true);
          
          // Set z-index for new item
          const maxZ = Math.max(...Object.values(itemZIndices), 0);
          setItemZIndices(prev => ({ ...prev, [response.data.id]: maxZ + 1 }));
        }
      } catch (error) {
        console.error('Error adding image:', error);
        showAlert('Erro', 'Algo deu errado ao adicionar a imagem.');
      }
    }
  }, [findEmptyPosition, addItem, showAlert, screenWidth, itemZIndices]);

  const handleAddText = useCallback(async () => {
    if (!textInput.trim()) {
      showAlert('Erro', 'Por favor, digite um texto.');
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

      const response = await addItem(newItem);
      if (response.error) {
        showAlert('Erro', 'Não foi possível adicionar o texto.');
      } else {
        setTextInput('');
        setShowTextModal(false);
        setHasUnsavedChanges(true);
        
        // Set z-index for new item
        const maxZ = Math.max(...Object.values(itemZIndices), 0);
        setItemZIndices(prev => ({ ...prev, [response.data.id]: maxZ + 1 }));
      }
    } catch (error) {
      console.error('Error adding text:', error);
      showAlert('Erro', 'Algo deu errado ao adicionar o texto.');
    }
  }, [textInput, findEmptyPosition, addItem, showAlert, screenWidth, itemZIndices]);

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

      const response = await addItem(newItem);
      if (response.error) {
        showAlert('Erro', 'Não foi possível adicionar o emoji.');
      } else {
        setShowEmojiModal(false);
        setHasUnsavedChanges(true);
        
        // Set z-index for new item
        const maxZ = Math.max(...Object.values(itemZIndices), 0);
        setItemZIndices(prev => ({ ...prev, [response.data.id]: maxZ + 1 }));
      }
    } catch (error) {
      console.error('Error adding emoji:', error);
      showAlert('Erro', 'Algo deu errado ao adicionar o emoji.');
    }
  }, [findEmptyPosition, addItem, showAlert, screenWidth, itemZIndices]);

  const handleUpdateItem = useCallback(async (id: string, updates: any) => {
    try {
      const response = await updateItem(id, updates);
      if (!response.error) {
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }, [updateItem]);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const response = await deleteItem(id);
      if (!response.error) {
        setHasUnsavedChanges(true);
        setSelectedItemId(null);
        
        // Remove from z-indices
        setItemZIndices(prev => {
          const newZIndices = { ...prev };
          delete newZIndices[id];
          return newZIndices;
        });
      } else {
        showAlert('Erro', 'Não foi possível excluir o item.');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showAlert('Erro', 'Algo deu errado ao excluir o item.');
    }
  }, [deleteItem, showAlert]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(prev => prev === id ? null : id);
    
    // Bring to front
    const maxZ = Math.max(...Object.values(itemZIndices), 0);
    setItemZIndices(prev => ({ ...prev, [id]: maxZ + 1 }));
  }, [itemZIndices]);

  const handleZoomReset = useCallback(() => {
    zoom.value = withSpring(1);
    canvasTranslateX.value = withSpring(0);
    canvasTranslateY.value = withSpring(0);
  }, []);

  const handleZoomIn = useCallback(() => {
    zoom.value = withSpring(Math.min(zoom.value * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    zoom.value = withSpring(Math.max(zoom.value * 0.8, 0.5));
  }, []);

  const canvasAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: canvasTranslateX.value },
        { translateY: canvasTranslateY.value },
        { scale: zoom.value },
      ],
    };
  });

  const handleExit = useCallback(() => {
    if (hasUnsavedChanges) {
      showConfirm(
        'Alterações não salvas',
        'Você tem alterações não salvas. Deseja sair mesmo assim?',
        () => router.back()
      );
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, showConfirm]);

  const handleSave = useCallback(async () => {
    try {
      await refresh();
      setHasUnsavedChanges(false);
      showAlert('Vision Board Salvo!', 'Suas alterações foram salvas com sucesso.');
    } catch (error) {
      showAlert('Erro', 'Não foi possível salvar as alterações.');
    }
  }, [refresh, showAlert]);

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleExit} style={styles.headerButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Manifeste conscientemente
              </Text>
            </View>
            
            {/* Zoom controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity onPress={handleZoomOut} style={[styles.zoomButton, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="zoom-out" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleZoomReset} style={[styles.zoomButton, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="center-focus-strong" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleZoomIn} style={[styles.zoomButton, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="zoom-in" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Canvas Container */}
          <View style={styles.canvasWrapper}>
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
                    <MaterialIcons name="auto-awesome" size={48} color={colors.primary} />
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
          </View>

          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.primary }]}
              onPress={handleAddImage}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add-photo-alternate" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowTextModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="text-fields" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowEmojiModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="emoji-emotions" size={24} color="white" />
            </TouchableOpacity>

            {/* Floating Finish Button */}
            <TouchableOpacity
              style={[styles.finishFloatingButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                showAlert(
                  'Vision Board Concluído!',
                  'Sua manifestação consciente está ativa. Visualize seus sonhos diariamente.',
                  () => router.push('/(tabs)/individual')
                );
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={28} color="white" />
              <Text style={styles.finishFloatingButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>

          {/* Text Input Modal */}
          <Modal visible={showTextModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
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
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.textMuted }]}
                    onPress={() => {
                      setTextInput('');
                      setShowTextModal(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      { backgroundColor: textInput.trim() ? colors.primary : colors.textMuted }
                    ]}
                    onPress={handleAddText}
                    disabled={!textInput.trim()}
                  >
                    <Text style={styles.modalButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Emoji Selection Modal */}
          <Modal visible={showEmojiModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.emojiModalContent, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Símbolos Sagrados
                </Text>
                
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
                
                <TouchableOpacity
                  style={[styles.closeModalButton, { backgroundColor: colors.textMuted }]}
                  onPress={() => setShowEmojiModal(false)}
                >
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    paddingVertical: Spacing.sm,
    zIndex: 1000,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 4,
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Canvas
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
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
  
  // Items
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
  finishFloatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 28,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginTop: Spacing.sm,
  },
  finishFloatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: Spacing.xs,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  textInput: {
    borderRadius: 16,
    padding: Spacing.lg,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
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
  },
});