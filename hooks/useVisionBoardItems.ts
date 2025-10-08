// hooks/useVisionBoardItems.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

// Definindo os tipos
export type BoardElementType = 'image' | 'text' | 'emoji' | 'sticker';

export interface BaseBoardElement {
  id: string;
  cocreation_id: string;
  type: BoardElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zindex: number;
  created_at: string;
}

export interface ImageElement extends BaseBoardElement {
  type: 'image';
  uri: string;
}

export interface TextElement extends BaseBoardElement {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
}

export interface EmojiElement extends BaseBoardElement {
  type: 'emoji';
  char: string;
  fontSize: number;
}

export interface StickerElement extends BaseBoardElement {
  type: 'sticker';
  uri: string;
}

export type BoardElement = 
  | ImageElement 
  | TextElement 
  | EmojiElement 
  | StickerElement;

// Hook principal
export const useVisionBoardItems = (cocreationId: string) => { // Certifique-se que cocreationId é string
  const [items, setItems] = useState<BoardElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      // Verificar se cocreationId está definido
      if (!cocreationId) {
        throw new Error('cocreationId não definido');
      }
      
      const { data, error } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('cocreation_id', cocreationId) // Passando cocreationId corretamente
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setItems(data as BoardElement[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching vision board items:', err);
    } finally {
      setLoading(false);
    }
  }, [cocreationId]);

  const addItem = useCallback(async (item: Omit<BoardElement, 'id' | 'cocreation_id' | 'created_at'>) => {
    console.log("[useVisionBoardItems] Tentando adicionar item:", item);
    console.log("[useVisionBoardItems] cocreationId atual:", cocreationId);
    
    // Verificar se cocreationId está definido
    if (!cocreationId) {
      const errorMsg = "cocreationId não fornecido para addItem.";
      console.error("[useVisionBoardItems] Erro:", errorMsg);
      return { data: null, error: errorMsg };
    }
  
    try {
      // Montar payload com cocreation_id
      const payload = { ...item, cocreation_id: cocreationId };
      console.log("[useVisionBoardItems] Payload para Supabase:", payload);
  
      const { data, error } = await supabase
        .from('vision_board_items')
        .insert([payload]) // Passando payload com cocreation_id
        .select()
        .single();

      if (error) {
        console.error("[useVisionBoardItems] Erro do Supabase:", error);
        throw error;
      }
  
      console.log("[useVisionBoardItems] Item inserido com sucesso:", data);
      setItems(prev => {
        const newItems = [...prev, data as BoardElement];
        console.log("[useVisionBoardItems] Estado 'items' atualizado para:", newItems);
        return newItems;
      });
  
      return { data, error: null };
    } catch (err: any) {
      const errorMsg = err.message || "Erro desconhecido ao adicionar item.";
      console.error("[useVisionBoardItems] Erro capturado:", errorMsg);
      return { data: null, error: errorMsg };
    }
  }, [cocreationId]); // Adicionar cocreationId como dependência

  const updateItem = useCallback(async (id: string, updates: Partial<BoardElement>) => {
    try {
      const { data, error } = await supabase
        .from('vision_board_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  useEffect(() => {
    if (cocreationId) {
      fetchItems();
    }
  }, [cocreationId, fetchItems]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem
  };
};
