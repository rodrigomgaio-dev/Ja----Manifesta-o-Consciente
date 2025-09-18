import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
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
import { useVisionBoard } from '@/hooks/useIndividualCocriations';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const GRID_SIZE = 3;
const ITEM_SIZE = (width - (Spacing.lg * 2) - (Spacing.md * (GRID_SIZE - 1))) / GRID_SIZE;

export default function VisionBoardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  
  const { items, loading, addItem, refresh } = useVisionBoard(cocreationId || '');
  const { updateCocriation } = useIndividualCocriations();

  const [cocriation, setCocriation] = useState<any>(null);

    useEffect(() => {
    // Vision board items loaded, no status update needed since we start as active
  }, [items]);

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
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
        const imageResult = await addItem({
          type: 'image',
          content: result.assets[0].uri,
          description: '',
          position_x: 0,
          position_y: 0,
          width: ITEM_SIZE,
          height: ITEM_SIZE,
        });

        if (imageResult.error) {
          showWebAlert('Erro', 'Não foi possível adicionar a imagem ao Vision Board.');
        } else {
          await refresh();
        }
      } catch (error) {
        console.error('Error adding image:', error);
        showWebAlert('Erro', 'Algo deu errado ao adicionar a imagem.');
      }
    }
  };

  const addTextToBoard = () => {
    // For now, add a placeholder text item
    const placeholderTexts = [
      'Gratidão infinita',
      'Abundância',
      'Amor incondicional', 
      'Prosperidade',
      'Paz interior',
      'Realização',
      'Sucesso',
      'Harmonia',
      'Felicidade plena',
      'Liberdade'
    ];
    
    const randomText = placeholderTexts[Math.floor(Math.random() * placeholderTexts.length)];
    
    addItem({
      type: 'text',
      content: randomText,
      description: 'Afirmação positiva',
      position_x: 0,
      position_y: 0,
      width: ITEM_SIZE,
      height: ITEM_SIZE / 2,
    });
  };

  const addEmojiToBoard = () => {
    const emojis = ['✨', '🌟', '💖', '🙏', '🌈', '💫', '🔮', '🦋', '🌸', '💎'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    addItem({
      type: 'emoji',
      content: randomEmoji,
      description: 'Símbolo de manifestação',
      position_x: 0,
      position_y: 0,
      width: ITEM_SIZE / 2,
      height: ITEM_SIZE / 2,
    });
  };

  const handleFinish = () => {
    if (items.length === 0) {
      showWebAlert(
        'Vision Board Vazio', 
        'Adicione pelo menos uma imagem ao seu Vision Board antes de continuar.',
        () => {}
      );
      return;
    }

    showWebAlert(
      'Vision Board Criado!',
      'Sua cocriação está agora ativa e pronta para manifestação!',
      () => {
        router.push('/(tabs)/individual');
      }
    );
  };

  const renderVisionBoardItem = (item: any, index: number) => {
    const itemStyle = {
      width: item.width || ITEM_SIZE,
      height: item.height || ITEM_SIZE,
    };

    return (
      <View key={item.id} style={[styles.visionBoardItem, itemStyle]}>
        {item.type === 'image' && (
          <Image 
            source={{ uri: item.content }} 
            style={styles.itemImage}
            contentFit="cover"
          />
        )}
        {item.type === 'text' && (
          <View style={[styles.textItem, { backgroundColor: colors.primary }]}>
            <Text style={styles.itemText}>{item.content}</Text>
          </View>
        )}
        {item.type === 'emoji' && (
          <View style={styles.emojiItem}>
            <Text style={styles.itemEmoji}>{item.content}</Text>
          </View>
        )}
      </View>
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
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Vision Board
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Crie a representação visual dos seus sonhos
          </Text>
        </View>

        {/* Vision Board Grid */}
        <SacredCard glowing style={styles.visionBoardCard}>
          <Text style={[styles.boardTitle, { color: colors.text }]}>
            Seu Vision Board
          </Text>
          
          <View style={styles.visionBoardGrid}>
            {items.map((item, index) => renderVisionBoardItem(item, index))}
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 9 - items.length) }).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.emptySlot, { borderColor: colors.border }]}>
                <MaterialIcons name="add" size={24} color={colors.textMuted} />
              </View>
            ))}
          </View>

          {items.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="dashboard" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Seu Vision Board está vazio
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
                Adicione imagens, textos e símbolos que representem seus sonhos
              </Text>
            </View>
          )}
        </SacredCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={addImageToBoard}
          >
            <MaterialIcons name="add-photo-alternate" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Adicionar Imagem
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
            onPress={addTextToBoard}
          >
            <MaterialIcons name="text-fields" size={24} color={colors.secondary} />
            <Text style={[styles.actionButtonText, { color: colors.secondary }]}>
              Adicionar Texto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
            onPress={addEmojiToBoard}
          >
            <MaterialIcons name="emoji-emotions" size={24} color={colors.accent} />
            <Text style={[styles.actionButtonText, { color: colors.accent }]}>
              Adicionar Emoji
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Info */}
        <SacredCard style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialIcons 
              name={items.length > 0 ? 'check-circle' : 'radio-button-unchecked'} 
              size={24} 
              color={items.length > 0 ? colors.success : colors.textMuted} 
            />
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Status da Cocriação
            </Text>
          </View>
                    <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            {items.length > 0 
              ? '✨ Sua cocriação está ATIVA e pronta para manifestação!'
              : '✨ Sua cocriação está ATIVA! Adicione elementos ao seu Vision Board'
            }
          </Text>
        </SacredCard>

        {/* Finish Button */}
        <View style={styles.finishContainer}>
          <SacredButton
            title={items.length > 0 ? "Finalizar Vision Board" : "Adicione Itens Primeiro"}
            onPress={handleFinish}
            disabled={items.length === 0}
            style={styles.finishButton}
          />
        </View>

        {/* Info */}
        <SacredCard style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            💡 Dicas para seu Vision Board
          </Text>
          <View style={styles.tipsList}>
            <Text style={[styles.tip, { color: colors.textSecondary }]}>
              • Use imagens que despertem emoções positivas
            </Text>
            <Text style={[styles.tip, { color: colors.textSecondary }]}>
              • Adicione palavras e afirmações poderosas
            </Text>
            <Text style={[styles.tip, { color: colors.textSecondary }]}>
              • Inclua símbolos que representem seus sonhos
            </Text>
            <Text style={[styles.tip, { color: colors.textSecondary }]}>
              • Visualize-se já vivendo essa realidade
            </Text>
          </View>
        </SacredCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  visionBoardCard: {
    marginBottom: Spacing.lg,
  },
  boardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  visionBoardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: 200,
  },
  visionBoardItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  textItem: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  itemEmoji: {
    fontSize: 32,
  },
  emptySlot: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  finishContainer: {
    marginBottom: Spacing.lg,
  },
  finishButton: {
    marginHorizontal: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
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
  },
});