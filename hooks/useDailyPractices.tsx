// hooks/useDailyPractices.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

// --- Supondo que os tipos para as sessões estejam em '@/services/types' também ---
// Ajuste os nomes e estrutura conforme seu arquivo real de tipos.
// Exemplo baseado no seu esquema anterior:
export interface PracticeSession {
  id: string;
  user_id: string;
  practice_id: string; // Este ID aponta para daily_practices.id
  type: 'gratitude' | 'affirmation' | 'mantra' | 'meditation';
  notes?: string;
  practiced_at: string; // ISO string
  created_at: string;
  updated_at: string;
}

// --- Tipos para os dados retornados pela memória ---
export interface MemoryGratitude {
  content: string;
  practiced_at: string;
}

export interface MemoryAffirmation {
  content: string;
  practiced_at: string;
}

export interface MemoryMantra {
  id: string;
  name: string;
  text_content: string;
  practice_count: number;
}

export interface DailyPractice {
  id: string;
  user_id: string;
  cocreation_id?: string;
  circle_id?: string;
  type: 'gratitude' | 'affirmation' | 'mantra' | 'meditation';
  title: string;
  content: string;
  scheduled_times?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDailyPractices(cocreationId?: string) {
  const { user } = useAuth();
  const [practices, setPractices] = useState<DailyPractice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPractices();
    }
  }, [user, cocreationId]);

  const fetchPractices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('daily_practices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (cocreationId) {
        query = query.eq('cocreation_id', cocreationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPractices(data || []);
    } catch (error) {
      console.error('Error fetching practices:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPractice = async (practice: Omit<DailyPractice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('daily_practices')
        .insert([{ ...practice, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setPractices(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding practice:', error);
      return { data: null, error: error.message };
    }
  };

  const updatePractice = async (id: string, updates: Partial<DailyPractice>) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('daily_practices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPractices(prev => prev.map(p => p.id === id ? data : p));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating practice:', error);
      return { data: null, error: error.message };
    }
  };

  const deletePractice = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('daily_practices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPractices(prev => prev.filter(p => p.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting practice:', error);
      return { error: error.message };
    }
  };

  // --- Novas Funções para a Memória da Cocriação ---

  // Função para obter práticas recentes (gratidões ou afirmações) associadas a uma cocriação
  const getRecentPractices = async (
    cocriacaoId: string,
    type: 'gratitude' | 'affirmation',
    limit: number
  ): Promise<MemoryGratitude[] | MemoryAffirmation[]> => {
    if (!user?.id) {
      console.error("Usuário não autenticado para buscar práticas recentes.");
      return [];
    }

    try {
      // Passo 1: Buscar os IDs das práticas diárias do tipo especificado associadas à cocriação
      const {  dailyPracticeIds, error: dpError } = await supabase
        .from('daily_practices') // Tabela de definições
        .select('id')
        .eq('cocreation_id', cocriacaoId)
        .eq('type', type)
        .eq('user_id', user.id); // Garante que pertence ao usuário logado

      if (dpError) throw dpError;

      if (dailyPracticeIds.length === 0) {
        console.log(`Nenhuma prática diária do tipo '${type}' encontrada para a cocriação ${cocriacaoId}.`);
        return [];
      }

      const practiceIds = dailyPracticeIds.map(dp => dp.id);

      // Passo 2: Buscar as sessões de prática realizadas para esses IDs específicos
      const {  practiceSessions, error: psError } = await supabase
        .from('practice_sessions') // Tabela de sessões realizadas
        .select('practice_id, notes, practiced_at') // Seleciona campos relevantes
        .in('practice_id', practiceIds) // Filtra pelas práticas diárias encontradas
        .order('practiced_at', { ascending: false }) // Ordena pelas mais recentes
        .limit(limit); // Limita o número de resultados

      if (psError) throw psError;

      // Mapeia as sessões para o formato esperado pela memória
      // Assumindo que 'notes' contém o conteúdo da gratidão/afirmação registrada
      const mappedPractices = practiceSessions.map(session => ({
        content: session.notes || '', // Ajuste se o conteúdo estiver em outro campo
        practiced_at: session.practiced_at,
      }));

      console.log(`Práticas recentes (${type}) encontradas para cocriação ${cocriacaoId}:`, mappedPractices);
      return mappedPractices as (MemoryGratitude[] | MemoryAffirmation[]); // Ajuste o tipo de retorno se necessário
    } catch (err) {
      console.error(`Erro ao buscar práticas recentes (${type}) para cocriação ${cocriacaoId}:`, err);
      throw err; // Lança o erro para ser tratado no chamador
    }
  };

  // Função para obter o mantra mais praticado associado a uma cocriação
  const getMostPracticedMantra = async (cocriacaoId: string): Promise<MemoryMantra | null> => {
    if (!user?.id) {
      console.error("Usuário não autenticado para buscar mantra mais praticado.");
      return null;
    }

    try {
      // Passo 1: Buscar os mantras diários associados à cocriação
      const { data: dailyMantras, error: dmError } = await supabase
        .from('daily_practices') // Tabela de definições
        .select('id, title as name, content as text_content') // Mapeia campos conforme o tipo MemoryMantra
        .eq('cocreation_id', cocriacaoId)
        .eq('type', 'mantra') // Filtra apenas mantras
        .eq('user_id', user.id); // Garante que pertence ao usuário logado

      if (dmError) throw dmError;

      if (dailyMantras.length === 0) {
        console.log(`Nenhum mantra diário encontrado para a cocriação ${cocriacaoId}.`);
        return null;
      }

      const mantraIds = dailyMantras.map(m => m.id);

      // Passo 2: Contar as sessões de prática para cada ID de mantra (usando RPC)
      const {  practiceCounts, error: countError } = await supabase
        .rpc('get_practice_counts', { practice_ids: mantraIds }); // Chama a função RPC criada no banco

      if (countError) throw countError;

      // Passo 3: Encontrar o mantra com a maior contagem
      let mostPracticedId = '';
      let maxCount = 0;
      practiceCounts.forEach((item: { practice_id: string; count: number }) => {
        if (item.count > maxCount) {
          maxCount = item.count;
          mostPracticedId = item.practice_id;
        }
      });

      if (!mostPracticedId) {
        console.log(`Nenhuma sessão de prática encontrada para os mantras da cocriação ${cocriacaoId}.`);
        return null;
      }

      // Passo 4: Obter os detalhes do mantra mais praticado
      const mantraDetails = dailyMantras.find(m => m.id === mostPracticedId);

      if (!mantraDetails) {
        // Detalhes do mantra não encontrados (não deveria acontecer se o fluxo estiver correto)
        console.error("Detalhes do mantra mais praticado não encontrados.");
        return null;
      }

      const result: MemoryMantra = {
        id: mantraDetails.id,
        name: mantraDetails.name,
        text_content: mantraDetails.text_content,
        practice_count: maxCount,
      };

      console.log(`Mantra mais praticado para cocriação ${cocriacaoId}:`, result);
      return result;
    } catch (err) {
      console.error(`Erro ao buscar mantra mais praticado para cocriação ${cocriacaoId}:`, err);
      throw err; // Lança o erro para ser tratado no chamador
    }
  };
  // --- Fim das Novas Funções ---

  return {
    practices,
    loading,
    addPractice,
    updatePractice,
    deletePractice,
    refetch: fetchPractices,
    // --- Exporta as novas funções ---
    getRecentPractices,
    getMostPracticedMantra
    // --------------------------------
  };
}