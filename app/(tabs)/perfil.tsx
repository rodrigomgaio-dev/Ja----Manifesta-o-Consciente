import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Colors';

export default function PerfilScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);

  const showWebAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      const confirmed = confirm(`${title}: ${message}`);
      if (confirmed && buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleLogout = () => {
    showWebAlert(
      'Confirmar Logout',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      console.log('Performing logout...');
      const { error } = await signOut();
      if (error) {
        console.error('Error during logout:', error);
        showWebAlert('Erro', 'Não foi possível fazer logout. Tente novamente.');
      } else {
        console.log('Logout successful');
        // Navigation is handled by signOut function
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      showWebAlert('Erro', 'Erro inesperado durante logout. Tente novamente.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeMode(newTheme);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="person-off" size={64} color={colors.textMuted} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              Usuário não encontrado
            </Text>
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
          <Text style={[styles.title, { color: colors.text }]}>
            Meu Perfil
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sua jornada de manifestação consciente
          </Text>
        </View>

        {/* User Info Card */}
        <SacredCard glowing style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {user.avatar_url ? (
                <MaterialIcons name="person" size={40} color="white" />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials(user.full_name)}
                </Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user.full_name || 'Usuário Jaé'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
            </View>
          </View>

          <View style={styles.userStats}>
            <Text style={[styles.joinDate, { color: colors.textMuted }]}>
              Membro desde {formatDate('2024-01-01')}
            </Text>
          </View>
        </SacredCard>

        {/* Theme Settings */}
        <SacredCard style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tema do Aplicativo
          </Text>
          
          <View style={styles.themeOptions}>
            {[
              { key: 'light', label: 'Claro', icon: 'light-mode' },
              { key: 'dark', label: 'Escuro', icon: 'dark-mode' },
              { key: 'auto', label: 'Automático', icon: 'brightness-auto' },
            ].map((theme) => (
              <TouchableOpacity
                key={theme.key}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === theme.key ? colors.primary + '20' : colors.surface,
                    borderColor: themeMode === theme.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleThemeChange(theme.key as 'light' | 'dark' | 'auto')}
              >
                <MaterialIcons 
                  name={theme.icon as any} 
                  size={24} 
                  color={themeMode === theme.key ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.themeLabel,
                  { color: themeMode === theme.key ? colors.primary : colors.text }
                ]}>
                  {theme.label}
                </Text>
                {themeMode === theme.key && (
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SacredCard>

        {/* App Info */}
        <SacredCard style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sobre o Jaé
          </Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Manifestação através da presença consciente
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="favorite" size={20} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Cocriação individual e coletiva
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="volume-off" size={20} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Silêncio como espaço sagrado
              </Text>
            </View>
          </View>

          <View style={styles.appVersion}>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>
              Versão 1.0.0
            </Text>
          </View>
        </SacredCard>

        {/* Logout Section */}
        <SacredCard style={styles.logoutCard}>
          <View style={styles.logoutContent}>
            <View style={styles.logoutInfo}>
              <Text style={[styles.logoutTitle, { color: colors.text }]}>
                Sessão
              </Text>
              <Text style={[styles.logoutDescription, { color: colors.textSecondary }]}>
                Faça logout para trocar de conta
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: colors.textMuted }]}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <MaterialIcons name="hourglass-empty" size={16} color={colors.textMuted} />
              ) : (
                <MaterialIcons name="exit-to-app" size={16} color={colors.textMuted} />
              )}
              <Text style={[styles.logoutButtonText, { color: colors.textMuted }]}>
                {loggingOut ? 'Saindo...' : 'Sair'}
              </Text>
            </TouchableOpacity>
          </View>
        </SacredCard>

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "A transformação acontece quando nos conectamos com nossa essência 
            e manifestamos a partir do amor incondicional."
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  userCard: {
    marginBottom: Spacing.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: 16,
    lineHeight: 20,
  },
  userStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  joinDate: {
    fontSize: 14,
    textAlign: 'center',
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  themeOptions: {
    gap: Spacing.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.md,
    lineHeight: 20,
  },
  appVersion: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: Spacing.md,
  },
  versionText: {
    fontSize: 12,
  },
  logoutCard: {
    marginBottom: Spacing.lg,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutInfo: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  logoutDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  logoutButtonText: {
    fontSize: 14,
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