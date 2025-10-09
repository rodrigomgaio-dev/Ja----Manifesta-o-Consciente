// app/vision-board-editor/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { supabase } from '@/services/supabase';
import GradientBackground from '@/components/ui/GradientBackground';
import { Spacing } from '@/constants/Colors';

export default function VisionBoardEditorScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { items, loading, error, addItem } = useVisionBoardItems(cocreationId);

  const [menuOpen, setMenuOpen] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  const toggleMenu = () => {
    const newState = !menuOpen;
    setMenuOpen(newState);
    rotation.value = withSpring(newState ? 45 : 0, { damping: 12 });
    scale.value = withTiming(newState ? 1 : 0, { duration: 300 });
  };

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  // --- Função para adicionar imagem ---
  const handleAddImage = async () => {
    try {
      toggleMenu();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0].uri) return;

      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop()!;
      const fileExt = filename.split('.').pop();
      const supabasePath = `vision_board/${Date.now()}_${filename}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('vision-board')
        .upload(supabasePath, blob);

      if (uploadError) throw uploadError;

      const { publicURL, error: urlError } = supabase.storage
        .from('vision-board')
        .getPublicUrl(supabasePath);

      if (urlError) throw urlError;

      // Adiciona o item no board
      await addItem({
        type: 'image',
        uri: publicURL,
        x: 50,
        y: 50,
        width: 150,
        height: 150,
        rotation: 0,
        zindex: items.length + 1,
      });
    } catch (err: any) {
      Alert.alert("Erro ao adicionar imagem", err.message || "Erro desconhecido");
      console.error("Erro handleAddImage:", err);
    }
  };

  if (!cocreationId || typeof cocreationId !== 'string') {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ErrorView message="ID da Cocriação inválido ou não fornecido." onBack={() => router.back()} />
        </View>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ErrorView message={error} onBack={() => router.back()} />
        </View>
      </GradientBackground>
    );
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando elementos do Vision Board...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ErrorView message="Você precisa estar logado para editar este Vision Board." onBack={() => router.back()} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>Editor do Vision Board</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Canvas */}
        <View style={styles.canvas}>
          {items.map((item) => {
            if (item.type === 'image' && 'uri' in item) {
              return (
                <Image
                  key={item.id}
                  source={{ uri: item.uri }}
                  style={{
                    position: 'absolute',
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    transform: [{ rotate: `${item.rotation}deg` }],
                    zIndex: item.zindex,
                    borderRadius: 8,
                  }}
                  contentFit="cover"
                />
              );
            }

            if (item.type === 'text' && 'content' in item) {
              return (
                <Text
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: item.x,
                    top: item.y,
                    fontSize: item.fontSize,
                    color: item.color,
                    zIndex: item.zindex,
                  }}
                >
                  {item.content}
                </Text>
              );
            }

            return null;
          })}

          {items.length === 0 && (
            <Text style={[styles.canvasPlaceholder, { color: colors.textSecondary }]}>
              Toque no botão + para adicionar elementos
            </Text>
          )}
        </View>

        {/* Menu flutuante */}
        <Animated.View
          style={[
            styles.floatingMenu,
            menuAnimatedStyle,
            { bottom: insets.bottom + 100, right: 30 },
          ]}
        >
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.primary }]} onPress={handleAddImage}>
            <MaterialIcons name="image" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.primary }]} onPress={() => toggleMenu()}>
            <MaterialIcons name="text-fields" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.primary }]} onPress={() => toggleMenu()}>
            <MaterialIcons name="emoji-emotions" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.primary }]} onPress={() => toggleMenu()}>
            <MaterialIcons name="auto-awesome" size={22} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Botão flutuante principal */}
        <Animated.View
          style={[
            styles.floatingButtonContainer,
            { bottom: insets.bottom + 40, right: 30, transform: [{ rotate: `${rotation.value}deg` }] },
          ]}
        >
          <TouchableOpacity style={[styles.floatingButton, { backgroundColor: colors.primary }]} onPress={toggleMenu}>
            <MaterialIcons name="add" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

function ErrorView({ message, onBack }: { message: string; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error" size={64} color={colors.error} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>Erro</Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>{message}</Text>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.textMuted }]} onPress={onBack}>
        <Text style={[styles.backButtonText, { color: 'white' }]}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: { padding: Spacing.xs, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  canvas: {
    flex: 1,
    margin: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasPlaceholder: { fontSize: 16, textAlign: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  errorTitle: { fontSize: 24, fontWeight: 'bold', marginTop: Spacing.md, marginBottom: Spacing.sm },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: Spacing.lg },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  loadingText: { fontSize: 16, marginTop: Spacing.md, textAlign: 'center' },

  // Botão flutuante
  floatingButtonContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3.5,
  },

  // Menu flutuante animado
  floatingMenu: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  menuItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
});
