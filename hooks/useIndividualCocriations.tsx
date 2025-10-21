import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { IndividualCocriation, VisionBoardItem } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';

export function useIndividualCocriations() {
  const { user } = useAuth();
  const [cocriations, setCocriations] = useState<IndividualCocriation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCocriations();
    } else {
      setCocriations([]);
      setLoading(false);
    }
  }, [user]);

  const loadCocriations = async () => {
    if (!user) return;

    try {
      console.log('Loading cocriations for user:', user.id);
      
      const { data, error } = await supabase
        .from('individual_cocriations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cocriations:', error);
      } else {
        console.log('Loaded cocriations:', data);
        setCocriations(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading cocriations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Nova função para carregar uma única cocriação
  const loadSingleCocriation = async (id: string) => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('individual_cocriations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading single cocriation:', error);
        return { data: null, error };
      }

      // Atualiza o cache local
      setCocriations(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [data, ...prev];
      });

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error loading single cocriation:', error);
      return { data: null, error };
    }
  };

  const createCocriation = async (cocriation: {
    title: string;
    description?: string;
    mental_code?: string;
    why_reason?: string;
    cover_image_url?: string;
  }) => {
    if (!user) {
      console.error('No user authenticated for creating cocriation');
      return { error: new Error('User not authenticated') };
    }

    console.log('Creating cocriation for user:', user.id, 'Data:', cocriation);

    try {
      const insertData = {
        user_id: user.id,
        title: cocriation.title.trim(),
        description: cocriation.description?.trim() || null,
        mental_code: cocriation.mental_code?.trim() || null,
        why_reason: cocriation.why_reason?.trim() || null,
        cover_image_url: cocriation.cover_image_url || null,
        status: 'defining' as const,
        nft_generated: false,
        vision_board_completed: false,
        practice_schedule_completed: false,
        future_letter_completed: false,
      };

      console.log('Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('individual_cocriations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating cocriation:', error);
        return { error };
      }

      console.log('Cocriation created successfully:', data);

      // Update local state
      setCocriations(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error creating cocriation:', error);
      return { error };
    }
  };

  const updateCocriation = async (
    id: string,
    updates: Partial<IndividualCocriation>
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      console.log('Updating cocriation:', id, updates);

      const { data, error } = await supabase
        .from('individual_cocriations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cocriation:', error);
        return { error };
      }

      console.log('Cocriation updated successfully:', data);

      // Update local state immediately with the full updated data
      setCocriations(prev => {
        const updated = prev.map(c => (c.id === id ? data : c));
        console.log('Updated cocriations cache:', updated);
        return updated;
      });

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating cocriation:', error);
      return { error };
    }
  };

  const deleteCocriation = async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('individual_cocriations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting cocriation:', error);
        return { error };
      }

      setCocriations(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting cocriation:', error);
      return { error };
    }
  };

  const completeCocriation = async (id: string) => {
    return updateCocriation(id, {
      status: 'completed',
      completion_date: new Date().toISOString(),
    });
  };

  return {
    cocriations,
    loading,
    createCocriation,
    updateCocriation,
    deleteCocriation,
    completeCocriation,
    refresh: loadCocriations,
    loadSingle: loadSingleCocriation,
  };
}

export function useVisionBoard(cocriationId: string) {
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cocriationId) {
      loadVisionBoardItems();
    }
  }, [cocriationId]);

  const loadVisionBoardItems = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('cocreation_id', cocriationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading vision board items:', error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error loading vision board items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: {
    type: 'image' | 'text' | 'drawing' | 'emoji';
    content?: string;
    description?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('vision_board_items')
        .insert({
          cocreation_id: cocriationId,
          type: item.type,
          content: item.content,
          description: item.description,
          position_x: item.position_x || 0,
          position_y: item.position_y || 0,
          width: item.width || 100,
          height: item.height || 100,
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      setItems(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateItem = async (id: string, updates: Partial<VisionBoardItem>) => {
    try {
      const { data, error } = await supabase
        .from('vision_board_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setItems(prev => prev.map(item => (item.id === id ? data : item)));
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', id);

      if (error) {
        return { error };
      }

      setItems(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refresh: loadVisionBoardItems,
  };
}