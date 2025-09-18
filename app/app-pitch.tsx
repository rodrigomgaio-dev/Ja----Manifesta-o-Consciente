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
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

export default function AppPitchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    router.push('/login');
  };

  const features = [
    {
      icon: 'person',
      title: 'Cocriação Individual',
      description: 'Crie seu Vision Board pessoal e manifeste seus sonhos com práticas diárias de presença.',
    },
    {
      icon: 'group',
      title: 'Círculos de Cocriação',
      description: 'Forme grupos íntimos de até 13 pessoas para manifestar propósitos comuns em silêncio.',
    },
    {
      icon: 'volume-off',
      title: 'Sem Notificações',
      description: 'Manifestação acontece no silêncio. Sem chats, sem ruído, apenas presença e intenção.',
    },
    {
      icon: 'auto-awesome',
      title: 'NFT Simbólico',
      description: 'Ao concluir sua jornada, receba um certificado emocional único da sua conquista.',
    },
  ];

  const principles = [
    'Silêncio como espaço sagrado de criação',
    'Presença consciente em cada momento',
    'Emoção como força transformadora',
    'Comunhão sem necessidade de palavras',
    'Manifestação através da intenção pura',
  ];

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="auto-awesome" size={48} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.text }]}>Jaé</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Manifestação Consciente através da Presença
          </Text>
        </View>

        {/* Hero Section */}
        <SacredCard glowing style={styles.heroCard}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Transforme seus sonhos em realidade
          </Text>
          <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
            O Jaé é um aplicativo revolucionário que transforma a manifestação 
            em um ritual de presença, silêncio e emoção. Crie sozinho ou em 
            círculos íntimos, sempre em silêncio sagrado.
          </Text>
          <SacredButton
            title="Começar Jornada"
            onPress={handleGetStarted}
            style={styles.heroButton}
          />
        </SacredCard>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Como Funciona
          </Text>
          
          {features.map((feature, index) => (
            <SacredCard key={index} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <MaterialIcons 
                  name={feature.icon as any} 
                  size={32} 
                  color={colors.primary} 
                />
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
              </View>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {feature.description}
              </Text>
            </SacredCard>
          ))}
        </View>

        {/* Principles */}
        <SacredCard style={styles.principlesCard}>
          <Text style={[styles.principlesTitle, { color: colors.text }]}>
            Princípios Sagrados
          </Text>
          <Text style={[styles.principlesSubtitle, { color: colors.textSecondary }]}>
            O Jaé é baseado em princípios milenares de manifestação consciente
          </Text>
          
          <View style={styles.principlesList}>
            {principles.map((principle, index) => (
              <View key={index} style={styles.principleItem}>
                <MaterialIcons 
                  name="fiber-manual-record" 
                  size={8} 
                  color={colors.primary} 
                />
                <Text style={[styles.principleText, { color: colors.textSecondary }]}>
                  {principle}
                </Text>
              </View>
            ))}
          </View>
        </SacredCard>

        {/* Journey Steps */}
        <View style={styles.journeySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sua Jornada de Manifestação
          </Text>
          
          <View style={styles.stepsList}>
            {[
              { step: 1, title: 'Defina sua Intenção', desc: 'Crie seu título e descrição com clareza' },
              { step: 2, title: 'Vision Board', desc: 'Adicione imagens, textos e símbolos' },
              { step: 3, title: 'Carta ao Futuro', desc: 'Escreva para o você que já conquistou' },
              { step: 4, title: 'Práticas Diárias', desc: 'Cultive presença com meditação e gratidão' },
              { step: 5, title: 'Manifestação', desc: 'Acompanhe sua jornada até a conclusão' },
              { step: 6, title: 'Certificado NFT', desc: 'Receba seu certificado emocional único' },
            ].map((item, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <SacredCard glowing style={styles.ctaCard}>
          <MaterialIcons name="rocket-launch" size={48} color={colors.accent} />
          <Text style={[styles.ctaTitle, { color: colors.text }]}>
            Pronto para Manifestar?
          </Text>
          <Text style={[styles.ctaDescription, { color: colors.textSecondary }]}>
            Junte-se a milhares de pessoas que já transformaram seus sonhos em realidade.
          </Text>
          <SacredButton
            title="Criar Conta Grátis"
            onPress={handleGetStarted}
            style={styles.ctaButton}
          />
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.loginLinkText, { color: colors.primary }]}>
              Já tem conta? Entrar
            </Text>
          </TouchableOpacity>
        </SacredCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            "A manifestação acontece no silêncio da presença, onde intenção e emoção se encontram."
          </Text>
        </View>
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
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 6,
    marginTop: Spacing.md,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroDescription: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  heroButton: {
    minWidth: 200,
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  featureCard: {
    marginBottom: Spacing.lg,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  principlesCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  principlesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  principlesSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  principlesList: {
    alignSelf: 'stretch',
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
  journeySection: {
    marginBottom: Spacing.xl,
  },
  stepsList: {
    gap: Spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ctaDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  ctaButton: {
    minWidth: 200,
    marginBottom: Spacing.md,
  },
  loginLink: {
    paddingVertical: Spacing.sm,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});