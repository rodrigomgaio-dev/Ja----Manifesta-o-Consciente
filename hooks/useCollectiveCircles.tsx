import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CollectiveCircle {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  personal_message?: string;
  audio_invitation_url?: string;
  mental_code?: string;
  status: 'forming' | 'active' | 'completed';
  max_members: number;
  completion_date?: string;
  nft_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface CircleInvitation {
  id: string;
  circle_id: string;
  invite_token: string;
  created_by: string;
  used_by?: string;
  used_at?: string;
  expires_at?: string;
  created_at: string;
}

export function useCollectiveCircles() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CollectiveCircle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCircles();
    } else {
      setCircles([]);
      setLoading(false);
    }
  }, [user]);

  const loadCircles = async () => {
    if (!user) return;

    try {
      console.log('Loading circles for user:', user.id);
      
      const { data, error } = await supabase
        .from('collective_circles')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading circles:', error);
      } else {
        console.log('Loaded circles:', data);
        setCircles(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading circles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCircle = async (circle: {
    title: string;
    description?: string;
    cover_image_url?: string;
    personal_message?: string;
    audio_invitation_url?: string;
    max_members?: number;
  }) => {
    if (!user) {
      console.error('No user authenticated for creating circle');
      return { error: new Error('User not authenticated') };
    }

    console.log('Creating circle for user:', user.id, 'Data:', circle);

    try {
      const insertData = {
        creator_id: user.id,
        title: circle.title.trim(),
        description: circle.description?.trim() || null,
        cover_image_url: circle.cover_image_url || null,
        personal_message: circle.personal_message?.trim() || null,
        audio_invitation_url: circle.audio_invitation_url || null,
        status: 'forming' as const,
        max_members: circle.max_members || 13,
        nft_generated: false,
      };

      console.log('Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('collective_circles')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating circle:', error);
        return { error };
      }

      console.log('Circle created successfully:', data);

      // Update local state
      setCircles(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error creating circle:', error);
      return { error };
    }
  };

  const createInvitation = async (circleId: string) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('circle_invitations')
        .insert({
          circle_id: circleId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error creating invitation:', error);
      return { error };
    }
  };

  const getInvitationDetails = async (token: string) => {
    try {
      console.log('Getting invitation details for token:', token);
      
      const { data, error } = await supabase
        .from('circle_invitations')
        .select(`
          *,
          collective_circles (
            id,
            title,
            description,
            cover_image_url,
            personal_message,
            audio_invitation_url,
            max_members,
            status,
            created_at
          ),
          profiles!circle_invitations_created_by_fkey (
            full_name,
            email
          )
        `)
        .eq('invite_token', token)
        .maybeSingle();

      if (error) {
        console.error('Error getting invitation details:', error);
        return { error };
      }

      if (!data) {
        console.log('No invitation found for token:', token);
        return { error: new Error('Invitation not found') };
      }

      console.log('Invitation details loaded:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error getting invitation:', error);
      return { error };
    }
  };

  const updateCircle = async (
    id: string,
    updates: Partial<CollectiveCircle>
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('collective_circles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('creator_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating circle:', error);
        return { error };
      }

      setCircles(prev =>
        prev.map(c => (c.id === id ? { ...c, ...data } : c))
      );
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating circle:', error);
      return { error };
    }
  };

  const deleteCircle = async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('collective_circles')
        .delete()
        .eq('id', id)
        .eq('creator_id', user.id);

      if (error) {
        console.error('Error deleting circle:', error);
        return { error };
      }

      setCircles(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting circle:', error);
      return { error };
    }
  };

  return {
    circles,
    loading,
    createCircle,
    createInvitation,
    getInvitationDetails,
    updateCircle,
    deleteCircle,
    refresh: loadCircles,
  };
}