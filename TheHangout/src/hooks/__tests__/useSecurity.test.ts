/**
 * useSecurity Hooks Tests
 * 
 * Comprehensive tests for all security-related hooks:
 * - useSecurityStatus
 * - useSecureToken
 * - useInputValidation
 * - useSecureForm
 * - useAuthSecurity
 * - useSessionMonitoring
 * - useSecureRequest
 * - useDataEncryption
 */

import { renderHook, act } from '@testing-library/react-native';
import {
  useSecurityStatus,
  useSecureToken,
  useInputValidation,
  useSecureForm,
  useAuthSecurity,
  useSessionMonitoring,
  useSecureRequest,
  useDataEncryption,
  commonValidationRules,
} from '../useSecurity';
import { mockSecurityManager } from '../../__tests__/mocks';
import { SecurityError, SecurityErrorType } from '../../security/SecurityManager';

// Mock the security manager
jest.mock('../../security/SecurityManager', () => ({
  ...jest.requireActual('../../security/SecurityManager'),
  securityManager: mockSecurityManager,
}));

// Mock AppState
const mockAppState = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock('react-native', () => ({
  AppState: mockAppState,
  Alert: { alert: jest.fn() },
}));

describe('useSecurity Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useSecurityStatus', () => {
    it('should fetch security status on mount', async () => {
      const mockStatus = {
        hasActiveSession: true,
        isAccountLocked: false,
        sessionTimeRemaining: 30,
        lastActivity: new Date(),
        deviceId: 'device-123',
      };

      mockSecurityManager.getSecurityStatus.mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useSecurityStatus());

      expect(result.current.loading).toBe(true);

      // Wait for the effect to complete
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(mockSecurityManager.getSecurityStatus).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.hasActiveSession).toBe(true);
    });

    it('should refresh status periodically', async () => {
      const { result } = renderHook(() => useSecurityStatus());

      // Fast-forward time to trigger interval
      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      expect(mockSecurityManager.getSecurityStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockSecurityManager.getSecurityStatus.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSecurityStatus());

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(consoleError).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);

      consoleError.mockRestore();
    });
  });

  describe('useSecureToken', () => {
    it('should get token on mount', async () => {
      const mockToken = 'test-access-token';
      mockSecurityManager.getAccessToken.mockResolvedValueOnce(mockToken);

      const { result } = renderHook(() => useSecureToken());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.loading).toBe(false);
      expect(result.current.hasValidToken).toBe(true);
    });

    it('should store tokens correctly', async () => {
      const { result } = renderHook(() => useSecureToken());

      await act(async () => {
        await result.current.storeTokens('access-token', 'refresh-token');
      });

      expect(mockSecurityManager.storeTokens).toHaveBeenCalledWith(
        'access-token',
        'refresh-token'
      );
    });

    it('should clear tokens correctly', async () => {
      const { result } = renderHook(() => useSecureToken());

      await act(async () => {
        await result.current.clearTokens();
      });

      expect(mockSecurityManager.clearTokens).toHaveBeenCalled();
      expect(result.current.token).toBeNull();
    });

    it('should handle token errors', async () => {
      const tokenError = new SecurityError(SecurityErrorType.TOKEN_ERROR, 'Token failed');
      mockSecurityManager.getAccessToken.mockRejectedValueOnce(tokenError);

      const { result } = renderHook(() => useSecureToken());

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.error).toEqual(tokenError);
      expect(result.current.token).toBeNull();
      expect(result.current.hasValidToken).toBe(false);
    });
  });

  describe('useInputValidation', () => {
    const validationConfig = {
      email: commonValidationRules.email,
      password: commonValidationRules.password,
    };

    it('should validate fields correctly', () => {
      const { result } = renderHook(() => useInputValidation(validationConfig));

      act(() => {
        const isValid = result.current.validateField('email', 'test@example.com');
        expect(isValid).toBe(true);
      });

      act(() => {
        const isValid = result.current.validateField('email', 'invalid-email');
        expect(isValid).toBe(false);
      });
    });

    it('should track touched fields', () => {
      const { result } = renderHook(() => useInputValidation(validationConfig));

      act(() => {
        result.current.setFieldTouched('email', true);
      });

      expect(result.current.touched.email).toBe(true);
    });

    it('should return errors for touched fields only', () => {
      const { result } = renderHook(() => useInputValidation(validationConfig));

      act(() => {
        result.current.validateField('email', 'invalid-email');
      });

      // Error should not be shown until field is touched
      expect(result.current.getFieldError('email')).toBe('');

      act(() => {
        result.current.setFieldTouched('email', true);
      });

      expect(result.current.getFieldError('email')).toBeTruthy();
    });

    it('should clear all errors and touched state', () => {
      const { result } = renderHook(() => useInputValidation(validationConfig));

      act(() => {
        result.current.validateField('email', 'invalid');
        result.current.setFieldTouched('email', true);
      });

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('should handle security validation errors', () => {
      mockSecurityManager.sanitizeInput.mockReturnValueOnce('sanitized');
      
      const { result } = renderHook(() => useInputValidation(validationConfig));

      act(() => {
        result.current.validateField('email', 'malicious<script>');
      });

      expect(mockSecurityManager.sanitizeInput).toHaveBeenCalledWith('malicious<script>');
    });
  });

  describe('useSecureForm', () => {
    const formConfig = {
      validation: {
        email: commonValidationRules.email,
        password: commonValidationRules.password,
      },
      onSubmit: jest.fn(),
      initialValues: {
        email: '',
        password: '',
      },
    };

    beforeEach(() => {
      formConfig.onSubmit.mockClear();
    });

    it('should initialize with initial values', () => {
      const { result } = renderHook(() => useSecureForm(formConfig));

      expect(result.current.values).toEqual({
        email: '',
        password: '',
      });
    });

    it('should update values correctly', () => {
      const { result } = renderHook(() => useSecureForm(formConfig));

      act(() => {
        result.current.setValue('email', 'test@example.com');
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('should handle form submission with valid data', async () => {
      formConfig.onSubmit.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useSecureForm(formConfig));

      act(() => {
        result.current.setValue('email', 'test@example.com');
        result.current.setValue('password', 'Test123!@#');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(formConfig.onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Test123!@#',
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should prevent submission with invalid data', async () => {
      const { result } = renderHook(() => useSecureForm(formConfig));

      act(() => {
        result.current.setValue('email', 'invalid-email');
      });

      await act(async () => {
        try {
          await result.current.handleSubmit();
        } catch (error) {
          expect(error).toBeInstanceOf(SecurityError);
        }
      });

      expect(formConfig.onSubmit).not.toHaveBeenCalled();
      expect(result.current.submitError).toBeInstanceOf(SecurityError);
    });

    it('should reset form to initial state', () => {
      const { result } = renderHook(() => useSecureForm(formConfig));

      act(() => {
        result.current.setValue('email', 'test@example.com');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(formConfig.initialValues);
    });
  });

  describe('useAuthSecurity', () => {
    it('should track failed attempts', async () => {
      mockSecurityManager.recordFailedAttempt.mockResolvedValueOnce(false);
      const { result } = renderHook(() => useAuthSecurity());

      await act(async () => {
        const locked = await result.current.recordFailedAttempt();
        expect(locked).toBe(false);
      });

      expect(mockSecurityManager.recordFailedAttempt).toHaveBeenCalled();
    });

    it('should clear failed attempts', async () => {
      const { result } = renderHook(() => useAuthSecurity());

      await act(async () => {
        await result.current.clearFailedAttempts();
      });

      expect(mockSecurityManager.clearFailedAttempts).toHaveBeenCalled();
    });

    it('should update lock time remaining', () => {
      const { result } = renderHook(() => useAuthSecurity());

      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      // Timer should update the lock time remaining
      expect(result.current.lockTimeRemaining).toBeDefined();
    });
  });

  describe('useSessionMonitoring', () => {
    it('should check session status on mount', async () => {
      mockSecurityManager.isSessionExpired.mockResolvedValueOnce(false);
      mockSecurityManager.getSecurityStatus.mockResolvedValueOnce({
        sessionTimeRemaining: 30,
        hasActiveSession: true,
        isAccountLocked: false,
        lastActivity: new Date(),
        deviceId: 'device-123',
      });

      const { result } = renderHook(() => useSessionMonitoring());

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(mockSecurityManager.isSessionExpired).toHaveBeenCalled();
      expect(result.current.isSessionExpired).toBe(false);
    });

    it('should update activity', async () => {
      const { result } = renderHook(() => useSessionMonitoring());

      await act(async () => {
        await result.current.updateActivity();
      });

      expect(mockSecurityManager.updateLastActivity).toHaveBeenCalled();
    });

    it('should monitor app state changes', () => {
      const { result } = renderHook(() => useSessionMonitoring());

      // Simulate app state change
      const mockListener = mockAppState.addEventListener.mock.calls[0][1];
      
      act(() => {
        mockListener('active');
      });

      expect(mockSecurityManager.updateLastActivity).toHaveBeenCalled();
    });
  });

  describe('useSecureRequest', () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should make secure requests with token', async () => {
      const mockToken = 'test-token';
      const mockResponse = { ok: true, json: () => Promise.resolve({}) };
      
      mockSecurityManager.validateUrl.mockReturnValueOnce(true);
      mockSecurityManager.getSecureHeaders.mockReturnValueOnce({
        Authorization: `Bearer ${mockToken}`,
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useSecureRequest());
      
      // Set the token first
      result.current.hasValidToken = true;

      await act(async () => {
        await result.current.makeSecureRequest('https://api.example.com/data');
      });

      expect(mockSecurityManager.validateUrl).toHaveBeenCalledWith('https://api.example.com/data');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      mockSecurityManager.validateUrl.mockReturnValueOnce(true);
      mockSecurityManager.getSecureHeaders.mockReturnValueOnce({});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSecureRequest());

      await act(async () => {
        try {
          await result.current.makeSecureRequest('https://api.example.com/data');
        } catch (error) {
          expect(error).toBeInstanceOf(SecurityError);
          expect(error.type).toBe(SecurityErrorType.NETWORK_ERROR);
        }
      });
    });
  });

  describe('useDataEncryption', () => {
    it('should encrypt data when ready', async () => {
      mockSecurityManager.encryptData.mockResolvedValueOnce('encrypted-data');
      
      const { result } = renderHook(() => useDataEncryption());

      // Wait for ready state
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await act(async () => {
        const encrypted = await result.current.encryptData('sensitive data');
        expect(encrypted).toBe('encrypted-data');
      });

      expect(mockSecurityManager.encryptData).toHaveBeenCalledWith('sensitive data');
    });

    it('should decrypt data when ready', async () => {
      mockSecurityManager.decryptData.mockResolvedValueOnce('decrypted-data');
      
      const { result } = renderHook(() => useDataEncryption());

      // Wait for ready state
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await act(async () => {
        const decrypted = await result.current.decryptData('encrypted-data');
        expect(decrypted).toBe('decrypted-data');
      });

      expect(mockSecurityManager.decryptData).toHaveBeenCalledWith('encrypted-data');
    });

    it('should throw error when not ready', async () => {
      const { result } = renderHook(() => useDataEncryption());

      // Don't wait for ready state
      await act(async () => {
        try {
          await result.current.encryptData('data');
        } catch (error) {
          expect(error).toBeInstanceOf(SecurityError);
          expect(error.type).toBe(SecurityErrorType.ENCRYPTION_ERROR);
        }
      });
    });
  });

  describe('commonValidationRules', () => {
    it('should provide email validation rules', () => {
      expect(commonValidationRules.email).toEqual({
        required: true,
        pattern: expect.any(RegExp),
        maxLength: 254,
      });
    });

    it('should provide password validation rules', () => {
      expect(commonValidationRules.password).toEqual({
        required: true,
        pattern: expect.any(RegExp),
        minLength: 8,
        maxLength: 128,
      });
    });

    it('should provide username validation rules', () => {
      expect(commonValidationRules.username).toEqual({
        required: true,
        pattern: expect.any(RegExp),
        minLength: 3,
        maxLength: 20,
      });
    });
  });
});