import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Colors';

interface AffirmationItem {
  text: string;
  category: string;
  timestamp: Date;
}

const CATEGORIES = [
  { 
    label: 'Abundância', 
    value: 'abundance', 
    icon: '💰',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#60A5FA', '#93C5FD']
  },
  { 
    label: 'Amor', 
    value: 'love', 
    icon: '❤️',
    color: '#EC4899',
    gradient: ['#EC4899', '#F97316', '#FB923C']
  },
  { 
    label: 'Saúde', 
    value: 'health', 
    icon: '⭐',
    color: '#10B981',
    gradient: ['#10B981', '#3B82F6', '#06B6D4']
  },
  { 
    label: 'Sucesso', 
    value: 'success', 
    icon: '⚡',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706', '#B45309']
  },
];

const PREDEFINED_AFFIRMATIONS: Record<string, string[]> = {
  abundance: [
    'Eu sou abundância em todas as áreas da minha vida',
    'Dinheiro flui facilmente para mim',
    'Eu mereço prosperidade e riqueza',
    'Oportunidades financeiras me encontram constantemente',
  ],
  love: [
    'Eu sou digno de amor incondicional',
    'Meus relacionamentos são harmoniosos e amorosos',
    'Eu atraio pessoas que me valorizam',
    'Amor e gratidão preenchem meu coração',
  ],
  health: [
    'Meu corpo é saudável, forte e vibrante',
    'Cada célula do meu corpo irradia vitalidade',
    'Eu cuido do meu templo sagrado com amor',
    'Energia vital flui livremente através de mim',
  ],
  success: [
    'Eu realizo meus objetivos com facilidade',
    'O sucesso é meu estado natural',
    'Minhas ações criam resultados extraordinários',
    'Eu sou um imã para oportunidades',
  ],
};

export default function AffirmationsPracticeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cocreationId, circleId, title } = useLocalSearchParams<{ 
    cocreationId?: string; 
    circleId?: string;
    title?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customAffirmation, setCustomAffirmation] = useState('');
  const [myAffirmations, setMyAffirmations] = useState<AffirmationItem[]>([]);

  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);
  const currentAffirmations = selectedCategory ? (PREDEFINED_AFFIRMATIONS[selectedCategory] || []) : [];

  const handleSaveAffirmation = () => {
    if (customAffirmation.trim() === '' || !selectedCategory) {
      return;
    }

    const newAffirmation: AffirmationItem = {
      text: customAffirmation,
      category: selectedCategory,
      timestamp: new Date(),
    };

    setMyAffirmations(prev => [newAffirmation, ...prev]);
    setCustomAffirmation('');
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Adicionada há ${diffMins} min`;
    if (diffHours < 24) return `Adicionada há ${diffHours}h`;
    return `Adicionada há ${diffDays} dias`;
  };

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

        {/* Title Header */}
        <View style={styles.titleHeader}>
          <MaterialIcons name="psychology" size={48} color={colors.primary} />
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Momento de Afirmações
          </Text>
          <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
            Reprograme sua mente consciente
          </Text>
        </View>

        {/* Category Selection */}
        <SacredCard glowing style={styles.categoryCard}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            Escolha uma categoria para ver exemplos
          </Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category.value 
                      ? category.color + '30' 
                      : colors.surface + '80',
                    borderColor: selectedCategory === category.value 
                      ? category.color 
                      : colors.border,
                    borderWidth: selectedCategory === category.value ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === category.value ? null : category.value)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: selectedCategory === category.value ? colors.text : colors.textSecondary }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SacredCard>

        {/* Current Category Affirmations */}
        {selectedCategory && (
        <SacredCard style={styles.affirmationsCard}>
          <View style={styles.affirmationsHeader}>
            <Text style={styles.affirmationsIcon}>{currentCategory?.icon}</Text>
            <Text style={[styles.affirmationsTitle, { color: colors.text }]}>
              Afirmações de {currentCategory?.label}
            </Text>
          </View>

          <View style={styles.affirmationsList}>
            {currentAffirmations.map((affirmation, index) => (
              <View 
                key={index}
                style={[
                  styles.affirmationItem,
                  { 
                    backgroundColor: colors.surface + '60',
                    borderColor: currentCategory?.color + '30',
                  }
                ]}
              >
                <Text style={[styles.affirmationText, { color: colors.text }]}>
                  {affirmation}
                </Text>
              </View>
            ))}
          </View>
        </SacredCard>
        )}

        {/* Create Custom Affirmation */}
        <SacredCard style={styles.customCard}>
          <Text style={[styles.customTitle, { color: colors.text }]}>
            Criar Afirmação Personalizada
          </Text>

          <TextInput
            style={[
              styles.customInput,
              { 
                backgroundColor: colors.surface + '60',
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            value={customAffirmation}
            onChangeText={setCustomAffirmation}
            placeholder="Escreva sua afirmação poderosa no presente..."
            placeholderTextColor={colors.textMuted + '80'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSaveAffirmation}
            disabled={customAffirmation.trim() === '' || !selectedCategory}
          >
            <LinearGradient
              colors={currentCategory?.gradient || ['#8B5CF6', '#EC4899', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.gradientButton, (!selectedCategory || customAffirmation.trim() === '') && styles.disabledButton]}
            >
              <Text style={styles.submitButtonText}>
                Salvar Afirmação
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SacredCard>

        {/* My Affirmations */}
        {myAffirmations.length > 0 && (
          <SacredCard style={styles.myAffirmationsCard}>
            <Text style={[styles.myAffirmationsTitle, { color: colors.text }]}>
              Minhas Afirmações
            </Text>

            {myAffirmations.map((item, index) => {
              const category = CATEGORIES.find(c => c.value === item.category);
              return (
                <View 
                  key={index} 
                  style={[
                    styles.myAffirmationItem,
                    { 
                      backgroundColor: colors.surface + '60',
                      borderLeftColor: category?.color,
                    }
                  ]}
                >
                  <Text style={[styles.myAffirmationText, { color: colors.text }]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.myAffirmationTimestamp, { color: colors.textMuted }]}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
              );
            })}
          </SacredCard>
        )}

        {/* Sacred Quote */}
        <SacredCard style={styles.quoteCard}>
          <Text style={[styles.quote, { color: colors.textSecondary }]}>
            "Suas palavras criam sua realidade. Afirme no presente aquilo que deseja manifestar."
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
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
  titleHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  categoryCard: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryButton: {
    width: '47%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  affirmationsCard: {
    marginBottom: Spacing.lg,
  },
  affirmationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  affirmationsIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  affirmationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  affirmationsList: {
    gap: Spacing.md,
  },
  affirmationItem: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  affirmationText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  customCard: {
    marginBottom: Spacing.lg,
  },
  customTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  customInput: {
    minHeight: 100,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  gradientButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  myAffirmationsCard: {
    marginBottom: Spacing.lg,
  },
  myAffirmationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  myAffirmationItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  myAffirmationText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  myAffirmationTimestamp: {
    fontSize: 12,
    fontStyle: 'italic',
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
