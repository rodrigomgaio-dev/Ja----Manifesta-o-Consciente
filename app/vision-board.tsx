import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Modal,
  TextInput,
  PanResponder,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');
const CANVAS_WIDTH = width * 2;
const CANVAS_HEIGHT = height * 1.5;
const VISIBLE_AREA = { width: width - 40, height: height * 0.6 };

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
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onUpdate, onDelete }) => {
  const { colors } = useTheme();
  
  // Animated values
  const pan = useRef(new Animated.ValueXY({ 
    x: item.position_x || 50, 
    y: item.position_y || 50 
  })).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // Update position when item changes
  useEffect(() => {
    pan.setValue({ x: item.position_x || 50, y: item.position_y || 50 });
  }, [item.position_x, item.position_y]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if gesture is significant enough
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      
      onPanResponderGrant: () => {
        setIsDragging(true);
        setShowDeleteButton(true);
        
        // Set the offset to the current value
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        
        // Scale up animation (lift effect)
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: false,
        }).start();
      },
      
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        
        // Flatten the offset
        pan.flattenOffset();
        
        // Scale down animation
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }).start();
        
        // Get final position
        const finalX = pan.x._value;
        const finalY = pan.y._value;
        
        // Ensure item stays within bounds
        const constrainedX = Math.max(0, Math.min(finalX, CANVAS_WIDTH - (item.width || 120)));
        const constrainedY = Math.max(0, Math.min(finalY, CANVAS_HEIGHT - (item.height || 120)));
        
        // Update position in state and database
        if (finalX !== constrainedX || finalY !== constrainedY) {
          pan.setValue({ x: constrainedX, y: constrainedY });
        }
        
        onUpdate(item.id, { 
          position_x: constrainedX, 
          position_y: constrainedY 
        });
        
        // Hide delete button after a delay
        setTimeout(() => setShowDeleteButton(false), 3000);
      },
    })
  ).current;

  const itemStyle = {
    width: item.width || 120,
    height: item.height || (item.type === 'text' ? 80 : 120),
  };

  return (
    <Animated.View
      style={[
        styles.draggableItem,
        itemStyle,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }
          ],
        },
        isDragging && styles.draggingItem
      ]}
      {...panResponder.panHandlers}
    >
      {/* Delete button */}
      {showDeleteButton && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error }]}
          onPress={() => onDelete(item.id)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="close" size={16} color="white" />
        </TouchableOpacity>
      )}

      {/* Item content based on type */}
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
        <View style={[styles.textItemContainer, { backgroundColor: colors.primary + 'CC' }]}>
          <Text style={[styles.textItemContent, { color: 'white' }]}>
            {item.content}
          </Text>
        </View>
      )}
      
      {item.type === 'emoji' && (
        <View style={[styles.emojiItemContainer, { backgroundColor: colors.surface + 'AA' }]}>
          <Text style={styles.emojiItemContent}>{item.content}</Text>
        </View>
      )}
    </Animated.View>
  );
};

