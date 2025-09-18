import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={[styles.scrollView, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="auto-awesome" size={28} color={colors.primary} />
            <Text style={[styles.appName, { color: colors.text }]}>Jaé</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              Manifestação Consciente
            </Text>
          </View>

          {/* Main Invitation Card */}
          <SacredCard glowing style={styles.invitationCard}>
            <View style={styles.invitationContent}>
              {/* Sacred Symbol */}
              <View style={styles.symbolContainer}>
                <MaterialIcons name="groups" size={48} color={colors.primary} />
              </View>

              {/* Title */}
              <Text style={[styles.inviteTitle, { color: colors.text }]}>
                Convite a um Círculo de Cocriação
              </Text>

              {/* Explanation */}
              <Text style={[styles.explanation, { color: colors.textSecondary }]}>
                "Quando duas ou mais pessoas, conectadas em propósito, se juntam intencionalmente 
                para cocriarem uma nova realidade."
              </Text>

              {/* Main Message */}
              <View style={styles.messageContainer}>
                <Text style={[styles.mainMessage, { color: colors.text }]}>
                  Você está sendo chamado(a){'\n'}
                  por alguém que vê em você{'\n'}
                  um(a) parceiro(a) essencial de propósito.
                </Text>

                <View style={styles.exclusivityContainer}>
                  <MaterialIcons name="lock" size={20} color={colors.accent} />
                  <Text style={[styles.exclusivityText, { color: colors.textSecondary }]}>
                    Este não é um convite aberto.
                  </Text>
                </View>

                <Text style={[styles.callToAction, { color: colors.text }]}>
                  É um chamado pessoal de alinhamento intencional para unir forças 
                  e juntos alcançarem um objetivo em comum.
                </Text>

                <Text style={[styles.instruction, { color: colors.textMuted }]}>
                  Crie sua conta gratuita ou{'\n'}
                  Faça o seu login para entender melhor.
                </Text>
              </View>
            </View>
          </SacredCard>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <SacredButton 
              title="Quero Entender" 
              onPress={handleAcceptInvite} 
              style={styles.acceptButton} 
            />
            
            <TouchableOpacity 
              style={[styles.declineButton, { borderColor: colors.border }]}
              onPress={handleDeclineInvite}
            >
              <Text style={[styles.declineButtonText, { color: colors.textSecondary }]}>
                Agora Não
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sacred Quote */}
          <SacredCard style={styles.quoteCard}>
            <Text style={[styles.quote, { color: colors.textSecondary }]}>
              "A manifestação acontece no silêncio da presença, onde intenção e emoção se encontram."
            </Text>
          </SacredCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  appName: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 3,
    marginTop: Spacing.sm,
  },
  tagline: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  invitationCard: {
    marginBottom: Spacing.xl,
  },
  invitationContent: {
    alignItems: 'center',
  },
  symbolContainer: {
    marginBottom: Spacing.lg,
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  explanation: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  messageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  mainMessage: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Spacing.xl,
  },
  exclusivityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  exclusivityText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  callToAction: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  acceptButton: {
    marginHorizontal: Spacing.md,
  },
  declineButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quoteCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  quote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});