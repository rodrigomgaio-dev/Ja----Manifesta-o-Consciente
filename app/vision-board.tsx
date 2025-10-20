import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';

import GradientBackground from '@/components/ui/GradientBackground';
import SacredModal from '@/components/ui/SacredModal';
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
  
  const { items, loading, addItem, deleteItem, finalizeVisionBoard } = useVisionBoard(cocreationId || '');

  // State
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    buttons?: any[];
  }>({ title: '', message: '', type: 'info' });

  const showModal = useCallback((
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: any[]
  ) => {
    setModalConfig({ title, message, type, buttons });
    setModalVisible(true);
  }, []);

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
      allowsMultipleSelection: false,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const newItem = {
          type: 'image' as const,
          content: result.assets[0].uri,
          description: 'Imagem do Vision Board',
        };

        const response = await addItem(newItem);
        if (response.error) {
          showModal('Erro', 'Não foi possível adicionar a imagem.', 'error');
        }
      } catch (error) {
        console.error('Error adding image:', error);
        showModal('Erro', 'Algo deu errado ao adicionar a imagem.', 'error');
      } finally {
        setUploading(false);
      }
    }
  }, [addItem, showModal]);

  const handleDeleteImage = useCallback(async (id: string) => {
    showModal(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta imagem do Vision Board?',
      'warning',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setModalVisible(false),
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setModalVisible(false);
            try {
              const response = await deleteItem(id);
              if (response.error) {
                setTimeout(() => {
                  showModal('Erro', 'Não foi possível excluir a imagem.', 'error');
                }, 300);
              }
            } catch (error) {
              console.error('Error deleting image:', error);
              setTimeout(() => {
                showModal('Erro', 'Algo deu errado ao excluir a imagem.', 'error');
              }, 300);
            }
          },
        },
      ]
    );
  }, [deleteItem, showModal]);

  const handleComplete = useCallback(async () => {
    if (items.length === 0) {
      showModal(
        'Vision Board Vazio',
        'Adicione pelo menos uma imagem antes de concluir.',
        'warning'
      );
      return;
    }

    try {
      const result = await finalizeVisionBoard();
      
      if (result.error) {
        console.error('Error finalizing vision board:', result.error);
        showModal('Erro', 'Não foi possível finalizar o Vision Board.', 'error');
      } else {
        showModal(
          'Vision Board Finalizado!',
          'Utilize-o para visualizar durante suas práticas e sentir que JÁ É.',
          'success'
        );
        setTimeout(() => {
          router.push(`/cocriacao-details?id=${cocreationId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error finalizing vision board:', error);
      showModal('Erro', 'Algo deu errado ao finalizar.', 'error');
    }
  }, [items, finalizeVisionBoard, showModal, cocreationId]);

  // Calculate number of columns based on screen width
  const numColumns = screenWidth > 600 ? 3 : 2;
  const itemWidth = (screenWidth - (Spacing.lg * 2) - (Spacing.md * (numColumns - 1))) / numColumns;

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vision Board</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Crie sua manifestação
          </Text>
        </View>

        {/* Image Grid */}
        <View style={styles.gridContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
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
              extraData={items}
            />
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyCard, { backgroundColor: colors.surface + '60' }]}>
                <MaterialIcons name="add-photo-alternate" size={80} color={colors.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  Vision Board Vazio
                </Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Adicione imagens que representam{"\n"}seus sonhos e manifestações
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Floating Action Buttons */}
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={() => router.push(`/cocriacao-details?id=${cocreationId}`)}
          >
            <MaterialIcons name="close" size={28} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}
            onPress={handleAddImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <MaterialIcons name="add-photo-alternate" size={28} color="#3B82F6" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: items.length > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)' }
            ]}
            onPress={handleComplete}
            disabled={items.length === 0}
          >
            <MaterialIcons 
              name="check-circle" 
              size={28} 
              color={items.length > 0 ? '#22C55E' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 10,
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
  
  // Grid
  gridContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  gridContent: {
    paddingBottom: Spacing.xl * 2,
  },
  imageItem: {
    margin: Spacing.md / 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  image: {
    borderRadius: 16,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyCard: {
    padding: Spacing.xl * 2,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Floating Actions
  floatingActions: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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