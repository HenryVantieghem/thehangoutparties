import { BaseRepository, QueryOptions } from './BaseRepository';
import { PartyModel, DataTransformer, LocationModel, UserModel } from '../models';
import { apiClient } from '../services/api';

export interface PartyQueryOptions extends QueryOptions {
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
  };
  vibe?: string[];
  tags?: string[];
  status?: 'active' | 'ended' | 'cancelled';
  trending?: boolean;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PartyCreationData {
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  max_attendees?: number;
  tags?: string[];
  vibe?: 'chill' | 'lit' | 'banger' | 'exclusive' | 'casual';
  visibility?: 'public' | 'friends' | 'private';
  starts_at?: string;
  ends_at?: string;
  photo_url?: string;
}

export class PartyRepository extends BaseRepository<PartyModel> {
  constructor() {
    super('/parties', {
      ttl: 180000, // 3 minutes cache for parties (more dynamic data)
      invalidateOn: ['create', 'update', 'delete', 'join', 'leave'],
    });
  }

  protected transform(data: any): PartyModel {
    return DataTransformer.transformParty(data);
  }

  protected toAPIFormat(model: PartyModel): any {
    return {
      id: model.id,
      created_by: model.created_by,
      title: model.title,
      description: model.description,
      photo_url: model.photo_url,
      address: model.address,
      latitude: model.latitude,
      longitude: model.longitude,
      max_attendees: model.max_attendees,
      tags: model.tags,
      vibe: model.vibe,
      visibility: model.visibility,
      starts_at: model.starts_at,
      ends_at: model.ends_at,
    };
  }

  /**
   * Find parties near a specific location
   */
  async findNearby(
    location: { latitude: number; longitude: number; radius?: number },
    options: Omit<PartyQueryOptions, 'location'> = {}
  ) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: {
          ...options.filter,
          lat: location.latitude,
          lng: location.longitude,
          radius: location.radius || 10,
        },
      });

      const cacheKey = this.getCacheKey('findNearby', { location, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/nearby?${params}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? 120000, // 2 minutes for location-based data
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch nearby parties');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'findNearby');
    }
  }

  /**
   * Find trending parties
   */
  async findTrending(options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: { ...options.filter, trending: true },
        sort: options.sort || 'engagement_score',
        order: options.order || 'desc',
      });

      const cacheKey = this.getCacheKey('findTrending', options);
      
      const response = await apiClient.get<any>(`${this.endpoint}/trending?${params}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? 300000, // 5 minutes for trending
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch trending parties');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'findTrending');
    }
  }

  /**
   * Create a new party
   */
  async createParty(data: PartyCreationData): Promise<PartyModel> {
    try {
      // Validate the party data
      const validatedData = DataTransformer.validatePartyCreation(data);
      
      const response = await apiClient.post<any>(this.endpoint, validatedData);

      if (!response.success || !response.data) {
        throw new Error('Failed to create party');
      }

      await this.invalidateCache('create');
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'createParty');
    }
  }

  /**
   * Join a party
   */
  async joinParty(partyId: string): Promise<PartyModel> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${partyId}/join`);

      if (!response.success || !response.data) {
        throw new Error('Failed to join party');
      }

      await this.invalidateCache('join');
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'joinParty');
    }
  }

  /**
   * Leave a party
   */
  async leaveParty(partyId: string): Promise<PartyModel> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${partyId}/leave`);

      if (!response.success || !response.data) {
        throw new Error('Failed to leave party');
      }

      await this.invalidateCache('leave');
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'leaveParty');
    }
  }

  /**
   * Get party attendees
   */
  async getAttendees(partyId: string, options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams(options);
      const queryString = params.toString() ? `?${params}` : '';
      const cacheKey = this.getCacheKey('getAttendees', { partyId, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${partyId}/attendees${queryString}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? 120000, // 2 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch party attendees');
      }

      return DataTransformer.transformPaginatedResponse(
        response.data,
        DataTransformer.transformUser.bind(DataTransformer)
      );
    } catch (error) {
      this.handleError(error, 'getAttendees');
    }
  }

  /**
   * Report a party
   */
  async reportParty(partyId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${partyId}/report`, {
        reason: DataTransformer.sanitizeUserInput(reason),
      });

      if (!response.success) {
        throw new Error('Failed to report party');
      }

      return true;
    } catch (error) {
      this.handleError(error, 'reportParty');
    }
  }

  /**
   * Get party analytics (for party creators)
   */
  async getAnalytics(partyId: string) {
    try {
      const cacheKey = this.getCacheKey('getAnalytics', { partyId });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${partyId}/analytics`, {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch party analytics');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getAnalytics');
    }
  }

  /**
   * Update party engagement score
   */
  async updateEngagement(partyId: string, action: 'view' | 'like' | 'share' | 'join') {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${partyId}/engagement`, {
        action,
      });

      if (!response.success) {
        throw new Error('Failed to update engagement');
      }

      // Don't invalidate entire cache for engagement updates
      // Just clear this specific party
      await apiClient.clearCache(`${this.endpoint}/${partyId}`);
      
      return true;
    } catch (error) {
      // Don't throw error for engagement updates - they're not critical
      console.warn('Failed to update engagement:', error);
      return false;
    }
  }

  /**
   * Filter parties by multiple criteria
   */
  async findWithFilters(filters: PartyQueryOptions) {
    try {
      const filterParams = { ...filters.filter };

      // Add location filter
      if (filters.location) {
        filterParams.lat = filters.location.latitude;
        filterParams.lng = filters.location.longitude;
        filterParams.radius = filters.location.radius || 10;
      }

      // Add other filters
      if (filters.vibe) filterParams.vibe = filters.vibe.join(',');
      if (filters.tags) filterParams.tags = filters.tags.join(',');
      if (filters.status) filterParams.status = filters.status;
      if (filters.trending !== undefined) filterParams.trending = filters.trending;
      if (filters.featured !== undefined) filterParams.featured = filters.featured;
      if (filters.startDate) filterParams.start_date = filters.startDate;
      if (filters.endDate) filterParams.end_date = filters.endDate;

      return this.findMany({
        ...filters,
        filter: filterParams,
      });
    } catch (error) {
      this.handleError(error, 'findWithFilters');
    }
  }

  /**
   * Get parties created by a specific user
   */
  async findByCreator(userId: string, options: QueryOptions = {}) {
    try {
      return this.findMany({
        ...options,
        filter: { ...options.filter, created_by: userId },
        sort: options.sort || 'created_at',
        order: options.order || 'desc',
      });
    } catch (error) {
      this.handleError(error, 'findByCreator');
    }
  }

  /**
   * Get parties a user is attending
   */
  async findByAttendee(userId: string, options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: { ...options.filter, attendee_id: userId },
      });

      const cacheKey = this.getCacheKey('findByAttendee', { userId, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/attending?${params}`, {
        cache: options.cache ?? true,
        cacheTTL: options.cacheTTL ?? 180000, // 3 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch attended parties');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'findByAttendee');
    }
  }
}

// Export singleton instance
export const partyRepository = new PartyRepository();