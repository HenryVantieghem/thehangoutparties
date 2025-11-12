import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Security configuration
export interface SecurityConfig {
  tokenExpiryBuffer: number; // Minutes before token expiry to refresh
  maxFailedAttempts: number;
  lockoutDuration: number; // Minutes
  sessionTimeout: number; // Minutes
  enableBiometric: boolean;
  requireHttps: boolean;
  enableCertificatePinning: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  tokenExpiryBuffer: 5,
  maxFailedAttempts: 5,
  lockoutDuration: 15,
  sessionTimeout: 30,
  enableBiometric: true,
  requireHttps: true,
  enableCertificatePinning: true,
};

// Security keys for secure storage
export enum SecureKeys {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_ID = 'user_id',
  BIOMETRIC_KEY = 'biometric_key',
  DEVICE_ID = 'device_id',
  ENCRYPTION_KEY = 'encryption_key',
  SESSION_DATA = 'session_data',
  FAILED_ATTEMPTS = 'failed_attempts',
  LAST_ACTIVITY = 'last_activity',
}

// Input validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  phoneNumber: /^\+?[\d\s-()]{10,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  safeString: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
};

// Security error types
export enum SecurityErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  TOKEN_ERROR = 'token_error',
  NETWORK_ERROR = 'network_error',
  ENCRYPTION_ERROR = 'encryption_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  ACCOUNT_LOCKED = 'account_locked',
  SESSION_EXPIRED = 'session_expired',
}

