// app/vision-board-editor/index.tsx (atualizado com tratamento de erros)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
  ActivityIndicator, // Adicionado
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
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { Spacing } from '@/constants/Colors';

// ... (resto das importações e tipos)

export default function VisionBoardEditorScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { cocreationId } = useLocalSearchParams<{ cocreationId: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // --- LOGS DETALHADOS PARA DIAGNÓSTICO ---
  console.log("[VisionBoardEditor] Iniciando componente...");
  console.log("[VisionBoardEditor] cocreationId recebido:", cocreationId);
  console.log("[VisionBoardEditor] Tipo de cocreationId:", typeof cocreationId);

  // Validar cocreationId
  if (!cocreationId || typeof cocreationId !== 'string') {
    console.error("[VisionBoardEditor] ERRO CRÍTICO: cocreationId inválido ou não fornecido!");
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Erro Crítico
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              ID da Cocriação inválido ou não fornecido.
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.textMuted }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: 'white' }]}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  const { items, loading, error, addItem, updateItem, deleteItem, refresh } = useVisionBoardItems(cocreationId);

  // --- LOGS DETALHADOS PARA DIAGNÓSTICO ---
  console.log("[VisionBoardEditor] Hook useVisionBoardItems chamado com sucesso.");
  console.log("[VisionBoardEditor] Estado do hook:", { items, loading, error });

  // --- TRATAMENTO DE ERRO DO HOOK ---
  if (error) {
    console.error("[VisionBoardEditor] Erro retornado pelo hook useVisionBoardItems:", error);
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
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.textMuted }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: 'white' }]}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  // --- ESTADO DE LOADING ---
  if (loading) {
    console.log("[VisionBoardEditor] Carregando dados...");
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

  // --- VERIFICAÇÃO DE USUÁRIO ---
  if (!user) {
    console.log("[VisionBoardEditor] Usuário não autenticado.");
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Acesso Negado
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Você precisa estar logado para editar este Vision Board.
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.textMuted }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: 'white' }]}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  // --- COMPONENTE PRINCIPAL ---
  console.log("[VisionBoardEditor] Renderizando componente principal com", items.length, "itens.");

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Editor do Vision Board
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {/* TODO: implementar adição de elementos */}}
          >
            <MaterialIcons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.canvas}>
          <Text style={[styles.canvasPlaceholder, { color: colors.textSecondary }]}>
            {items.length === 0 ? 'Toque no botão + para adicionar elementos' : `${items.length} elementos`}
          </Text>
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: Spacing.xs,
    borderRadius: 8,
  },
  addButton: {
    padding: Spacing.xs,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
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
  canvasPlaceholder: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
