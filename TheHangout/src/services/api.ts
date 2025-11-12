import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/lib/types';
import { z } from 'zod';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  statusCode: number;
  success: boolean;
}

export interface APIRequestOptions {
  method?: HTTPMethod;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class APIError extends Error {
  public statusCode: number;
  public originalError?: any;

  constructor(message: string, statusCode: number, originalError?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Robust API client with caching, retries, and offline support
 */
export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private isOnline: boolean = true;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };

    // Monitor network connectivity
    this.initNetworkMonitoring();
    
    // Process queued requests when back online
    this.processRequestQueue();
  }

  private async initNetworkMonitoring() {
    try {
      const netInfo = await import('@react-native-community/netinfo');
      netInfo.default.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? true;
        
        if (wasOffline && this.isOnline) {
          this.processRequestQueue();
        }
      });
    } catch (error) {
      // NetInfo not available, assume online
      console.warn('NetInfo not available, assuming online connectivity');
    }
  }

  private async processRequestQueue() {
    if (!this.isOnline || this.requestQueue.length === 0) return;

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of queue) {
      try {
        await request();
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  private generateCacheKey(url: string, options: APIRequestOptions): string {
    if (options.cacheKey) return options.cacheKey;
    
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      const memoryEntry = this.cache.get(key);
      if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl) {
        return memoryEntry.data;
      }

      // Try persistent cache
      const persistentCache = await AsyncStorage.getItem(`cache:${key}`);
      if (persistentCache) {
        const entry: CacheEntry<T> = JSON.parse(persistentCache);
        if (Date.now() - entry.timestamp < entry.ttl) {
          // Update memory cache
          this.cache.set(key, entry);
          return entry.data;
        }
        // Expired, remove from persistent storage
        await AsyncStorage.removeItem(`cache:${key}`);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    return null;
  }

  private async setCache<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      // Update memory cache
      this.cache.set(key, entry);

      // Update persistent cache for important data
      if (ttl > 60000) { // Only persist cache entries with TTL > 1 minute
        await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      }
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private async makeRequest<T>(
    url: string, 
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = 10000,
      retries = 3,
      cache = method === 'GET',
      cacheTTL = 300000, // 5 minutes default
    } = options;

    const cacheKey = this.generateCacheKey(url, options);
    
    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cachedData = await this.getFromCache<T>(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          success: true,
          statusCode: 200,
        };
      }
    }

    // If offline, queue non-GET requests
    if (!this.isOnline && method !== 'GET') {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await this.makeRequest<T>(url, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    // Throw network error if offline for GET requests
    if (!this.isOnline) {
      throw new NetworkError('No internet connection available');
    }

    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(fullURL, requestOptions);
        
        let responseData: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text() as any;
        }

        if (!response.ok) {
          throw new APIError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            responseData
          );
        }

        // Cache successful GET responses
        if (cache && method === 'GET' && response.ok) {
          await this.setCache(cacheKey, responseData, cacheTTL);
        }

        return {
          data: responseData,
          success: true,
          statusCode: response.status,
        };
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof APIError && error.statusCode >= 400 && error.statusCode < 500) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    throw lastError || new NetworkError('Request failed after all retries');
  }

  public async get<T>(
    url: string, 
    options: Omit<APIRequestOptions, 'method' | 'body'> = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' });
  }

  public async post<T>(
    url: string, 
    body?: Record<string, any>, 
    options: Omit<APIRequestOptions, 'method' | 'body'> = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'POST', body });
  }

  public async put<T>(
    url: string, 
    body?: Record<string, any>, 
    options: Omit<APIRequestOptions, 'method' | 'body'> = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PUT', body });
  }

  public async patch<T>(
    url: string, 
    body?: Record<string, any>, 
    options: Omit<APIRequestOptions, 'method' | 'body'> = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PATCH', body });
  }

  public async delete<T>(
    url: string, 
    options: Omit<APIRequestOptions, 'method' | 'body'> = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' });
  }

  public setAuthToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  public clearAuthToken(): void {
    delete this.defaultHeaders.Authorization;
  }

  public async clearCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Clear specific cache entries
        const keys = [...this.cache.keys()].filter(key => key.includes(pattern));
        keys.forEach(key => this.cache.delete(key));
        
        // Clear from persistent storage
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key => key.startsWith('cache:') && key.includes(pattern));
        await AsyncStorage.multiRemove(cacheKeys);
      } else {
        // Clear all cache
        this.cache.clear();
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key => key.startsWith('cache:'));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  public getQueueLength(): number {
    return this.requestQueue.length;
  }

  public isOffline(): boolean {
    return !this.isOnline;
  }
}

// Default API client instance
export const apiClient = new APIClient(
  process.env.EXPO_PUBLIC_API_URL || 'https://api.thehangout.app',
  {
    'X-App-Version': '1.0.0',
    'X-Platform': 'mobile',
  }
);

// Validation schemas for API responses
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
  bio: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const partyResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  photo_url: z.string().optional(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  max_attendees: z.number().optional(),
  attendee_count: z.number().default(0),
  status: z.enum(['active', 'ended', 'cancelled']),
  is_trending: z.boolean().default(false),
  view_count: z.number().default(0),
  engagement_score: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
  tags: z.array(z.string()).default([]),
  vibe: z.enum(['chill', 'lit', 'banger', 'exclusive', 'casual']).default('casual'),
});

export const messageResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender_id: z.string(),
  party_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});