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
      setRefreshing(false);
      setRefreshingFromPull(false);
    }
  }, [refresh]);

  if (loading && !refreshingFromPull) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Carregando...</Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (!cocriation) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Cocriação não encontrada</Text>
            <SacredButton
              title="Voltar"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Excluir Cocriação",
      "Tem certeza que deseja excluir esta cocriação? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteCocriation(cocriation.id);
              router.back();
            } catch (error) {
              console.error('Erro ao excluir cocriação:', error);
              Alert.alert('Erro', 'Não foi possível excluir a cocriação');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleVisionBoardAccess = () => {
    // Verificar se o vision board foi completado usando o campo vision_board_completed
    if (cocriation.vision_board_completed) {
      // Se completado, navegar para a tela de visualização
      router.push({
        pathname: '/vision-board-view',
        params: { cocreationId: cocriation.id }
      });
    } else {
      // Se não completado, navegar para a tela de edição
      router.push({
        pathname: '/vision-board',
        params: { cocreationId: cocriation.id }
      });
    }
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <SacredCard style={styles.card}>
          {cocriation.cover_image_url && (
            <Image
              source={{ uri: cocriation.cover_image_url }}
              style={styles.coverImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              {cocriation.title}
            </Text>
            
            {cocriation.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {cocriation.description}
              </Text>
            )}
            
            {cocriation.why_reason && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.accent }]}>Seu Porquê</Text>
                <Text style={[styles.sectionText, { color: colors.text }]}>
                  {cocriation.why_reason}
                </Text>
              </View>
            )}
            
            {cocriation.mental_code && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.accent }]}>Código Mental</Text>
                <Text style={[styles.sectionText, { color: colors.text }]}>
                  {cocriation.mental_code}
                </Text>
              </View>
            )}
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>Status</Text>
              <Text style={[styles.sectionText, { color: colors.text }]}>
                {cocriation.status === 'active' ? 'Ativo' : cocriation.status}
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>Criado em</Text>
              <Text style={[styles.sectionText, { color: colors.text }]}>
                {new Date(cocriation.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </SacredCard>

        <View style={styles.actions}>
          <SacredButton
            title="Vision Board"
            onPress={handleVisionBoardAccess}
            variant="primary"
            style={styles.actionButton}
          />
          
          <SacredButton
            title="Carta do Futuro"
            onPress={() => router.push({
              pathname: '/future-letter',
              params: { cocreationId: cocriation.id }
            })}
            variant="secondary"
            style={styles.actionButton}
          />
          
          <SacredButton
            title="Editar"
            onPress={() => router.push({
              pathname: '/edit-individual',
              params: { id: cocriation.id }
            })}
            variant="secondary"
            style={styles.actionButton}
          />
          
          <SacredButton
            title="Excluir"
            onPress={handleDelete}
            variant="destructive"
            style={styles.actionButton}
            loading={isDeleting}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing.lg,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  content: {
    gap: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  actionButton: {
    marginHorizontal: 0,
  },
});