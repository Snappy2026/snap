// ============================================================================
// Database & Supabase Type Definitions
// ============================================================================

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type MediaType = 'image' | 'video';
export type UserRole = 'admin' | 'creator' | 'customer';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role?: UserRole;
  stripe_account_id?: string | null;
  custom_gold_price?: number;
  custom_yearly_price?: number;
  is_vip_member?: boolean;
  vip_tier?: string;
  vip_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface Snap {
  id: string;
  sender_id: string;
  recipient_id: string;
  media_url: string;
  media_type: MediaType;
  duration: number;
  viewed_at: string | null;
  is_pay_per_view?: boolean;
  price_amount?: number;
  created_at: string;
  sender_profile?: Partial<Profile>;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  text_content: string;
  created_at: string;
  read_at: string | null;
  sender_profile?: Partial<Profile>;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  is_pay_per_view?: boolean;
  price_amount?: number;
  created_at: string;
  expires_at: string;
  user_profile?: Partial<Profile>;
}

export interface VipContentItem {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: MediaType;
  required_tier: string;
  created_at: string;
  creator_profile?: Partial<Profile>;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Friendship, 'id'>>;
      };
      snaps: {
        Row: Snap;
        Insert: Omit<Snap, 'id' | 'viewed_at' | 'created_at'>;
        Update: Partial<Omit<Snap, 'id'>>;
      };
      messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'read_at' | 'created_at'>;
        Update: Partial<Omit<ChatMessage, 'id'>>;
      };
      stories: {
        Row: Story;
        Insert: Omit<Story, 'id' | 'created_at' | 'expires_at'>;
        Update: Partial<Omit<Story, 'id'>>;
      };
      vip_content: {
        Row: VipContentItem;
        Insert: Omit<VipContentItem, 'id' | 'created_at'>;
        Update: Partial<Omit<VipContentItem, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      friendship_status: FriendshipStatus;
      media_type: MediaType;
    };
  };
}
