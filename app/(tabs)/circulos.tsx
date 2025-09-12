import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

export default function CirculosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
            </Text>
            <SacredButton
              title="Criar Agora"
              onPress={() => router.push('/create-circle')}
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
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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