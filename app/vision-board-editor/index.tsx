// app/vision-board-editor/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system'; // Se for usar para verificar URI

import GradientBackground from '@/components/ui/GradientBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems'; // Caminho absoluto
import { BoardElement, BoardElementType } from './types/boardTypes'; // Caminho relativo
import EditorElement from './components/EditorElement'; // Caminho relativo
import { Spacing } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VisionBoardEditorScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  
  const { items, loading, error, addItem, updateItem, deleteItem } = useVisionBoardItems(cocreationId || '');
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  // --- useEffect de DEBUG: Adicionado no TOP LEVEL do componente ---
  useEffect(() => {
    console.log("[VisionBoardEditor] Estado 'items' foi atualizado. Novo valor:", items);
    // Você pode adicionar mais logs aqui se precisar
  }, [items]); // Re-executa sempre que 'items' muda
  // --- FIM useEffect de DEBUG ---

  const handleError = useCallback((message: string, error?: any) => {
    console.error(message, error);
    Alert.alert('Erro', message);
  }, []);

  const handleAddElement = useCallback((type: BoardElementType) => {
    setShowAddModal(false);
    
    setTimeout(() => {
      switch (type) {
        case 'image':
          handleAddImage();
          break;
        case 'text':
          setShowTextInputModal(true);
          break;
        case 'emoji':
          Alert.alert('Em breve', 'Funcionalidade de Emoji estará disponível em breve.');
          break;
        case 'sticker':
          Alert.alert('Em breve', 'Funcionalidade de Sticker estará disponível em breve.');
          break;
      }
    }, 300);
  }, []); // Dependências serão adicionadas abaixo

  const handleAddImage = useCallback(async () => {
    try {
      console.log("[VisionBoardEditor] Iniciando processo de adicionar imagem...");
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const errorMsg = 'Permissão necessária para acessar a galeria de fotos.';
        console.warn("[VisionBoardEditor] Permissão negada:", errorMsg);
        handleError(errorMsg);
        return;
      }

      console.log("[VisionBoardEditor] Permissão concedida. Abrindo seletor...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log("[VisionBoardEditor] Imagem selecionada:", uri);

        if (!uri || typeof uri !== 'string') {
          const errorMsg = 'URI da imagem inválida.';
          console.error("[VisionBoardEditor] Erro:", errorMsg);
          handleError(errorMsg);
          return;
        }

        const newItem = {
          type: 'image' as const,
          uri: uri,
          position_x: Math.random() * 100 + 50,
          position_y: Math.random() * 100 + 150,
          width: 150,
          height: 150,
          rotation: 0,
          zindex: items.length + 1
        };

        console.log("[VisionBoardEditor] Preparando para chamar addItem com:", newItem);
        const response = await addItem(newItem);
        console.log("[VisionBoardEditor] Resposta completa do addItem:", response);

        if (response.error) {
          handleError('Erro ao adicionar imagem.', response.error);
        } else {
          console.log('[VisionBoardEditor] Imagem adicionada com sucesso ao estado!');
        }
      } else {
        console.log("[VisionBoardEditor] Seleção de imagem cancelada pelo usuário.");
      }
    } catch (err: any) {
      const errorMsg = 'Falha inesperada ao adicionar imagem.';
      console.error(`[VisionBoardEditor] ${errorMsg}`, err);
      handleError(errorMsg, err);
    }
  }, [addItem, handleError, items.length]);

  const handleAddText = useCallback(async () => {
    if (!textInput.trim()) {
      Alert.alert('Erro', 'Por favor, digite um texto.');
      return;
    }

    try {
      const newItem = {
        type: 'text' as const,
        content: textInput.trim(),
        fontSize: 24,
        color: '#000000',
        position_x: Math.random() * 100 + 50,
        position_y: Math.random() * 100 + 150,
        width: 200,
        height: 100,
        rotation: 0,
        zindex: items.length + 1
      };

      console.log("Tentando adicionar texto:", newItem);
      const response = await addItem(newItem);
      console.log("Resposta do addItem (texto):", response);

      if (response.error) {
        handleError('Erro ao adicionar texto.', response.error);
      } else {
        setTextInput('');
        setShowTextInputModal(false);
        console.log('Texto adicionado com sucesso!');
      }
    } catch (err: any) {
      handleError('Falha inesperada ao adicionar texto.', err);
    }
  }, [textInput, addItem, handleError, items.length]);

  const handleElementTransform = useCallback(async (
    id: string,
    transforms: Partial<Pick<BoardElement, 'position_x' | 'position_y' | 'width' | 'height' | 'rotation'>>
  ) => {
    try {
      console.log(`Atualizando elemento ${id} com:`, transforms);
      const response = await updateItem(id, transforms);
      if (response.error) {
        handleError('Erro ao atualizar elemento.', response.error);
      }
    } catch (err: any) {
      handleError('Falha inesperada ao atualizar elemento.', err);
    }
  }, [updateItem, handleError]);

  const handleElementDelete = useCallback(async (id: string) => {
    try {
      console.log(`Excluindo elemento ${id}`);
      const response = await deleteItem(id);
      if (response.error) {
        handleError('Erro ao excluir elemento.', response.error);
      } else {
        if (selectedElementId === id) {
          setSelectedElementId(null);
        }
        console.log('Elemento excluído com sucesso!');
      }
    } catch (err: any) {
      handleError('Falha inesperada ao excluir elemento.', err);
    }
  }, [deleteItem, handleError, selectedElementId]);

  const handleSaveBoard = useCallback(async () => {
    try {
      console.log("Salvando o Vision Board...");
      router.back();
    } catch (error) {
      handleError('Erro ao salvar o Vision Board.', error);
    }
  }, [handleError]);

  // --- Correção 3: Função para fechar modais ---
  const closeModals = useCallback(() => {
    setShowAddModal(false);
    setShowTextInputModal(false);
  }, []);

  // Atualizar dependências do handleAddElement
  useEffect(() => {
    // Isso força a recriação do handleAddElement quando handleAddImage muda
  }, [handleAddImage]);

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Acesso Negado
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Você precisa estar logado para editar este Vision Board.
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando elementos...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Erro ao Carregar
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>Voltar</Text>
            </TouchableOpacity>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Editor Vision Board
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Crie sua manifestação visual
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleSaveBoard} style={styles.headerButton}>
            <MaterialIcons name="save" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Canvas Container */}
        <View style={styles.canvasWrapper}>
          <ScrollView 
            style={[styles.canvasScrollView, { backgroundColor }]}
            contentContainerStyle={styles.canvasScrollContent}
            scrollEnabled={true} 
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {/* Área de Edição - Canvas */}
            <View style={styles.canvas}>
              {items.map((item) => (
                <EditorElement
                  key={item.id}
                  element={item}
                  isSelected={selectedElementId === item.id}
                  onSelect={() => setSelectedElementId(item.id)}
                  onTransform={(transforms) => handleElementTransform(item.id, transforms)}
                  onDelete={() => handleElementDelete(item.id)}
                />
              ))}

              {/* Estado vazio */}
              {items.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialIcons name="auto-awesome" size={64} color={colors.textMuted} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                    Canvas Vazio
                  </Text>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    Adicione imagens, textos ou emojis para começar sua manifestação.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Floating Action Buttons */}
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
          
          {selectedElementId && (
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.error }]}
              onPress={() => handleElementDelete(selectedElementId)}
            >
              <MaterialIcons name="delete" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* --- MODAL DE ADIÇÃO DE ELEMENTOS --- */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
        >
          <TouchableWithoutFeedback onPress={closeModals}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Adicionar Elemento
                    </Text>
                    <TouchableOpacity onPress={closeModals} style={styles.modalCloseButton}>
                      <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.modalBody}>
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleAddElement('image')}
                    >
                      <MaterialIcons name="image" size={24} color={colors.primary} />
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>
                        Imagem
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleAddElement('text')}
                    >
                      <MaterialIcons name="text-fields" size={24} color={colors.secondary} />
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>
                        Texto
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleAddElement('emoji')}
                    >
                      <MaterialIcons name="sentiment-satisfied" size={24} color={colors.accent} />
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>
                        Emoji
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleAddElement('sticker')}
                    >
                      <MaterialIcons name="auto-awesome" size={24} color={colors.accent} />
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>
                        Sticker
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* --- MODAL DE TEXTO --- */}
        <Modal
          visible={showTextInputModal}
          transparent
          animationType="slide"
        >
          <TouchableWithoutFeedback onPress={closeModals}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.textModalContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Adicionar Texto
                    </Text>
                    <TouchableOpacity onPress={closeModals} style={styles.modalCloseButton}>
                      <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.textModalBody}>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      value={textInput}
                      onChangeText={setTextInput}
                      placeholder="Digite sua intenção, sonho ou afirmação..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={4}
                      autoFocus
                    />
                    
                    <View style={styles.textModalActions}>
                      <TouchableOpacity
                        style={[styles.textModalButton, { backgroundColor: colors.textMuted }]}
                        onPress={closeModals}
                      >
                        <Text style={styles.textModalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.textModalButton, { backgroundColor: colors.primary }]}
                        onPress={handleAddText}
                        disabled={!textInput.trim()}
                      >
                        <Text style={styles.textModalButtonText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
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
    zindex: 1000,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
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
  
  // Canvas Container
  canvasWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  canvasScrollView: {
    flex: 1,
    borderRadius: 16,
  },
  canvasScrollContent: {
    paddingVertical: Spacing.lg,
  },
  canvas: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 1.2,
    position: 'relative',
    borderRadius: 16,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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
    right: Spacing.lg + 10,
    bottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    zindex: 100,
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
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
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
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: Spacing.lg,
  },
  
  // Text Modal
  textModalBody: {
    padding: Spacing.lg,
  },
  textInput: {
    borderRadius: 16,
    padding: Spacing.lg,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
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
  
  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
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
    // backgroundColor: 'rgba(0,0,0,0.1)', // Corrigido: Removido uso de 'colors'
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
