import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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

  return {
    practices,
    loading,
    addPractice,
    updatePractice,
    deletePractice,
    refetch: fetchPractices,
  };
}
