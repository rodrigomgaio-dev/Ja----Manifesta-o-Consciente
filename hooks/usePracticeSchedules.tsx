import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  const [schedule, setSchedule] = useState<PracticeSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && cocreationId) {
      loadSchedule();
    } else {
      setSchedule(null);
      setLoading(false);
    }
  }, [user, cocreationId]);

  const loadSchedule = useCallback(async () => {
    if (!user || !cocreationId) return;

    try {
      console.log('Loading practice schedule for cocreation:', cocreationId);
      
      const { data, error } = await supabase
        .from('practice_schedules')
        .select('*')
        .eq('cocreation_id', cocreationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading practice schedule:', error);
      } else {
        console.log('Loaded practice schedule:', data);
        setSchedule(data);
      }
    } catch (error) {
      console.error('Unexpected error loading practice schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [user, cocreationId]);

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
      setSchedule(data);
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
      setSchedule(data);
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

      setSchedule(null);
      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting schedule:', error);
      return { error };
    }
  };

  return {
    schedule,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refresh: loadSchedule,
  };
}
