import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface FutureLetter {
  id: string;
  user_id: string;
  individual_cocreation_id?: string;
  circle_id?: string;
  title?: string;
  content: string;
  is_revealed: boolean;
  revealed_at?: string;
  created_at: string;
}

export function useFutureLetter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createFutureLetter = async (data: {
    individual_cocreation_id?: string;
    circle_id?: string;
    title?: string;
    content: string;
  }) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    setLoading(true);
    
    try {
      const { data: letter, error } = await supabase
        .from('future_letters')
        .insert({
          user_id: user.id,
          individual_cocreation_id: data.individual_cocreation_id || null,
          circle_id: data.circle_id || null,
          title: data.title || null,
          content: data.content,
          is_revealed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating future letter:', error);
        return { error };
      }

      return { data: letter, error: null };
    } catch (error) {
      console.error('Unexpected error creating future letter:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const getFutureLetter = async (cocreationId: string) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data: letter, error } = await supabase
        .from('future_letters')
        .select('*')
        .eq('individual_cocreation_id', cocreationId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting future letter:', error);
        return { error };
      }

      return { data: letter, error: null };
    } catch (error) {
      console.error('Unexpected error getting future letter:', error);
      return { error };
    }
  };

  const revealFutureLetter = async (letterId: string) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data: letter, error } = await supabase
        .from('future_letters')
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq('id', letterId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error revealing future letter:', error);
        return { error };
      }

      return { data: letter, error: null };
    } catch (error) {
      console.error('Unexpected error revealing future letter:', error);
      return { error };
    }
  };

  return {
    loading,
    createFutureLetter,
    getFutureLetter,
    revealFutureLetter,
  };
}