/**
 * User statistics object
 */
export interface UserStats {
  /** Number of friends the user has */
  friend_count: number;
  /** Number of parties the user has attended */
  parties_attended: number;
  /** Number of photos the user has posted */
  photos_posted: number;
}

/**
 * User profile information
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's unique username */
  username: string;
  /** URL to the user's avatar image */
  avatar_url: string | null;
  /** User's bio text (max 200 characters) */
  bio: string | null;
  /** User's statistics and activity metrics */
  stats: UserStats;
}

/**
 * Geographic location coordinates
 */
export interface Location {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Location accuracy in meters (optional) */
  accuracy?: number;
}

/**
 * Party information
 */
export interface Party {
  /** Unique identifier for the party */
  id: string;
  /** ID of the user who created the party */
  created_by: string;
  /** Party title */
  title: string;
  /** Party description */
  description: string | null;
  /** Geographic location of the party */
  location: Location;
  /** URL to the party's photo */
  photo: string | null;
  /** Number of attendees */
  attendees: number;
}

/**
 * Photo information
 */
export interface Photo {
  /** Unique identifier for the photo */
  id: string;
  /** ID of the party this photo belongs to */
  party_id: string;
  /** ID of the user who posted the photo */
  user_id: string;
  /** URL to the photo */
  photo_url: string;
  /** Photo caption */
  caption: string | null;
  /** Number of likes the photo has received */
  likes: number;
}

/**
 * Comment on a photo
 */
export interface Comment {
  /** Unique identifier for the comment */
  id: string;
  /** ID of the photo this comment belongs to */
  photo_id: string;
  /** ID of the user who made the comment */
  user_id: string;
  /** Comment text content */
  text: string;
}

/**
 * Friend relationship
 */
export interface Friend {
  /** Unique identifier for the friendship */
  id: string;
  /** ID of the user who initiated the friendship */
  user_id: string;
  /** ID of the friend */
  friend_id: string;
  /** Status of the friendship: 'pending', 'accepted', 'blocked' */
  status: 'pending' | 'accepted' | 'blocked';
}

/**
 * Real-time message in a party chat
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** ID of the party this message belongs to */
  party_id: string;
  /** ID of the user who sent the message */
  user_id: string;
  /** Message text content */
  text: string;
}

/**
 * User achievement
 */
export interface Achievement {
  /** Unique identifier for the achievement */
  id: string;
  /** ID of the user who unlocked the achievement */
  user_id: string;
  /** Type of achievement (e.g., 'first_party', 'social_butterfly', etc.) */
  achievement_type: string;
  /** Timestamp when the achievement was unlocked */
  unlocked_at: Date | string;
}

