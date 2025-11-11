import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  User,
  Party,
  Photo,
  Friend,
  Message,
  Location,
} from '../types';
import {
  AuthService,
  PartyService,
  PhotoService,
  FriendService,
  MessageService,
  UserService,
  supabase,
} from '../services/supabase';
import { logError, getErrorMessage } from '../utils';
import * as ExpoLocation from 'expo-location';

// ============================================================================
// TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { username?: string; avatar_url?: string; bio?: string }) => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
}

interface PartyState {
  parties: Party[];
  currentParty: Party | null;
  loading: boolean;
  error: string | null;
  createParty: (partyData: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    photo_url?: string;
  }) => Promise<void>;
  joinParty: (partyId: string) => Promise<void>;
  fetchParties: (filters?: {
    location?: Location;
    radius?: number;
    status?: string;
  }) => Promise<void>;
  setParties: (parties: Party[]) => void;
  subscribe: (partyId: string, callback: (payload: any) => void) => RealtimeChannel | null;
  reset: () => void;
}

interface PhotoState {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  likePhoto: (photoId: string) => Promise<void>;
  uploadPhoto: (partyId: string, photoUri: string, caption?: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  setPhotos: (photos: Photo[]) => void;
  subscribe: (partyId: string, callback: (payload: any) => void) => RealtimeChannel | null;
  reset: () => void;
}

interface FriendState {
  friends: Friend[];
  friendRequests: Friend[];
  loading: boolean;
  error: string | null;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  setFriends: (friends: Friend[]) => void;
  reset: () => void;
}

interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (partyId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  subscribe: (partyId: string, callback: (payload: any) => void) => RealtimeChannel | null;
  reset: () => void;
}

interface LocationState {
  currentLocation: Location | null;
  loading: boolean;
  error: string | null;
  updateLocation: (location: Location) => Promise<void>;
  watchLocation: () => Promise<void>;
  reset: () => void;
}

interface UserState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  searchUsers: (query: string, limit?: number) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  reset: () => void;
}

interface UIState {
  loading: boolean;
  error: string | null;
  showError: (error: string) => void;
  clearError: () => void;
  showLoading: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

interface OfflineQueueItem {
  id: string;
  type: 'createParty' | 'joinParty' | 'uploadPhoto' | 'likePhoto' | 'sendMessage' | 'addFriend';
  data: any;
  timestamp: number;
}

interface OfflineState {
  queue: OfflineQueueItem[];
  isOnline: boolean;
  loading: boolean;
  error: string | null;
  addToQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => void;
  syncQueue: () => Promise<void>;
  setOnline: (isOnline: boolean) => void;
  reset: () => void;
}

// ============================================================================
// AUTH STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,

        signUp: async (email: string, password: string, username: string) => {
          set({ isLoading: true, error: null });
          try {
            const { user: authUser } = await AuthService.signUp(email, password, username);
            if (authUser) {
              const user = await UserService.getUser(authUser.id);
              set({ user: user || null, isLoading: false });
            }
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            logError('authStore.signUp', error);
            throw error;
          }
        },

        signIn: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const { user: authUser } = await AuthService.signIn(email, password);
            if (authUser) {
              const user = await UserService.getUser(authUser.id);
              set({ user: user || null, isLoading: false });
            }
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            logError('authStore.signIn', error);
            throw error;
          }
        },

        signOut: async () => {
          set({ isLoading: true, error: null });
          try {
            await AuthService.signOut();
            set({ user: null, isLoading: false });
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            logError('authStore.signOut', error);
            throw error;
          }
        },

        updateProfile: async (updates: { username?: string; avatar_url?: string; bio?: string }) => {
          set({ isLoading: true, error: null });
          try {
            const updatedUser = await AuthService.updateProfile(updates);
            set({ user: updatedUser, isLoading: false });
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            logError('authStore.updateProfile', error);
            throw error;
          }
        },

        setError: (error: string | null) => {
          set({ error });
        },

        reset: () => {
          set({ user: null, isLoading: false, error: null });
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ user: state.user }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// ============================================================================
// PARTY STORE
// ============================================================================

