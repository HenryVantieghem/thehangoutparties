import { z } from 'zod';

// Base model with common fields
export const baseModelSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// User model
export const userModelSchema = baseModelSchema.extend({
  email: z.string().email(),
  username: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().optional(),
  friend_count: z.number().default(0),
  parties_attended: z.number().default(0),
  photos_posted: z.number().default(0),
  last_location_lat: z.number().optional(),
  last_location_lng: z.number().optional(),
  privacy_setting: z.enum(['public', 'friends', 'private']).default('public'),
  is_verified: z.boolean().default(false),
  is_blocked: z.boolean().default(false),
  is_blocked_by_list: z.array(z.string()).default([]),
  deleted_at: z.string().nullable().default(null),
  last_seen_at: z.string().optional(),
});

export type UserModel = z.infer<typeof userModelSchema>;

// Party model
export const partyModelSchema = baseModelSchema.extend({
  created_by: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  photo_url: z.string().url().optional(),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  max_attendees: z.number().positive().optional(),
  attendee_count: z.number().min(0).default(0),
  status: z.enum(['active', 'ended', 'cancelled']).default('active'),
  is_trending: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  view_count: z.number().min(0).default(0),
  engagement_score: z.number().min(0).max(10).default(0),
  tags: z.array(z.string()).default([]),
  vibe: z.enum(['chill', 'lit', 'banger', 'exclusive', 'casual']).default('casual'),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  ended_at: z.string().nullable().default(null),
  last_activity_at: z.string().optional(),
  creator: userModelSchema.optional(),
  attendees: z.array(userModelSchema).default([]),
  photos: z.array(z.string()).default([]),
});

export type PartyModel = z.infer<typeof partyModelSchema>;

// Message model
export const messageModelSchema = baseModelSchema.extend({
  party_id: z.string(),
  sender_id: z.string(),
  content: z.string().min(1).max(300),
  type: z.enum(['text', 'image', 'system']).default('text'),
  reply_to: z.string().optional(),
  reactions: z.array(z.object({
    emoji: z.string(),
    count: z.number().min(0),
    users: z.array(z.string()),
  })).default([]),
  is_edited: z.boolean().default(false),
  edited_at: z.string().optional(),
  sender: userModelSchema.optional(),
});

export type MessageModel = z.infer<typeof messageModelSchema>;

// Photo model
export const photoModelSchema = baseModelSchema.extend({
  party_id: z.string(),
  user_id: z.string(),
  url: z.string().url(),
  caption: z.string().max(200).optional(),
  likes_count: z.number().min(0).default(0),
  is_featured: z.boolean().default(false),
  is_reported: z.boolean().default(false),
  reported_at: z.string().optional(),
  approved_at: z.string().optional(),
  user: userModelSchema.optional(),
  party: partyModelSchema.optional(),
});

export type PhotoModel = z.infer<typeof photoModelSchema>;

// Location model
export const locationModelSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  timestamp: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type LocationModel = z.infer<typeof locationModelSchema>;

