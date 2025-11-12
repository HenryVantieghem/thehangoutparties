import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { captureException } from './index';

export interface ErrorHandlingOptions {
  silent?: boolean;
  showAlert?: boolean;
  hapticFeedback?: boolean;
  logToConsole?: boolean;
  context?: string;
  metadata?: Record<string, any>;
  fallbackValue?: any;
  retryable?: boolean;
  onRetry?: () => void;
}

export interface ErrorDetails {
  type: 'network' | 'auth' | 'validation' | 'permission' | 'unknown';
  code?: string | number;
  message: string;
  originalError: Error;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public type: ErrorDetails['type'];
  public code?: string | number;
  public metadata?: Record<string, any>;
  public retryable: boolean;
  public timestamp: Date;

  constructor(
    message: string,
    type: ErrorDetails['type'] = 'unknown',
    code?: string | number,
    metadata?: Record<string, any>,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.metadata = metadata;
    this.retryable = retryable;
    this.timestamp = new Date();
  }
}

export const createAppError = (
  error: unknown,
  context?: string,
  metadata?: Record<string, any>
): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new AppError(
        'Network connection error. Please check your internet connection.',
        'network',
        'NETWORK_ERROR',
        { ...metadata, originalMessage: error.message, context },
        true
      );
    }

    // Auth errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return new AppError(
        'Authentication error. Please sign in again.',
        'auth',
        'AUTH_ERROR',
        { ...metadata, originalMessage: error.message, context },
        false
      );
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new AppError(
        'Invalid input. Please check your data and try again.',
        'validation',
        'VALIDATION_ERROR',
        { ...metadata, originalMessage: error.message, context },
        false
      );
    }

    // Permission errors
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return new AppError(
        'Permission denied. You don\'t have access to this resource.',
        'permission',
        'PERMISSION_ERROR',
        { ...metadata, originalMessage: error.message, context },
        false
      );
    }

    // Generic error
    return new AppError(
      error.message || 'An unexpected error occurred',
      'unknown',
      undefined,
      { ...metadata, originalMessage: error.message, context },
      false
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError(error, 'unknown', undefined, { ...metadata, context }, false);
  }

  // Handle unknown errors
  return new AppError(
    'An unexpected error occurred',
    'unknown',
    undefined,
    { ...metadata, error: String(error), context },
    false
  );
};

export const handleError = async (
  error: unknown,
  options: ErrorHandlingOptions = {}
): Promise<any> => {
  const {
    silent = false,
    showAlert = !silent,
    hapticFeedback = true,
    logToConsole = true,
    context,
    metadata,
    fallbackValue,
    retryable = false,
    onRetry,
  } = options;

  const appError = createAppError(error, context, metadata);

  // Log error if enabled
  if (logToConsole) {
    console.error(`[Error Handler] ${appError.type.toUpperCase()}:`, {
      message: appError.message,
      code: appError.code,
      context: appError.metadata?.context,
      timestamp: appError.timestamp,
      stack: appError.stack,
      metadata: appError.metadata,
    });
  }

  // Capture exception for error tracking
  captureException(appError, {
    type: appError.type,
    code: appError.code,
    context,
    metadata: appError.metadata,
    retryable: appError.retryable || retryable,
  });

  // Haptic feedback
  if (hapticFeedback) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (hapticError) {
      // Silently fail haptic feedback
    }
  }

  // Show user-facing alert
  if (showAlert && !silent) {
    const alertTitle = getErrorTitle(appError.type);
    const alertMessage = getUserFriendlyMessage(appError);
    
    if (appError.retryable || retryable) {
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: onRetry || (() => {}),
            style: 'default',
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }], { cancelable: false });
    }
  }

  // Return fallback value or rethrow
  if (fallbackValue !== undefined) {
    return fallbackValue;
  }

  throw appError;
};

const getErrorTitle = (type: ErrorDetails['type']): string => {
  switch (type) {
    case 'network':
      return 'Connection Error';
    case 'auth':
      return 'Authentication Error';
    case 'validation':
      return 'Invalid Input';
    case 'permission':
      return 'Access Denied';
    default:
      return 'Error';
  }
};

const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.type) {
    case 'network':
      return 'Please check your internet connection and try again.';
    case 'auth':
      return 'Please sign in again to continue.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'permission':
      return 'You don\'t have permission to perform this action.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
};

// Async wrapper with error handling
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options: ErrorHandlingOptions = {}
): T => {
  return (async (...args: Parameters<T>): Promise<any> => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      return await handleError(error, options);
    }
  }) as T;
};

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError: (error: unknown, options?: ErrorHandlingOptions) =>
      handleError(error, options),
    createError: (
      message: string,
      type?: ErrorDetails['type'],
      code?: string | number,
      metadata?: Record<string, any>
    ) => new AppError(message, type, code, metadata),
  };
};

// Common error patterns
export const ErrorPatterns = {
  NETWORK_TIMEOUT: new AppError(
    'Request timed out. Please try again.',
    'network',
    'TIMEOUT',
    {},
    true
  ),
  
  UNAUTHORIZED: new AppError(
    'Your session has expired. Please sign in again.',
    'auth',
    'UNAUTHORIZED',
    {},
    false
  ),
  
  FORBIDDEN: new AppError(
    'You don\'t have permission to access this resource.',
    'permission',
    'FORBIDDEN',
    {},
    false
  ),
  
  NOT_FOUND: new AppError(
    'The requested resource was not found.',
    'unknown',
    'NOT_FOUND',
    {},
    false
  ),
  
  VALIDATION_FAILED: new AppError(
    'Please check your input and try again.',
    'validation',
    'VALIDATION_FAILED',
    {},
    false
  ),
  
  SERVER_ERROR: new AppError(
    'Server error. Please try again later.',
    'unknown',
    'SERVER_ERROR',
    {},
    true
  ),
};

// Error boundary helpers
export const isCriticalError = (error: Error | AppError): boolean => {
  if (error instanceof AppError) {
    return error.type === 'auth' || error.type === 'permission';
  }
  
  const criticalPatterns = [
    /ChunkLoadError/i,
    /Loading chunk \d+ failed/i,
    /Loading CSS chunk/i,
    /Network Error/i,
    /Authentication/i,
    /Permission denied/i,
  ];
  
  return criticalPatterns.some(pattern => pattern.test(error.message));
};

export const shouldAutoRetry = (error: Error | AppError): boolean => {
  if (error instanceof AppError) {
    return error.retryable;
  }
  
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /fetch/i,
    /connection/i,
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
};

// Performance monitoring helpers
export const measureErrorRate = (() => {
  const errorCounts = new Map<string, number>();
  const windowStart = Date.now();
  const windowDuration = 5 * 60 * 1000; // 5 minutes

  return (error: AppError): number => {
    const now = Date.now();
    const key = `${error.type}_${error.code || 'unknown'}`;
    
    // Reset window if needed
    if (now - windowStart > windowDuration) {
      errorCounts.clear();
    }
    
    const current = errorCounts.get(key) || 0;
    errorCounts.set(key, current + 1);
    
    return errorCounts.get(key) || 0;
  };
})();