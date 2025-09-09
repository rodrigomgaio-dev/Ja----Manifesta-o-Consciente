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
      const { data, error } = await supabase
        .from('individual_cocriations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cocriations:', error);
      } else {
        setCocriations(data || []);
      }
    } catch (error) {
      console.error('Error loading cocriations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCocriation = async (cocriation: {
    title: string;
    description?: string;
    mental_code?: string;
    why_reason?: string;
  }) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('individual_cocriations')
        .insert({
          user_id: user.id,
          title: cocriation.title,
          description: cocriation.description,
          mental_code: cocriation.mental_code,
          why_reason: cocriation.why_reason,
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      setCocriations(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateCocriation = async (
    id: string,
    updates: Partial<IndividualCocriation>
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
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
        return { error };
      }

      setCocriations(prev =>
        prev.map(c => (c.id === id ? { ...c, ...data } : c))
      );
      return { data, error: null };
    } catch (error) {
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
        return { error };
      }

      setCocriations(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (error) {
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