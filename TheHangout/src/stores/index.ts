import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { Party } from '../types';
import { 
  UserModel, 
  PartyModel, 
  MessageModel, 
  PhotoModel, 
  PaginatedResponse 
} from '../models';
import { userRepository } from '../repositories/UserRepository';
import { partyRepository } from '../repositories/PartyRepository';
import { messageRepository } from '../repositories/MessageRepository';
import { APIError, NetworkError } from '../services/api';

interface AuthState {
  user: UserModel | null;
  session: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: UserModel | null) => void;
  setSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateProfile: (data: { username?: string; display_name?: string; bio?: string; avatar_url?: string; privacy_setting?: 'public' | 'friends' | 'private' }) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setSession: (session) => {
        set({ session });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          // TODO: Implement actual authentication with backend
          // For now, using repository pattern with mock data
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get current user after successful authentication
          const user = await userRepository.getCurrentUser();
          
          if (user) {
            set({
              user,
              session: { access_token: 'mock_token', user_id: user.id },
              isAuthenticated: true,
              loading: false,
            });
          } else {
            throw new Error('Authentication failed');
          }
        } catch (error: any) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof NetworkError 
              ? 'Network connection failed. Please check your internet connection.'
              : error.message || 'Failed to sign in';
          
          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, username: string) => {
        try {
          set({ loading: true, error: null });
          
          // Check username availability first
          const isAvailable = await userRepository.checkUsernameAvailable(username);
          if (!isAvailable) {
            throw new Error('Username is already taken');
          }
          
          // TODO: Implement actual user creation with backend
          // For now, simulate successful signup
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get user after successful signup
          const user = await userRepository.getCurrentUser();
          
          if (user) {
            set({
              user,
              session: { access_token: 'mock_token', user_id: user.id },
              isAuthenticated: true,
              loading: false,
            });
          } else {
            throw new Error('Account creation failed');
          }
        } catch (error: any) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof NetworkError 
              ? 'Network connection failed. Please check your internet connection.'
              : error.message || 'Failed to create account';
          
          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ loading: true });
          
          // Mock sign out
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to sign out',
            loading: false,
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ loading: true, error: null });
          
          // Mock password reset - replace with actual implementation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to send reset email',
            loading: false,
          });
          throw error;
        }
      },

      initializeAuth: async () => {
        try {
          set({ loading: true });
          
          // Try to get current user from repository (will handle cached data)
          const user = await userRepository.getCurrentUser();
          
          if (user) {
            set({
              user,
              session: { access_token: 'mock_token', user_id: user.id },
              isAuthenticated: true,
            });
          } else {
            // Check for stored session
            const storedState = await AsyncStorage.getItem('auth-storage');
            if (storedState) {
              const { user: storedUser, session } = JSON.parse(storedState);
              if (storedUser && session) {
                set({
                  user: storedUser,
                  session,
                  isAuthenticated: true,
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        } finally {
          set({ loading: false });
        }
      },

      updateProfile: async (data) => {
        try {
          set({ loading: true, error: null });
          
          const updatedUser = await userRepository.updateProfile(data);
          
          set({
            user: updatedUser,
            loading: false,
          });
        } catch (error: any) {
          const errorMessage = error instanceof APIError 
            ? error.message 
            : error instanceof NetworkError 
              ? 'Network connection failed. Please check your internet connection.'
              : error.message || 'Failed to update profile';
          
          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      checkUsernameAvailable: async (username: string) => {
        try {
          return await userRepository.checkUsernameAvailable(username);
        } catch (error: any) {
          console.error('Failed to check username availability:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

// Party Store
interface PartyState {
  parties: PartyModel[];
  nearbyParties: PartyModel[];
  trendingParties: PartyModel[];
  userParties: PartyModel[];
  attendingParties: PartyModel[];
  selectedParty: PartyModel | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    hasNext: boolean;
    total: number;
  };
}

interface PartyActions {
  setParties: (parties: PartyModel[]) => void;
  setSelectedParty: (party: PartyModel | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // CRUD operations
  createParty: (data: {
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
  }) => Promise<void>;
  
  updateParty: (id: string, updates: Partial<PartyModel>) => void;
  removeParty: (id: string) => void;
  
  // Discovery operations
  findNearbyParties: (location: { latitude: number; longitude: number; radius?: number }) => Promise<void>;
  findTrendingParties: () => Promise<void>;
  loadUserParties: (userId: string) => Promise<void>;
  loadAttendingParties: (userId: string) => Promise<void>;
  
  // Party operations
  joinParty: (partyId: string) => Promise<void>;
  leaveParty: (partyId: string) => Promise<void>;
  getPartyAttendees: (partyId: string) => Promise<UserModel[]>;
  
  // Utility
  clearError: () => void;
  subscribe: (partyId: string, callback: (payload: any) => void) => any;
  refreshParties: () => Promise<void>;
}

export const usePartyStore = create<PartyState & PartyActions>()((set, get) => ({
  // State
  parties: [],
  nearbyParties: [],
  trendingParties: [],
  userParties: [],
  attendingParties: [],
  selectedParty: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    hasNext: false,
    total: 0,
  },

  // Actions
  setParties: (parties) => {
    set({ parties });
  },

  setSelectedParty: (party) => {
    set({ selectedParty: party });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },

  createParty: async (data) => {
    try {
      set({ loading: true, error: null });
      
      const newParty = await partyRepository.createParty(data);
      
      set((state) => ({
        parties: [newParty, ...state.parties],
        userParties: [newParty, ...state.userParties],
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to create party';
      
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateParty: (id, updates) => {
    set((state) => ({
      parties: state.parties.map((party) =>
        party.id === id ? { ...party, ...updates } : party
      ),
      nearbyParties: state.nearbyParties.map((party) =>
        party.id === id ? { ...party, ...updates } : party
      ),
      trendingParties: state.trendingParties.map((party) =>
        party.id === id ? { ...party, ...updates } : party
      ),
      userParties: state.userParties.map((party) =>
        party.id === id ? { ...party, ...updates } : party
      ),
      attendingParties: state.attendingParties.map((party) =>
        party.id === id ? { ...party, ...updates } : party
      ),
      selectedParty: state.selectedParty?.id === id 
        ? { ...state.selectedParty, ...updates } 
        : state.selectedParty,
    }));
  },

  removeParty: (id) => {
    set((state) => ({
      parties: state.parties.filter((party) => party.id !== id),
      nearbyParties: state.nearbyParties.filter((party) => party.id !== id),
      trendingParties: state.trendingParties.filter((party) => party.id !== id),
      userParties: state.userParties.filter((party) => party.id !== id),
      attendingParties: state.attendingParties.filter((party) => party.id !== id),
      selectedParty: state.selectedParty?.id === id ? null : state.selectedParty,
    }));
  },

  findNearbyParties: async (location) => {
    try {
      set({ loading: true, error: null });
      
      const result = await partyRepository.findNearby(location);
      
      set({
        nearbyParties: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load nearby parties';
      
      set({ error: errorMessage, loading: false });
    }
  },

  findTrendingParties: async () => {
    try {
      set({ loading: true, error: null });
      
      const result = await partyRepository.findTrending();
      
      set({
        trendingParties: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load trending parties';
      
      set({ error: errorMessage, loading: false });
    }
  },

  loadUserParties: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const result = await partyRepository.findByCreator(userId);
      
      set({
        userParties: result.data,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load user parties';
      
      set({ error: errorMessage, loading: false });
    }
  },

  loadAttendingParties: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const result = await partyRepository.findByAttendee(userId);
      
      set({
        attendingParties: result.data,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load attending parties';
      
      set({ error: errorMessage, loading: false });
    }
  },

  joinParty: async (partyId: string) => {
    try {
      set({ loading: true, error: null });
      
      const updatedParty = await partyRepository.joinParty(partyId);
      
      // Update party in all relevant arrays
      get().updateParty(partyId, updatedParty);
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to join party';
      
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  leaveParty: async (partyId: string) => {
    try {
      set({ loading: true, error: null });
      
      const updatedParty = await partyRepository.leaveParty(partyId);
      
      // Update party in all relevant arrays and remove from attending
      get().updateParty(partyId, updatedParty);
      set((state) => ({
        attendingParties: state.attendingParties.filter(party => party.id !== partyId),
      }));
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to leave party';
      
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  getPartyAttendees: async (partyId: string) => {
    try {
      const result = await partyRepository.getAttendees(partyId);
      return result.data;
    } catch (error: any) {
      console.error('Failed to load party attendees:', error);
      return [];
    }
  },

  clearError: () => {
    set({ error: null });
  },

  subscribe: (partyId: string, callback: (payload: any) => void) => {
    // Placeholder for real-time subscription
    // Will be implemented with WebSocket or server-sent events
    console.log('Subscribing to party updates:', partyId);
    return partyRepository.subscribeToParty(partyId, callback);
  },

  refreshParties: async () => {
    const state = get();
    const { currentLocation } = useLocationStore.getState();
    
    if (currentLocation) {
      await get().findNearbyParties(currentLocation);
    }
    await get().findTrendingParties();
  },
}));

// Location Store
interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  permissions: {
    location: boolean;
  };
  loading: boolean;
  error: string | null;
}

interface LocationActions {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: { latitude: number; longitude: number }) => void;
  setPermissions: (permissions: { location: boolean }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useLocationStore = create<LocationState & LocationActions>()(
  persist(
    (set, get) => ({
      // State
      currentLocation: null,
      permissions: {
        location: false,
      },
      loading: false,
      error: null,

      // Actions
      startTracking: async () => {
        try {
          set({ loading: true, error: null });

          // Request permissions
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('Location permission denied');
          }

          set((state) => ({
            permissions: { ...state.permissions, location: true },
          }));

          // Get current location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          set({
            currentLocation: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            loading: false,
          });

          // Start watching location
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 30000, // Update every 30 seconds
              distanceInterval: 100, // Update every 100 meters
            },
            (location) => {
              set({
                currentLocation: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
              });
            }
          );
        } catch (error: any) {
          set({
            error: error.message || 'Failed to get location',
            loading: false,
          });
        }
      },

      stopTracking: () => {
        set({
          currentLocation: null,
          permissions: { location: false },
        });
      },

      updateLocation: (location) => {
        set({ currentLocation: location });
      },

      setPermissions: (permissions) => {
        set((state) => ({
          permissions: { ...state.permissions, ...permissions },
        }));
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        permissions: state.permissions,
      }),
    }
  )
);

// Photo Store
interface PhotoState {
  photos: PhotoModel[];
  partyPhotos: Record<string, PhotoModel[]>;
  userPhotos: Record<string, PhotoModel[]>;
  loading: boolean;
  error: string | null;
  uploading: boolean;
}

interface PhotoActions {
  setPhotos: (photos: PhotoModel[]) => void;
  addPhoto: (photo: PhotoModel) => void;
  removePhoto: (id: string) => void;
  
  // Photo operations
  loadPartyPhotos: (partyId: string) => Promise<void>;
  loadUserPhotos: (userId: string) => Promise<void>;
  uploadPhoto: (partyId: string, imageFile: FormData, caption?: string) => Promise<void>;
  likePhoto: (photoId: string) => Promise<void>;
  reportPhoto: (photoId: string, reason: string) => Promise<void>;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  clearError: () => void;
}

export const usePhotoStore = create<PhotoState & PhotoActions>()((set, get) => ({
  // State
  photos: [],
  partyPhotos: {},
  userPhotos: {},
  loading: false,
  error: null,
  uploading: false,

  // Actions
  setPhotos: (photos) => set({ photos }),
  
  addPhoto: (photo) => {
    set((state) => ({ 
      photos: [photo, ...state.photos],
      partyPhotos: {
        ...state.partyPhotos,
        [photo.party_id]: [photo, ...(state.partyPhotos[photo.party_id] || [])]
      }
    }));
  },
  
  removePhoto: (id) => {
    set((state) => {
      const updatedPartyPhotos = { ...state.partyPhotos };
      Object.keys(updatedPartyPhotos).forEach(partyId => {
        updatedPartyPhotos[partyId] = updatedPartyPhotos[partyId].filter(p => p.id !== id);
      });
      
      const updatedUserPhotos = { ...state.userPhotos };
      Object.keys(updatedUserPhotos).forEach(userId => {
        updatedUserPhotos[userId] = updatedUserPhotos[userId].filter(p => p.id !== id);
      });
      
      return {
        photos: state.photos.filter(p => p.id !== id),
        partyPhotos: updatedPartyPhotos,
        userPhotos: updatedUserPhotos,
      };
    });
  },
  
  loadPartyPhotos: async (partyId: string) => {
    try {
      set({ loading: true, error: null });
      
      // TODO: Implement photo repository and API
      // For now, using placeholder data
      const photos: PhotoModel[] = [];
      
      set((state) => ({
        partyPhotos: {
          ...state.partyPhotos,
          [partyId]: photos
        },
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load photos';
      
      set({ error: errorMessage, loading: false });
    }
  },
  
  loadUserPhotos: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      // TODO: Implement photo repository and API
      // For now, using placeholder data
      const photos: PhotoModel[] = [];
      
      set((state) => ({
        userPhotos: {
          ...state.userPhotos,
          [userId]: photos
        },
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load user photos';
      
      set({ error: errorMessage, loading: false });
    }
  },
  
  uploadPhoto: async (partyId: string, imageFile: FormData, caption?: string) => {
    try {
      set({ uploading: true, error: null });
      
      // TODO: Implement photo upload via repository
      // For now, simulating upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set({ uploading: false });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to upload photo';
      
      set({ error: errorMessage, uploading: false });
      throw error;
    }
  },
  
  likePhoto: async (photoId: string) => {
    try {
      // TODO: Implement like functionality via repository
      console.log('Liking photo:', photoId);
    } catch (error: any) {
      console.error('Failed to like photo:', error);
    }
  },
  
  reportPhoto: async (photoId: string, reason: string) => {
    try {
      // TODO: Implement report functionality via repository
      console.log('Reporting photo:', photoId, 'Reason:', reason);
    } catch (error: any) {
      console.error('Failed to report photo:', error);
      throw error;
    }
  },
  
  setLoading: (loading) => set({ loading }),
  setUploading: (uploading) => set({ uploading }),
  clearError: () => set({ error: null }),
}));

// Message Store
interface MessageState {
  messages: Record<string, MessageModel[]>; // partyId -> messages
  conversations: any[];
  unreadCount: number;
  loading: boolean;
  sending: boolean;
  error: string | null;
  pagination: Record<string, {
    page: number;
    hasNext: boolean;
    total: number;
  }>;
}

interface MessageActions {
  setMessages: (partyId: string, messages: MessageModel[]) => void;
  addMessage: (message: MessageModel) => void;
  updateMessage: (messageId: string, updates: Partial<MessageModel>) => void;
  removeMessage: (messageId: string) => void;
  
  // Message operations
  loadMessages: (partyId: string, options?: { before?: string; after?: string }) => Promise<void>;
  sendMessage: (partyId: string, content: string, type?: 'text' | 'image', replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Reactions
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  
  // Conversations
  loadConversations: () => Promise<void>;
  markAsRead: (partyId: string) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  
  // Real-time
  subscribeToParty: (partyId: string) => () => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState & MessageActions>()((set, get) => ({
  // State
  messages: {},
  conversations: [],
  unreadCount: 0,
  loading: false,
  sending: false,
  error: null,
  pagination: {},

  // Actions
  setMessages: (partyId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [partyId]: messages
      }
    }));
  },
  
  addMessage: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.party_id]: [
          ...(state.messages[message.party_id] || []),
          message
        ]
      }
    }));
  },
  
  updateMessage: (messageId, updates) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      
      Object.keys(updatedMessages).forEach(partyId => {
        updatedMessages[partyId] = updatedMessages[partyId].map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
      });
      
      return { messages: updatedMessages };
    });
  },
  
  removeMessage: (messageId) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      
      Object.keys(updatedMessages).forEach(partyId => {
        updatedMessages[partyId] = updatedMessages[partyId].filter(msg => msg.id !== messageId);
      });
      
      return { messages: updatedMessages };
    });
  },
  
  loadMessages: async (partyId: string, options = {}) => {
    try {
      set({ loading: true, error: null });
      
      const result = await messageRepository.findByParty(partyId, options);
      
      set((state) => ({
        messages: {
          ...state.messages,
          [partyId]: result.data
        },
        pagination: {
          ...state.pagination,
          [partyId]: result.pagination
        },
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load messages';
      
      set({ error: errorMessage, loading: false });
    }
  },
  
  sendMessage: async (partyId: string, content: string, type = 'text', replyTo?: string) => {
    try {
      set({ sending: true, error: null });
      
      const message = await messageRepository.sendMessage({
        party_id: partyId,
        content,
        type,
        reply_to: replyTo,
      });
      
      get().addMessage(message);
      
      set({ sending: false });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to send message';
      
      set({ error: errorMessage, sending: false });
      throw error;
    }
  },
  
  editMessage: async (messageId: string, content: string) => {
    try {
      const updatedMessage = await messageRepository.editMessage(messageId, { content });
      get().updateMessage(messageId, updatedMessage);
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to edit message';
      
      set({ error: errorMessage });
      throw error;
    }
  },
  
  deleteMessage: async (messageId: string) => {
    try {
      await messageRepository.deleteMessage(messageId);
      get().removeMessage(messageId);
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to delete message';
      
      set({ error: errorMessage });
      throw error;
    }
  },
  
  addReaction: async (messageId: string, emoji: string) => {
    try {
      const updatedMessage = await messageRepository.addReaction(messageId, emoji);
      get().updateMessage(messageId, updatedMessage);
    } catch (error: any) {
      console.error('Failed to add reaction:', error);
    }
  },
  
  removeReaction: async (messageId: string, emoji: string) => {
    try {
      const updatedMessage = await messageRepository.removeReaction(messageId, emoji);
      get().updateMessage(messageId, updatedMessage);
    } catch (error: any) {
      console.error('Failed to remove reaction:', error);
    }
  },
  
  loadConversations: async () => {
    try {
      set({ loading: true, error: null });
      
      const conversations = await messageRepository.getConversations();
      
      set({
        conversations,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof NetworkError 
          ? 'Network connection failed. Please check your internet connection.'
          : error.message || 'Failed to load conversations';
      
      set({ error: errorMessage, loading: false });
    }
  },
  
  markAsRead: async (partyId: string) => {
    try {
      await messageRepository.markAsRead(partyId);
      get().getUnreadCount();
    } catch (error: any) {
      console.error('Failed to mark messages as read:', error);
    }
  },
  
  getUnreadCount: async () => {
    try {
      const count = await messageRepository.getUnreadCount();
      set({ unreadCount: count });
    } catch (error: any) {
      console.error('Failed to get unread count:', error);
    }
  },
  
  subscribeToParty: (partyId: string) => {
    const subscription = messageRepository.subscribeToParty(partyId, (message: MessageModel) => {
      get().addMessage(message);
    });
    
    return subscription.unsubscribe;
  },
  
  setLoading: (loading) => set({ loading }),
  setSending: (sending) => set({ sending }),
  clearError: () => set({ error: null }),
}));