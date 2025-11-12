import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { securityManager, SecurityError, SecurityErrorType, ValidationPatterns } from '../security/SecurityManager';

// Security status hook
export function useSecurityStatus() {
  const [status, setStatus] = useState({
    hasActiveSession: false,
    isAccountLocked: false,
    sessionTimeRemaining: 0,
    lastActivity: null as Date | null,
    deviceId: null as string | null,
  });
  
  const [loading, setLoading] = useState(true);
  
  const checkStatus = useCallback(async () => {
    try {
      const securityStatus = await securityManager.getSecurityStatus();
      setStatus(securityStatus);
    } catch (error) {
      console.error('Failed to check security status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    
    // Check status every minute
    const interval = setInterval(checkStatus, 60000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    ...status,
    loading,
    refresh: checkStatus,
  };
}

// Secure token hook
export function useSecureToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SecurityError | null>(null);

  const getToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = await securityManager.getAccessToken();
      setToken(accessToken);
      
      return accessToken;
    } catch (err) {
      const secError = err instanceof SecurityError ? err : new SecurityError(
        SecurityErrorType.TOKEN_ERROR,
        'Failed to get access token'
      );
      setError(secError);
      setToken(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const storeTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      await securityManager.storeTokens(accessToken, refreshToken);
      setToken(accessToken);
      setError(null);
    } catch (err) {
      const secError = err instanceof SecurityError ? err : new SecurityError(
        SecurityErrorType.TOKEN_ERROR,
        'Failed to store tokens'
      );
      setError(secError);
    }
  }, []);

  const clearTokens = useCallback(async () => {
    try {
      await securityManager.clearTokens();
      setToken(null);
      setError(null);
    } catch (err) {
      console.error('Failed to clear tokens:', err);
    }
  }, []);

  useEffect(() => {
    getToken();
  }, [getToken]);

  return {
    token,
    loading,
    error,
    getToken,
    storeTokens,
    clearTokens,
    hasValidToken: !!token && !loading && !error,
  };
}

// Input validation hook
export interface ValidationRule {
  pattern?: RegExp;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  custom?: (value: string) => boolean | string;
}

export interface ValidationConfig {
  [fieldName: string]: ValidationRule;
}

export function useInputValidation(config: ValidationConfig) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const rule = config[fieldName];
    if (!rule) return null;

    try {
      // Check required
      if (rule.required && (!value || value.trim() === '')) {
        return `${fieldName} is required`;
      }

      // Skip other validations if field is empty and not required
      if (!value && !rule.required) return null;

      // Sanitize input
      const sanitized = securityManager.sanitizeInput(value);
      if (sanitized !== value) {
        return `${fieldName} contains invalid characters`;
      }

      // Check length
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} must be no more than ${rule.maxLength} characters`;
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${fieldName} format is invalid`;
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (typeof customResult === 'string') {
          return customResult;
        }
        if (customResult === false) {
          return `${fieldName} is invalid`;
        }
      }

      return null;
    } catch (error) {
      if (error instanceof SecurityError) {
        return error.message;
      }
      return `${fieldName} validation failed`;
    }
  }, [config]);

  const validate = useCallback((values: Record<string, string>) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(config).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName] || '');
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [config, validateField]);

  const validateSingleField = useCallback((fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || '',
    }));

    return !error;
  }, [validateField]);

  const setFieldTouched = useCallback((fieldName: string, isTouched: boolean = true) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: isTouched,
    }));
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return touched[fieldName] ? errors[fieldName] : '';
  }, [errors, touched]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    validate,
    validateField: validateSingleField,
    setFieldTouched,
    getFieldError,
    clearErrors,
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
  };
}

// Secure form hook
export interface SecureFormConfig {
  validation: ValidationConfig;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  initialValues?: Record<string, string>;
}

export function useSecureForm(config: SecureFormConfig) {
  const [values, setValues] = useState(config.initialValues || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SecurityError | null>(null);
  
  const validation = useInputValidation(config.validation);

  const setValue = useCallback((fieldName: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    validation.validateField(fieldName, value);
  }, [validation]);

  const handleBlur = useCallback((fieldName: string) => {
    validation.setFieldTouched(fieldName, true);
  }, [validation]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Mark all fields as touched
      Object.keys(config.validation).forEach(fieldName => {
        validation.setFieldTouched(fieldName, true);
      });

      // Validate all fields
      const isValid = validation.validate(values);
      
      if (!isValid) {
        throw new SecurityError(
          SecurityErrorType.VALIDATION_ERROR,
          'Please fix validation errors before submitting'
        );
      }

      await config.onSubmit(values);
    } catch (error) {
      const secError = error instanceof SecurityError ? error : new SecurityError(
        SecurityErrorType.VALIDATION_ERROR,
        'Form submission failed'
      );
      setSubmitError(secError);
      throw secError;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validation, config]);

  const reset = useCallback(() => {
    setValues(config.initialValues || {});
    validation.clearErrors();
    setSubmitError(null);
  }, [config.initialValues, validation]);

  return {
    values,
    setValue,
    handleBlur,
    handleSubmit,
    reset,
    isSubmitting,
    submitError,
    isValid: validation.isValid,
    getFieldError: validation.getFieldError,
  };
}

