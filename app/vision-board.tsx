import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  useWindowDimensions,
  FlatList,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';

import GradientBackground from '@/components/ui/GradientBackground';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { Spacing } from '@/constants/Colors';

export default function VisionBoardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth } = useWindowDimensions();
  
  const { items, loading, addItem, deleteItem, refresh } = useVisionBoard(cocreationId || '');

  // State
  const [showImagePicker, setShowImagePicker] = useState(false);

  const showAlert = useCallback((title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  }, []);

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
        const newItem = {
          type: 'image' as const,
          content: result.assets[0].uri,
          description: 'Imagem do Vision Board',
        };

        const response = await addItem(newItem);
        if (response.error) {
          showAlert('Erro', 'Não foi possível adicionar a imagem.');
        }
      } catch (error) {
        console.error('Error adding image:', error);
        showAlert('Erro', 'Algo deu errado ao adicionar a imagem.');
      }
    }
    setShowImagePicker(false);
  }, [addItem, showAlert]);

  const handleDeleteImage = useCallback(async (id: string) => {
    try {
      const response = await deleteItem(id);
      if (response.error) {
        showAlert('Erro', 'Não foi possível excluir a imagem.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert('Erro', 'Algo deu errado ao excluir a imagem.');
    }
  }, [deleteItem, showAlert]);

  const handleExit = useCallback(() => {
    router.back();
  }, []);

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

  // Calculate number of columns based on screen width
  const numColumns = screenWidth > 600 ? 3 : 2;
  const itemWidth = (screenWidth - (Spacing.lg * 2) - (Spacing.md * (numColumns - 1))) / numColumns;

  const renderImageItem = ({ item }: { item: any }) => (
    <View style={[styles.imageItem, { width: itemWidth }]}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteImage(item.id)}
      >
        <MaterialIcons name="close" size={20} color="white" />
      </TouchableOpacity>
      <ExpoImage
        source={{ uri: item.content }}
        style={[styles.image, { width: itemWidth, height: itemWidth }]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
    </View>
  );

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
          
          {/* Botão de salvar removido */}
        </View>

        {/* Image Grid */}
        <View style={styles.gridContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="hourglass-empty" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Carregando...
              </Text>
            </View>
          ) : items.length > 0 ? (
            <FlatList
              data={items}
              renderItem={renderImageItem}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              extraData={items} // <-- Força atualização ao adicionar/remover itens
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="photo-library" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Nenhuma Imagem
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                Adicione imagens para começar sua manifestação
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowImagePicker(true)}
          >
            <MaterialIcons name="add-a-photo" size={32} color="white" />
          </TouchableOpacity>

          <SacredButton
            title="Finalizar Vision Board"
            onPress={() => {
              showAlert(
                'Vision Board Concluído!',
                'Sua manifestação consciente está ativa. Visualize seus sonhos diariamente.',
                () => router.push('/(tabs)/individual')
              );
            }}
            style={styles.finishButton}
          />
        </View>

        {/* Image Picker Modal */}
        <Modal visible={showImagePicker} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowImagePicker(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Adicionar Imagem
              </Text>
              <Text style={[styles.modalText, { color: colors.textMuted }]}>
                Deseja selecionar uma imagem da galeria?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.textMuted }]}
                  onPress={() => setShowImagePicker(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddImage}
                >
                  <Text style={styles.modalButtonText}>Selecionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
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
    zIndex: 10,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: 8,
  },
  headerCenter: {
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
  
  // Grid
  gridContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  gridContent: {
    paddingBottom: Spacing.xl,
  },
  imageItem: {
    margin: Spacing.md / 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(200, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    borderRadius: 12,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  // Action Buttons
  actionContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishButton: {
    width: '100%',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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