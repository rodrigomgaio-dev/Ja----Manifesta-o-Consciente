import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

export default function CircleInviteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const handleAcceptInvite = () => {
    router.push(`/login?invite=${token}`);
  };

  const handleDeclineInvite = () => {
    router.push('/app-pitch');
  };

  const shareInvite = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const message = `Você foi convidado para um Círculo de Cocriação no Jaé! 🌟\n\nParticipe: ${url}`;
    try {
      if (Platform.OS === 'web' && (navigator as any)?.share) {
        await (navigator as any).share({ title: 'Convite para Círculo de Cocriação', text: message, url });
      } else {
        await Share.share({ message, url });
      }
    } catch {}
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MaterialIcons name="auto-awesome" size={32} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.text }]}>Jaé</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>Manifestação Consciente</Text>
        </View>

        <SacredCard glowing style={styles.invitationCard}>
          <View style={styles.invitationContent}>
            <Text style={[styles.inviteLabel, { color: colors.textMuted }]}>Convite para Círculo</Text>
            <Text style={[styles.circleTitle, { color: colors.text }]}>Junte-se a um Círculo de Cocriação</Text>
            <Text style={[styles.circleDescription, { color: colors.textSecondary }]}>
              Para proteger a privacidade do círculo, os detalhes só aparecem após login.
            </Text>
          </View>
        </SacredCard>

        <SacredCard style={styles.defaultMessage}>
          <Text style={[styles.defaultMessageText, { color: colors.textSecondary }]}>
            Faça login para ver quem convidou, o propósito e aceitar sua participação.
          </Text>
        </SacredCard>

        <View style={styles.actionButtons}>
          <SacredButton title="Fazer Login e Continuar" onPress={handleAcceptInvite} style={styles.acceptButton} />
          <SacredButton title="Agora Não" onPress={handleDeclineInvite} variant="outline" style={styles.declineButton} />
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
          <MaterialIcons name="share" size={20} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.primary }]}>Compartilhar Convite</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  appName: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 4,
    marginTop: Spacing.sm,
  },
  tagline: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  invitationCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  invitationContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  inviteLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  circleTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  circleDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  defaultMessage: {
    marginBottom: Spacing.xl,
  },
  defaultMessageText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  acceptButton: {
    marginHorizontal: Spacing.md,
  },
  declineButton: {
    marginHorizontal: Spacing.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },
});