import { BaseRepository, QueryOptions } from './BaseRepository';
import { MessageModel, DataTransformer } from '../models';
import { apiClient } from '../services/api';

export interface MessageQueryOptions extends QueryOptions {
  partyId?: string;
  userId?: string;
  type?: 'text' | 'image' | 'system';
  before?: string; // Message ID for pagination
  after?: string; // Message ID for pagination
}

export interface MessageCreationData {
  party_id: string;
  content: string;
  type?: 'text' | 'image';
  reply_to?: string;
}

export interface MessageUpdateData {
  content?: string;
}

export class MessageRepository extends BaseRepository<MessageModel> {
  constructor() {
    super('/messages', {
      ttl: 60000, // 1 minute cache for messages (highly dynamic)
      invalidateOn: ['create', 'update', 'delete'],
    });
  }

  protected transform(data: any): MessageModel {
    return DataTransformer.transformMessage(data);
  }

  protected toAPIFormat(model: MessageModel): any {
    return {
      id: model.id,
      party_id: model.party_id,
      sender_id: model.sender_id,
      content: model.content,
      type: model.type,
      reply_to: model.reply_to,
    };
  }

  /**
   * Get messages for a specific party
   */
  async findByParty(partyId: string, options: Omit<MessageQueryOptions, 'partyId'> = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: { ...options.filter, party_id: partyId },
        sort: options.sort || 'created_at',
        order: options.order || 'desc',
      });

      // Add cursor-based pagination for messages
      if (options.before) params.set('before', options.before);
      if (options.after) params.set('after', options.after);

      const cacheKey = this.getCacheKey('findByParty', { partyId, ...options });
      
      const response = await apiClient.get<any>(`/parties/${partyId}/messages?${params}`, {
        cache: true,
        cacheTTL: 30000, // 30 seconds for party messages
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch messages');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'findByParty');
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(data: MessageCreationData): Promise<MessageModel> {
    try {
      // Validate message data
      const validatedData = DataTransformer.validateMessage(data);
      
      const response = await apiClient.post<any>(`/parties/${data.party_id}/messages`, validatedData);

      if (!response.success || !response.data) {
        throw new Error('Failed to send message');
      }

      // Invalidate party messages cache
      await apiClient.clearCache(`/parties/${data.party_id}/messages`);
      await this.invalidateCache('create');
      
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'sendMessage');
    }
  }

  /**
   * Edit a message (only within 15 minutes of creation)
   */
  async editMessage(messageId: string, data: MessageUpdateData): Promise<MessageModel> {
    try {
      const sanitizedData = DataTransformer.sanitizeUserInput(data);
      
      const response = await apiClient.patch<any>(`${this.endpoint}/${messageId}`, sanitizedData);

      if (!response.success || !response.data) {
        throw new Error('Failed to edit message');
      }

      await this.invalidateCache('update');
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'editMessage');
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<any>(`${this.endpoint}/${messageId}`);

      if (!response.success) {
        throw new Error('Failed to delete message');
      }

      await this.invalidateCache('delete');
      return true;
    } catch (error) {
      this.handleError(error, 'deleteMessage');
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, emoji: string): Promise<MessageModel> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${messageId}/reactions`, {
        emoji: DataTransformer.sanitizeUserInput(emoji),
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to add reaction');
      }

      // Clear specific message cache
      await apiClient.clearCache(`${this.endpoint}/${messageId}`);
      
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'addReaction');
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, emoji: string): Promise<MessageModel> {
    try {
      const response = await apiClient.delete<any>(`${this.endpoint}/${messageId}/reactions`, {
        body: { emoji: DataTransformer.sanitizeUserInput(emoji) },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to remove reaction');
      }

      // Clear specific message cache
      await apiClient.clearCache(`${this.endpoint}/${messageId}`);
      
      return this.transform(response.data);
    } catch (error) {
      this.handleError(error, 'removeReaction');
    }
  }

  /**
   * Report a message
   */
  async reportMessage(messageId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}/${messageId}/report`, {
        reason: DataTransformer.sanitizeUserInput(reason),
      });

      if (!response.success) {
        throw new Error('Failed to report message');
      }

      return true;
    } catch (error) {
      this.handleError(error, 'reportMessage');
    }
  }

  /**
   * Get message thread (replies to a message)
   */
  async getThread(messageId: string, options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        sort: options.sort || 'created_at',
        order: options.order || 'asc',
      });

      const cacheKey = this.getCacheKey('getThread', { messageId, ...options });
      
      const response = await apiClient.get<any>(`${this.endpoint}/${messageId}/thread?${params}`, {
        cache: true,
        cacheTTL: 60000, // 1 minute
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch message thread');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'getThread');
    }
  }

  /**
   * Search messages in a party
   */
  async searchInParty(partyId: string, query: string, options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        filter: { ...options.filter, search: query, party_id: partyId },
      });

      const cacheKey = this.getCacheKey('searchInParty', { partyId, query, ...options });
      
      const response = await apiClient.get<any>(`/parties/${partyId}/messages/search?${params}`, {
        cache: true,
        cacheTTL: 120000, // 2 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to search messages');
      }

      return DataTransformer.transformPaginatedResponse(response.data, this.transform.bind(this));
    } catch (error) {
      this.handleError(error, 'searchInParty');
    }
  }

  /**
   * Get user's recent conversations
   */
  async getConversations(options: QueryOptions = {}) {
    try {
      const params = this.buildQueryParams({
        ...options,
        sort: options.sort || 'last_message_at',
        order: options.order || 'desc',
      });

      const cacheKey = this.getCacheKey('getConversations', options);
      
      const response = await apiClient.get<any>(`/conversations?${params}`, {
        cache: true,
        cacheTTL: 180000, // 3 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch conversations');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getConversations');
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(partyId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<any>(`/parties/${partyId}/messages/read`);

      if (!response.success) {
        throw new Error('Failed to mark messages as read');
      }

      // Clear conversations cache
      await apiClient.clearCache('/conversations');
      
      return true;
    } catch (error) {
      this.handleError(error, 'markAsRead');
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>('/messages/unread-count', {
        cache: true,
        cacheTTL: 30000, // 30 seconds
      });

      if (!response.success || response.data?.count === undefined) {
        throw new Error('Failed to fetch unread count');
      }

      return response.data.count;
    } catch (error) {
      this.handleError(error, 'getUnreadCount');
    }
  }

  /**
   * Upload image for message
   */
  async uploadImage(imageFile: FormData): Promise<string> {
    try {
      const response = await apiClient.post<{ image_url: string }>('/messages/upload-image', imageFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for image upload
      });

      if (!response.success || !response.data?.image_url) {
        throw new Error('Failed to upload image');
      }

      return response.data.image_url;
    } catch (error) {
      this.handleError(error, 'uploadImage');
    }
  }

  /**
   * Subscribe to real-time messages for a party (WebSocket)
   */
  subscribeToParty(partyId: string, callback: (message: MessageModel) => void) {
    // This would implement WebSocket subscription
    // For now, return a mock subscription
    console.log(`Subscribing to party ${partyId} messages`);
    
    // Mock subscription - in real app, this would connect to WebSocket
    const mockSubscription = {
      unsubscribe: () => {
        console.log(`Unsubscribed from party ${partyId} messages`);
      },
    };

    return mockSubscription;
  }

  /**
   * Get message statistics for a party (for moderators)
   */
  async getMessageStats(partyId: string) {
    try {
      const cacheKey = this.getCacheKey('getMessageStats', { partyId });
      
      const response = await apiClient.get<any>(`/parties/${partyId}/messages/stats`, {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        cacheKey,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch message statistics');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'getMessageStats');
    }
  }
}

// Export singleton instance
export const messageRepository = new MessageRepository();