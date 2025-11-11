import { formatDistanceToNow, format, differenceInSeconds, isToday as dateFnsIsToday } from 'date-fns';
import { Location, Party } from '../types';
import { VALIDATION, API } from '../constants';

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in kilometers
 * @throws Error if coordinates are invalid
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  try {
    if (
      typeof lat1 !== 'number' ||
      typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' ||
      typeof lon2 !== 'number'
    ) {
      throw new Error('All coordinates must be valid numbers');
    }

    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch (error) {
    throw new Error(`Failed to calculate distance: ${getErrorMessage(error)}`);
  }
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is near a home location within a specified radius
 * @param currentLocation - Current location coordinates
 * @param homeLocation - Home location coordinates
 * @param radiusKm - Radius in kilometers (default: 5km)
 * @returns True if location is within the radius
 */
export function isLocationNearHome(
  currentLocation: Location,
  homeLocation: Location,
  radiusKm: number = 5
): boolean {
  try {
    if (!currentLocation || !homeLocation) {
      throw new Error('Both locations are required');
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      homeLocation.latitude,
      homeLocation.longitude
    );

    return distance <= radiusKm;
  } catch (error) {
    logError('isLocationNearHome', error);
    return false;
  }
}

/**
 * Get address from coordinates using reverse geocoding
 * Note: This is a placeholder - in production, use a geocoding service like Google Maps API
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise resolving to address string
 */
export async function getAddressFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid coordinates');
    }

    // Placeholder implementation
    // In production, integrate with a geocoding service
    // Example: Google Maps Geocoding API, Mapbox Geocoding API, etc.
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    throw new Error(`Failed to get address: ${getErrorMessage(error)}`);
  }
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - Date object or ISO string
 * @returns Formatted relative time string
 */
export function formatTimeAgo(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    logError('formatTimeAgo', error);
    return 'Unknown time';
  }
}

/**
 * Format a date according to a specified format string
 * @param date - Date object or ISO string
 * @param formatStr - Format string (default: "MMM dd, yyyy")
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'MMM dd, yyyy'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    return format(dateObj, formatStr);
  } catch (error) {
    logError('formatDate', error);
    return 'Invalid date';
  }
}

/**
 * Get countdown string until a target date
 * @param targetDate - Target date to countdown to
 * @returns Countdown string (e.g., "2h 30m 15s")
 */
export function getCountdown(targetDate: Date | string): string {
  try {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();

    if (isNaN(target.getTime())) {
      throw new Error('Invalid target date');
    }

    const seconds = differenceInSeconds(target, now);

    if (seconds < 0) {
      return 'Event has passed';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  } catch (error) {
    logError('getCountdown', error);
    return 'Unable to calculate countdown';
  }
}

/**
 * Check if a date is today
 * @param date - Date object or ISO string
 * @returns True if the date is today
 */
export function isToday(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    return dateFnsIsToday(dateObj);
  } catch (error) {
    logError('isToday', error);
    return false;
  }
}

// ============================================================================
// IMAGE UTILITIES
// ============================================================================

/**
 * Compress an image file
 * Note: This is a placeholder - in production, use a library like react-native-image-resizer
 * @param imageUri - URI of the image to compress
 * @param quality - Compression quality (0-1, default: 0.8)
 * @returns Promise resolving to compressed image URI
 */
export async function compressImage(
  imageUri: string,
  quality: number = 0.8
): Promise<string> {
  try {
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    if (quality < 0 || quality > 1) {
      throw new Error('Quality must be between 0 and 1');
    }

    // Placeholder implementation
    // In production, use react-native-image-resizer or similar library
    return imageUri;
  } catch (error) {
    throw new Error(`Failed to compress image: ${getErrorMessage(error)}`);
  }
}

/**
 * Resize an image to specified dimensions
 * Note: This is a placeholder - in production, use a library like react-native-image-resizer
 * @param imageUri - URI of the image to resize
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @returns Promise resolving to resized image URI
 */
