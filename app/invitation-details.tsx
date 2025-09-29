import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectiveCircles } from '@/hooks/useCollectiveCircles';
import { supabase } from '@/services/supabase';
import { Spacing } from '@/constants/Colors';

export default function InvitationDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { getInvitationDetails } = useCollectiveCircles();

  const [invitationData, setInvitationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitationDetails();
    }
  }, [token]);

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const loadInvitationDetails = async () => {
    if (!token) return;

    try {
      const result = await getInvitationDetails(token);
      
      if (result.error) {
        console.error('Error loading invitation details:', result.error);
        showWebAlert(
          'Convite Não Encontrado',
          'Este link de convite não é válido ou expirou.',
          () => router.replace('/app-pitch')
        );
      } else {
        setInvitationData(result.data);
      }
    } catch (error) {
      console.error('Unexpected error loading invitation:', error);
      showWebAlert(
        'Erro',
        'Não foi possível carregar os detalhes do convite.',
        () => router.replace('/app-pitch')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!user || !invitationData) return;

    setJoining(true);

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', invitationData.collective_circles.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        showWebAlert(
          'Já é Membro',
          'Você já faz parte deste círculo!',
          () => router.replace('/(tabs)/circulos')
        );
        return;
      }

      // Navigate to alignment ritual
      router.replace(`/alignment-ritual?token=${token}&circleId=${invitationData.collective_circles.id}`);
    } catch (error) {
      console.error('Error checking membership:', error);
      showWebAlert('Erro', 'Algo deu errado. Tente novamente.');
    } finally {
      setJoining(false);
    }
  };

  const handleDecline = () => {
    router.replace('/app-pitch');
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Carregando detalhes do convite...
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  if (!invitationData) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Convite Não Encontrado
            </Text>
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
              Este link de convite não é válido ou expirou.
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  const circle = invitationData.collective_circles;
  const inviter = invitationData.profiles;

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.text }]}>Jaé</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Manifestação Consciente
          </Text>
        </View>

        {/* Invitation Details Card */}
        <SacredCard glowing style={styles.invitationCard}>
          {/* Cover Image */}
          {circle.cover_image_url && (
            <Image 
              source={{ uri: circle.cover_image_url }} 
              style={styles.coverImage}
              contentFit="cover"
            />
          )}

          {/* Circle Info */}
          <View style={styles.circleInfo}>
            <Text style={[styles.circleTitle, { color: colors.text }]}>
              {circle.title}
            </Text>

            {circle.description && (
              <Text style={[styles.circleDescription, { color: colors.textSecondary }]}>
                {circle.description}
              </Text>
            )}

            {/* Inviter Info */}
            <View style={styles.inviterSection}>
              <MaterialIcons name="person" size={20} color={colors.primary} />
              <Text style={[styles.inviterText, { color: colors.textSecondary }]}>
                Convite de: {inviter.full_name || inviter.email}
              </Text>
            </View>

            {/* Personal Message */}
            {circle.personal_message && (
              <View style={styles.personalMessageSection}>
                <Text style={[styles.personalMessageTitle, { color: colors.text }]}>
                  Mensagem Pessoal
                </Text>
                <Text style={[styles.personalMessage, { color: colors.textSecondary }]}>
                  "{circle.personal_message}"
                </Text>
              </View>
            )}

            {/* Audio Invitation */}
            {circle.audio_invitation_url && (
              <View style={styles.audioSection}>
                <MaterialIcons name="mic" size={24} color={colors.accent} />
                <Text style={[styles.audioTitle, { color: colors.text }]}>
                  Convite em Áudio
                </Text>
                <Text style={[styles.audioDescription, { color: colors.textSecondary }]}>
                  Uma mensagem especial foi gravada para você
                </Text>
                {/* TODO: Implement audio player */}
              </View>
            )}
          </View>
        </SacredCard>

        {/* Circle Stats */}
        <SacredCard style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Sobre este Círculo
          </Text>
          
          <View style={styles.statsList}>
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

            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={20} color={colors.secondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                Criado em {new Date(circle.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </SacredCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <SacredButton
            title="Quero Cocriar"
            onPress={handleJoinCircle}
            loading={joining}
            style={styles.acceptButton}
          />
          
          <TouchableOpacity 
            style={[styles.declineButton, { borderColor: colors.border }]}
            onPress={handleDecline}
            disabled={joining}
          >
            <Text style={[styles.declineButtonText, { color: colors.textSecondary }]}>
              Agora Não
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "Quando nos unimos em propósito comum, criamos um campo sagrado 
            onde os milagres se tornam naturais."
          </Text>
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
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 13,
  },
  invitationCard: {
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
    textAlign: 'center',
  },
  circleDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inviterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
  },
  inviterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },
  personalMessageSection: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 12,
  },
  personalMessageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  personalMessage: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  audioSection: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  audioDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  statsList: {
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: Spacing.md,
    flex: 1,
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
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});