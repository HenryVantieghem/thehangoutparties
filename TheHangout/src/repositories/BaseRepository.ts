import { apiClient, APIResponse, APIError, NetworkError } from '../services/api';
import { DataTransformer, PaginatedResponse } from '../models';

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, any>;
  include?: string[];
  cache?: boolean;
  cacheTTL?: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  invalidateOn?: string[]; // Operations that invalidate this cache
}

export abstract class BaseRepository<T> {
  protected readonly endpoint: string;
  protected readonly cacheConfig: CacheConfig;

  constructor(endpoint: string, cacheConfig?: Partial<CacheConfig>) {
    this.endpoint = endpoint;
    this.cacheConfig = {
      ttl: 300000, // 5 minutes default
      invalidateOn: ['create', 'update', 'delete'],
      ...cacheConfig,
    };
  }

  /**
   * Transform raw API response to domain model
   */
  protected abstract transform(data: any): T;

  /**
   * Transform domain model back to API format
   */
  protected abstract toAPIFormat(model: T): any;

  /**
   * Build query parameters for API requests
   */
  protected buildQueryParams(options: QueryOptions): URLSearchParams {
    const params = new URLSearchParams();

    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.sort) params.set('sort', options.sort);
    if (options.order) params.set('order', options.order);
    if (options.include) params.set('include', options.include.join(','));
    
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(`filter[${key}]`, String(value));
        }
      });
    }

    return params;
  }

  /**
   * Generate cache key for specific operations
   */
  protected getCacheKey(operation: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${this.endpoint}:${operation}:${paramStr}`;
  }

  /**
   * Invalidate cache for specific operations
   */
  protected async invalidateCache(operation: string): Promise<void> {
    if (this.cacheConfig.invalidateOn?.includes(operation)) {
      await apiClient.clearCache(this.endpoint);
    }
  }

  /**
   * Handle API errors consistently
   */
  protected handleError(error: any, operation: string): never {
    console.error(`${this.constructor.name} ${operation} error:`, error);

    if (error instanceof NetworkError) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }

    if (error instanceof APIError) {
      switch (error.statusCode) {
        case 400:
          throw new Error('Invalid request. Please check your input.');
        case 401:
          throw new Error('Authentication required. Please sign in again.');
        case 403:
          throw new Error('You do not have permission to perform this action.');
        case 404:
          throw new Error('The requested resource was not found.');
        case 409:
          throw new Error('Conflict detected. The resource may have been modified.');
        case 422:
          throw new Error('Validation failed. Please check your input.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error occurred. Please try again later.');
        default:
          throw new Error(error.message || 'An unexpected error occurred.');
      }
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }

  /**
   * Get all items with optional filtering and pagination
   */
  async findMany(options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
    try {
      const params = this.buildQueryParams(options);
      const cacheKey = this.getCacheKey('findMany', Object.fromEntries(params));
      
      const response = await apiClient.get<any>(`${this.endpoint}?${params}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? this.cacheConfig.ttl,
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch data');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'findMany');
    }
  }

  /**
   * Get single item by ID
   */
  async findById(id: string, options: Pick<QueryOptions, 'include' | 'cache' | 'cacheTTL'> = {}): Promise<T | null> {
    try {
      const params = new URLSearchParams();
      if (options.include) params.set('include', options.include.join(','));
      
      const queryString = params.toString() ? `?${params}` : '';
      const cacheKey = this.getCacheKey('findById', { id, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${id}${queryString}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? this.cacheConfig.ttl,
        cacheKey,
      });

      if (!response.success) {
        if (response.statusCode === 404) return null;
        throw new Error('Failed to fetch data');
      }

      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Create new item
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const apiData = DataTransformer.sanitizeUserInput(data);
      
      const response = await apiClient.post<any>(this.endpoint, apiData);

      if (!response.success || !response.data) {
        throw new Error('Failed to create resource');
      }

      await this.invalidateCache('create');
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Update existing item
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const apiData = DataTransformer.sanitizeUserInput(data);
      
      const response = await apiClient.patch<any>(`${this.endpoint}/${id}`, apiData);

      if (!response.success || !response.data) {
        throw new Error('Failed to update resource');
      }

      await this.invalidateCache('update');
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete item by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<any>(`${this.endpoint}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete resource');
      }

      await this.invalidateCache('delete');
      return true;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Search items with text query
   */
  async search(query: string, options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: { ...options.filter, search: query },
      });
      
      const cacheKey = this.getCacheKey('search', { query, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/search?${params}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? 60000, // Shorter cache for search
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to search data');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'search');
    }
  }

  /**
   * Count items matching criteria
   */
  async count(filter?: Record<string, any>): Promise<number> {
    try {
      const params = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(`filter[${key}]`, String(value));
          }
        });
      }
      
      const queryString = params.toString() ? `?${params}` : '';
      const cacheKey = this.getCacheKey('count', filter);
      
      const response = await apiClient.get<{ count: number }>(`${this.endpoint}/count${queryString}`, {
        cache: true,
        cacheTTL: 60000, // 1 minute cache for counts
        cacheKey,
      });

      if (!response.success || response.data?.count === undefined) {
        throw new Error('Failed to count data');
      }

      return response.data.count;
    } catch (error) {
      this.handleError(error, 'count');
    }
  }

  /**
   * Batch operations
   */
  async batchCreate(items: Partial<T>[]): Promise<T[]> {
    try {
      const apiData = items.map(item => DataTransformer.sanitizeUserInput(item));
      
      const response = await apiClient.post<any>(`${this.endpoint}/batch`, { items: apiData });

      if (!response.success || !response.data?.items) {
        throw new Error('Failed to create resources');
      }

      await this.invalidateCache('create');
      return response.data.items.map(this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'batchCreate');
    }
  }

  async batchUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    try {
      const apiData = updates.map(update => ({
        id: update.id,
        data: DataTransformer.sanitizeUserInput(update.data),
      }));
      
      const response = await apiClient.patch<any>(`${this.endpoint}/batch`, { updates: apiData });

      if (!response.success || !response.data?.items) {
        throw new Error('Failed to update resources');
      }

      await this.invalidateCache('update');
      return response.data.items.map(this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'batchUpdate');
    }
  }

  async batchDelete(ids: string[]): Promise<boolean> {
    try {
      const response = await apiClient.delete<any>(`${this.endpoint}/batch`, {
        body: { ids },
      });

      if (!response.success) {
        throw new Error('Failed to delete resources');
      }

      await this.invalidateCache('delete');
      return true;
    } catch (error) {
      this.handleError(error, 'batchDelete');
    }
  }

  /**
   * Refresh cache for all operations
   */
  async refreshCache(): Promise<void> {
    await apiClient.clearCache(this.endpoint);
  }
}