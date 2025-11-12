import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { Party } from '../types';

export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at: Date;
}

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
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
          
          // Mock sign in - replace with actual implementation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful sign in
          const mockUser: User = {
            id: '1',
            email,
            username: email.split('@')[0],
            created_at: new Date(),
          };
          
          set({
            user: mockUser,
            session: { access_token: 'mock_token' },
            isAuthenticated: true,
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to sign in',
            loading: false,
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, username: string) => {
        try {
          set({ loading: true, error: null });
          
          // Mock sign up - replace with actual implementation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful sign up
          const mockUser: User = {
            id: '1',
            email,
            username,
            created_at: new Date(),
          };
          
          set({
            user: mockUser,
            session: { access_token: 'mock_token' },
            isAuthenticated: true,
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create account',
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
          
          // Check for existing session
          const storedState = await AsyncStorage.getItem('auth-storage');
          if (storedState) {
            const { user, session } = JSON.parse(storedState);
            if (user && session) {
              set({
                user,
                session,
                isAuthenticated: true,
              });
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        } finally {
          set({ loading: false });
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
  parties: Party[];
  loading: boolean;
  error: string | null;
}

interface PartyActions {
  setParties: (parties: Party[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addParty: (party: Party) => void;
  updateParty: (id: string, updates: Partial<Party>) => void;
  removeParty: (id: string) => void;
  clearError: () => void;
}

export const usePartyStore = create<PartyState & PartyActions>()((set, get) => ({
  // State
  parties: [],
  loading: false,
  error: null,

  // Actions
  setParties: (parties) => {
    set({ parties });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },

  addParty: (party) => {
    set((state) => ({
      parties: [party, ...state.parties],
    }));
  },

  updateParty: (id, updates) => {
    set((state) => ({
      parties: state.parties.map((party) =>
        party.id === id ? { ...party, ...updates } : party
      ),
    }));
  },

  removeParty: (id) => {
    set((state) => ({
      parties: state.parties.filter((party) => party.id !== id),
    }));
  },

  clearError: () => {
    set({ error: null });
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