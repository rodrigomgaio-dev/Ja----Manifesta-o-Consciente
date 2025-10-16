import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useIndividualCocriations } from './useIndividualCocriations';

export interface PracticeSchedule {
  id: string;
  user_id: string;
  cocreation_id: string;
  mode: 'flow' | 'routine';
  days_of_week: number[] | null; // null = diário
  time_type: 'specific' | 'wake_up' | 'before_sleep' | 'flexible' | null;
  specific_time: string | null; // formato HH:MM
  practices: string[]; // ['gratitude', 'meditation', 'mantram', 'affirmation']
  duration_hours: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePracticeSchedules(cocreationId: string) {
  const { user } = useAuth();
  const { updateCocriation } = useIndividualCocriations();
  const [schedules, setSchedules] = useState<PracticeSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && cocreationId) {
      loadSchedules();
    } else {
      setSchedules([]);
      setLoading(false);
    }
  }, [user, cocreationId]);

  const loadSchedules = useCallback(async () => {
    if (!user || !cocreationId) return;

    try {
      console.log('Loading practice schedules for cocreation:', cocreationId);
      
      const { data, error } = await supabase
        .from('practice_schedules')
        .select('*')
        .eq('cocreation_id', cocreationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading practice schedules:', error);
      } else {
        console.log('Loaded practice schedules:', data);
        setSchedules(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading practice schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [user, cocreationId]);

  const loadSingle = useCallback(async (scheduleId: string) => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('practice_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading schedule:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error loading schedule:', error);
      return { data: null, error };
    }
  }, [user]);

  const createSchedule = async (scheduleData: {
    mode: 'flow' | 'routine';
    days_of_week?: number[] | null;
    time_type?: 'specific' | 'wake_up' | 'before_sleep' | 'flexible' | null;
    specific_time?: string | null;
    practices?: string[];
    duration_hours?: number | null;
    duration_minutes?: number | null;
  }) => {
    if (!user || !cocreationId) {
      console.error('No user or cocreation ID for creating schedule');
      return { error: new Error('User or cocreation ID not available') };
    }

    console.log('Creating practice schedule:', scheduleData);

    try {
      const insertData = {
        user_id: user.id,
        cocreation_id: cocreationId,
        mode: scheduleData.mode,
        days_of_week: scheduleData.days_of_week || null,
        time_type: scheduleData.time_type || null,
        specific_time: scheduleData.specific_time || null,
        practices: scheduleData.practices || [],
        duration_hours: scheduleData.duration_hours || null,
        duration_minutes: scheduleData.duration_minutes || null,
        is_active: true,
      };

      console.log('Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('practice_schedules')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating schedule:', error);
        return { error };
      }

      console.log('Schedule created successfully:', data);
      setSchedules(prev => [data, ...prev]);
      
      // Marcar como completo na cocriação
      await updateCocriation(cocreationId, { 
        practice_schedule_completed: true 
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error creating schedule:', error);
      return { error };
    }
  };

  const updateSchedule = async (
    scheduleId: string,
    updates: Partial<PracticeSchedule>
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      console.log('Updating schedule:', scheduleId, updates);

      const { data, error } = await supabase
        .from('practice_schedules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule:', error);
        return { error };
      }

      console.log('Schedule updated successfully:', data);
      setSchedules(prev => prev.map(s => s.id === data.id ? data : s));
      
      // Marcar como completo na cocriação se ainda não estiver
      await updateCocriation(cocreationId, { 
        practice_schedule_completed: true 
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating schedule:', error);
      return { error };
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('practice_schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting schedule:', error);
        return { error };
      }

      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting schedule:', error);
      return { error };
    }
  };

  return {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loadSingle,
    refresh: loadSchedules,
  };
}