// Authentication security hook
export function useAuthSecurity() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  const checkLockStatus = useCallback(async () => {
    try {
      const locked = await securityManager.isAccountLocked();
      setIsLocked(locked);
      
      if (locked) {
        const status = await securityManager.getSecurityStatus();
        // Calculate time remaining based on last activity
        // This is a simplified calculation
        setLockTimeRemaining(15); // Assuming 15 minutes lockout
      } else {
        setLockTimeRemaining(0);
      }
    } catch (error) {
      console.error('Failed to check lock status:', error);
    }
  }, []);

  const recordFailedAttempt = useCallback(async () => {
    try {
      const locked = await securityManager.recordFailedAttempt();
      setFailedAttempts(prev => prev + 1);
      
      if (locked) {
        setIsLocked(true);
        await checkLockStatus();
      }
      
      return locked;
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
      return false;
    }
  }, [checkLockStatus]);

  const clearFailedAttempts = useCallback(async () => {
    try {
      await securityManager.clearFailedAttempts();
      setFailedAttempts(0);
      setIsLocked(false);
      setLockTimeRemaining(0);
    } catch (error) {
      console.error('Failed to clear failed attempts:', error);
    }
  }, []);

  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  // Update lock time remaining
  useEffect(() => {
    if (lockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [lockTimeRemaining]);

  return {
    failedAttempts,
    isLocked,
    lockTimeRemaining,
    recordFailedAttempt,
    clearFailedAttempts,
    checkLockStatus,
  };
}

// Session monitoring hook
export function useSessionMonitoring() {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const lastActivityRef = useRef(Date.now());

  const updateActivity = useCallback(async () => {
    lastActivityRef.current = Date.now();
    await securityManager.updateLastActivity();
    setIsSessionExpired(false);
  }, []);

  const checkSessionStatus = useCallback(async () => {
    try {
      const expired = await securityManager.isSessionExpired();
      setIsSessionExpired(expired);
      
      if (!expired) {
        const status = await securityManager.getSecurityStatus();
        setTimeRemaining(status.sessionTimeRemaining);
      }
    } catch (error) {
      console.error('Failed to check session status:', error);
    }
  }, []);

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateActivity();
        checkSessionStatus();
      } else if (nextAppState === 'background') {
        // App going to background, check session on return
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [updateActivity, checkSessionStatus]);

  // Check session status periodically
  useEffect(() => {
    checkSessionStatus();
    
    const interval = setInterval(checkSessionStatus, 60000); // Every minute
    return () => clearInterval(interval);
  }, [checkSessionStatus]);

  return {
    isSessionExpired,
    timeRemaining,
    updateActivity,
    checkSessionStatus,
  };
}

// Network security hook
export function useSecureRequest() {
  const { token } = useSecureToken();

  const makeSecureRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    try {
      // Validate URL
      securityManager.validateUrl(url);

      // Get secure headers
      const secureHeaders = securityManager.getSecureHeaders(token || undefined);

      // Merge headers
      const headers = {
        ...secureHeaders,
        ...options.headers,
      };

      // Make request with security headers
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new SecurityError(
          SecurityErrorType.NETWORK_ERROR,
          `Request failed with status ${response.status}`,
          response.status.toString()
        );
      }

      return response;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      throw new SecurityError(
        SecurityErrorType.NETWORK_ERROR,
        'Network request failed',
        'NETWORK_ERROR',
        error
      );
    }
  }, [token]);

  return {
    makeSecureRequest,
    hasValidToken: !!token,
  };
}

// Data encryption hook
export function useDataEncryption() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Security manager initialization
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const encryptData = useCallback(async (data: string): Promise<string> => {
    if (!isReady) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_ERROR,
        'Encryption service not ready'
      );
    }
    
    return await securityManager.encryptData(data);
  }, [isReady]);

  const decryptData = useCallback(async (encryptedData: string): Promise<string> => {
    if (!isReady) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_ERROR,
        'Encryption service not ready'
      );
    }
    
    return await securityManager.decryptData(encryptedData);
  }, [isReady]);

  return {
    encryptData,
    decryptData,
    isReady,
  };
}

// Common validation rules
export const commonValidationRules = {
  email: {
    required: true,
    pattern: ValidationPatterns.email,
    maxLength: 254,
  },
  password: {
    required: true,
    pattern: ValidationPatterns.password,
    minLength: 8,
    maxLength: 128,
  },
  username: {
    required: true,
    pattern: ValidationPatterns.username,
    minLength: 3,
    maxLength: 20,
  },
  displayName: {
    required: true,
    pattern: ValidationPatterns.safeString,
    minLength: 1,
    maxLength: 50,
  },
  bio: {
    required: false,
    pattern: ValidationPatterns.safeString,
    maxLength: 500,
  },
  partyTitle: {
    required: true,
    pattern: ValidationPatterns.safeString,
    minLength: 1,
    maxLength: 100,
  },
  partyDescription: {
    required: false,
    pattern: ValidationPatterns.safeString,
    maxLength: 500,
  },
  messageContent: {
    required: true,
    pattern: ValidationPatterns.safeString,
    minLength: 1,
    maxLength: 300,
  },
};