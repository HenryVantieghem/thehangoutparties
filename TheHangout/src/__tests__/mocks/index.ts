/**
 * Mock Factories
 * 
 * Provides mock implementations for external dependencies and services.
 */

// Mock Supabase client
export const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    onAuthStateChange: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
};

// Mock Expo SecureStore
export const mockSecureStore = {
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
};

// Mock Expo Crypto
export const mockCrypto = {
  digestStringAsync: jest.fn().mockResolvedValue('mock-hash'),
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32)),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
};

// Mock Expo Location
export const mockLocation = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
  }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
    },
  }),
};

// Mock Expo Camera
export const mockCamera = {
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
  }),
};

// Mock AsyncStorage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock React Native modules
export const mockPlatform = {
  OS: 'ios' as const,
  Version: '14.0',
  select: jest.fn((options: any) => options.ios),
};

export const mockDimensions = {
  get: jest.fn(() => ({ width: 375, height: 667 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

export const mockAlert = {
  alert: jest.fn(),
};

export const mockAppState = {
  currentState: 'active',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock Zustand stores
export const createMockStore = <T>(initialState: T) => {
  let state = initialState;
  
  const listeners = new Set<(state: T) => void>();
  
  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextState };
    listeners.forEach((listener) => listener(state));
  };
  
  const getState = () => state;
  
  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  
  return {
    setState,
    getState,
    subscribe,
    destroy: () => listeners.clear(),
  };
};

// Mock security manager
export const mockSecurityManager = {
  storeSecureValue: jest.fn().mockResolvedValue(undefined),
  getSecureValue: jest.fn().mockResolvedValue(null),
  deleteSecureValue: jest.fn().mockResolvedValue(undefined),
  storeTokens: jest.fn().mockResolvedValue(undefined),
  getAccessToken: jest.fn().mockResolvedValue(null),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  isTokenExpired: jest.fn().mockResolvedValue(false),
  validateInput: jest.fn().mockReturnValue(true),
  sanitizeInput: jest.fn().mockImplementation((input: string) => input),
  validateEmail: jest.fn().mockReturnValue(true),
  validatePassword: jest.fn().mockReturnValue(true),
  validateUsername: jest.fn().mockReturnValue(true),
  encryptData: jest.fn().mockResolvedValue('encrypted-data'),
  decryptData: jest.fn().mockResolvedValue('decrypted-data'),
  recordFailedAttempt: jest.fn().mockResolvedValue(false),
  clearFailedAttempts: jest.fn().mockResolvedValue(undefined),
  isAccountLocked: jest.fn().mockResolvedValue(false),
  updateLastActivity: jest.fn().mockResolvedValue(undefined),
  isSessionExpired: jest.fn().mockResolvedValue(false),
  validateUrl: jest.fn().mockReturnValue(true),
  getSecureHeaders: jest.fn().mockReturnValue({}),
  getSecurityStatus: jest.fn().mockResolvedValue({
    hasActiveSession: false,
    isAccountLocked: false,
    sessionTimeRemaining: 0,
    lastActivity: null,
    deviceId: null,
  }),
  updateConfig: jest.fn(),
  getConfig: jest.fn().mockReturnValue({}),
};

// Mock repositories
export const mockUserRepository = {
  getById: jest.fn(),
  getByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
};

export const mockPartyRepository = {
  getById: jest.fn(),
  getByLocation: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  getAttendees: jest.fn(),
};

export const mockMessageRepository = {
  getByPartyId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Performance test utilities
export const mockPerformanceMonitor = {
  startTiming: jest.fn(),
  endTiming: jest.fn(),
  recordMetric: jest.fn(),
  getMetrics: jest.fn().mockReturnValue({}),
};

// Error boundary mock
export const mockErrorBoundary = {
  componentDidCatch: jest.fn(),
  componentDidUpdate: jest.fn(),
};