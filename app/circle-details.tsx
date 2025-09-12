import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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

export default function CircleDetailsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, token } = useLocalSearchParams<{ id: string; token?: string }>();
  const { circles, loading } = useCollectiveCircles();

  const [circle, setCircle] = useState<any>(null);
  const [inviteUrl, setInviteUrl] = useState<string>('');

  useEffect(() => {
    if (id && circles.length > 0) {
      const foundCircle = circles.find(c => c.id === id);
      setCircle(foundCircle);
    }
  }, [id, circles]);

    useEffect(() => {
    if (token) {
      // Construct invite URL for Expo Router
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://yourapp.com';
      //setInviteUrl(`${baseUrl}/circle-invite/${token}`);

      // Cursor solution    
      //  const path =
      //Platform.OS === 'web'
      //? `/#/circle-invite/${token}`
      //: `/circle-invite/${token}`;
      //setInviteUrl(`${baseUrl}${path}`);

      //Qwen solution
          setInviteUrl(`${baseUrl}/?circleInviteToken=${token}`);

    }
  }, [token]);

  const copyInviteLink = async () => {
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(inviteUrl);
          alert('Link copiado para área de transferência!');
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = inviteUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Link copiado!');
        }
      }
    } else {
      try {
        await Share.share({
          message: `Você foi convidado para um Círculo de Cocriação no Jaé! 🌟\n\nCircle: ${circle?.title}\n\nParticipe: ${inviteUrl}`,
          url: inviteUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `🌟 Você foi convidado para um Círculo de Cocriação no Jaé!\n\n` +
      `Circle: ${circle?.title}\n\n` +
      `Participe: ${inviteUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    
    if (Platform.OS === 'web') {
      window.open(whatsappUrl, '_blank');
    } else {
      Linking.openURL(whatsappUrl);
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando detalhes do círculo...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (!circle) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Círculo não encontrado
            </Text>
            <SacredButton
              title="Voltar"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

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

        {/* Circle Info */}
        <SacredCard glowing style={styles.circleCard}>
          {circle.cover_image_url && (
            <Image 
              source={{ uri: circle.cover_image_url }} 
              style={styles.coverImage}
              contentFit="cover"
            />
          )}
          
          <View style={styles.circleInfo}>
            <Text style={[styles.circleTitle, { color: colors.text }]}>
              {circle.title}
            </Text>
            
            <Text style={[styles.circleDescription, { color: colors.textSecondary }]}>
              {circle.description}
            </Text>

            <View style={styles.circleStats}>
              <View style={styles.statItem}>
                <MaterialIcons name="group" size={20} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Máximo {circle.max_members} membros
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="auto-awesome" size={20} color={colors.accent} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Status: {circle.status === 'forming' ? 'Formando' : 
                          circle.status === 'active' ? 'Ativo' : 'Concluído'}
                </Text>
              </View>
            </View>
          </View>
        </SacredCard>

        {/* Invite Section */}
        {token && (
          <SacredCard style={styles.inviteCard}>
            <Text style={[styles.inviteTitle, { color: colors.text }]}>
              Convidar Participantes
            </Text>
            <Text style={[styles.inviteDescription, { color: colors.textSecondary }]}>
              Compartilhe este link para convidar pessoas para seu círculo sagrado
            </Text>

            <View style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: colors.textMuted }]} numberOfLines={2}>
                {inviteUrl}
              </Text>
            </View>

            <View style={styles.shareActions}>
              <SacredButton
                title="Copiar Link"
                onPress={copyInviteLink}
                style={styles.shareButton}
              />
              
              <TouchableOpacity 
                style={[styles.whatsappButton, { backgroundColor: colors.success + '20' }]}
                onPress={shareWhatsApp}
              >
                <MaterialIcons name="share" size={20} color={colors.success} />
                <Text style={[styles.whatsappText, { color: colors.success }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          </SacredCard>
        )}

        {/* Personal Message */}
        {circle.personal_message && (
          <SacredCard style={styles.messageCard}>
            <Text style={[styles.messageTitle, { color: colors.text }]}>
              Sua Mensagem Pessoal
            </Text>
            <Text style={[styles.messageContent, { color: colors.textSecondary }]}>
              "{circle.personal_message}"
            </Text>
          </SacredCard>
        )}

        {/* Audio Invitation */}
        {circle.audio_invitation_url && (
          <SacredCard style={styles.audioCard}>
            <MaterialIcons name="mic" size={32} color={colors.accent} />
            <Text style={[styles.audioTitle, { color: colors.text }]}>
              Convite em Áudio
            </Text>
            <Text style={[styles.audioDescription, { color: colors.textSecondary }]}>
              Você gravou uma mensagem especial para seus convidados
            </Text>
          </SacredCard>
        )}

        {/* Sacred Principles Reminder */}
        <SacredCard style={styles.principlesCard}>
          <Text style={[styles.principlesTitle, { color: colors.text }]}>
            Princípios do Círculo Sagrado
          </Text>
          <View style={styles.principlesList}>
            {[
              { icon: 'volume-off', text: 'Silêncio: Sem chats ou notificações' },
              { icon: 'favorite', text: 'Intimidade: Máximo 13 pessoas' },
              { icon: 'schedule', text: 'Presença: Momentos sincronizados' },
              { icon: 'how-to-vote', text: 'Consenso: Decisões coletivas' },
            ].map((principle, index) => (
              <View key={index} style={styles.principleItem}>
                <MaterialIcons 
                  name={principle.icon as any} 
                  size={16} 
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
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
  circleCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 200,
    marginBottom: Spacing.lg,
  },
  circleInfo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  circleTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  circleDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  circleStats: {
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  inviteCard: {
    marginBottom: Spacing.lg,
  },
  inviteTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inviteDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  linkContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  linkText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  shareActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  shareButton: {
    flex: 2,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  whatsappText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  messageCard: {
    marginBottom: Spacing.lg,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  messageContent: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  audioCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  audioDescription: {
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