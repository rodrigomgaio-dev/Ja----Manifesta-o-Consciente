
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
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');
const CANVAS_WIDTH = width * 3;
const CANVAS_HEIGHT = height * 2;

// Sacred emojis for selection
const SACRED_EMOJIS = [
  '✨', '💫', '🌟', '⭐', '💖', '💜', '🤍', '💎',
  '🙏', '🕉️', '☯️', '🔮', '🕯️', '🪷', '🌸', '🌺',
  '🦋', '🕊️', '🌈', '☀️', '🌙', '🌊', '🌳', '🍃',
  '💰', '🏆', '👑', '🎯', '🎨', '📿', '🧘‍♀️', '🧘‍♂️'
];

interface VisionBoardItemProps {
  item: any;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

const DraggableVisionBoardItem: React.FC<VisionBoardItemProps> = ({ item, onUpdate, onDelete }) => {
  const { colors } = useTheme();
  const pan = useRef(new Animated.ValueXY({ x: item.position_x || 0, y: item.position_y || 0 })).current;
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
      setShowDeleteButton(true);
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: () => {
      pan.flattenOffset();
      
      // Save new position
      const newX = pan.x._value;
      const newY = pan.y._value;
      onUpdate(item.id, { position_x: newX, position_y: newY });
      
      setTimeout(() => setShowDeleteButton(false), 2000);
    },
  });

  const itemStyle = {
    width: item.width || 120,
    height: item.height || 120,
  };

  return (
    <Animated.View
      style={[
        styles.draggableItem,
        itemStyle,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Delete button */}
      {showDeleteButton && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error }]}
          onPress={() => onDelete(item.id)}
        >
          <MaterialIcons name="close" size={16} color="white" />
        </TouchableOpacity>
      )}

      {/* Item content */}
      {item.type === 'image' && (
        <Image 
          source={{ uri: item.content }} 
          style={styles.itemContent}
          contentFit="cover"
        />
      )}
      {item.type === 'text' && (
        <View style={[styles.textItem, { backgroundColor: colors.primary + '80' }]}>
          <Text style={styles.itemText}>{item.content}</Text>
        </View>
      )}
      {item.type === 'emoji' && (
        <View style={[styles.emojiItem, { backgroundColor: colors.surface + '40' }]}>
          <Text style={styles.itemEmoji}>{item.content}</Text>
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

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      const result = confirm(`${title}: ${message}`);
      if (result && onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const result = confirm(`${title}: ${message}`);
      if (result) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: onConfirm },
      ]);
    }
  };

  const addImageToBoard = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showWebAlert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const randomX = Math.random() * (CANVAS_WIDTH - 200);
        const randomY = Math.random() * (CANVAS_HEIGHT - 200);
        
        await addItem({
          type: 'image',
          content: result.assets[0].uri,
          description: '',
          position_x: randomX,
          position_y: randomY,
          width: 120,
          height: 120,
        });
        
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Error adding image:', error);
        showWebAlert('Erro', 'Algo deu errado ao adicionar a imagem.');
      }
    }
  };

  const handleAddText = async () => {
    if (!textInput.trim()) {
      showWebAlert('Erro', 'Por favor, digite um texto.');
      return;
    }

    try {
      const randomX = Math.random() * (CANVAS_WIDTH - 200);
      const randomY = Math.random() * (CANVAS_HEIGHT - 100);
      
      await addItem({
        type: 'text',
        content: textInput.trim(),
        description: 'Texto personalizado',
        position_x: randomX,
        position_y: randomY,
        width: 150,
        height: 80,
      });
      
      setTextInput('');
      setShowTextModal(false);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error adding text:', error);
      showWebAlert('Erro', 'Algo deu errado ao adicionar o texto.');
    }
  };

  const handleAddEmoji = async (emoji: string) => {
    try {
      const randomX = Math.random() * (CANVAS_WIDTH - 100);
      const randomY = Math.random() * (CANVAS_HEIGHT - 100);
      
      await addItem({
        type: 'emoji',
        content: emoji,
        description: 'Símbolo sagrado',
        position_x: randomX,
        position_y: randomY,
        width: 60,
        height: 60,
      });
      
      setShowEmojiModal(false);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error adding emoji:', error);
      showWebAlert('Erro', 'Algo deu errado ao adicionar o emoji.');
    }
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    try {
      await updateItem(id, updates);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleExit = () => {
    if (hasUnsavedChanges) {
      showConfirmDialog(
        'Alterações não salvas',
        'Você tem alterações não salvas. Deseja sair mesmo assim?',
        () => router.back()
      );
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    showWebAlert('Vision Board Salvo!', 'Suas alterações foram salvas com sucesso.');
  };

  const handleFinish = () => {
    showWebAlert(
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
          <TouchableOpacity onPress={handleExit} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Manifeste seus sonhos
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <MaterialIcons name="save" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Canvas Area */}
        <ScrollView
          style={styles.canvasContainer}
          contentContainerStyle={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          maximumZoomScale={2}
          minimumZoomScale={0.5}
        >
          <View style={[styles.canvas, { backgroundColor: colors.surface + '10' }]}>
            {/* Background pattern */}
            <View style={styles.canvasPattern}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={[styles.patternLine, { backgroundColor: colors.border + '20' }]} />
              ))}
            </View>

            {/* Vision Board Items */}
            {items.map((item) => (
              <DraggableVisionBoardItem
                key={item.id}
                item={item}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}

            {/* Empty state */}
            {items.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyStateContent, { backgroundColor: colors.surface + '40' }]}>
                  <MaterialIcons name="gesture" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                    Canvas Infinito
                  </Text>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    Adicione elementos e posicione-os livremente{"\n"}
                    Arraste para mover • Toque longo para excluir
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={styles.floatingButtons}>
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: colors.primary }]}
            onPress={addImageToBoard}
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

        {/* Finish Button */}
        <View style={styles.finishContainer}>
          <SacredButton
            title="Concluir Vision Board"
            onPress={handleFinish}
            style={styles.finishButton}
          />
        </View>

        {/* Text Modal */}
        <Modal visible={showTextModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Adicionar Texto
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Digite seu texto de manifestação..."
                placeholderTextColor={colors.textMuted}
                multiline
                autoFocus
              />
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
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddText}
                >
                  <Text style={styles.modalButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Emoji Modal */}
        <Modal visible={showEmojiModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.emojiModalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Símbolos Sagrados
              </Text>
              <ScrollView style={styles.emojiGrid}>
                <View style={styles.emojiContainer}>
                  {SACRED_EMOJIS.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.emojiButton, { backgroundColor: colors.background }]}
                      onPress={() => handleAddEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.textMuted }]}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.sm,
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
  },
  saveButton: {
    padding: Spacing.sm,
  },
  canvasContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
  canvasPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  patternLine: {
    height: 1,
    width: '100%',
  },
  draggableItem: {
    position: 'absolute',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  itemContent: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  textItem: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emojiItem: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 28,
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
  },
  emptyStateContent: {
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    width: 200,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  floatingButtons: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 100,
    gap: Spacing.md,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  finishContainer: {
    padding: Spacing.lg,
  },
  finishButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: Spacing.xl,
    borderRadius: 16,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  textInput: {
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emojiModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: Spacing.lg,
    borderRadius: 16,
  },
  emojiGrid: {
    maxHeight: 300,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emojiText: {
    fontSize: 24,
  },
  closeButton: {
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
});
