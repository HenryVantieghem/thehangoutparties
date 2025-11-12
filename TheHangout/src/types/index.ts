/**
 * Complete TypeScript type definitions for The Hangout
 * Enhanced with proper validation and security considerations
 */

// Re-export navigation types
export * from './navigation';

// User types with proper validation
export interface User {
  readonly id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url: string | null;
  bio: string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  friend_count: number;
  parties_attended: number;
  photos_posted: number;
  last_location_lat: number | null;
  last_location_lng: number | null;
  privacy_setting: 'public' | 'friends_only' | 'private';
  is_blocked_by_list: readonly string[];
  readonly deleted_at: Date | string | null;
  readonly last_seen_at: Date | string | null;
  badges?: readonly Achievement[];
  is_verified?: boolean;
  notification_preferences?: UserNotificationPreferences;
  safety_settings?: UserSafetySettings;
}

// User safety and privacy types
export interface UserNotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  party_invites: boolean;
  friend_requests: boolean;
  party_updates: boolean;
  messages: boolean;
  promotional: boolean;
}

export interface UserSafetySettings {
  block_strangers: boolean;
  location_sharing: boolean;
  photo_tagging: boolean;
  search_visibility: boolean;
  activity_status: boolean;
}

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

// Enhanced Photo types with content moderation
export interface Photo {
  readonly id: string;
  party_id: string;
  user_id: string;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes: number;
  comment_count: number;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly deleted_at: Date | string | null;
  is_featured: boolean;
  blur_hash?: string | null;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_flags?: string[];
  user?: User;
  comments?: readonly Comment[];
  is_liked_by_current_user?: boolean;
  tagged_users?: readonly User[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

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

// Enhanced Message types for real-time chat
export interface Message {
  readonly id: string;
  conversation_id: string;
  party_id?: string;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'system' | 'emoji';
  reply_to?: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  readonly deleted_at: Date | string | null;
  edited_at: Date | string | null;
  is_read: boolean;
  delivery_status: 'sending' | 'sent' | 'delivered' | 'failed';
  user?: User;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
}

export interface MessageReaction {
  readonly id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  readonly created_at: Date | string;
  user?: User;
}

export interface MessageAttachment {
  readonly id: string;
  message_id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail_url?: string;
  filename?: string;
  file_size?: number;
  mime_type?: string;
}

export interface Conversation {
  readonly id: string;
  type: 'direct' | 'party' | 'group';
  name?: string;
  description?: string;
  avatar_url?: string;
  party_id?: string;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  last_message?: Message;
  unread_count: number;
  participants: ConversationParticipant[];
}

export interface ConversationParticipant {
  readonly id: string;
  conversation_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'moderator';
  joined_at: Date | string;
  last_read_at: Date | string | null;
  is_muted: boolean;
  user?: User;
}

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

// Enhanced API response types with proper error handling
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      error: null;
      meta?: {
        pagination?: PaginationMeta;
        timestamp: string;
        version: string;
      };
    }
  | {
      success: false;
      data: null;
      error: ApiError;
      meta?: {
        timestamp: string;
        version: string;
        request_id?: string;
      };
    };

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field_errors?: Record<string, string[]>;
  retry_after?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: ValidationError[];
};

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface AsyncOperation<T> extends LoadingState {
  data: T | null;
}

// Accessibility types
export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'text' | 'image' | 'header' | 'none';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

// Security types
export interface SecurityHeaders {
  'X-CSRF-Token'?: string;
  'X-Request-ID'?: string;
  'Authorization'?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: Date | string;
}

// Enhanced Party types with better validation
export interface Party {
  readonly id: string;
  created_by: string;
  title: string;
  description: string | null;
  full_description?: string;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_url: string | null;
  thumbnail_url?: string | null;
  attendee_count: number;
  max_attendees: number | null;
  status: 'draft' | 'active' | 'ended' | 'cancelled' | 'archived';
  visibility: 'public' | 'friends_only' | 'private' | 'invite_only';
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
  starts_at: Date | string;
  ends_at: Date | string | null;
  readonly ended_at: Date | string | null;
  readonly last_activity_at: Date | string;
  is_trending: boolean;
  view_count: number;
  engagement_score: number;
  tags: readonly string[];
  vibe: 'chill' | 'lit' | 'exclusive' | 'casual' | 'banger' | null;
  price?: number;
  currency?: string;
  age_restriction?: number;
  dress_code?: string;
  rules?: readonly string[];
  amenities?: readonly string[];
  weather_dependency?: boolean;
  creator?: User;
  attendees?: readonly PartyAttendee[];
  photos?: readonly Photo[];
  safety_features?: PartySafetyFeatures;
  moderation_status: 'pending' | 'approved' | 'rejected';
}

export interface PartySafetyFeatures {
  verified_host: boolean;
  emergency_contact: string | null;
  safety_guidelines: readonly string[];
  max_capacity_enforced: boolean;
  age_verification_required: boolean;
  alcohol_policy: 'none' | 'byob' | 'provided' | 'cash_bar';
}

// Legacy types for backward compatibility
export interface UserStats {
  friend_count: number;
  parties_attended: number;
  photos_posted: number;
}

// Environment and feature flag types
export interface FeatureFlags {
  real_time_chat: boolean;
  push_notifications: boolean;
  location_sharing: boolean;
  photo_tagging: boolean;
  video_calls: boolean;
  premium_features: boolean;
  analytics_tracking: boolean;
  crash_reporting: boolean;
}

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  environment: Environment;
  api_url: string;
  websocket_url: string;
  supabase_url: string;
  supabase_anon_key: string;
  feature_flags: FeatureFlags;
  version: string;
  build_number: string;
}
