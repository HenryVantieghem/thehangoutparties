import { BaseRepository, QueryOptions } from './BaseRepository';
import { UserModel, DataTransformer } from '../models';
import { apiClient } from '../services/api';

export interface UserQueryOptions extends QueryOptions {
  location?: {
    latitude: number;
    longitude: number;
    radius?: number;
  };
  privacy?: 'public' | 'friends' | 'private';
  verified?: boolean;
  lastSeen?: 'online' | 'recent' | 'week' | 'month';
}

export interface UserProfileData {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  privacy_setting?: 'public' | 'friends' | 'private';
}

export class UserRepository extends BaseRepository<UserModel> {
  constructor() {
    super('/users', {
      ttl: 600000, // 10 minutes cache for user data
      invalidateOn: ['update', 'delete'],
    });
  }

  protected transform(data: any): UserModel {
    return DataTransformer.transformUser(data);
  }

  protected toAPIFormat(model: UserModel): any {
    return {
      id: model.id,
      email: model.email,
      username: model.username,
      display_name: model.display_name,
      bio: model.bio,
      avatar_url: model.avatar_url,
      privacy_setting: model.privacy_setting,
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserModel | null> {
    try {
      const response = await apiClient.get<any>('/auth/me', {
        cache: true,
        cacheTTL: 300000, // 5 minutes for current user
      });

      if (!response.success) {
        if (response.statusCode === 401) return null;
        throw new Error('Failed to fetch current user');
      }

      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'getCurrentUser');
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UserProfileData): Promise<UserModel> {
    try {
      const sanitizedData = DataTransformer.sanitizeUserInput(data);
      
      const response = await apiClient.patch<any>('/auth/profile', sanitizedData);

      if (!response.success || !response.data) {
        throw new Error('Failed to update profile');
      }

      await this.invalidateCache('update');
      // Clear current user cache
      await apiClient.clearCache('/auth/me');
      
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'updateProfile');
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ available: boolean }>(
        `/users/check-username?username=${encodeURIComponent(username)}`,
        { cache: false }
      );

      if (!response.success) {
        throw new Error('Failed to check username availability');
      }

      return response.data?.available ?? false;
    } catch (error) {
      this.handleError(error, 'checkUsernameAvailable');
    }
  }

  /**
   * Search users by username or display name
   */
  async searchUsers(query: string, options: UserQueryOptions = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: {
          ...options.filter,
          search: query,
          privacy: 'public', // Only search public profiles
        },
      });

      const cacheKey = this.getCacheKey('searchUsers', { query, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/search?${params}`, {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to search users');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'searchUsers');
    }
  }

  /**
   * Find users near a location
   */
  async findNearby(
    location: { latitude: number; longitude: number; radius?: number },
    options: Omit<UserQueryOptions, 'location'> = {}
  ) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: {
          ...options.filter,
          lat: location.latitude,
          lng: location.longitude,
          radius: location.radius || 10,
          privacy: 'public', // Only show public profiles
        },
      });

      const cacheKey = this.getCacheKey('findNearby', { location, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/nearby?${params}`, {
        cache: true,
        cacheTTL: 180000, // 3 minutes for location data
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch nearby users');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'findNearby');
    }
  }

  /**
   * Get user's friends
   */
  async getFriends(userId: string, options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams(options);
      const queryString = params.toString() ? `?${params}` : '';
      const cacheKey = this.getCacheKey('getFriends', { userId, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${userId}/friends${queryString}`, {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch friends');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'getFriends');
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${userId}/friend-request`);

      if (!response.success) {
        throw new Error('Failed to send friend request');
      }

      return true;
    } catch (error) {
      this.handleError(error, 'sendFriendRequest');
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`/friend-requests/${requestId}/accept`);

      if (!response.success) {
        throw new Error('Failed to accept friend request');
      }

      // Clear friends cache
      await apiClient.clearCache(`${this.endpoint}/*/friends`);
      
      return true;
    } catch (error) {
      this.handleError(error, 'acceptFriendRequest');
    }
  }

  /**
   * Reject friend request
   */
  async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`/friend-requests/${requestId}/reject`);

      if (!response.success) {
        throw new Error('Failed to reject friend request');
      }

      return true;
    } catch (error) {
      this.handleError(error, 'rejectFriendRequest');
    }
  }

  /**
   * Remove friend
   */
  async removeFriend(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<any>(`${this.endpoint}/${userId}/friend`);

      if (!response.success) {
        throw new Error('Failed to remove friend');
      }

      // Clear friends cache
      await apiClient.clearCache(`${this.endpoint}/*/friends`);
      
      return true;
    } catch (error) {
      this.handleError(error, 'removeFriend');
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${userId}/block`);

      if (!response.success) {
        throw new Error('Failed to block user');
      }

      // Clear relevant caches
      await apiClient.clearCache(`${this.endpoint}/${userId}`);
      
      return true;
    } catch (error) {
      this.handleError(error, 'blockUser');
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<any>(`${this.endpoint}/${userId}/block`);

      if (!response.success) {
        throw new Error('Failed to unblock user');
      }

      return true;
    } catch (error) {
      this.handleError(error, 'unblockUser');
    }
  }

  /**
   * Report user
   */
  async reportUser(userId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${userId}/report`, {
        reason: DataTransformer.sanitizeUserInput(reason),
      });

      if (!response.success) {
        throw new Error('Failed to report user');
      }

      return true;
    } catch (error) {
      this.handleError(error, 'reportUser');
    }
  }

  /**
   * Update user location
   */
  async updateLocation(latitude: number, longitude: number): Promise<boolean> {
    try {
      const response = await apiClient.patch<any>('/auth/location', {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });

      if (!response.success) {
        throw new Error('Failed to update location');
      }

      // Clear current user cache
      await apiClient.clearCache('/auth/me');
      
      return true;
    } catch (error) {
      this.handleError(error, 'updateLocation');
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics(userId: string) {
    try {
      const cacheKey = this.getCacheKey('getStatistics', { userId });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${userId}/statistics`, {
        cache: true,
        cacheTTL: 600000, // 10 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch user statistics');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getStatistics');
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(imageFile: FormData): Promise<string> {
    try {
      const response = await apiClient.post<{ avatar_url: string }>('/auth/avatar', imageFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.success || !response.data?.avatar_url) {
        throw new Error('Failed to upload avatar');
      }

      // Clear current user cache
      await apiClient.clearCache('/auth/me');
      await this.invalidateCache('update');
      
      return response.data.avatar_url;
    } catch (error) {
      this.handleError(error, 'uploadAvatar');
    }
  }

  /**
   * Get user's activity feed
   */
  async getActivityFeed(userId: string, options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams(options);
      const queryString = params.toString() ? `?${params}` : '';
      const cacheKey = this.getCacheKey('getActivityFeed', { userId, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${userId}/activity${queryString}`, {
        cache: true,
        cacheTTL: 180000, // 3 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch activity feed');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getActivityFeed');
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<boolean> {
    try {
      const response = await apiClient.delete<any>('/auth/account');

      if (!response.success) {
        throw new Error('Failed to delete account');
      }

      // Clear all user-related caches
      await apiClient.clearCache();
      
      return true;
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();