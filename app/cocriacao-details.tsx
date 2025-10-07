import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl, // Importar o RefreshControl
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
// Remover a importação de useVisionBoard, pois não será mais usado para verificação de status
// import { useVisionBoard } from '@/hooks/useVisionBoard'; 
import { Spacing } from '@/constants/Colors';

export default function CocriacaoDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cocriations, deleteCocriation, loading, refresh } = useIndividualCocriations();
  
  // REMOVIDO: const { items: visionBoardItems, loading: visionBoardLoading, refresh: refreshVisionBoard } = useVisionBoard(id || '');

  const [cocriation, setCocriation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // REMOVIDO: const [isVisionBoardStarted, setIsVisionBoardStarted] = useState(false);
  
  // ADICIONADO: Estados para o RefreshControl
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingFromPull, setRefreshingFromPull] = useState(false); // Para distinguir o refresh manual

  // Atualizar cocriation quando cocriations array muda
  useEffect(() => {
    console.log('Cocriations updated, searching for id:', id);
    if (id && cocriations.length > 0) {
      const foundCocriation = cocriations.find(c => c.id === id);
      console.log('Found cocriation:', foundCocriation);
      setCocriation(foundCocriation);
      // REMOVIDO: setIsVisionBoardStarted(!!foundCocriation?.vision_board_items_count && foundCocriation.vision_board_items_count > 0);
    }
  }, [id, cocriations]);

  // ADICIONADO: Função para recarregar dados manualmente
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshingFromPull(true); // Indica que o refresh foi acionado pelo pull
    try {
      // Recarregar apenas a lista de cocriações (isso atualizará a cocriação específica via useEffect)
      await refresh();
      // O useEffect acima cuidará de atualizar 'cocriation' e 'isVisionBoardCompleted'
    } catch (error) {
      console.error("Erro ao recarregar dados:", error);
    } finally {