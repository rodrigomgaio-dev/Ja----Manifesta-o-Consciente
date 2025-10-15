import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      icon: 'dashboard',
      title: 'Painel',
      description: 'Acompanhe suas cocriações',
      route: '/(tabs)/painel',
      iconBg: 'rgba(139, 92, 246, 0.2)',
      iconColor: colors.primary,
    },
    {
      icon: 'person',
      title: 'Minhas Cocriações',
      description: 'Vision Board e práticas pessoais',
      route: '/(tabs)/individual',
      iconBg: 'rgba(236, 72, 153, 0.2)',
      iconColor: colors.secondary,
    },
    {
      icon: 'group',
      title: 'Círculos de Cocriação',
      description: 'Círculos de até 13 pessoas',
      route: '/(tabs)/circulos',
      iconBg: 'rgba(59, 130, 246, 0.2)',
      iconColor: colors.accent,
    },
    {
      icon: 'spa',
      title: 'Práticas Diárias',
      description: 'Meditação, gratidão e mantras',
      route: '/(tabs)/praticas',
      iconBg: 'rgba(168, 85, 247, 0.2)',
      iconColor: colors.primary,
    },
  ];

  return (
    <GradientBackground>
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.gold || '#D4AF37' }]}>
            Jaé
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Transforme a manifestação em um ritual de{'\n'}presença, silêncio e emoção
          </Text>
        </View>

        {/* Menu Cards */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <SacredCard
              key={index}
              animated
              onPress={() => router.push(item.route as any)}
              style={styles.menuCard}
            >
              <View style={styles.menuCardContent}>
                <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons 
                    name={item.icon as any} 
                    size={28} 
                    color={item.iconColor} 
                  />
                </View>
                
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>

                <MaterialIcons 
                  name="chevron-right" 
                  size={24} 
                  color={colors.textMuted} 
                />
              </View>
            </SacredCard>
          ))}
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "A manifestação acontece no silêncio da presença, onde{'\n'}intenção e emoção se encontram."
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
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 6,
    marginBottom: Spacing.lg,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  menuContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  menuCard: {
    marginBottom: 0,
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  menuDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  quote: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
});