export const usePartyStore = create<PartyState>()(
  devtools(
    persist(
      (set, get) => ({
        parties: [],
        currentParty: null,
        loading: false,
        error: null,
        subscription: null as RealtimeChannel | null,

        createParty: async (partyData: {
          title: string;
          description?: string;
          latitude: number;
          longitude: number;
          photo_url?: string;
        }) => {
          set({ loading: true, error: null });
          try {
            const party = await PartyService.createParty(partyData);
            set((state) => ({
              parties: [party, ...state.parties],
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('partyStore.createParty', error);
            throw error;
          }
        },

        joinParty: async (partyId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await PartyService.joinParty(partyId, user.id);
            set((state) => ({
              parties: state.parties.map((p) =>
                p.id === partyId ? { ...p, attendees: p.attendees + 1 } : p
              ),
              currentParty:
                state.currentParty?.id === partyId
                  ? { ...state.currentParty, attendees: state.currentParty.attendees + 1 }
                  : state.currentParty,
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('partyStore.joinParty', error);
            throw error;
          }
        },

        fetchParties: async (filters?: {
          location?: Location;
          radius?: number;
          status?: string;
        }) => {
          set({ loading: true, error: null });
          try {
            const parties = await PartyService.getParties(filters);
            set({ parties, loading: false });
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('partyStore.fetchParties', error);
          }
        },

        setParties: (parties: Party[]) => {
          set({ parties });
        },

        subscribe: (partyId: string, callback: (payload: any) => void) => {
          try {
            const channel = PartyService.subscribeToPartyUpdates(partyId, (payload) => {
              callback(payload);
              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                const party = payload.new as any;
                set((state) => ({
                  parties: state.parties.map((p) => (p.id === party.id ? { ...p, ...party } : p)),
                  currentParty:
                    state.currentParty?.id === party.id ? { ...state.currentParty, ...party } : state.currentParty,
                }));
              }
            });
            return channel;
          } catch (error) {
            logError('partyStore.subscribe', error);
            return null;
          }
        },

        reset: () => {
          set({ parties: [], currentParty: null, loading: false, error: null });
        },
      }),
      {
        name: 'party-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ parties: state.parties, currentParty: state.currentParty }),
      }
    ),
    { name: 'PartyStore' }
  )
);

// ============================================================================
// PHOTO STORE
// ============================================================================

export const usePhotoStore = create<PhotoState>()(
  devtools(
    persist(
      (set, get) => ({
        photos: [],
        loading: false,
        error: null,

        likePhoto: async (photoId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await PhotoService.likePhoto(photoId, user.id);
            set((state) => ({
              photos: state.photos.map((p) =>
                p.id === photoId ? { ...p, likes: p.likes + 1 } : p
              ),
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('photoStore.likePhoto', error);
            throw error;
          }
        },

        uploadPhoto: async (partyId: string, photoUri: string, caption?: string) => {
          set({ loading: true, error: null });
          try {
            const photo = await PhotoService.uploadPhoto(partyId, photoUri, caption);
            set((state) => ({
              photos: [photo, ...state.photos],
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('photoStore.uploadPhoto', error);
            throw error;
          }
        },

        deletePhoto: async (photoId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await PhotoService.deletePhoto(photoId, user.id);
            set((state) => ({
              photos: state.photos.filter((p) => p.id !== photoId),
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('photoStore.deletePhoto', error);
            throw error;
          }
        },

        setPhotos: (photos: Photo[]) => {
          set({ photos });
        },

        subscribe: (partyId: string, callback: (payload: any) => void) => {
          try {
            const channel = PhotoService.subscribeToPhotos(partyId, (payload) => {
              callback(payload);
              if (payload.eventType === 'INSERT') {
                const photo = payload.new as Photo;
                set((state) => ({ photos: [photo, ...state.photos] }));
              } else if (payload.eventType === 'DELETE') {
                const photoId = payload.old.id;
                set((state) => ({ photos: state.photos.filter((p) => p.id !== photoId) }));
              } else if (payload.eventType === 'UPDATE') {
                const photo = payload.new as Photo;
                set((state) => ({
                  photos: state.photos.map((p) => (p.id === photo.id ? photo : p)),
                }));
              }
            });
            return channel;
          } catch (error) {
            logError('photoStore.subscribe', error);
            return null;
          }
        },

        reset: () => {
          set({ photos: [], loading: false, error: null });
        },
      }),
      {
        name: 'photo-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ photos: state.photos }),
      }
    ),
    { name: 'PhotoStore' }
  )
);

// ============================================================================
// FRIEND STORE
// ============================================================================

export const useFriendStore = create<FriendState>()(
  devtools(
    persist(
      (set, get) => ({
        friends: [],
        friendRequests: [],
        loading: false,
        error: null,

        addFriend: async (friendId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await FriendService.sendFriendRequest(user.id, friendId);
            const request: Friend = {
              id: `temp-${Date.now()}`,
              user_id: user.id,
              friend_id: friendId,
              status: 'pending',
            };
            set((state) => ({
              friendRequests: [request, ...state.friendRequests],
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('friendStore.addFriend', error);
            throw error;
          }
        },

        removeFriend: async (friendshipId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await FriendService.removeFriend(friendshipId, user.id);
            set((state) => ({
              friends: state.friends.filter((f) => f.id !== friendshipId),
              friendRequests: state.friendRequests.filter((f) => f.id !== friendshipId),
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('friendStore.removeFriend', error);
            throw error;
          }
        },

        acceptRequest: async (friendshipId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await FriendService.acceptFriendRequest(friendshipId, user.id);
            set((state) => {
              const request = state.friendRequests.find((f) => f.id === friendshipId);
              return {
                friends: request ? [request, ...state.friends] : state.friends,
                friendRequests: state.friendRequests.filter((f) => f.id !== friendshipId),
                loading: false,
              };
            });
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('friendStore.acceptRequest', error);
            throw error;
          }
        },

        setFriends: (friends: Friend[]) => {
          set({
            friends: friends.filter((f) => f.status === 'accepted'),
            friendRequests: friends.filter((f) => f.status === 'pending'),
          });
        },

        reset: () => {
          set({ friends: [], friendRequests: [], loading: false, error: null });
        },
      }),
      {
        name: 'friend-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ friends: state.friends, friendRequests: state.friendRequests }),
      }
    ),
    { name: 'FriendStore' }
  )
);

// ============================================================================
// MESSAGE STORE
// ============================================================================

export const useMessageStore = create<MessageState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        loading: false,
        error: null,

        sendMessage: async (partyId: string, text: string) => {
          set({ loading: true, error: null });
          try {
            const message = await MessageService.sendMessage(partyId, text);
            set((state) => ({
              messages: [...state.messages, message],
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('messageStore.sendMessage', error);
            throw error;
          }
        },

        deleteMessage: async (messageId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await MessageService.deleteMessage(messageId, user.id);
            set((state) => ({
              messages: state.messages.filter((m) => m.id !== messageId),
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('messageStore.deleteMessage', error);
            throw error;
          }
        },

        setMessages: (messages: Message[]) => {
          set({ messages });
        },

        subscribe: (partyId: string, callback: (payload: any) => void) => {
          try {
            const channel = MessageService.subscribeToMessages(partyId, (payload) => {
              callback(payload);
              if (payload.eventType === 'INSERT') {
                const message = payload.new as Message;
                set((state) => ({ messages: [...state.messages, message] }));
              } else if (payload.eventType === 'DELETE') {
                const messageId = payload.old.id;
                set((state) => ({ messages: state.messages.filter((m) => m.id !== messageId) }));
              }
            });
            return channel;
          } catch (error) {
            logError('messageStore.subscribe', error);
            return null;
          }
        },

        reset: () => {
          set({ messages: [], loading: false, error: null });
        },
      }),
      {
        name: 'message-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ messages: state.messages }),
      }
    ),
    { name: 'MessageStore' }
  )
);

// ============================================================================
// LOCATION STORE
// ============================================================================

export const useLocationStore = create<LocationState>()(
  devtools(
    persist(
      (set, get) => ({
        currentLocation: null,
        loading: false,
        error: null,

        updateLocation: async (location: Location) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (user) {
              await UserService.updateUserLocation(user.id, location);
            }
            set({ currentLocation: location, loading: false });
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('locationStore.updateLocation', error);
          }
        },

        watchLocation: async () => {
          set({ loading: true, error: null });
          try {
            // Request location permissions
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              throw new Error('Location permission not granted');
            }
            // Get current position
            const location = await ExpoLocation.getCurrentPositionAsync({});
            const newLocation: Location = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
            };
            set({ currentLocation: newLocation, loading: false });
            await get().updateLocation(newLocation);
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('locationStore.watchLocation', error);
          }
        },

        reset: () => {
          set({ currentLocation: null, loading: false, error: null });
        },
      }),
      {
        name: 'location-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ currentLocation: state.currentLocation }),
      }
    ),
    { name: 'LocationStore' }
  )
);

// ============================================================================
// USER STORE
// ============================================================================

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        currentUser: null,
        users: [],
        loading: false,
        error: null,

        searchUsers: async (query: string, limit: number = 20) => {
          set({ loading: true, error: null });
          try {
            const users = await UserService.searchUsers(query, limit);
            set({ users, loading: false });
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('userStore.searchUsers', error);
          }
        },

        blockUser: async (userId: string) => {
          set({ loading: true, error: null });
          try {
            const { user } = useAuthStore.getState();
            if (!user) throw new Error('User not authenticated');
            await UserService.blockUser(user.id, userId);
            set((state) => ({
              users: state.users.filter((u) => u.id !== userId),
              loading: false,
            }));
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, loading: false });
            logError('userStore.blockUser', error);
            throw error;
          }
        },

        setCurrentUser: (user: User | null) => {
          set({ currentUser: user });
        },

        reset: () => {
          set({ currentUser: null, users: [], loading: false, error: null });
        },
      }),
      {
        name: 'user-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ currentUser: state.currentUser }),
      }
    ),
    { name: 'UserStore' }
  )
);

// ============================================================================
// UI STORE
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      loading: false,
      error: null,

      showError: (error: string) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      showLoading: () => {
        set({ loading: true });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      reset: () => {
        set({ loading: false, error: null });
      },
    }),
    { name: 'UIStore' }
  )
);