export default function VisionBoardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  
  const { items, loading, addItem, updateItem, deleteItem, refresh } = useVisionBoard(cocreationId || '');

  const [showTextModal, setShowTextModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localItems, setLocalItems] = useState<any[]>([]);

  // Sync items with local state for immediate updates
  useEffect(() => {
    console.log('Items updated:', items.length);
    setLocalItems([...items]);
  }, [items]);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (confirm(`${title}: ${message}`)) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: onConfirm },
      ]);
    }
  };

  // Find empty position in visible area
  const findEmptyPosition = (itemWidth: number, itemHeight: number) => {
    const margin = 20;
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = margin + Math.random() * (VISIBLE_AREA.width - itemWidth - margin * 2);
      const y = margin + Math.random() * (VISIBLE_AREA.height - itemHeight - margin * 2);
      
      // Check if position overlaps with existing items
      const overlaps = localItems.some(existingItem => {
        const exX = existingItem.position_x || 0;
        const exY = existingItem.position_y || 0;
        const exW = existingItem.width || 120;
        const exH = existingItem.height || 120;
        
        return !(x > exX + exW + 10 || 
                 x + itemWidth + 10 < exX || 
                 y > exY + exH + 10 || 
                 y + itemHeight + 10 < exY);
      });
      
      if (!overlaps) {
        return { x, y };
      }
    }
    
    // If no empty position found, use a random position
    return {
      x: margin + Math.random() * (VISIBLE_AREA.width - itemWidth - margin * 2),
      y: margin + Math.random() * (VISIBLE_AREA.height - itemHeight - margin * 2),
    };
  };

  const handleAddImage = async () => {
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
        const itemWidth = 150;
        const itemHeight = 150;
        const position = findEmptyPosition(itemWidth, itemHeight);
        
        const newItem = {
          type: 'image' as const,
          content: result.assets[0].uri,
          description: 'Imagem do Vision Board',
          position_x: position.x,
          position_y: position.y,
          width: itemWidth,
          height: itemHeight,
        };

        console.log('Adding image item:', newItem);
        
        const response = await addItem(newItem);
        if (response.error) {
          console.error('Error adding image:', response.error);
          showAlert('Erro', 'Não foi possível adicionar a imagem.');
        } else {
          console.log('Image added successfully:', response.data);
          setHasUnsavedChanges(true);
          
          // Force refresh to ensure item appears
          setTimeout(() => refresh(), 100);
        }
      } catch (error) {
        console.error('Error adding image:', error);
        showAlert('Erro', 'Algo deu errado ao adicionar a imagem.');
      }
    }
  };

  const handleAddText = async () => {
    if (!textInput.trim()) {
      showAlert('Erro', 'Por favor, digite um texto.');
      return;
    }

    try {
      const itemWidth = 180;
      const itemHeight = 100;
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

      console.log('Adding text item:', newItem);
      
      const response = await addItem(newItem);
      if (response.error) {
        console.error('Error adding text:', response.error);
        showAlert('Erro', 'Não foi possível adicionar o texto.');
      } else {
        console.log('Text added successfully:', response.data);
        setTextInput('');
        setShowTextModal(false);
        setHasUnsavedChanges(true);
        
        // Force refresh to ensure item appears
        setTimeout(() => refresh(), 100);
      }
    } catch (error) {
      console.error('Error adding text:', error);
      showAlert('Erro', 'Algo deu errado ao adicionar o texto.');
    }
  };

  const handleAddEmoji = async (emoji: string) => {
    try {
      const itemWidth = 80;
      const itemHeight = 80;
      const position = findEmptyPosition(itemWidth, itemHeight);
      
      const newItem = {
        type: 'emoji' as const,
        content: emoji,
        description: 'Símbolo sagrado',
        position_x: position.x,
        position_y: position.y,
        width: itemWidth,
        height: itemHeight,
      };

      console.log('Adding emoji item:', newItem);
      
      const response = await addItem(newItem);
      if (response.error) {
        console.error('Error adding emoji:', response.error);
        showAlert('Erro', 'Não foi possível adicionar o emoji.');
      } else {
        console.log('Emoji added successfully:', response.data);
        setShowEmojiModal(false);
        setHasUnsavedChanges(true);
        
        // Force refresh to ensure item appears
        setTimeout(() => refresh(), 100);
      }
    } catch (error) {
      console.error('Error adding emoji:', error);
      showAlert('Erro', 'Algo deu errado ao adicionar o emoji.');
    }
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    try {
      console.log('Updating item:', id, updates);
      
      // Update local state immediately for smooth UX
      setLocalItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      
      // Update database
      const response = await updateItem(id, updates);
      if (response.error) {
        console.error('Error updating item:', response.error);
        // Revert local changes on error
        await refresh();
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      // Revert local changes on error
      await refresh();
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      console.log('Deleting item:', id);
      
      // Update local state immediately
      setLocalItems(prev => prev.filter(item => item.id !== id));
      
      // Delete from database
      const response = await deleteItem(id);
      if (response.error) {
        console.error('Error deleting item:', response.error);
        showAlert('Erro', 'Não foi possível excluir o item.');
        // Revert local changes on error
        await refresh();
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showAlert('Erro', 'Algo deu errado ao excluir o item.');
      // Revert local changes on error
      await refresh();
    }
  };

  const handleExit = () => {
    if (hasUnsavedChanges) {
      showConfirm(
        'Alterações não salvas',
        'Você tem alterações não salvas. Deseja sair mesmo assim?',
        () => router.back()
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    try {
      await refresh(); // Sync with database
      setHasUnsavedChanges(false);
      showAlert('Vision Board Salvo!', 'Suas alterações foram salvas com sucesso.');
    } catch (error) {
      showAlert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const handleFinish = () => {
    showAlert(
      'Vision Board Concluído!',
      'Sua manifestação consciente está ativa. Visualize seus sonhos diariamente.',
      () => router.push('/(tabs)/individual')
    );
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
          <TouchableOpacity onPress={handleExit} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Manifeste conscientemente
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <MaterialIcons 
              name="save" 
              size={24} 
              color={hasUnsavedChanges ? colors.primary : colors.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Canvas Container */}
        <View style={styles.canvasWrapper}>
          <ScrollView
            style={styles.canvasScrollView}
            contentContainerStyle={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            maximumZoomScale={1.5}
            minimumZoomScale={0.8}
            bounces={false}
          >
            <View style={[styles.canvas, { backgroundColor: colors.surface + '20' }]}>
              {/* Background grid */}
              <View style={styles.gridPattern}>
                {Array.from({ length: Math.ceil(CANVAS_HEIGHT / 50) }).map((_, row) => (
                  <View key={`row-${row}`} style={styles.gridRow}>
                    {Array.from({ length: Math.ceil(CANVAS_WIDTH / 50) }).map((_, col) => (
                      <View 
                        key={`dot-${row}-${col}`} 
                        style={[styles.gridDot, { backgroundColor: colors.border + '30' }]} 
                      />
                    ))}
                  </View>
                ))}
              </View>

              {/* Vision Board Items */}
              {localItems.map((item) => (
                <DraggableItem
                  key={`${item.id}-${item.updated_at || item.created_at}`}
                  item={item}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}

              {/* Empty state */}
              {localItems.length === 0 && (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyStateContent, { backgroundColor: colors.surface + '60' }]}>
                    <MaterialIcons name="touch-app" size={48} color={colors.textMuted} />
                    <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                      Canvas Sagrado
                    </Text>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      Toque nos botões abaixo para adicionar{'\n'}
                      imagens, textos e símbolos sagrados
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleAddImage}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-photo-alternate" size={28} color="white" />
            <Text style={styles.actionButtonText}>Imagem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => setShowTextModal(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="text-fields" size={28} color="white" />
            <Text style={styles.actionButtonText}>Texto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowEmojiModal(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="emoji-emotions" size={28} color="white" />
            <Text style={styles.actionButtonText}>Símbolo</Text>
          </TouchableOpacity>
        </View>

        {/* Finish Button */}
        <View style={styles.finishSection}>
          <SacredButton
            title="Finalizar Vision Board"
            onPress={handleFinish}
            style={[styles.finishButton, { backgroundColor: colors.primary }]}
          />
        </View>

        {/* Text Input Modal */}
        <Modal visible={showTextModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Adicionar Texto Sagrado
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
              
              <ScrollView 
                style={styles.emojiScrollView}
                showsVerticalScrollIndicator={false}
              >
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
          </View>
        </Modal>
      </View>
    </GradientBackground>
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
    zIndex: 100,
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
  
  // Canvas
  canvasWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  canvasScrollView: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
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
    paddingVertical: 25,
    paddingHorizontal: 25,
  },
  gridDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  
  // Draggable Items
  draggableItem: {
    position: 'absolute',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    backgroundColor: 'transparent',
  },
  draggingItem: {
    elevation: 8,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  itemContent: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  textItemContainer: {
    width: '100%',
    height: '100%',
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
    width: '100%',
    height: '100%',
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
    top: '35%',
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -80 }],
  },
  emptyStateContent: {
    padding: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    width: 240,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Action Bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  
  // Finish Section
  finishSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  finishButton: {
    paddingVertical: Spacing.lg,
  },
  
  // Modals
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
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  textInput: {
    borderRadius: 12,
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
    borderRadius: 10,
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
    maxHeight: '85%',
    padding: Spacing.lg,
    borderRadius: 20,
  },
  emojiScrollView: {
    maxHeight: 350,
    marginBottom: Spacing.lg,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
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
    borderRadius: 10,
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