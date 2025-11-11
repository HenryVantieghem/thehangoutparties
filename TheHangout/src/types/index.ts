/**
 * Complete TypeScript type definitions for The Hangout
 */

export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  friend_count: number;
  parties_attended: number;
  photos_posted: number;
  last_location_lat: number | null;
  last_location_lng: number | null;
  privacy_setting: 'public' | 'friends_only' | 'private';
  is_blocked_by_list: string[];
  deleted_at: Date | string | null;
  last_seen_at: Date | string | null;
  badges?: Achievement[];
};

export type Party = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_url: string | null;
  thumbnail_url?: string | null;
  attendee_count: number;
  max_attendees: number | null;
  status: 'active' | 'ended' | 'archived';
  created_at: Date | string;
  updated_at: Date | string;
  ended_at: Date | string | null;
  last_activity_at: Date | string;
  is_trending: boolean;
  view_count: number;
  engagement_score: number;
  tags: string[];
  vibe: 'chill' | 'lit' | 'exclusive' | 'casual' | 'banger' | null;
  creator?: User;
  attendees?: User[];
  photos?: Photo[];
};

export type PartyAttendee = {
  id: string;
  party_id: string;
  user_id: string;
  joined_at: Date | string;
  status: 'going' | 'interested' | 'maybe';
  user?: User;
};

export type Photo = {
  id: string;
  party_id: string;
  user_id: string;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes: number;
  comment_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  is_featured: boolean;
  blur_hash?: string | null;
  user?: User;
  comments?: Comment[];
  is_liked_by_current_user?: boolean;
};

export type Comment = {
  id: string;
  photo_id: string;
  user_id: string;
  text: string;
  created_at: Date | string;
  deleted_at: Date | string | null;
  edited_at: Date | string | null;
  user?: User;
};

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: Date | string;
  updated_at: Date | string;
  friend?: User;
};

export type Message = {
  id: string;
  party_id: string;
  user_id: string;
  text: string;
  created_at: Date | string;
  deleted_at: Date | string | null;
  is_read: boolean;
  user?: User;
};

export type Achievement = {
  id: string;
  user_id: string;
  achievement_type: 'party_creator' | 'social_butterfly' | 'photo_pro' | 'social_legend' | 'early_adopter' | 'night_owl' | 'local_legend';
  unlocked_at: Date | string;
  progress_data?: Record<string, any>;
};

export type Location = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: Date | string;
};

export type UserPreferences = {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  location_sharing: boolean;
  private_mode: boolean;
  theme: 'dark' | 'light' | 'auto';
  language: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ApiResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

// Legacy types for backward compatibility
export interface UserStats {
  friend_count: number;
  parties_attended: number;
  photos_posted: number;
}
