import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollectiveCircles } from '@/hooks/useCollectiveCircles';
import { Spacing } from '@/constants/Colors';

export default function CircleInviteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
    const { token } = useLocalSearchParams<{ token: string }>();
  const { getInvitationDetails } = useCollectiveCircles();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitationDetails();
    }
  }, [token]);

  const loadInvitationDetails = async () => {
    try {
      const result = await getInvitationDetails(token);
      
      if (result.error) {
        setError('Convite não encontrado ou expirado');
      } else {
        setInvitation(result.data);
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

    const handleAcceptInvite = () => {
    // Navigate to login/register with invitation token and circle info
    router.push(`/login?invite=${token}&circleId=${invitation.collective_circles.id}`);
  };

  const handleDeclineInvite = () => {
    // Navigate to app pitch page
    router.push('/app-pitch');
  };

  const shareInvite = async () => {
    const message = `${invitation.profiles.full_name} te convidou para um Círculo de Cocriação no Jaé! 🌟\n\nCircle: ${invitation.collective_circles.title}\n\nParticipe: ${window.location.href}`;
    
    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Convite para Círculo de Cocriação',
            text: message,
            url: window.location.href,
          });
        } catch (error) {
          // Fallback to copy link
          navigator.clipboard.writeText(window.location.href);
          alert('Link copiado para área de transferência!');
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para área de transferência!');
      }
    } else {
      try {
        await Share.share({
          message,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="group" size={64} color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando convite...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (error || !invitation) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Convite Inválido
            </Text>
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
              {error || 'Este convite não existe ou expirou.'}
            </Text>
            <SacredButton
              title="Conhecer o Jaé"
              onPress={handleDeclineInvite}
              style={styles.pitchButton}
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

  const circle = invitation.collective_circles;
  const inviter = invitation.profiles;

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="auto-awesome" size={32} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.text }]}>Jaé</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Manifestação Consciente
          </Text>
        </View>

        {/* Invitation Card */}
        <SacredCard glowing style={styles.invitationCard}>
          {circle.cover_image_url && (
            <Image 
              source={{ uri: circle.cover_image_url }} 
              style={styles.coverImage}
              contentFit="cover"
            />
          )}
          
          <View style={styles.invitationContent}>
            <Text style={[styles.inviteLabel, { color: colors.textMuted }]}>
              Você foi convidado por
            </Text>
            <Text style={[styles.inviterName, { color: colors.primary }]}>
              {inviter.full_name}
            </Text>
            
            <Text style={[styles.circleTitle, { color: colors.text }]}>
              {circle.title}
            </Text>
            
            <Text style={[styles.circleDescription, { color: colors.textSecondary }]}>
              {circle.description}
            </Text>

            {circle.personal_message && (
              <View style={styles.personalMessage}>
                <MaterialIcons name="format-quote" size={20} color={colors.accent} />
                <Text style={[styles.personalMessageText, { color: colors.textSecondary }]}>
                  {circle.personal_message}
                </Text>
              </View>
            )}

            {circle.audio_invitation_url && (
              <TouchableOpacity style={styles.audioPlayer}>
                <MaterialIcons name="play-circle-filled" size={32} color={colors.accent} />
                <Text style={[styles.audioText, { color: colors.textSecondary }]}>
                  Tocar mensagem de áudio
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SacredCard>

        {/* Default Invitation Message */}
        <SacredCard style={styles.defaultMessage}>
          <Text style={[styles.defaultMessageText, { color: colors.textSecondary }]}>
            Você está sendo convidado para um Círculo de Cocriação, um espaço sagrado 
            onde pessoas se reúnem em silêncio para manifestar um propósito comum. 
            Sem chats, sem notificações, apenas presença e intenção compartilhada.
          </Text>
        </SacredCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <SacredButton
            title="Quero Cocriar"
            onPress={handleAcceptInvite}
            style={styles.acceptButton}
          />
          
          <SacredButton
            title="Agora Não"
            onPress={handleDeclineInvite}
            variant="outline"
            style={styles.declineButton}
          />
        </View>

        {/* Share Button */}
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={shareInvite}
        >
          <MaterialIcons name="share" size={20} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.primary }]}>
            Compartilhar Convite
          </Text>
        </TouchableOpacity>

        {/* Circle Info */}
        <View style={styles.circleInfo}>
          <View style={styles.infoItem}>
            <MaterialIcons name="group" size={16} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Máximo {circle.max_members} membros
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="volume-off" size={16} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Sem notificações
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="auto-awesome" size={16} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Manifestação coletiva
            </Text>
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  pitchButton: {
    minWidth: 160,
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
  coverImage: {
    width: '100%',
    height: 160,
    marginBottom: Spacing.lg,
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
  inviterName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  circleTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  circleDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  personalMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  personalMessageText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginLeft: Spacing.sm,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  audioText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
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
  circleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
});