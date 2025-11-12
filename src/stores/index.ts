import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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