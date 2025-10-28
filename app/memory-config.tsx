import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '@/components/ui/GradientBackground';
import SacredCard from '@/components/ui/SacredCard';
import SacredButton from '@/components/ui/SacredButton';
import SacredModal from '@/components/ui/SacredModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useIndividualCocriations } from '@/hooks/useIndividualCocriations';
import { useAuth } from '@/contexts/AuthContext';
import { useVisionBoardItems } from '@/hooks/useVisionBoardItems';
import { useDailyPractices } from '@/hooks/useDailyPractices';
import { Spacing } from '@/constants/Colors';

export default function MemoryConfigScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const { cocriations, completeCocriation } = useIndividualCocriations();
  const { cocreationId } = useLocalSearchParams();
  const id = cocreationId as string;

  const { items: visionBoardItems } = useVisionBoardItems(id || '');
  const { practices } = useDailyPractices(id || '');

  const [cocriation, setCocriation] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Seleção de conteúdo para a Memória
  const [selectedGratitudes, setSelectedGratitudes] = useState([]);
  const [selectedMantra, setSelectedMantra] = useState(null);
  const [selectedMeditation, setSelectedMeditation] = useState(null);
  const [selectedAffirmations, setSelectedAffirmations] = useState([]);

  useEffect(() => {
    if (id && cocriations.length > 0) {
      const found = cocriations.find(c => c.id === id);
      if (found) {
        setCocriation(found);
      }
    }
  }, [id, cocriations]);

  // Filtrar práticas por tipo
  const gratitudes = practices.filter(p => p.type === 'gratitude');
  const mantras = practices.filter(p => p.type === 'mantra');
  const meditations = practices.filter(p => p.type === 'meditation');
  const affirmations = practices.filter(p => p.type === 'affirmation');

  // Filtrar imagens do Vision Board
  const imageItems = visionBoardItems.filter(item => item.type === 'image' && item.content);

  const handleCompleteMemory = async () => {
    if (!cocriation) return;
    
    setIsCompleting(true);
    try {
      // Marcar cocriação como concluída
      await completeCocriation(cocriation.id);
      
      // Navegar para visualização da memória com configurações
      router.push({
        pathname: '/symbolic-nft',
        params: {
          cocreationId: cocriation.id,
          selectedGratitudes: JSON.stringify(selectedGratitudes),
          selectedMantra: selectedMantra || '',
          selectedMeditation: selectedMeditation || '',
          selectedAffirmations: JSON.stringify(selectedAffirmations),
        }
      });
    } catch (error) {
      console.error('Erro ao concluir cocriação:', error);
      setIsCompleting(false);
    }
  };

  const canGenerateMemory = cocriation && (
    selectedGratitudes.length > 0 ||
    selectedMantra !== null ||
    selectedMeditation !== null ||
    selectedAffirmations.length > 0 ||
    imageItems.length > 0
  );

  if (!cocriation) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personalizar Memória</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <SacredCard style={styles.infoCard}>
            <Text style={styles.infoTitle}>Sua Memória de Cocriação</Text>
            <Text style={styles.infoText}>
              Escolha os elementos que mais ressoam com sua jornada para incluir 
              na sua Memória de Cocriação. Esta será sua lembrança emocional 
              do momento em que tudo já era real.
            </Text>
          </SacredCard>

          {/* Seção: Gratidões */}
          {gratitudes.length > 0 && (
            <SacredCard style={styles.selectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="favorite" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Gratidões (até 3)</Text>
              </View>
              {gratitudes.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.selectionItem,
                    { borderColor: selectedGratitudes.includes(g.id) ? colors.primary : colors.border }
                  ]}
                  onPress={() => {
                    if (selectedGratitudes.includes(g.id)) {
                      setSelectedGratitudes(prev => prev.filter(id => id !== g.id));
                    } else if (selectedGratitudes.length < 3) {
                      setSelectedGratitudes(prev => [...prev, g.id]);
                    }
                  }}
                >
                  <MaterialIcons
                    name={selectedGratitudes.includes(g.id) ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={selectedGratitudes.includes(g.id) ? colors.primary : colors.text}
                  />
                  <Text style={[styles.selectionText, { color: colors.text }]}>
                    {g.title || g.content.substring(0, 80) + '...'}
                  </Text>
                </TouchableOpacity>
              ))}
            </SacredCard>
          )}

          {/* Seção: Mantra */}
          {mantras.length > 0 && (
            <SacredCard style={styles.selectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="record-voice-over" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Mantra (1)</Text>
              </View>
              {mantras.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.selectionItem,
                    { borderColor: selectedMantra === m.id ? colors.primary : colors.border }
                  ]}
                  onPress={() => setSelectedMantra(selectedMantra === m.id ? null : m.id)}
                >
                  <MaterialIcons
                    name={selectedMantra === m.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={24}
                    color={selectedMantra === m.id ? colors.primary : colors.text}
                  />
                  <Text style={[styles.selectionText, { color: colors.text }]}>
                    {m.title || m.content.substring(0, 80) + '...'}
                  </Text>
                </TouchableOpacity>
              ))}
            </SacredCard>
          )}

          {/* Seção: Meditação */}
          {meditations.length > 0 && (
            <SacredCard style={styles.selectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="self-improvement" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Meditação (1)</Text>
              </View>
              {meditations.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.selectionItem,
                    { borderColor: selectedMeditation === m.id ? colors.primary : colors.border }
                  ]}
                  onPress={() => setSelectedMeditation(selectedMeditation === m.id ? null : m.id)}
                >
                  <MaterialIcons
                    name={selectedMeditation === m.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={24}
                    color={selectedMeditation === m.id ? colors.primary : colors.text}
                  />
                  <Text style={[styles.selectionText, { color: colors.text }]}>
                    {m.title || m.content.substring(0, 80) + '...'}
                  </Text>
                </TouchableOpacity>
              ))}
            </SacredCard>
          )}

          {/* Seção: Afirmações */}
          {affirmations.length > 0 && (
            <SacredCard style={styles.selectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="psychology" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Afirmações (até 3)</Text>
              </View>
              {affirmations.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.selectionItem,
                    { borderColor: selectedAffirmations.includes(a.id) ? colors.primary : colors.border }
                  ]}
                  onPress={() => {
                    if (selectedAffirmations.includes(a.id)) {
                      setSelectedAffirmations(prev => prev.filter(id => id !== a.id));
                    } else if (selectedAffirmations.length < 3) {
                      setSelectedAffirmations(prev => [...prev, a.id]);
                    }
                  }}
                >
                  <MaterialIcons
                    name={selectedAffirmations.includes(a.id) ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={selectedAffirmations.includes(a.id) ? colors.primary : colors.text}
                  />
                  <Text style={[styles.selectionText, { color: colors.text }]}>
                    {a.title || a.content.substring(0, 80) + '...'}
                  </Text>
                </TouchableOpacity>
              ))}
            </SacredCard>
          )}

          {/* Seção: Imagens do Vision Board */}
          {imageItems.length > 0 && (
            <SacredCard style={styles.selectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="image" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  Imagens do Vision Board ({imageItems.length} incluídas automaticamente)
                </Text>
              </View>
              <Text style={[styles.autoIncludeText, { color: colors.text }]}>
                Todas as imagens do seu Vision Board serão incluídas automaticamente na memória.
              </Text>
            </SacredCard>
          )}

          {/* Status de Seleção */}
          <SacredCard style={styles.statusCard}>
            <Text style={styles.statusTitle}>Resumo da Seleção</Text>
            <View style={styles.statusItem}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                Gratidões: {selectedGratitudes.length}/3
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                Mantra: {selectedMantra ? '1/1' : '0/1'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                Meditação: {selectedMeditation ? '1/1' : '0/1'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                Afirmações: {selectedAffirmations.length}/3
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                Imagens: {imageItems.length} incluídas
              </Text>
            </View>
          </SacredCard>

          {/* Botão Gerar Memória */}
          <SacredButton
            title={isCompleting ? "Finalizando..." : "Gerar Minha Memória"}
            onPress={() => setShowConfirmModal(true)}
            disabled={!canGenerateMemory || isCompleting}
            loading={isCompleting}
            style={styles.generateButton}
          />

          {/* Espaçamento inferior */}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* Modal de Confirmação */}
        <SacredModal
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Finalizar Cocriação"
          type="info"
        >
          <Text style={styles.modalText}>
            Você está prestes a finalizar sua cocriação "{cocriation.title}". 
            {'\n\n'}
            Sua Memória de Cocriação será gerada com os elementos selecionados e 
            não poderá mais ser alterada.
            {'\n\n'}
            Deseja prosseguir?
          </Text>
          <View style={styles.modalButtons}>
            <SacredButton
              title="Cancelar"
              onPress={() => setShowConfirmModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <SacredButton
              title="Sim, Finalizar"
              onPress={handleCompleteMemory}
              loading={isCompleting}
              style={styles.modalButton}
            />
          </View>
        </SacredModal>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
  },
  selectionCard: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selectionText: {
    fontSize: 14,
    marginLeft: Spacing.md,
    flex: 1,
  },
  autoIncludeText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  statusItem: {
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: 14,
  },
  generateButton: {
    marginBottom: Spacing.lg,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
