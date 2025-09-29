import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredButton from '@/components/ui/SacredButton';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/Colors';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const { invite, circleId } = useLocalSearchParams<{ invite?: string; circleId?: string }>();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // If user logged in with an invitation, go to alignment ritual
      if (invite) {
        const qs = circleId
          ? `token=${invite}&circleId=${circleId}`
          : `token=${invite}`;
        router.replace(`/alignment-ritual?${qs}`);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, invite, circleId]);

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showWebAlert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        showWebAlert(
          'Erro no Login',
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
            : error.message || 'Erro inesperado. Tente novamente.'
        );
        setIsLoading(false);
      } else {
        // Success - AuthContext will handle navigation
        // Check if there's a circle invite token to process
        if (Platform.OS === 'web') {
          const url = new URL(window.location.href);
          const circleInviteToken = url.searchParams.get('circleInviteToken');
          
          if (circleInviteToken) {
            // Clear the URL parameter and redirect to invitation details
            window.history.replaceState({}, document.title, window.location.pathname);
            router.replace(`/invitation-details?token=${circleInviteToken}`);
            return;
          }
        }
        
        // Normal login flow - go to home
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      showWebAlert('Erro Inesperado', 'Algo deu errado. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      showWebAlert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        console.error('SignUp error:', error);
        showWebAlert('Erro no Cadastro', error.message);
      } else {
        showWebAlert(
          'Conta Criada!', 
          'Verifique seu e-mail para confirmar sua conta.',
          () => {
            router.replace('/(tabs)');
          }
        );
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      showWebAlert('Erro Inesperado', 'Algo deu errado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Carregando...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.scrollView, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.appName, { color: colors.text }]}>Jaé</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Manifestação Consciente através da Presença
            </Text>
          </View>

          {/* Auth Form */}
          <SacredCard glowing style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </Text>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Nome Completo
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, color: colors.text },
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Seu nome completo"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Senha
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    { backgroundColor: colors.surface, color: colors.text },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <SacredButton
              title={isSignUp ? 'Criar Conta' : 'Entrar'}
              onPress={handleAuth}
              loading={isLoading}
              style={styles.authButton}
            />

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setFullName('');
              }}
            >
              <Text style={[styles.switchModeText, { color: colors.primary }]}>
                {isSignUp
                  ? 'Já tem uma conta? Entrar'
                  : 'Não tem conta? Criar agora'}
              </Text>
            </TouchableOpacity>
          </SacredCard>

          {/* Sacred Quote */}
          <SacredCard style={styles.quoteCard}>
            <Text style={[styles.quote, { color: colors.textSecondary }]}>
              "A manifestação acontece no silêncio da presença, onde intenção e
              emoção se encontram."
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
  },
  scrollView: {
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
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  authCard: {
    marginBottom: Spacing.xl,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.md,
    top: 13,
  },
  authButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quoteCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
});