import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollectiveCircles } from '@/hooks/useCollectiveCircles';
import { Spacing } from '@/constants/Colors';
export default function CirculosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { circles, loading } = useCollectiveCircles();

  const handleCreateNew = () => {
    router.push('/create-circle');
  };

  const renderCircle = (circle: any) => (
    <SacredCard
      key={circle.id}
      animated
      onPress={() => router.push(`/circle-details?id=${circle.id}`)}
      style={styles.circleCard}
    >
        {circle.cover_image_url && (
          <Image 
            source={{ uri: circle.cover_image_url }} 
            style={styles.coverImage}
            contentFit="cover"
          />
        )}
        <View style={styles.circleHeader}>
          <View style={styles.circleInfo}>
            <Text style={[styles.circleTitle, { color: colors.text }]}>
              {circle.title}
            </Text>
            {circle.description && (
              <Text style={[styles.circleDescription, { color: colors.textSecondary }]}>
                {circle.description.length > 100 
                  ? circle.description.substring(0, 100) + '...' 
                  : circle.description}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: circle.status === 'active' ? colors.primary + '20' : 
                           circle.status === 'forming' ? colors.secondary + '20' : colors.success + '20' 
          }]}>
            <Text style={[styles.statusText, { 
              color: circle.status === 'active' ? colors.primary : 
                    circle.status === 'forming' ? colors.secondary : colors.success 
            }]}>
              {circle.status === 'active' ? 'Ativo' : 
               circle.status === 'forming' ? 'Formando' : 'Concluído'}
            </Text>
          </View>
        </View>
        
        <View style={styles.circleStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="group" size={16} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              Máx. {circle.max_members} membros
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color={colors.accent} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              Criado em {new Date(circle.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </SacredCard>
  );

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Círculos de Cocriação
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Manifestação coletiva em silêncio sagrado
          </Text>
        </View>

                        {/* Create Circle */}
        <SacredCard glowing style={styles.createCard}>
          <View style={styles.createContent}>
            <MaterialIcons 
              name="group-add" 
              size={48} 
              color={colors.accent} 
            />
            <Text style={[styles.createTitle, { color: colors.text }]}>
              Criar Círculo
            </Text>
            <Text style={[styles.createDescription, { color: colors.textSecondary }]}>
              Forme um grupo íntimo de até 13 pessoas para manifestar um propósito comum
            </Text>            <SacredButton
              title="Criar Agora"
              onPress={handleCreateNew}
              variant="secondary"
              style={styles.createButton}
            />
          </View>
        </SacredCard>

        {/* Join Circle */}
        <SacredCard style={styles.joinCard}>
          <View style={styles.joinContent}>
            <MaterialIcons 
              name="link" 
              size={32} 
              color={colors.primary} 
            />
            <View style={styles.joinText}>
              <Text style={[styles.joinTitle, { color: colors.text }]}>
                Participar de Círculo
              </Text>
              <Text style={[styles.joinDescription, { color: colors.textSecondary }]}>
                Recebeu um convite? Use o link para entrar
              </Text>
            </View>
            <SacredButton
              title="Entrar"
              onPress={() => {}}
              variant="outline"
              size="sm"
            />
          </View>
        </SacredCard>
        {/* My Circles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Meus Círculos
          </Text>
          
          {loading ? (
            <SacredCard style={styles.loadingCard}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Carregando seus círculos...
              </Text>
            </SacredCard>
          ) : circles.length > 0 ? (
            circles.map(renderCircle)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons 
                name="groups" 
                size={64} 
                color={colors.textMuted} 
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Seu primeiro círculo te aguarda
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
                Crie ou participe de um círculo para manifestar em comunhão
              </Text>
            </View>
          )}
        </View>

        {/* Sacred Principles */}
        <SacredCard style={styles.principlesCard}>
          <Text style={[styles.principlesTitle, { color: colors.text }]}>
            Princípios Sagrados
          </Text>
          <View style={styles.principlesList}>
            {[
              { icon: 'volume-off', text: 'Silêncio: Sem chats ou notificações' },
              { icon: 'favorite', text: 'Intimidade: Máximo de 13 pessoas' },
              { icon: 'schedule', text: 'Presença: Momentos sincronizados' },
              { icon: 'how-to-vote', text: 'Consenso: Decisões coletivas' },
              { icon: 'auto-awesome', text: 'Intenção: Foco no propósito comum' },
            ].map((principle, index) => (
              <View key={index} style={styles.principleItem}>
                <MaterialIcons 
                  name={principle.icon as any} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.principleText, { color: colors.textSecondary }]}>
                  {principle.text}
                </Text>
              </View>
            ))}
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
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  createCard: {
    marginBottom: Spacing.lg,
  },
  createContent: {
    alignItems: 'center',
  },
  createTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  createDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  createButton: {
    minWidth: 160,
  },
  joinCard: {
    marginBottom: Spacing.xl,
  },
  joinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinText: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  joinTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  joinDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  circleCard: {
    marginBottom: Spacing.md,
  },
  coverImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: Spacing.md,
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  circleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  circleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  circleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  circleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  principlesCard: {
    marginBottom: Spacing.xl,
  },
  principlesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  principlesList: {
    gap: Spacing.md,
  },
  principleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  principleText: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.md,
    lineHeight: 20,
  },
});