export async function resizeImage(
  imageUri: string,
  width: number,
  height: number
): Promise<string> {
  try {
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }

    // Placeholder implementation
    // In production, use react-native-image-resizer or similar library
    return imageUri;
  } catch (error) {
    throw new Error(`Failed to resize image: ${getErrorMessage(error)}`);
  }
}

/**
 * Generate a thumbnail from an image
 * @param imageUri - URI of the image
 * @param size - Thumbnail size in pixels (default: 200)
 * @returns Promise resolving to thumbnail image URI
 */
export async function generateThumbnail(
  imageUri: string,
  size: number = 200
): Promise<string> {
  try {
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    if (size <= 0) {
      throw new Error('Thumbnail size must be a positive number');
    }

    return resizeImage(imageUri, size, size);
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${getErrorMessage(error)}`);
  }
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate a string to a specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  try {
    if (typeof str !== 'string') {
      throw new Error('Input must be a string');
    }

    if (maxLength < 0) {
      throw new Error('Max length must be non-negative');
    }

    if (str.length <= maxLength) {
      return str;
    }

    return str.substring(0, maxLength).trim() + '...';
  } catch (error) {
    logError('truncateString', error);
    return str;
  }
}

/**
 * Validate an email address format
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export function validateEmail(email: string): boolean {
  try {
    if (typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  } catch (error) {
    logError('validateEmail', error);
    return false;
  }
}

/**
 * Validate a username according to app rules
 * @param username - Username to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  try {
    if (typeof username !== 'string') {
      return { isValid: false, error: 'Username must be a string' };
    }

    const trimmed = username.trim();

    if (trimmed.length < VALIDATION.USERNAME_MIN) {
      return {
        isValid: false,
        error: `Username must be at least ${VALIDATION.USERNAME_MIN} characters`,
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Username can only contain letters, numbers, and underscores',
      };
    }

    return { isValid: true };
  } catch (error) {
    logError('validateUsername', error);
    return { isValid: false, error: 'Failed to validate username' };
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  try {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } catch (error) {
    logError('sanitizeInput', error);
    return '';
  }
}

// ============================================================================
// DATA UTILITIES
// ============================================================================

/**
 * Group an array of items by a specified key
 * @param array - Array to group
 * @param key - Key to group by (can be a function or string)
 * @returns Object with grouped items
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  try {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }

    return array.reduce((result, item) => {
      const groupKey =
        typeof key === 'function' ? String(key(item)) : String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  } catch (error) {
    logError('groupBy', error);
    return {};
  }
}

/**
 * Sort an array by date property
 * @param array - Array to sort
 * @param dateKey - Key containing the date value
 * @param ascending - Sort order (default: false, newest first)
 * @returns Sorted array
 */
export function sortByDate<T>(
  array: T[],
  dateKey: keyof T,
  ascending: boolean = false
): T[] {
  try {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }

    return [...array].sort((a, b) => {
      const dateA = new Date(a[dateKey] as string | Date).getTime();
      const dateB = new Date(b[dateKey] as string | Date).getTime();

      if (isNaN(dateA) || isNaN(dateB)) {
        return 0;
      }

      return ascending ? dateA - dateB : dateB - dateA;
    });
  } catch (error) {
    logError('sortByDate', error);
    return array;
  }
}

/**
 * Filter an array by status property
 * @param array - Array to filter
 * @param statusKey - Key containing the status value
 * @param status - Status value to filter by
 * @returns Filtered array
 */
export function filterByStatus<T>(
  array: T[],
  statusKey: keyof T,
  status: string
): T[] {
  try {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }

    return array.filter((item) => item[statusKey] === status);
  } catch (error) {
    logError('filterByStatus', error);
    return [];
  }
}

/**
 * Remove duplicate items from an array based on a unique key
 * @param array - Array to deduplicate
 * @param key - Key to use for uniqueness check
 * @returns Array with duplicates removed
 */
export function deduplicateBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): T[] {
  try {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }

    const seen = new Set<string | number>();
    return array.filter((item) => {
      const uniqueKey =
        typeof key === 'function' ? key(item) : item[key];
      if (seen.has(uniqueKey)) {
        return false;
      }
      seen.add(uniqueKey);
      return true;
    });
  } catch (error) {
    logError('deduplicateBy', error);
    return array;
  }
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Format a number with thousand separators
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 0): string {
  try {
    if (typeof num !== 'number' || isNaN(num)) {
      throw new Error('Invalid number');
    }

    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    logError('formatNumber', error);
    return '0';
  }
}

/**
 * Calculate growth rate percentage between two values
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Growth rate as a percentage
 */
export function calculateGrowthRate(
  oldValue: number,
  newValue: number
): number {
  try {
    if (typeof oldValue !== 'number' || typeof newValue !== 'number') {
      throw new Error('Both values must be numbers');
    }

    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }

    return ((newValue - oldValue) / oldValue) * 100;
  } catch (error) {
    logError('calculateGrowthRate', error);
    return 0;
  }
}

/**
 * Round a number to a specified number of decimal places
 * @param num - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundToDecimal(num: number, decimals: number = 2): number {
  try {
    if (typeof num !== 'number' || isNaN(num)) {
      throw new Error('Invalid number');
    }

    if (decimals < 0) {
      throw new Error('Decimal places must be non-negative');
    }

    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  } catch (error) {
    logError('roundToDecimal', error);
    return num;
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Extract error message from various error types
 * @param error - Error object, string, or unknown type
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  try {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }

    return 'An unknown error occurred';
  } catch {
    return 'Failed to extract error message';
  }
}

/**
 * Log an error with context
 * @param context - Context where the error occurred
 * @param error - Error to log
 */
export function logError(context: string, error: unknown): void {
  try {
    const message = getErrorMessage(error);
    const timestamp = new Date().toISOString();
    
    // In production, integrate with a logging service
    console.error(`[${timestamp}] [${context}]`, message, error);
  } catch {
    // Silently fail if logging itself fails
  }
}

/**
 * Check if an error is a network-related error
 * @param error - Error to check
 * @returns True if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  try {
    const message = getErrorMessage(error).toLowerCase();

    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  } catch {
    return false;
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Party form data interface
 */
export interface PartyFormData {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Validate party form data
 * @param data - Party form data to validate
 * @returns Object with isValid boolean and error messages
 */
export function validatePartyForm(data: PartyFormData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  try {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.title = 'Party title is required';
    } else if (data.title.length > 100) {
      errors.title = 'Party title must be 100 characters or less';
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    if (
      typeof data.latitude !== 'number' ||
      isNaN(data.latitude) ||
      data.latitude < -90 ||
      data.latitude > 90
    ) {
      errors.latitude = 'Valid latitude is required';
    }

    if (
      typeof data.longitude !== 'number' ||
      isNaN(data.longitude) ||
      data.longitude < -180 ||
      data.longitude > 180
    ) {
      errors.longitude = 'Valid longitude is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  } catch (error) {
    logError('validatePartyForm', error);
    return {
      isValid: false,
      errors: { general: 'Failed to validate party form' },
    };
  }
}

/**
 * Validate photo caption
 * @param caption - Caption text to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePhotoCaption(caption: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    if (typeof caption !== 'string') {
      return { isValid: false, error: 'Caption must be a string' };
    }

    if (caption.length > VALIDATION.CAPTION_MAX) {
      return {
        isValid: false,
        error: `Caption must be ${VALIDATION.CAPTION_MAX} characters or less`,
      };
    }

    return { isValid: true };
  } catch (error) {
    logError('validatePhotoCaption', error);
    return { isValid: false, error: 'Failed to validate caption' };
  }
}

/**
 * Validate message text
 * @param message - Message text to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMessage(message: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    if (typeof message !== 'string') {
      return { isValid: false, error: 'Message must be a string' };
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (trimmed.length > 1000) {
      return {
        isValid: false,
        error: 'Message must be 1000 characters or less',
      };
    }

    return { isValid: true };
  } catch (error) {
    logError('validateMessage', error);
    return { isValid: false, error: 'Failed to validate message' };
  }
}

