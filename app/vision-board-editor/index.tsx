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

  // ... (resto do código do componente principal)
}
