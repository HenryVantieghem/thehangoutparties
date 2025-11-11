import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import {
  User,
  UserStats,
  Location,
  Party,
  Photo,
  Comment,
  Friend,
  Message,
  Achievement,
} from '../types';
import { API } from '../constants';
import { getErrorMessage, logError } from '../utils';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

/**
 * Supabase configuration
 * Note: Replace with your actual Supabase URL and anon key
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Initialize Supabase client with AsyncStorage for React Native
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const cacheManager = new CacheManager();

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const AuthService = {
  /**
   * Sign up a new user
   * @param email - User email address
   * @param password - User password
   * @param username - Desired username
   * @returns User data and session
   */
  async signUp(
    email: string,
    password: string,
    username: string
  ): Promise<{ user: any; session: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          username,
        });

        if (profileError) {
          logError('AuthService.signUp - profile creation', profileError);
        }
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      logError('AuthService.signUp', error);
      throw new Error(`Failed to sign up: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Sign in an existing user
   * @param email - User email address
   * @param password - User password
   * @returns User data and session
   */
  async signIn(email: string, password: string): Promise<{ user: any; session: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Clear cache on sign in
      cacheManager.clear();

      return { user: data.user, session: data.session };
    } catch (error) {
      logError('AuthService.signIn', error);
      throw new Error(`Failed to sign in: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear cache on sign out
      cacheManager.clear();
    } catch (error) {
      logError('AuthService.signOut', error);
      throw new Error(`Failed to sign out: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Send password reset email
   * @param email - User email address
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'thehangout://reset-password',
      });

      if (error) throw error;
    } catch (error) {
      logError('AuthService.resetPassword', error);
      throw new Error(`Failed to send reset email: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Get the current authenticated user
   * @returns Current user data or null
   */
  async getCurrentUser(): Promise<any | null> {
    try {
      const cacheKey = 'current_user';
      const cached = cacheManager.get<any>(cacheKey);
      if (cached) return cached;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (user) {
        cacheManager.set(cacheKey, user, 2 * 60 * 1000); // 2 minutes cache
      }

      return user;
    } catch (error) {
      logError('AuthService.getCurrentUser', error);
      return null;
    }
  },

  /**
   * Update user profile information
   * @param updates - Profile updates object
   * @returns Updated user profile
   */
  async updateProfile(updates: {
    username?: string;
    avatar_url?: string;
    bio?: string;
    privacy_setting?: string;
  }): Promise<User> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      cacheManager.delete('current_user');
      cacheManager.delete(`user_${user.id}`);

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        avatar_url: data.avatar_url,
        bio: data.bio,
        stats: {
          friend_count: data.friend_count,
          parties_attended: data.parties_attended,
          photos_posted: data.photos_posted,
        },
      };
    } catch (error) {
      logError('AuthService.updateProfile', error);
      throw new Error(`Failed to update profile: ${getErrorMessage(error)}`);
    }
  },
};

// ============================================================================
// USER SERVICE
// ============================================================================