export class SecurityError extends Error {
  constructor(
    public type: SecurityErrorType,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private deviceId: string | null = null;
  private encryptionKey: string | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;

  private constructor(config: SecurityConfig = DEFAULT_SECURITY_CONFIG) {
    this.config = config;
    this.initializeDevice();
    this.startSessionMonitoring();
  }

  public static getInstance(config?: SecurityConfig): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager(config);
    }
    return SecurityManager.instance;
  }

  // Device initialization
  private async initializeDevice(): Promise<void> {
    try {
      // Get or create device ID
      this.deviceId = await this.getSecureValue(SecureKeys.DEVICE_ID);
      if (!this.deviceId) {
        this.deviceId = await this.generateDeviceId();
        await this.storeSecureValue(SecureKeys.DEVICE_ID, this.deviceId);
      }

      // Get or create encryption key
      this.encryptionKey = await this.getSecureValue(SecureKeys.ENCRYPTION_KEY);
      if (!this.encryptionKey) {
        this.encryptionKey = await this.generateEncryptionKey();
        await this.storeSecureValue(SecureKeys.ENCRYPTION_KEY, this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize device security:', error);
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_ERROR,
        'Failed to initialize device security'
      );
    }
  }

  // Secure storage operations
  public async storeSecureValue(key: SecureKeys, value: string): Promise<void> {
    try {
      const options = {
        requireAuthentication: key === SecureKeys.BIOMETRIC_KEY,
        authenticationPrompt: 'Authenticate to access secure data',
      };

      await SecureStore.setItemAsync(key, value, options);
    } catch (error) {
      console.error(`Failed to store secure value for key ${key}:`, error);
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_ERROR,
        'Failed to store secure data'
      );
    }
  }

  public async getSecureValue(key: SecureKeys): Promise<string | null> {
    try {
      const options = {
        requireAuthentication: key === SecureKeys.BIOMETRIC_KEY,
        authenticationPrompt: 'Authenticate to access secure data',
      };

      return await SecureStore.getItemAsync(key, options);
    } catch (error) {
      console.error(`Failed to get secure value for key ${key}:`, error);
      return null;
    }
  }

  public async deleteSecureValue(key: SecureKeys): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to delete secure value for key ${key}:`, error);
    }
  }

  // Token management
  public async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.storeSecureValue(SecureKeys.ACCESS_TOKEN, accessToken);
    await this.storeSecureValue(SecureKeys.REFRESH_TOKEN, refreshToken);
    await this.updateLastActivity();
  }

  public async getAccessToken(): Promise<string | null> {
    const token = await this.getSecureValue(SecureKeys.ACCESS_TOKEN);
    
    if (token && await this.isTokenExpired(token)) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      return refreshed ? await this.getSecureValue(SecureKeys.ACCESS_TOKEN) : null;
    }
    
    return token;
  }

  public async getRefreshToken(): Promise<string | null> {
    return await this.getSecureValue(SecureKeys.REFRESH_TOKEN);
  }

  public async clearTokens(): Promise<void> {
    await this.deleteSecureValue(SecureKeys.ACCESS_TOKEN);
    await this.deleteSecureValue(SecureKeys.REFRESH_TOKEN);
    await this.deleteSecureValue(SecureKeys.USER_ID);
    await this.deleteSecureValue(SecureKeys.SESSION_DATA);
  }

  // Token validation
  public async isTokenExpired(token: string): Promise<boolean> {
    try {
      const payload = this.parseJWTPayload(token);
      if (!payload.exp) return true;

      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const bufferTime = this.config.tokenExpiryBuffer * 60 * 1000;
      const now = Date.now();

      return (expiryTime - bufferTime) <= now;
    } catch {
      return true;
    }
  }

  private parseJWTPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      throw new SecurityError(SecurityErrorType.TOKEN_ERROR, 'Invalid token format');
    }
  }

  // Input validation and sanitization
  public validateInput(input: string, pattern: RegExp, fieldName: string): boolean {
    if (!input || typeof input !== 'string') {
      throw new SecurityError(
        SecurityErrorType.VALIDATION_ERROR,
        `${fieldName} is required and must be a string`
      );
    }

    if (!pattern.test(input)) {
      throw new SecurityError(
        SecurityErrorType.VALIDATION_ERROR,
        `${fieldName} format is invalid`
      );
    }

    return true;
  }

  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  public validateEmail(email: string): boolean {
    return this.validateInput(email, ValidationPatterns.email, 'Email');
  }

  public validatePassword(password: string): boolean {
    return this.validateInput(password, ValidationPatterns.password, 'Password');
  }

  public validateUsername(username: string): boolean {
    return this.validateInput(username, ValidationPatterns.username, 'Username');
  }

  // Data encryption
  public async encryptData(data: string): Promise<string> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      // Create a simple encryption using base64 and key rotation
      // In production, use proper encryption libraries
      const encoded = btoa(data);
      const keyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey
      );
      
      // Simple XOR-like operation with key
      let encrypted = '';
      for (let i = 0; i < encoded.length; i++) {
        const charCode = encoded.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length);
        encrypted += String.fromCharCode(charCode);
      }
      
      return btoa(encrypted);
    } catch (error) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_ERROR,
        'Failed to encrypt data'
      );
    }
  }

  public async decryptData(encryptedData: string): Promise<string> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const keyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey
      );

      // Reverse the encryption process
      const encrypted = atob(encryptedData);
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return atob(decrypted);
    } catch (error) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_ERROR,
        'Failed to decrypt data'
      );
    }
  }

  // Rate limiting and account security
  public async recordFailedAttempt(): Promise<boolean> {
    try {
      const attemptsStr = await this.getSecureValue(SecureKeys.FAILED_ATTEMPTS);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
      const newAttempts = attempts + 1;

      await this.storeSecureValue(SecureKeys.FAILED_ATTEMPTS, newAttempts.toString());

      if (newAttempts >= this.config.maxFailedAttempts) {
        await this.lockAccount();
        return true; // Account is now locked
      }

      return false; // Account not locked yet
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
      return false;
    }
  }

  public async clearFailedAttempts(): Promise<void> {
    await this.deleteSecureValue(SecureKeys.FAILED_ATTEMPTS);
  }

  public async isAccountLocked(): Promise<boolean> {
    try {
      const lockTimeStr = await this.getSecureValue(SecureKeys.FAILED_ATTEMPTS);
      if (!lockTimeStr) return false;

      const attempts = parseInt(lockTimeStr, 10);
      if (attempts < this.config.maxFailedAttempts) return false;

      // Check if lockout duration has passed
      const lastActivityStr = await this.getSecureValue(SecureKeys.LAST_ACTIVITY);
      if (!lastActivityStr) return true;

      const lastActivity = parseInt(lastActivityStr, 10);
      const lockoutDuration = this.config.lockoutDuration * 60 * 1000;
      const now = Date.now();

      if (now - lastActivity > lockoutDuration) {
        // Lockout period has passed, clear failed attempts
        await this.clearFailedAttempts();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check account lock status:', error);
      return false;
    }
  }

  private async lockAccount(): Promise<void> {
    // Account is locked by having max failed attempts
    // Lockout duration is checked in isAccountLocked()
    await this.updateLastActivity();
  }

  // Session management
  public async updateLastActivity(): Promise<void> {
    await this.storeSecureValue(SecureKeys.LAST_ACTIVITY, Date.now().toString());
  }

  public async isSessionExpired(): Promise<boolean> {
    try {
      const lastActivityStr = await this.getSecureValue(SecureKeys.LAST_ACTIVITY);
      if (!lastActivityStr) return true;

      const lastActivity = parseInt(lastActivityStr, 10);
      const sessionTimeout = this.config.sessionTimeout * 60 * 1000;
      const now = Date.now();

      return (now - lastActivity) > sessionTimeout;
    } catch {
      return true;
    }
  }

  private startSessionMonitoring(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }

    // Check session every minute
    this.sessionTimer = setInterval(async () => {
      if (await this.isSessionExpired()) {
        await this.handleSessionExpiry();
      }
    }, 60000);
  }

  private async handleSessionExpiry(): Promise<void> {
    await this.clearTokens();
    // Emit session expiry event or navigate to login
    // This would be handled by the auth store
  }

  // URL and network security
  public validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      throw new SecurityError(SecurityErrorType.VALIDATION_ERROR, 'URL is required');
    }

    if (this.config.requireHttps && !url.startsWith('https://')) {
      throw new SecurityError(
        SecurityErrorType.NETWORK_ERROR,
        'HTTPS is required for all network requests'
      );
    }

    return this.validateInput(url, ValidationPatterns.url, 'URL');
  }

  public getSecureHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Device-ID': this.deviceId || '',
      'X-Platform': Platform.OS,
      'X-App-Version': '1.0.0', // This would come from app config
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Utility methods
  private async generateDeviceId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async generateEncryptionKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;

      // This would make an API call to refresh the token
      // For now, return false to indicate refresh failed
      return false;
    } catch {
      return false;
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  // Configuration
  public updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Security status
  public async getSecurityStatus(): Promise<{
    hasActiveSession: boolean;
    isAccountLocked: boolean;
    sessionTimeRemaining: number; // minutes
    lastActivity: Date | null;
    deviceId: string | null;
  }> {
    const hasActiveSession = !!(await this.getAccessToken());
    const isAccountLocked = await this.isAccountLocked();
    const lastActivityStr = await this.getSecureValue(SecureKeys.LAST_ACTIVITY);
    const lastActivity = lastActivityStr ? new Date(parseInt(lastActivityStr, 10)) : null;
    
    let sessionTimeRemaining = 0;
    if (hasActiveSession && lastActivity) {
      const elapsed = Date.now() - lastActivity.getTime();
      const timeout = this.config.sessionTimeout * 60 * 1000;
      sessionTimeRemaining = Math.max(0, Math.floor((timeout - elapsed) / 60000));
    }

    return {
      hasActiveSession,
      isAccountLocked,
      sessionTimeRemaining,
      lastActivity,
      deviceId: this.deviceId,
    };
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();