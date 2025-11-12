/**
 * Test Utilities
 * 
 * Provides common utilities, mocks, and helpers for testing components and hooks.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Theme provider mock (if you have a theme system)
const TestThemeProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// Test wrapper that includes all necessary providers
const AllProviders = ({ children }: { children: ReactNode }) => {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <NavigationContainer>
        <TestThemeProvider>
          {children}
        </TestThemeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Test bio',
  avatar_url: 'https://example.com/avatar.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockParty = (overrides = {}) => ({
  id: '1',
  title: 'Test Party',
  description: 'A test party description',
  date: new Date().toISOString(),
  location: 'Test Location',
  latitude: 37.7749,
  longitude: -122.4194,
  host_id: '1',
  max_attendees: 20,
  current_attendees: 5,
  image_url: 'https://example.com/party.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: '1',
  content: 'Test message content',
  user_id: '1',
  party_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: createMockUser(),
  ...overrides,
});

// Security test utilities
export const createMockSecurityError = (type: string, message: string) => {
  const error = new Error(message);
  error.name = 'SecurityError';
  (error as any).type = type;
  return error;
};

export const createMockValidationConfig = () => ({
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
  },
  password: {
    required: true,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    minLength: 8,
    maxLength: 128,
  },
});

// Loading state test utilities
export const createMockLoadingOperation = (overrides = {}) => ({
  id: 'test-operation-1',
  type: 'api',
  description: 'Test operation',
  priority: 'medium',
  progress: 0,
  startTime: Date.now(),
  ...overrides,
});

// Async test utilities
export const waitForAsync = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// Mock navigation helpers
export const createMockNavigation = (overrides = {}) => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  ...overrides,
});

export const createMockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});

// Performance test utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Accessibility test helpers
export const findByAccessibilityLabel = (getByLabelText: any, label: string) => {
  return getByLabelText(label);
};

export const findByAccessibilityRole = (getByRole: any, role: string) => {
  return getByRole(role);
};

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Export everything including the custom render
export * from '@testing-library/react-native';
export { customRender as render };