export const UserService = {
  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User data
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const cacheKey = `user_${userId}`;
      const cached = cacheManager.get<User>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data) return null;

      const user: User = {
        id: data.id,
        email: data.email,
        username: data.username,
        avatar_url: data.avatar_url,
        bio: data.bio,
        stats: {
          friend_count: data.friend_count,
          parties_attended: data.parties_attended,
          photos_posted: data.photos_posted,
        },
      };

      cacheManager.set(cacheKey, user);
      return user;
    } catch (error) {
      logError('UserService.getUser', error);
      return null;
    }
  },

  /**
   * Search users by username or email
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @returns Array of matching users
   */
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('privacy_setting', 'public')
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((u) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          avatar_url: u.avatar_url,
          bio: u.bio,
          stats: {
            friend_count: u.friend_count,
            parties_attended: u.parties_attended,
            photos_posted: u.photos_posted,
          },
        })) || []
      );
    } catch (error) {
      logError('UserService.searchUsers', error);
      return [];
    }
  },

  /**
   * Get user statistics
   * @param userId - User ID
   * @returns User statistics
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const cacheKey = `user_stats_${userId}`;
      const cached = cacheManager.get<UserStats>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('users')
        .select('friend_count, parties_attended, photos_posted')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data) return null;

      const stats: UserStats = {
        friend_count: data.friend_count,
        parties_attended: data.parties_attended,
        photos_posted: data.photos_posted,
      };

      cacheManager.set(cacheKey, stats, 1 * 60 * 1000); // 1 minute cache
      return stats;
    } catch (error) {
      logError('UserService.getUserStats', error);
      return null;
    }
  },

  /**
   * Update user location (debounced)
   * @param userId - User ID
   * @param location - Location coordinates
   */
  updateUserLocation: debounce(
    async (userId: string, location: Location): Promise<void> => {
      try {
        // Store location in user metadata or separate table
        // This is a placeholder - adjust based on your schema
        const { error } = await supabase
          .from('users')
          .update({
            // Assuming you have location fields or use metadata
            // Adjust based on your actual schema
          })
          .eq('id', userId);

        if (error) throw error;
      } catch (error) {
        logError('UserService.updateUserLocation', error);
      }
    },
    5000 // Debounce for 5 seconds
  ),

  /**
   * Block a user
   * @param blockerId - ID of user doing the blocking
   * @param blockedId - ID of user being blocked
   */
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
      });

      if (error) throw error;

      // Invalidate caches
      cacheManager.delete(`user_${blockedId}`);
      cacheManager.delete(`user_stats_${blockerId}`);
    } catch (error) {
      logError('UserService.blockUser', error);
      throw new Error(`Failed to block user: ${getErrorMessage(error)}`);
    }
  },
};

// ============================================================================
// PARTY SERVICE
// ============================================================================