// Notification model
export const notificationModelSchema = baseModelSchema.extend({
  user_id: z.string(),
  type: z.enum([
    'party_invite',
    'friend_request',
    'message',
    'party_update',
    'photo_like',
    'photo_comment',
    'system'
  ]),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  is_read: z.boolean().default(false),
  read_at: z.string().optional(),
  action_url: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export type NotificationModel = z.infer<typeof notificationModelSchema>;

// API pagination wrapper
export const paginatedResponseSchema = <T>(itemSchema: z.ZodType<T>) => z.object({
  data: z.array(itemSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1),
    total: z.number().min(0),
    totalPages: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Data transformation utilities
export class DataTransformer {
  /**
   * Transform raw API user data to UserModel
   */
  static transformUser(rawUser: any): UserModel {
    try {
      return userModelSchema.parse({
        ...rawUser,
        display_name: rawUser.display_name || rawUser.username || rawUser.email?.split('@')[0],
        friend_count: rawUser.friend_count || 0,
        parties_attended: rawUser.parties_attended || 0,
        photos_posted: rawUser.photos_posted || 0,
        privacy_setting: rawUser.privacy_setting || 'public',
        is_verified: rawUser.is_verified || false,
        is_blocked: rawUser.is_blocked || false,
        is_blocked_by_list: rawUser.is_blocked_by_list || [],
      });
    } catch (error) {
      console.error('User transformation error:', error);
      throw new Error(`Invalid user data: ${error.message}`);
    }
  }

  /**
   * Transform raw API party data to PartyModel
   */
  static transformParty(rawParty: any): PartyModel {
    try {
      return partyModelSchema.parse({
        ...rawParty,
        attendee_count: rawParty.attendee_count || 0,
        status: rawParty.status || 'active',
        is_trending: rawParty.is_trending || false,
        is_featured: rawParty.is_featured || false,
        view_count: rawParty.view_count || 0,
        engagement_score: rawParty.engagement_score || 0,
        tags: rawParty.tags || [],
        vibe: rawParty.vibe || 'casual',
        visibility: rawParty.visibility || 'public',
        creator: rawParty.creator ? this.transformUser(rawParty.creator) : undefined,
        attendees: rawParty.attendees ? rawParty.attendees.map(this.transformUser) : [],
        photos: rawParty.photos || [],
      });
    } catch (error) {
      console.error('Party transformation error:', error);
      throw new Error(`Invalid party data: ${error.message}`);
    }
  }

  /**
   * Transform raw API message data to MessageModel
   */
  static transformMessage(rawMessage: any): MessageModel {
    try {
      return messageModelSchema.parse({
        ...rawMessage,
        type: rawMessage.type || 'text',
        reactions: rawMessage.reactions || [],
        is_edited: rawMessage.is_edited || false,
        sender: rawMessage.sender ? this.transformUser(rawMessage.sender) : undefined,
      });
    } catch (error) {
      console.error('Message transformation error:', error);
      throw new Error(`Invalid message data: ${error.message}`);
    }
  }

  /**
   * Transform raw API photo data to PhotoModel
   */
  static transformPhoto(rawPhoto: any): PhotoModel {
    try {
      return photoModelSchema.parse({
        ...rawPhoto,
        likes_count: rawPhoto.likes_count || 0,
        is_featured: rawPhoto.is_featured || false,
        is_reported: rawPhoto.is_reported || false,
        user: rawPhoto.user ? this.transformUser(rawPhoto.user) : undefined,
        party: rawPhoto.party ? this.transformParty(rawPhoto.party) : undefined,
      });
    } catch (error) {
      console.error('Photo transformation error:', error);
      throw new Error(`Invalid photo data: ${error.message}`);
    }
  }

  /**
   * Transform raw API notification data to NotificationModel
   */
  static transformNotification(rawNotification: any): NotificationModel {
    try {
      return notificationModelSchema.parse({
        ...rawNotification,
        is_read: rawNotification.is_read || false,
        priority: rawNotification.priority || 'normal',
      });
    } catch (error) {
      console.error('Notification transformation error:', error);
      throw new Error(`Invalid notification data: ${error.message}`);
    }
  }

  /**
   * Transform paginated API response
   */
  static transformPaginatedResponse<T>(
    rawResponse: any, 
    transformItem: (item: any) => T
  ): PaginatedResponse<T> {
    try {
      return {
        data: rawResponse.data?.map(transformItem) || [],
        pagination: {
          page: rawResponse.pagination?.page || 1,
          limit: rawResponse.pagination?.limit || 10,
          total: rawResponse.pagination?.total || 0,
          totalPages: rawResponse.pagination?.totalPages || 0,
          hasNext: rawResponse.pagination?.hasNext || false,
          hasPrev: rawResponse.pagination?.hasPrev || false,
        },
      };
    } catch (error) {
      console.error('Paginated response transformation error:', error);
      throw new Error(`Invalid paginated response: ${error.message}`);
    }
  }

  /**
   * Sanitize user input for API requests
   */
  static sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim().substring(0, 1000); // Prevent extremely long strings
    }
    if (Array.isArray(input)) {
      return input.slice(0, 100).map(item => this.sanitizeUserInput(item)); // Limit array size
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        if (key.length > 100) continue; // Skip extremely long keys
        sanitized[key] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }
    return input;
  }

  /**
   * Validate and transform party creation data
   */
  static validatePartyCreation(data: any) {
    const schema = z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      address: z.string().min(1),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      max_attendees: z.number().positive().optional(),
      tags: z.array(z.string()).max(10).optional(),
      vibe: z.enum(['chill', 'lit', 'banger', 'exclusive', 'casual']).optional(),
      visibility: z.enum(['public', 'friends', 'private']).optional(),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
    });

    return schema.parse(this.sanitizeUserInput(data));
  }

  /**
   * Validate and transform message data
   */
  static validateMessage(data: any) {
    const schema = z.object({
      content: z.string().min(1).max(300),
      type: z.enum(['text', 'image']).default('text'),
      reply_to: z.string().optional(),
    });

    return schema.parse(this.sanitizeUserInput(data));
  }
}

// Export all models and utilities
export {
  UserModel,
  PartyModel,
  MessageModel,
  PhotoModel,
  LocationModel,
  NotificationModel,
  PaginatedResponse,
  DataTransformer,
};