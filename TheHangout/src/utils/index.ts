import { Party, User } from '../types';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

// Distance calculation between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
};

// Time ago formatting
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHour = Math.floor(diffInMin / 60);
  const diffInDay = Math.floor(diffInHour / 24);

  if (diffInSec < 60) return `${diffInSec}s ago`;
  if (diffInMin < 60) return `${diffInMin}m ago`;
  if (diffInHour < 24) return `${diffInHour}h ago`;
  if (diffInDay < 7) return `${diffInDay}d ago`;
  
  return date.toLocaleDateString();
};

// String utilities
export const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Number formatting
export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
};

export const formatNumberCompact = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
};

// Error handling
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  return 'An unexpected error occurred';
};

export const logError = (context: string, error: unknown): void => {
  console.error(`[${context}]`, error);
};

export const isNetworkError = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err?.code === 'NETWORK_ERROR' || err?.message?.includes('network') || err?.message?.includes('fetch');
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err?.code === 'AUTH_ERROR' || err?.status === 401 || err?.message?.includes('auth');
  }
  return false;
};

export const captureException = (error: unknown, context?: Record<string, any>): void => {
  console.error('Exception captured:', error, context);
  // In production, send to error tracking service (e.g., Sentry)
};

// Validation utilities
export const validatePartyForm = (data: {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Party title is required';
  } else if (data.title.length > 100) {
    errors.title = 'Party title must be 100 characters or less';
  }
  
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be 500 characters or less';
  }
  
  if (!data.latitude || !data.longitude) {
    errors.location = 'Location is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePhotoCaption = (caption: string): { isValid: boolean; error?: string } => {
  if (caption.length > 200) {
    return { isValid: false, error: 'Caption must be 200 characters or less' };
  }
  return { isValid: true };
};

export const validateMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 300) {
    return { isValid: false, error: 'Message must be 300 characters or less' };
  }
  return { isValid: true };
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    (result[group] = result[group] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) return Array.from(new Set(array));
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// Mock Data for Development

// Mock users for parties
const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'sarah@university.edu',
    username: 'sarahparty',
    avatar_url: 'https://picsum.photos/200/200?random=1',
    bio: 'Party enthusiast and event organizer',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    friend_count: 125,
    parties_attended: 23,
    photos_posted: 45,
    last_location_lat: 40.7128,
    last_location_lng: -74.0060,
    privacy_setting: 'public',
    is_blocked_by_list: [],
    deleted_at: null,
    last_seen_at: new Date(),
  },
  {
    id: 'user2',
    email: 'mike@university.edu',
    username: 'mikedj',
    avatar_url: 'https://picsum.photos/200/200?random=2',
    bio: 'DJ and music lover',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10'),
    friend_count: 89,
    parties_attended: 15,
    photos_posted: 32,
    last_location_lat: 40.7282,
    last_location_lng: -73.9942,
    privacy_setting: 'public',
    is_blocked_by_list: [],
    deleted_at: null,
    last_seen_at: new Date(),
  },
  {
    id: 'user3',
    email: 'emma@university.edu',
    username: 'emmavibe',
    avatar_url: 'https://picsum.photos/200/200?random=3',
    bio: 'Creating unforgettable memories',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20'),
    friend_count: 156,
    parties_attended: 31,
    photos_posted: 78,
    last_location_lat: 40.7589,
    last_location_lng: -73.9851,
    privacy_setting: 'public',
    is_blocked_by_list: [],
    deleted_at: null,
    last_seen_at: new Date(),
  },
  {
    id: 'user4',
    email: 'alex@university.edu',
    username: 'alexfun',
    avatar_url: 'https://picsum.photos/200/200?random=4',
    bio: 'Life of the party',
    created_at: new Date('2024-03-05'),
    updated_at: new Date('2024-03-05'),
    friend_count: 203,
    parties_attended: 42,
    photos_posted: 67,
    last_location_lat: 40.7505,
    last_location_lng: -73.9934,
    privacy_setting: 'public',
    is_blocked_by_list: [],
    deleted_at: null,
    last_seen_at: new Date(),
  },
  {
    id: 'user5',
    email: 'jordan@university.edu',
    username: 'jordanbeats',
    avatar_url: 'https://picsum.photos/200/200?random=5',
    bio: 'Music producer and event host',
    created_at: new Date('2024-02-28'),
    updated_at: new Date('2024-02-28'),
    friend_count: 178,
    parties_attended: 28,
    photos_posted: 54,
    last_location_lat: 40.7527,
    last_location_lng: -73.9772,
    privacy_setting: 'public',
    is_blocked_by_list: [],
    deleted_at: null,
    last_seen_at: new Date(),
  },
];