export const PartyService = {
  /**
   * Get parties with optional filters
   * @param filters - Filter options (location, radius, status, etc.)
   * @param page - Page number for pagination
   * @returns Array of parties
   */
  async getParties(filters?: {
    location?: Location;
    radius?: number;
    status?: string;
    created_by?: string;
    page?: number;
  }): Promise<Party[]> {
    try {
      let query = supabase.from('parties').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.location && filters?.radius) {
        // Use PostGIS or calculate distance in query
        // This is a simplified version - adjust based on your setup
        query = query
          .gte('latitude', filters.location.latitude - filters.radius / 111)
          .lte('latitude', filters.location.latitude + filters.radius / 111)
          .gte('longitude', filters.location.longitude - filters.radius / 111)
          .lte('longitude', filters.location.longitude + filters.radius / 111);
      }

      const page = filters?.page || 0;
      const from = page * API.PAGINATION_LIMIT;
      const to = from + API.PAGINATION_LIMIT - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      return (
        data?.map((p) => ({
          id: p.id,
          created_by: p.created_by,
          title: p.title,
          description: p.description,
          location: {
            latitude: p.latitude,
            longitude: p.longitude,
          },
          photo: p.photo_url,
          attendees: p.attendee_count,
        })) || []
      );
    } catch (error) {
      logError('PartyService.getParties', error);
      return [];
    }
  },

  /**
   * Get a single party by ID
   * @param partyId - Party ID
   * @returns Party data or null
   */
  async getParty(partyId: string): Promise<Party | null> {
    try {
      const cacheKey = `party_${partyId}`;
      const cached = cacheManager.get<Party>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('id', partyId)
        .single();

      if (error) throw error;

      if (!data) return null;

      const party: Party = {
        id: data.id,
        created_by: data.created_by,
        title: data.title,
        description: data.description,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        photo: data.photo_url,
        attendees: data.attendee_count,
      };

      cacheManager.set(cacheKey, party);
      return party;
    } catch (error) {
      logError('PartyService.getParty', error);
      return null;
    }
  },

  /**
   * Create a new party
   * @param partyData - Party creation data
   * @returns Created party
   */
  async createParty(partyData: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    photo_url?: string;
  }): Promise<Party> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('parties')
        .insert({
          created_by: user.id,
          ...partyData,
          status: 'active',
          attendee_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const party: Party = {
        id: data.id,
        created_by: data.created_by,
        title: data.title,
        description: data.description,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        photo: data.photo_url,
        attendees: data.attendee_count,
      };

      // Invalidate parties list cache
      cacheManager.clear();

      return party;
    } catch (error) {
      logError('PartyService.createParty', error);
      throw new Error(`Failed to create party: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Update an existing party
   * @param partyId - Party ID
   * @param updates - Party updates
   * @returns Updated party
   */
  async updateParty(
    partyId: string,
    updates: {
      title?: string;
      description?: string;
      photo_url?: string;
      status?: string;
    }
  ): Promise<Party> {
    try {
      const { data, error } = await supabase
        .from('parties')
        .update(updates)
        .eq('id', partyId)
        .select()
        .single();

      if (error) throw error;

      const party: Party = {
        id: data.id,
        created_by: data.created_by,
        title: data.title,
        description: data.description,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        photo: data.photo_url,
        attendees: data.attendee_count,
      };

      // Invalidate cache
      cacheManager.delete(`party_${partyId}`);
      cacheManager.clear();

      return party;
    } catch (error) {
      logError('PartyService.updateParty', error);
      throw new Error(`Failed to update party: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Join a party
   * @param partyId - Party ID
   * @param userId - User ID
   * @returns Success status
   */
  async joinParty(partyId: string, userId: string): Promise<void> {
    try {
      // Check if already attending
      const { data: existing } = await supabase
        .from('party_attendees')
        .select('id')
        .eq('party_id', partyId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Already attending, just update status
        await supabase
          .from('party_attendees')
          .update({ status: 'going' })
          .eq('id', existing.id);
        return;
      }

      // Insert new attendance
      const { error: attendError } = await supabase.from('party_attendees').insert({
        party_id: partyId,
        user_id: userId,
        status: 'going',
      });

      if (attendError) throw attendError;

      // Update attendee count
      const { error: countError } = await supabase.rpc('increment', {
        table_name: 'parties',
        column_name: 'attendee_count',
        id: partyId,
      });

      if (countError) {
        // Fallback: manual update
        const { data: party } = await supabase
          .from('parties')
          .select('attendee_count')
          .eq('id', partyId)
          .single();

        if (party) {
          await supabase
            .from('parties')
            .update({ attendee_count: party.attendee_count + 1 })
            .eq('id', partyId);
        }
      }

      // Invalidate caches
      cacheManager.delete(`party_${partyId}`);
    } catch (error) {
      logError('PartyService.joinParty', error);
      throw new Error(`Failed to join party: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Leave a party
   * @param partyId - Party ID
   * @param userId - User ID
   */
  async leaveParty(partyId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('party_attendees')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update attendee count
      const { data: party } = await supabase
        .from('parties')
        .select('attendee_count')
        .eq('id', partyId)
        .single();

      if (party && party.attendee_count > 0) {
        await supabase
          .from('parties')
          .update({ attendee_count: party.attendee_count - 1 })
          .eq('id', partyId);
      }

      // Invalidate cache
      cacheManager.delete(`party_${partyId}`);
    } catch (error) {
      logError('PartyService.leaveParty', error);
      throw new Error(`Failed to leave party: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Subscribe to real-time party updates
   * @param partyId - Party ID
   * @param callback - Callback function for updates
   * @returns Realtime channel for cleanup
   */
  subscribeToPartyUpdates(
    partyId: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`party:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parties',
          filter: `id=eq.${partyId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },
};

// ============================================================================
// PHOTO SERVICE
// ============================================================================

export const PhotoService = {
  /**
   * Upload a photo to a party
   * @param partyId - Party ID
   * @param photoUri - Local photo URI
   * @param caption - Photo caption
   * @returns Created photo
   */
  async uploadPhoto(
    partyId: string,
    photoUri: string,
    caption?: string
  ): Promise<Photo> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      // Upload to storage first
      const fileName = `${partyId}/${user.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, {
          uri: photoUri,
          contentType: 'image/jpeg',
        } as any);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(fileName);

      // Create photo record
      const { data, error } = await supabase
        .from('photos')
        .insert({
          party_id: partyId,
          user_id: user.id,
          photo_url: publicUrl,
          caption: caption || null,
          likes: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user photos_posted count
      await supabase.rpc('increment', {
        table_name: 'users',
        column_name: 'photos_posted',
        id: user.id,
      });

      const photo: Photo = {
        id: data.id,
        party_id: data.party_id,
        user_id: data.user_id,
        photo_url: data.photo_url,
        caption: data.caption,
        likes: data.likes,
      };

      // Invalidate caches
      cacheManager.delete(`party_${partyId}`);

      return photo;
    } catch (error) {
      logError('PhotoService.uploadPhoto', error);
      throw new Error(`Failed to upload photo: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Get photos for a party
   * @param partyId - Party ID
   * @param page - Page number
   * @returns Array of photos
   */
  async getPhotos(partyId: string, page: number = 0): Promise<Photo[]> {
    try {
      const from = page * API.PAGINATION_LIMIT;
      const to = from + API.PAGINATION_LIMIT - 1;

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return (
        data?.map((p) => ({
          id: p.id,
          party_id: p.party_id,
          user_id: p.user_id,
          photo_url: p.photo_url,
          caption: p.caption,
          likes: p.likes,
        })) || []
      );
    } catch (error) {
      logError('PhotoService.getPhotos', error);
      return [];
    }
  },

  /**
   * Like or unlike a photo
   * @param photoId - Photo ID
   * @param userId - User ID
   * @returns Success status
   */
  async likePhoto(photoId: string, userId: string): Promise<void> {
    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Unlike: remove like and decrement count
        await supabase.from('likes').delete().eq('id', existing.id);
        await supabase.rpc('decrement', {
          table_name: 'photos',
          column_name: 'likes',
          id: photoId,
        });
      } else {
        // Like: add like and increment count
        await supabase.from('likes').insert({
          photo_id: photoId,
          user_id: userId,
        });
        await supabase.rpc('increment', {
          table_name: 'photos',
          column_name: 'likes',
          id: photoId,
        });
      }
    } catch (error) {
      logError('PhotoService.likePhoto', error);
      throw new Error(`Failed to like photo: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Delete a photo
   * @param photoId - Photo ID
   * @param userId - User ID (for authorization)
   */
  async deletePhoto(photoId: string, userId: string): Promise<void> {
    try {
      // Get photo to check ownership and get URL
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;
      if (photo.user_id !== userId) {
        throw new Error('Unauthorized to delete this photo');
      }

      // Delete from storage
      const fileName = photo.photo_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('photos').remove([fileName]);
      }

      // Delete photo record
      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) throw error;

      // Update user photos_posted count
      await supabase.rpc('decrement', {
        table_name: 'users',
        column_name: 'photos_posted',
        id: userId,
      });
    } catch (error) {
      logError('PhotoService.deletePhoto', error);
      throw new Error(`Failed to delete photo: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Subscribe to real-time photo updates for a party
   * @param partyId - Party ID
   * @param callback - Callback function for updates
   * @returns Realtime channel for cleanup
   */
  subscribeToPhotos(partyId: string, callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel(`photos:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `party_id=eq.${partyId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },
};

// ============================================================================
// COMMENT SERVICE
// ============================================================================

export const CommentService = {
  /**
   * Add a comment to a photo
   * @param photoId - Photo ID
   * @param text - Comment text
   * @returns Created comment
   */
  async addComment(photoId: string, text: string): Promise<Comment> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          text,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        photo_id: data.photo_id,
        user_id: data.user_id,
        text: data.text,
      };
    } catch (error) {
      logError('CommentService.addComment', error);
      throw new Error(`Failed to add comment: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Delete a comment
   * @param commentId - Comment ID
   * @param userId - User ID (for authorization)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logError('CommentService.deleteComment', error);
      throw new Error(`Failed to delete comment: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Subscribe to real-time comment updates for a photo
   * @param photoId - Photo ID
   * @param callback - Callback function for updates
   * @returns Realtime channel for cleanup
   */
  subscribeToComments(photoId: string, callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel(`comments:${photoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `photo_id=eq.${photoId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },
};

// ============================================================================
// FRIEND SERVICE
// ============================================================================

export const FriendService = {
  /**
   * Send a friend request
   * @param userId - User ID sending the request
   * @param friendId - User ID to send request to
   */
  async sendFriendRequest(userId: string, friendId: string): Promise<void> {
    try {
      if (userId === friendId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if request already exists
      const { data: existing } = await supabase
        .from('friends')
        .select('id, status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Already friends');
        }
        throw new Error('Friend request already exists');
      }

      const { error } = await supabase.from('friends').insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      });

      if (error) throw error;

      // Invalidate caches
      cacheManager.delete(`user_${userId}`);
      cacheManager.delete(`user_${friendId}`);
    } catch (error) {
      logError('FriendService.sendFriendRequest', error);
      throw new Error(`Failed to send friend request: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Accept a friend request
   * @param friendshipId - Friendship ID
   * @param userId - User ID accepting the request
   */
  async acceptFriendRequest(friendshipId: string, userId: string): Promise<void> {
    try {
      const { data: friendship, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', friendshipId)
        .single();

      if (fetchError) throw fetchError;

      if (friendship.friend_id !== userId) {
        throw new Error('Unauthorized to accept this request');
      }

      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      // Update friend counts for both users
      await supabase.rpc('increment', {
        table_name: 'users',
        column_name: 'friend_count',
        id: friendship.user_id,
      });
      await supabase.rpc('increment', {
        table_name: 'users',
        column_name: 'friend_count',
        id: friendship.friend_id,
      });

      // Invalidate caches
      cacheManager.delete(`user_${friendship.user_id}`);
      cacheManager.delete(`user_${friendship.friend_id}`);
    } catch (error) {
      logError('FriendService.acceptFriendRequest', error);
      throw new Error(`Failed to accept friend request: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Remove a friend or cancel a friend request
   * @param friendshipId - Friendship ID
   * @param userId - User ID removing the friendship
   */
  async removeFriend(friendshipId: string, userId: string): Promise<void> {
    try {
      const { data: friendship, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', friendshipId)
        .single();

      if (fetchError) throw fetchError;

      if (friendship.user_id !== userId && friendship.friend_id !== userId) {
        throw new Error('Unauthorized to remove this friendship');
      }

      const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
      if (error) throw error;

      // Decrement friend counts if was accepted
      if (friendship.status === 'accepted') {
        await supabase.rpc('decrement', {
          table_name: 'users',
          column_name: 'friend_count',
          id: friendship.user_id,
        });
        await supabase.rpc('decrement', {
          table_name: 'users',
          column_name: 'friend_count',
          id: friendship.friend_id,
        });
      }

      // Invalidate caches
      cacheManager.delete(`user_${friendship.user_id}`);
      cacheManager.delete(`user_${friendship.friend_id}`);
    } catch (error) {
      logError('FriendService.removeFriend', error);
      throw new Error(`Failed to remove friend: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Get friend list for a user
   * @param userId - User ID
   * @returns Array of friends
   */
  async getFriendList(userId: string): Promise<Friend[]> {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;

      return (
        data?.map((f) => ({
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          status: f.status,
        })) || []
      );
    } catch (error) {
      logError('FriendService.getFriendList', error);
      return [];
    }
  },
};

// ============================================================================
// MESSAGE SERVICE
// ============================================================================

export const MessageService = {
  /**
   * Send a message in a party chat
   * @param partyId - Party ID
   * @param text - Message text
   * @returns Created message
   */
  async sendMessage(partyId: string, text: string): Promise<Message> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('real_time_messages')
        .insert({
          party_id: partyId,
          user_id: user.id,
          text,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        party_id: data.party_id,
        user_id: data.user_id,
        text: data.text,
      };
    } catch (error) {
      logError('MessageService.sendMessage', error);
      throw new Error(`Failed to send message: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Delete a message
   * @param messageId - Message ID
   * @param userId - User ID (for authorization)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('real_time_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logError('MessageService.deleteMessage', error);
      throw new Error(`Failed to delete message: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Subscribe to real-time messages for a party
   * @param partyId - Party ID
   * @param callback - Callback function for updates
   * @returns Realtime channel for cleanup
   */
  subscribeToMessages(partyId: string, callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel(`messages:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'real_time_messages',
          filter: `party_id=eq.${partyId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },
};

// ============================================================================
// STORAGE SERVICE
// ============================================================================

export const StorageService = {
  /**
   * Upload an image to Supabase Storage
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   * @param file - File data (URI or blob)
   * @param options - Upload options
   * @returns Public URL of uploaded image
   */
  async uploadImage(
    bucket: string,
    path: string,
    file: string | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: options?.contentType || 'image/jpeg',
        upsert: options?.upsert || false,
      });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      logError('StorageService.uploadImage', error);
      throw new Error(`Failed to upload image: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Delete an image from Supabase Storage
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   */
  async deleteImage(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
    } catch (error) {
      logError('StorageService.deleteImage', error);
      throw new Error(`Failed to delete image: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Get public URL for a stored image
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   * @returns Public URL
   */
  getPublicUrl(bucket: string, path: string): string {
    try {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);
      return publicUrl;
    } catch (error) {
      logError('StorageService.getPublicUrl', error);
      return '';
    }
  },
};

