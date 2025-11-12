/**
 * Comprehensive validation schemas using Zod
 * Provides runtime type safety and input validation
 */
import { z } from 'zod';

// Base validation schemas
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(320, 'Email must be less than 320 characters');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  )
  .refine(
    (val) => !val.startsWith('_') && !val.endsWith('_'),
    'Username cannot start or end with underscore'
  );

const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Please enter a valid phone number'
  )
  .optional();

// User validation schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  agreeToPrivacy: z.boolean().refine(val => val === true, {
    message: 'You must agree to the privacy policy'
  })
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const resetPasswordSchema = z.object({
  email: emailSchema
});

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
  bio: z
    .string()
    .max(200, 'Bio must be less than 200 characters')
    .optional()
    .nullable(),
  avatar_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .nullable(),
  privacy_setting: z.enum(['public', 'friends_only', 'private']).optional(),
  phone: phoneSchema
});

// Party validation schemas
export const createPartySchema = z.object({
  title: z
    .string()
    .min(3, 'Party title must be at least 3 characters')
    .max(100, 'Party title must be less than 100 characters')
    .refine(
      (val) => val.trim().length >= 3,
      'Party title must contain at least 3 non-whitespace characters'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  full_description: z
    .string()
    .max(2000, 'Full description must be less than 2000 characters')
    .optional()
    .nullable(),
  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  starts_at: z.date().refine(
    (date) => date > new Date(),
    'Start time must be in the future'
  ),
  ends_at: z.date().optional().nullable(),
  max_attendees: z
    .number()
    .int('Max attendees must be a whole number')
    .min(2, 'Must allow at least 2 attendees')
    .max(500, 'Cannot exceed 500 attendees')
    .optional()
    .nullable(),
  vibe: z.enum(['chill', 'lit', 'exclusive', 'casual', 'banger']).optional().nullable(),
  tags: z
    .array(z.string().min(1).max(30))
    .max(10, 'Cannot have more than 10 tags')
    .optional(),
  visibility: z.enum(['public', 'friends_only', 'private', 'invite_only']).default('public'),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(1000, 'Price cannot exceed $1000')
    .optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD').optional(),
  age_restriction: z
    .number()
    .int('Age restriction must be a whole number')
    .min(13, 'Minimum age restriction is 13')
    .max(99, 'Maximum age restriction is 99')
    .optional(),
  dress_code: z
    .string()
    .max(100, 'Dress code must be less than 100 characters')
    .optional(),
  rules: z
    .array(z.string().min(1).max(200))
    .max(10, 'Cannot have more than 10 rules')
    .optional(),
  amenities: z
    .array(z.string().min(1).max(50))
    .max(20, 'Cannot have more than 20 amenities')
    .optional(),
  weather_dependency: z.boolean().default(false).optional()
});

export const updatePartySchema = createPartySchema.partial().omit({
  latitude: true,
  longitude: true
});

// Message validation schemas
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(300, 'Message must be less than 300 characters')
    .refine(
      (val) => val.trim().length >= 1,
      'Message cannot contain only whitespace'
    ),
  conversation_id: z.string().uuid('Invalid conversation ID'),
  reply_to: z.string().uuid().optional(),
  type: z.enum(['text', 'emoji']).default('text')
});

export const createConversationSchema = z.object({
  type: z.enum(['direct', 'party', 'group']),
  name: z
    .string()
    .min(1, 'Conversation name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  party_id: z.string().uuid().optional(),
  participant_ids: z.array(z.string().uuid()).min(1, 'At least one participant required')
});

// Photo validation schemas
export const uploadPhotoSchema = z.object({
  party_id: z.string().uuid('Invalid party ID'),
  caption: z
    .string()
    .max(200, 'Caption must be less than 200 characters')
    .optional()
    .nullable(),
  tagged_user_ids: z
    .array(z.string().uuid())
    .max(10, 'Cannot tag more than 10 users')
    .optional()
});

export const updatePhotoSchema = z.object({
  caption: z
    .string()
    .max(200, 'Caption must be less than 200 characters')
    .optional()
    .nullable(),
  tagged_user_ids: z
    .array(z.string().uuid())
    .max(10, 'Cannot tag more than 10 users')
    .optional()
});

// Comment validation schemas
export const createCommentSchema = z.object({
  photo_id: z.string().uuid('Invalid photo ID'),
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be less than 500 characters')
    .refine(
      (val) => val.trim().length >= 1,
      'Comment cannot contain only whitespace'
    )
});

export const updateCommentSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be less than 500 characters')
    .refine(
      (val) => val.trim().length >= 1,
      'Comment cannot contain only whitespace'
    )
});

// Location validation schemas
export const locationSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  accuracy: z.number().min(0).optional().nullable(),
  timestamp: z.date().optional()
});

// Search validation schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters'),
  type: z.enum(['parties', 'users', 'all']).default('all'),
  location: locationSchema.optional(),
  radius: z
    .number()
    .min(0.1, 'Radius must be at least 0.1 km')
    .max(100, 'Radius cannot exceed 100 km')
    .default(10)
    .optional(),
  filters: z.object({
    date_range: z.object({
      start: z.date(),
      end: z.date()
    }).optional(),
    price_range: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    vibes: z.array(z.enum(['chill', 'lit', 'exclusive', 'casual', 'banger'])).optional(),
    age_range: z.object({
      min: z.number().int().min(13),
      max: z.number().int().max(99)
    }).optional()
  }).optional()
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc').optional()
});

// File upload schemas
export const fileUploadSchema = z.object({
  file_size: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  mime_type: z.string().regex(/^(image|video)\/.+/, 'Invalid file type'),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional()
});

// Utility functions for validation
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{ field: string; message: string; code: string }>;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      };
    }
    throw error;
  }
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/[^\w\s\-.,!?@#$%^&*()[\]{}|;:'"\/\\]/g, '') // Remove special chars except common ones
    .substring(0, 1000); // Limit length
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production use a library like DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Type inference helpers
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type CreatePartyData = z.infer<typeof createPartySchema>;
export type UpdatePartyData = z.infer<typeof updatePartySchema>;
export type SendMessageData = z.infer<typeof sendMessageSchema>;
export type CreateConversationData = z.infer<typeof createConversationSchema>;
export type UploadPhotoData = z.infer<typeof uploadPhotoSchema>;
export type UpdatePhotoData = z.infer<typeof updatePhotoSchema>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type UpdateCommentData = z.infer<typeof updateCommentSchema>;
export type LocationData = z.infer<typeof locationSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;