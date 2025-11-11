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
 * Format distance in kilometers to human-readable string
 * @param km - Distance in kilometers
 * @returns Formatted string like "2.5 km away" or "500 m away"
 */
export function formatDistance(km: number): string {
  try {
    if (typeof km !== 'number' || km < 0) {
      return 'Unknown distance';
    }

    if (km < 1) {
      const meters = Math.round(km * 1000);
      return `${meters} m away`;
    }

    if (km < 10) {
      return `${km.toFixed(1)} km away`;
    }

    return `${Math.round(km)} km away`;
  } catch (error) {
    logError('formatDistance', error);
    return 'Unknown distance';
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

/**
 * Get coordinates from address using geocoding
 * Note: This is a placeholder - in production, use a geocoding service
 * @param address - Address string
 * @returns Promise resolving to coordinates object
 */
export async function getCoordinatesFromAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
}> {
  try {
    if (typeof address !== 'string' || !address.trim()) {
      throw new Error('Valid address is required');
    }

    // Placeholder implementation
    // In production, integrate with a geocoding service
    throw new Error('Geocoding not implemented');
  } catch (error) {
    throw new Error(`Failed to get coordinates: ${getErrorMessage(error)}`);
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

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return false;
    }

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    logError('isSameDay', error);
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

/**
 * Generate blur hash for an image
 * Note: This is a placeholder - in production, use blurhash library
 * @param imageUri - URI of the image
 * @returns Promise resolving to blur hash string
 */
export async function generateBlurHash(imageUri: string): Promise<string> {
  try {
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    // Placeholder implementation
    // In production, use blurhash library to generate hash
    return 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';
  } catch (error) {
    throw new Error(`Failed to generate blur hash: ${getErrorMessage(error)}`);
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

/**
 * Capitalize first letter of each word in a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  try {
    if (typeof str !== 'string') {
      return '';
    }

    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } catch (error) {
    logError('capitalizeWords', error);
    return str;
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
      const keyValue = typeof uniqueKey === 'string' || typeof uniqueKey === 'number' 
        ? uniqueKey 
        : String(uniqueKey);
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  } catch (error) {
    logError('deduplicateBy', error);
    return array;
  }
}

/**
 * Get unique items from an array
 * @param array - Array to get unique items from
 * @param key - Optional key to use for uniqueness
 * @returns Array with unique items
 */
export function unique<T>(
  array: T[],
  key?: keyof T | ((item: T) => string | number)
): T[] {
  try {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }

    if (key) {
      return deduplicateBy(array, key);
    }

    return Array.from(new Set(array));
  } catch (error) {
    logError('unique', error);
    return array;
  }
}

/**
 * Split an array into chunks of specified size
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  try {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }

    if (size <= 0) {
      throw new Error('Chunk size must be positive');
    }

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  } catch (error) {
    logError('chunk', error);
    return [];
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

/**
 * Format a number with K/M suffixes (e.g., 1.2K, 1.5M)
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumberCompact(num: number): string {
  try {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }

    return num.toString();
  } catch (error) {
    logError('formatNumberCompact', error);
    return '0';
  }
}

/**
 * Calculate percentage of a value relative to total
 * @param value - Value to calculate percentage for
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function percentage(value: number, total: number): number {
  try {
    if (typeof value !== 'number' || typeof total !== 'number') {
      throw new Error('Both values must be numbers');
    }

    if (total === 0) {
      return 0;
    }

    return roundToDecimal((value / total) * 100, 1);
  } catch (error) {
    logError('percentage', error);
    return 0;
  }
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  try {
    if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
      throw new Error('All values must be numbers');
    }

    if (min > max) {
      throw new Error('Min must be less than or equal to max');
    }

    return Math.min(Math.max(value, min), max);
  } catch (error) {
    logError('clamp', error);
    return value;
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

/**
 * Check if an error is an authentication-related error
 * @param error - Error to check
 * @returns True if error is auth-related
 */
export function isAuthError(error: unknown): boolean {
  try {
    const message = getErrorMessage(error).toLowerCase();

    return (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('token') ||
      message.includes('session') ||
      message.includes('login') ||
      message.includes('password')
    );
  } catch {
    return false;
  }
}

/**
 * Capture exception for error tracking/analytics
 * @param error - Error to capture
 * @param context - Additional context about the error
 */
export function captureException(error: unknown, context?: Record<string, any>): void {
  try {
    const errorMessage = getErrorMessage(error);
    const timestamp = new Date().toISOString();
    
    // In production, integrate with error tracking service (Sentry, Bugsnag, etc.)
    console.error(`[${timestamp}] Exception captured:`, errorMessage, context || {});
    
    // Example: Sentry.captureException(error, { extra: context });
  } catch {
    // Silently fail if capturing fails
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

    if (trimmed.length > VALIDATION.MESSAGE_MAX) {
      return {
        isValid: false,
        error: `Message must be ${VALIDATION.MESSAGE_MAX} characters or less`,
      };
    }

    return { isValid: true };
  } catch (error) {
    logError('validateMessage', error);
    return { isValid: false, error: 'Failed to validate message' };
  }
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce a function call
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle a function call
 * @param fn - Function to throttle
 * @param interval - Interval in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Memoize a function with cache
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

