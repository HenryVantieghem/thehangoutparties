/**
 * SecurityManager Tests
 * 
 * Comprehensive tests for the SecurityManager class covering:
 * - Token management
 * - Input validation and sanitization
 * - Data encryption/decryption
 * - Session management
 * - Rate limiting and account lockout
 * - Security configuration
 */

import { SecurityManager, SecurityError, SecurityErrorType, SecureKeys } from '../SecurityManager';
import { mockSecureStore, mockCrypto } from '../../__tests__/mocks';

// Mock the dependencies
jest.mock('expo-secure-store', () => mockSecureStore);
jest.mock('expo-crypto', () => mockCrypto);
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('SecurityManager', () => {
  let securityManager: SecurityManager;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance for testing
    (SecurityManager as any).instance = null;
    securityManager = SecurityManager.getInstance();
  });

  afterEach(() => {
    securityManager.destroy();
    jest.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = SecurityManager.getInstance();
      const instance2 = SecurityManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should use provided config on first instantiation', () => {
      (SecurityManager as any).instance = null;
      const customConfig = {
        tokenExpiryBuffer: 10,
        maxFailedAttempts: 3,
      };
      
      const instance = SecurityManager.getInstance(customConfig);
      const config = instance.getConfig();
      
      expect(config.tokenExpiryBuffer).toBe(10);
      expect(config.maxFailedAttempts).toBe(3);
    });
  });

  describe('Secure Storage Operations', () => {
    it('should store secure values correctly', async () => {
      const key = SecureKeys.ACCESS_TOKEN;
      const value = 'test-token';

      await securityManager.storeSecureValue(key, value);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        key,
        value,
        {
          requireAuthentication: false,
          authenticationPrompt: 'Authenticate to access secure data',
        }
      );
    });

    it('should retrieve secure values correctly', async () => {
      const key = SecureKeys.ACCESS_TOKEN;
      const expectedValue = 'test-token';
      mockSecureStore.getItemAsync.mockResolvedValueOnce(expectedValue);

      const result = await securityManager.getSecureValue(key);

      expect(result).toBe(expectedValue);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        key,
        {
          requireAuthentication: false,
          authenticationPrompt: 'Authenticate to access secure data',
        }
      );
    });

    it('should require authentication for biometric key', async () => {
      const key = SecureKeys.BIOMETRIC_KEY;
      const value = 'biometric-data';

      await securityManager.storeSecureValue(key, value);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        key,
        value,
        {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access secure data',
        }
      );
    });

    it('should handle storage errors gracefully', async () => {
      const key = SecureKeys.ACCESS_TOKEN;
      const value = 'test-token';
      const storageError = new Error('Storage failed');
      mockSecureStore.setItemAsync.mockRejectedValueOnce(storageError);

      await expect(securityManager.storeSecureValue(key, value))
        .rejects.toThrow(SecurityError);
    });
  });

  describe('Token Management', () => {
    it('should store tokens and update activity', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      await securityManager.storeTokens(accessToken, refreshToken);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SecureKeys.ACCESS_TOKEN,
        accessToken,
        expect.any(Object)
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SecureKeys.REFRESH_TOKEN,
        refreshToken,
        expect.any(Object)
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SecureKeys.LAST_ACTIVITY,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should retrieve access token when not expired', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lkd0CWXeVRDExm1qS5_2TjZhL2XAap7H1X7G6dNPKm8';
      mockSecureStore.getItemAsync.mockResolvedValueOnce(validToken);

      const result = await securityManager.getAccessToken();

      expect(result).toBe(validToken);
    });

    it('should return null for expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4KHmjlHBBjj7GkWYwvCyTNNMYOHB2MaXGP6SyERfMD4';
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(expiredToken)  // First call for getAccessToken
        .mockResolvedValueOnce(null);         // Second call for refresh token

      const result = await securityManager.getAccessToken();

      expect(result).toBeNull();
    });

    it('should clear all tokens', async () => {
      await securityManager.clearTokens();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(SecureKeys.ACCESS_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(SecureKeys.REFRESH_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(SecureKeys.USER_ID);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(SecureKeys.SESSION_DATA);
    });

    it('should validate JWT token expiry correctly', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7ZnV0dXJlVGltZX19.signature`;
      
      // Mock the token with future expiry
      const payload = { exp: futureTime };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      const isExpired = await securityManager.isTokenExpired(mockToken);

      expect(isExpired).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate email addresses correctly', () => {
      expect(() => securityManager.validateEmail('test@example.com')).not.toThrow();
      expect(() => securityManager.validateEmail('invalid-email')).toThrow(SecurityError);
      expect(() => securityManager.validateEmail('')).toThrow(SecurityError);
    });

    it('should validate passwords correctly', () => {
      const validPassword = 'Test123!@#';
      const invalidPassword = 'weak';

      expect(() => securityManager.validatePassword(validPassword)).not.toThrow();
      expect(() => securityManager.validatePassword(invalidPassword)).toThrow(SecurityError);
    });

    it('should validate usernames correctly', () => {
      const validUsername = 'testuser123';
      const invalidUsername = 'test@user';

      expect(() => securityManager.validateUsername(validUsername)).not.toThrow();
      expect(() => securityManager.validateUsername(invalidUsername)).toThrow(SecurityError);
    });

    it('should sanitize input correctly', () => {
      const maliciousInput = '<script>alert("XSS")</script>javascript:void(0)onload=alert("XSS")';
      const sanitized = securityManager.sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onload=');
    });

    it('should limit input length during sanitization', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = securityManager.sanitizeInput(longInput);

      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Data Encryption', () => {
    beforeEach(() => {
      // Mock crypto hash
      mockCrypto.digestStringAsync.mockResolvedValue('mock-hash-key');
    });

    it('should encrypt data successfully', async () => {
      const testData = 'sensitive information';

      const encrypted = await securityManager.encryptData(testData);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testData);
      expect(mockCrypto.digestStringAsync).toHaveBeenCalled();
    });

    it('should decrypt data successfully', async () => {
      const testData = 'sensitive information';

      // First encrypt the data
      const encrypted = await securityManager.encryptData(testData);
      
      // Then decrypt it
      const decrypted = await securityManager.decryptData(encrypted);

      expect(decrypted).toBe(testData);
    });

    it('should handle encryption errors', async () => {
      mockCrypto.digestStringAsync.mockRejectedValueOnce(new Error('Crypto failed'));

      await expect(securityManager.encryptData('test data'))
        .rejects.toThrow(SecurityError);
    });
  });

  describe('Rate Limiting and Account Lockout', () => {
    beforeEach(() => {
      // Mock current time for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
    });

    it('should record failed attempts', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce('2'); // Current attempts

      const locked = await securityManager.recordFailedAttempt();

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SecureKeys.FAILED_ATTEMPTS,
        '3',
        expect.any(Object)
      );
      expect(locked).toBe(false);
    });

    it('should lock account after max failed attempts', async () => {
      const config = securityManager.getConfig();
      const maxAttempts = config.maxFailedAttempts;
      
      mockSecureStore.getItemAsync.mockResolvedValueOnce((maxAttempts - 1).toString());

      const locked = await securityManager.recordFailedAttempt();

      expect(locked).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SecureKeys.LAST_ACTIVITY,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should clear failed attempts', async () => {
      await securityManager.clearFailedAttempts();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(SecureKeys.FAILED_ATTEMPTS);
    });

    it('should check if account is locked', async () => {
      const config = securityManager.getConfig();
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(config.maxFailedAttempts.toString()) // Failed attempts
        .mockResolvedValueOnce(Date.now().toString());              // Last activity

      const isLocked = await securityManager.isAccountLocked();

      expect(isLocked).toBe(true);
    });

    it('should unlock account after lockout period', async () => {
      const config = securityManager.getConfig();
      const pastTime = Date.now() - (config.lockoutDuration * 60 * 1000 + 1000);
      
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(config.maxFailedAttempts.toString()) // Failed attempts
        .mockResolvedValueOnce(pastTime.toString());                // Past last activity

      const isLocked = await securityManager.isAccountLocked();

      expect(isLocked).toBe(false);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(SecureKeys.FAILED_ATTEMPTS);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
    });

    it('should update last activity', async () => {
      await securityManager.updateLastActivity();

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SecureKeys.LAST_ACTIVITY,
        '1000000000000',
        expect.any(Object)
      );
    });

    it('should check if session is expired', async () => {
      const config = securityManager.getConfig();
      const pastTime = Date.now() - (config.sessionTimeout * 60 * 1000 + 1000);
      
      mockSecureStore.getItemAsync.mockResolvedValueOnce(pastTime.toString());

      const isExpired = await securityManager.isSessionExpired();

      expect(isExpired).toBe(true);
    });

    it('should return true for expired session when no activity recorded', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const isExpired = await securityManager.isSessionExpired();

      expect(isExpired).toBe(true);
    });
  });

  describe('Network Security', () => {
    it('should validate HTTPS URLs when required', () => {
      securityManager.updateConfig({ requireHttps: true });
      
      expect(() => securityManager.validateUrl('https://example.com')).not.toThrow();
      expect(() => securityManager.validateUrl('http://example.com')).toThrow(SecurityError);
    });

    it('should allow HTTP URLs when not required', () => {
      securityManager.updateConfig({ requireHttps: false });
      
      expect(() => securityManager.validateUrl('http://example.com')).not.toThrow();
    });

    it('should generate secure headers', () => {
      const token = 'test-token';
      const headers = securityManager.getSecureHeaders(token);

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Device-ID': expect.any(String),
        'X-Platform': 'ios',
        'X-App-Version': '1.0.0',
        'Authorization': `Bearer ${token}`,
      });
    });

    it('should generate headers without authorization when no token provided', () => {
      const headers = securityManager.getSecureHeaders();

      expect(headers).not.toHaveProperty('Authorization');
      expect(headers).toHaveProperty('X-Device-ID');
    });
  });

  describe('Security Status', () => {
    it('should return comprehensive security status', async () => {
      const mockTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockTime);
      
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('valid-token')    // Access token
        .mockResolvedValueOnce('0')              // Failed attempts (not locked)
        .mockResolvedValueOnce(mockTime.toString()); // Last activity

      const status = await securityManager.getSecurityStatus();

      expect(status).toEqual({
        hasActiveSession: true,
        isAccountLocked: false,
        sessionTimeRemaining: expect.any(Number),
        lastActivity: new Date(mockTime),
        deviceId: expect.any(String),
      });
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxFailedAttempts: 10,
        sessionTimeout: 60,
      };

      securityManager.updateConfig(newConfig);
      const config = securityManager.getConfig();

      expect(config.maxFailedAttempts).toBe(10);
      expect(config.sessionTimeout).toBe(60);
    });

    it('should return configuration copy', () => {
      const config1 = securityManager.getConfig();
      const config2 = securityManager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Should be different objects
    });
  });

  describe('Error Handling', () => {
    it('should handle secure store errors gracefully', async () => {
      mockSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Store error'));

      const result = await securityManager.getSecureValue(SecureKeys.ACCESS_TOKEN);

      expect(result).toBeNull();
    });

    it('should handle invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      await expect(securityManager.isTokenExpired(invalidToken))
        .resolves.toBe(true);
    });

    it('should handle missing token parts', async () => {
      const incompleteToken = 'header.payload'; // Missing signature

      await expect(securityManager.isTokenExpired(incompleteToken))
        .resolves.toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clear session timer on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      securityManager.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});