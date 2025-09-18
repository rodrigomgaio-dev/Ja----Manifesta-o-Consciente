export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      individual_cocriations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          mental_code: string | null;
          why_reason: string | null;
          status: 'active' | 'completed' | 'paused';
          completion_date: string | null;
          nft_generated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          mental_code?: string | null;
          why_reason?: string | null;
          status?: 'active' | 'completed' | 'paused';
          completion_date?: string | null;
          nft_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          mental_code?: string | null;
          why_reason?: string | null;
          status?: 'active' | 'completed' | 'paused';
          completion_date?: string | null;
          nft_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vision_board_items: {
        Row: {
          id: string;
          cocreation_id: string;
          type: 'image' | 'text' | 'drawing' | 'emoji';
          content: string | null;
          description: string | null;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cocreation_id: string;
          type: 'image' | 'text' | 'drawing' | 'emoji';
          content?: string | null;
          description?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          cocreation_id?: string;
          type?: 'image' | 'text' | 'drawing' | 'emoji';
          content?: string | null;
          description?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          created_at?: string;
        };
      };
      collective_circles: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          personal_message: string | null;
          audio_invitation_url: string | null;
          mental_code: string | null;
          status: 'forming' | 'active' | 'completed';
          max_members: number;
          completion_date: string | null;
          nft_generated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          personal_message?: string | null;
          audio_invitation_url?: string | null;
          mental_code?: string | null;
          status?: 'forming' | 'active' | 'completed';
          max_members?: number;
          completion_date?: string | null;
          nft_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          personal_message?: string | null;
          audio_invitation_url?: string | null;
          mental_code?: string | null;
          status?: 'forming' | 'active' | 'completed';
          max_members?: number;
          completion_date?: string | null;
          nft_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      circle_members: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          role: 'creator' | 'member';
          alignment_feeling: string | null;
          personal_meaning: string | null;
          energy_type: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          user_id: string;
          role?: 'creator' | 'member';
          alignment_feeling?: string | null;
          personal_meaning?: string | null;
          energy_type?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          user_id?: string;
          role?: 'creator' | 'member';
          alignment_feeling?: string | null;
          personal_meaning?: string | null;
          energy_type?: string | null;
          joined_at?: string;
        };
      };
      daily_practices: {
        Row: {
          id: string;
          user_id: string;
          cocreation_id: string | null;
          circle_id: string | null;
          type: 'gratitude' | 'meditation' | 'mantra' | 'affirmation';
          title: string;
          content: string;
          scheduled_times: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cocreation_id?: string | null;
          circle_id?: string | null;
          type: 'gratitude' | 'meditation' | 'mantra' | 'affirmation';
          title: string;
          content: string;
          scheduled_times?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cocreation_id?: string | null;
          circle_id?: string | null;
          type?: 'gratitude' | 'meditation' | 'mantra' | 'affirmation';
          title?: string;
          content?: string;
          scheduled_times?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface IndividualCocriation {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  mental_code?: string;
  why_reason?: string;
  status: 'active' | 'completed' | 'paused';
  completion_date?: string;
  nft_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisionBoardItem {
  id: string;
  cocreation_id: string;
  type: 'image' | 'text' | 'drawing' | 'emoji';
  content?: string;
  description?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
}

export interface CollectiveCircle {
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

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'creator' | 'member';
  alignment_feeling?: string;
  personal_meaning?: string;
  energy_type?: string;
  joined_at: string;
}

export interface DailyPractice {
  id: string;
  user_id: string;
  cocreation_id?: string;
  circle_id?: string;
  type: 'gratitude' | 'meditation' | 'mantra' | 'affirmation';
  title: string;
  content: string;
  scheduled_times?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ENERGY_TYPES = [
  'Amor Incondicional',
  'Sabedoria Ancestral',
  'Força Criativa',
  'Paz Interior',
  'Coragem Transformadora',
  'Compaixão Infinita',
  'Luz Dourada',
  'Intuição Sagrada',
  'Harmonia Cósmica',
  'Poder Pessoal',
  'Gratidão Profunda',
  'Conexão Divina'
];