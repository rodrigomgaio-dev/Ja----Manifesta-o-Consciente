// app/completed-cocreations.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { Spacing } from '@/constants/Colors';

export default function CompletedCocreationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocriations, loading } = useIndividualCocriations();

  // Filtrar apenas cocriações concluídas
  const completedCocriations = cocriations.filter(c => c.status === 'completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleViewNFT = (cocreationId: string) => {
    router.push(`/symbolic-nft?cocreationId=${cocreationId}`);
  };

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Cocriações Concluídas
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Celebre suas conquistas e visualize sua Memória de Cocriação
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <SacredCard style={styles.loadingCard}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando...
            </Text>
          </SacredCard>
        ) : completedCocriations.length === 0 ? (
          <SacredCard style={styles.emptyCard}>
            <MaterialIcons name="check-circle-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma Cocriação Concluída
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
              Suas cocriações concluídas aparecerão aqui
            </Text>
          </SacredCard>
        ) : (
          <View style={styles.cocriacoesList}>
            {completedCocriations.map((cocriation) => (
              <SacredCard
                key={cocriation.id}
                animated
                onPress={() => handleViewNFT(cocriation.id)}
                style={styles.cocriationCard}
              >
                {cocriation.cover_image_url && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: cocriation.cover_image_url }}
                      style={styles.coverImage}
                      contentFit="cover"
                    />
                    <View style={styles.completedBadge}>
                      <MaterialIcons name="verified" size={20} color="#FBBF24" />
                    </View>
                  </View>
                )}

                <View style={styles.cocriationContent}>
                  <View style={styles.cocriationHeader}>
                    <Text style={[styles.cocriationTitle, { color: colors.text }]}>
                      {cocriation.title}
                    </Text>
                    {cocriation.mental_code && (
                      <View style={[styles.mentalCodeBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.mentalCodeText}>
                          {cocriation.mental_code}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cocriationInfo}>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="calendar-today" size={16} color={colors.textMuted} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Concluída em {formatDate(cocriation.completion_date || cocriation.updated_at)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialIcons name="card-giftcard" size={16} color={colors.accent} />
                      <Text style={[styles.infoText, { color: colors.accent }]}>
                       Memória de Cocriação disponível
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cocriationActions}>
                    <TouchableOpacity
                      style={[styles.viewNFTButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleViewNFT(cocriation.id)}
                    >
                      <MaterialIcons name="visibility" size={18} color="white" />
                      <Text style={styles.viewNFTButtonText}>Ver Memória de Cocriação</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SacredCard>
            ))}
          </View>
        )}

        {/* Info Card */}
        {completedCocriations.length > 0 && (
          <SacredCard style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="auto-awesome" size={32} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Suas Conquistas
              </Text>
            </View>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              Você concluiu {completedCocriations.length}{' '}
              {completedCocriations.length === 1 ? 'cocriação' : 'cocriações'}! 
              Cada uma representa uma jornada de transformação e manifestação consciente.
            </Text>
          </SacredCard>
        )}
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  cocriacoesList: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cocriationCard: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 140,
  },
  completedBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocriationContent: {
    padding: Spacing.lg,
  },
  cocriationHeader: {
    marginBottom: Spacing.md,
  },
  cocriationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  mentalCodeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  mentalCodeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cocriationInfo: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
  },
  cocriationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewNFTButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  viewNFTButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
});