// ============================================================================
// OFFLINE STORE
// ============================================================================

export const useOfflineStore = create<OfflineState>()(
  devtools(
    persist(
      (set, get) => ({
        queue: [],
        isOnline: true,
        loading: false,
        error: null,

        addToQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => {
          const queueItem: OfflineQueueItem = {
            ...item,
            id: `queue-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
          };
          set((state) => ({
            queue: [...state.queue, queueItem],
          }));
        },

        syncQueue: async () => {
          const { queue, isOnline } = get();
          if (!isOnline || queue.length === 0) return;

          set({ loading: true, error: null });
          const { user } = useAuthStore.getState();
          if (!user) {
            set({ loading: false });
            return;
          }

          const processed: string[] = [];
          const errors: string[] = [];

          for (const item of queue) {
            try {
              switch (item.type) {
                case 'createParty':
                  await usePartyStore.getState().createParty(item.data);
                  break;
                case 'joinParty':
                  await usePartyStore.getState().joinParty(item.data.partyId);
                  break;
                case 'uploadPhoto':
                  await usePhotoStore.getState().uploadPhoto(
                    item.data.partyId,
                    item.data.photoUri,
                    item.data.caption
                  );
                  break;
                case 'likePhoto':
                  await usePhotoStore.getState().likePhoto(item.data.photoId);
                  break;
                case 'sendMessage':
                  await useMessageStore.getState().sendMessage(item.data.partyId, item.data.text);
                  break;
                case 'addFriend':
                  await useFriendStore.getState().addFriend(item.data.friendId);
                  break;
              }
              processed.push(item.id);
            } catch (error) {
              errors.push(item.id);
              logError(`offlineStore.syncQueue.${item.type}`, error);
            }
          }

          set((state) => ({
            queue: state.queue.filter((item) => !processed.includes(item.id)),
            loading: false,
            error: errors.length > 0 ? `${errors.length} items failed to sync` : null,
          }));
        },

        setOnline: (isOnline: boolean) => {
          set({ isOnline });
          if (isOnline) {
            get().syncQueue();
          }
        },

        reset: () => {
          set({ queue: [], isOnline: true, loading: false, error: null });
        },
      }),
      {
        name: 'offline-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ queue: state.queue, isOnline: state.isOnline }),
      }
    ),
    { name: 'OfflineStore' }
  )
);

// ============================================================================
// NETWORK STATUS LISTENER
// ============================================================================

// Listen to network status changes (web only)
// For React Native, use NetInfo from @react-native-community/netinfo
// Example:
// import NetInfo from '@react-native-community/netinfo';
// NetInfo.addEventListener(state => {
//   useOfflineStore.getState().setOnline(state.isConnected ?? false);
// });
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  const updateOnlineStatus = () => {
    useOfflineStore.getState().setOnline(navigator.onLine);
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  useAuthStore,
  usePartyStore,
  usePhotoStore,
  useFriendStore,
  useMessageStore,
  useLocationStore,
  useUserStore,
  useUIStore,
  useOfflineStore,
};