// Generate random time for parties
const generatePartyTime = () => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Random time between now and next week
  const randomTime = new Date(now.getTime() + Math.random() * (nextWeek.getTime() - now.getTime()));
  
  return {
    created_at: randomTime.toISOString(),
    updated_at: randomTime.toISOString(),
    ended_at: null,
    last_activity_at: randomTime.toISOString(),
  };
};

// Mock party data
export const mockParties: Party[] = [
  {
    id: 'party1',
    created_by: mockUsers[0].id,
    title: '🎉 Epic House Party at University Heights',
    description: 'Join us for the wildest house party of the semester! Great music, amazing people, and unforgettable memories. BYOB and bring your dancing shoes!',
    photo_url: 'https://picsum.photos/400/300?random=10',
    address: '123 University Heights Dr',
    latitude: 40.7128,
    longitude: -74.0060,
    max_attendees: 150,
    attendee_count: 34,
    status: 'active',
    is_trending: true,
    view_count: 256,
    engagement_score: 8.5,
    tags: ['house party', 'dancing', 'music', 'drinks', 'college'],
    vibe: 'banger',
    creator: mockUsers[0],
    attendees: mockUsers.slice(1, 4),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party2',
    created_by: mockUsers[1].id,
    title: '🏖️ Beach Bonfire & BBQ',
    description: 'Sunset beach party with bonfire, BBQ, volleyball, and chill vibes. Watch the sunset while enjoying great food and company!',
    photo_url: 'https://picsum.photos/400/300?random=11',
    address: 'Sunset Beach Park',
    latitude: 40.7282,
    longitude: -73.9942,
    max_attendees: 80,
    attendee_count: 23,
    status: 'active',
    is_trending: false,
    view_count: 134,
    engagement_score: 7.2,
    tags: ['beach', 'bonfire', 'BBQ', 'sunset', 'volleyball'],
    vibe: 'chill',
    creator: mockUsers[1],
    attendees: mockUsers.slice(0, 3),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party3',
    created_by: mockUsers[1].id,
    title: '🎵 Underground DJ Set - Electronic Vibes',
    description: 'Experience the best electronic music in the city! Underground venue with world-class DJs and mind-blowing sound system.',
    photo_url: 'https://picsum.photos/400/300?random=12',
    address: 'The Underground Club',
    latitude: 40.7589,
    longitude: -73.9851,
    max_attendees: 200,
    attendee_count: 67,
    status: 'active',
    is_trending: true,
    view_count: 423,
    engagement_score: 9.1,
    tags: ['electronic', 'DJ', 'underground', 'dancing', 'nightlife'],
    vibe: 'lit',
    creator: mockUsers[1],
    attendees: mockUsers.slice(2, 5),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party4',
    created_by: mockUsers[2].id,
    title: '🏠 Cozy Movie Night & Pizza',
    description: 'Intimate gathering for movie lovers! We\'ll watch classic films, eat amazing pizza, and have great conversations. Perfect for a chill night.',
    photo_url: 'https://picsum.photos/400/300?random=13',
    address: '456 Maple Street Apt 3B',
    latitude: 40.7505,
    longitude: -73.9934,
    max_attendees: 25,
    attendee_count: 12,
    status: 'active',
    is_trending: false,
    view_count: 67,
    engagement_score: 6.8,
    tags: ['movie night', 'pizza', 'cozy', 'friends', 'indoor'],
    vibe: 'chill',
    creator: mockUsers[2],
    attendees: mockUsers.slice(0, 2),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party5',
    created_by: mockUsers[3].id,
    title: '🍻 Rooftop Bar Crawl Adventure',
    description: 'Join us for an epic rooftop bar crawl across the city! Amazing views, great drinks, and new friends. Meet at Central Station.',
    photo_url: 'https://picsum.photos/400/300?random=14',
    address: 'Central Station (Meeting Point)',
    latitude: 40.7527,
    longitude: -73.9772,
    max_attendees: 120,
    attendee_count: 45,
    status: 'active',
    is_trending: true,
    view_count: 298,
    engagement_score: 8.3,
    tags: ['bar crawl', 'rooftop', 'drinks', 'city views', 'adventure'],
    vibe: 'lit',
    creator: mockUsers[3],
    attendees: mockUsers.slice(1, 5),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party6',
    created_by: mockUsers[4].id,
    title: '🎨 Art Gallery Opening & Wine Tasting',
    description: 'Sophisticated evening at the new downtown gallery. Contemporary art, fine wine, and intellectual conversations in a beautiful setting.',
    photo_url: 'https://picsum.photos/400/300?random=15',
    address: 'Downtown Contemporary Gallery',
    latitude: 40.7614,
    longitude: -73.9776,
    max_attendees: 60,
    attendee_count: 18,
    status: 'active',
    is_trending: false,
    view_count: 89,
    engagement_score: 7.5,
    tags: ['art', 'gallery', 'wine', 'sophisticated', 'culture'],
    vibe: 'exclusive',
    creator: mockUsers[4],
    attendees: mockUsers.slice(0, 3),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party7',
    created_by: mockUsers[0].id,
    title: '🏀 Game Night & Sports Viewing',
    description: 'Big game tonight! Join us for an exciting viewing party with snacks, drinks, and fellow sports fans. Multiple screens and great atmosphere.',
    photo_url: 'https://picsum.photos/400/300?random=16',
    address: 'Sports Bar & Grill',
    latitude: 40.7549,
    longitude: -73.9840,
    max_attendees: 100,
    attendee_count: 31,
    status: 'active',
    is_trending: false,
    view_count: 156,
    engagement_score: 6.9,
    tags: ['sports', 'viewing party', 'games', 'snacks', 'casual'],
    vibe: 'casual',
    creator: mockUsers[0],
    attendees: mockUsers.slice(2, 4),
    photos: [],
    ...generatePartyTime(),
  },
  {
    id: 'party8',
    created_by: mockUsers[2].id,
    title: '🌺 Garden Party & Brunch',
    description: 'Beautiful outdoor brunch in a stunning garden setting. Fresh food, mimosas, live acoustic music, and gorgeous flowers everywhere!',
    photo_url: 'https://picsum.photos/400/300?random=17',
    address: 'Botanical Gardens Pavilion',
    latitude: 40.7794,
    longitude: -73.9632,
    max_attendees: 70,
    attendee_count: 28,
    status: 'active',
    is_trending: true,
    view_count: 187,
    engagement_score: 8.7,
    tags: ['garden', 'brunch', 'outdoor', 'acoustic music', 'mimosas'],
    vibe: 'chill',
    creator: mockUsers[2],
    attendees: mockUsers.slice(1, 4),
    photos: [],
    ...generatePartyTime(),
  },
];

// Utility to get random parties
export const getRandomParties = (count: number = 10): Party[] => {
  const shuffled = [...mockParties].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, mockParties.length));
};

// Utility to get trending parties
export const getTrendingParties = (): Party[] => {
  return mockParties.filter(party => party.is_trending);
};

// Utility to get nearby parties (mock implementation)
export const getNearbyParties = (userLat: number, userLng: number, radiusKm: number = 10): Party[] => {
  return mockParties.filter(party => {
    const distance = calculateDistance(userLat, userLng, party.latitude, party.longitude);
    return distance <= radiusKm;
  });
};