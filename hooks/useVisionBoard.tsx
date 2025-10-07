import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { VisionBoardItem, IndividualCocriation } from '@/services/types';

export function useVisionBoard(cocriationId: string) {
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cocriation, setCocriation] = useState<IndividualCocriation | null>(null);

  useEffect(() => {
    if (cocriationId) {
      loadVisionBoardItems();
      loadCocriation();
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

  const loadCocriation = async () => {
    try {
      const { data, error } = await supabase
        .from('individual_cocriations')
        .select('*')
        .eq('id', cocriationId)
        .single();

      if (error) {
        console.error('Error loading cocriation:', error);
      } else {
        setCocriation(data);
      }
    } catch (error) {
      console.error('Error loading cocriation:', error);
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

  const finalizeVisionBoard = async () => {
    try {
      // Update the cocriation to mark vision board as completed
      // We'll add a custom field to track vision board completion status
      const { data, error } = await supabase
        .from('individual_cocriations')
        .update({ 
          updated_at: new Date().toISOString(),
          // Add a completion status field for vision board
          // This will be used to determine if vision board is completed
          status: 'vision_board_completed'
        })
        .eq('id', cocriationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating cocriation status:', error);
        return { error };
      }

      console.log('Vision Board marked as completed:', data);

      // Refresh data to reflect the change
      await loadCocriation();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error finalizing vision board:', error);
      return { error };
    }
  };

  const checkVisionBoardCompleted = () => {
    // Check if the cocriation status indicates vision board is completed
    return cocriation?.status === 'vision_board_completed' || cocriation?.status === 'completed';
  };

  return {
    items,
    loading,
    cocriation,
    addItem,
    updateItem,
    deleteItem,
    finalizeVisionBoard,
    checkVisionBoardCompleted,
    refresh: () => {
      loadVisionBoardItems();
      loadCocriation();
    },
  };
}