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
      const { data, error } = await supabase
        .from('individual_cocriations')
        .update({ 
          updated_at: new Date().toISOString(),
          // We'll use a custom field or status to track vision board completion
          // For now, we'll add a flag that indicates vision board is finished
        })
        .eq('id', cocriationId)
        .select()
        .single();

      if (error) {
        return { error };
      }

      // Add a special marker item to indicate vision board is completed
      const { data: markerData, error: markerError } = await supabase
        .from('vision_board_items')
        .upsert({
          cocreation_id: cocriationId,
          type: 'marker' as any, // Special type to mark completion
          content: 'VISION_BOARD_COMPLETED',
          description: 'Vision Board completion marker',
          position_x: -1, // Hidden position
          position_y: -1,
          width: 0,
          height: 0,
        }, {
          onConflict: 'cocreation_id,content'
        });

      if (markerError) {
        console.error('Error creating completion marker:', markerError);
      }

      // Refresh data
      await loadCocriation();
      await loadVisionBoardItems();
      
      return { data, error: null };
    } catch (error) {
      return { error };
    }
  };

  const checkVisionBoardCompleted = () => {
    return items.some(item => 
      item.type === 'marker' && item.content === 'VISION_BOARD_COMPLETED'
    );
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