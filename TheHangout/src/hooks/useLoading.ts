import { useState, useCallback, useRef, useEffect } from 'react';
import { create } from 'zustand';

// Global loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingOperation {
  id: string;
  description: string;
  type: 'api' | 'navigation' | 'data' | 'upload' | 'download' | 'processing';
  progress?: number; // 0-100
  startTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cancelable?: boolean;
  onCancel?: () => void;
}

export interface LoadingError {
  message: string;
  code?: string;
  type: 'network' | 'validation' | 'auth' | 'server' | 'unknown';
  retry?: () => void;
  details?: any;
}

// Global loading store
interface GlobalLoadingState {
  operations: Map<string, LoadingOperation>;
  errors: Map<string, LoadingError>;
  globalState: LoadingState;
  isAnyLoading: boolean;
  criticalLoading: boolean;
}

interface GlobalLoadingActions {
  startOperation: (operation: Omit<LoadingOperation, 'id' | 'startTime'>) => string;
  updateOperation: (id: string, updates: Partial<LoadingOperation>) => void;
  completeOperation: (id: string) => void;
  failOperation: (id: string, error: LoadingError) => void;
  cancelOperation: (id: string) => void;
  clearOperation: (id: string) => void;
  clearAllOperations: () => void;
  clearErrors: () => void;
  setGlobalState: (state: LoadingState) => void;
}

export const useGlobalLoadingStore = create<GlobalLoadingState & GlobalLoadingActions>()((set, get) => ({
  // State
  operations: new Map(),
  errors: new Map(),
  globalState: 'idle',
  isAnyLoading: false,
  criticalLoading: false,

  // Actions
  startOperation: (operationData) => {
    const id = `${operationData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: LoadingOperation = {
      ...operationData,
      id,
      startTime: Date.now(),
    };

    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.set(id, operation);
      
      const isAnyLoading = newOperations.size > 0;
      const criticalLoading = Array.from(newOperations.values()).some(op => op.priority === 'critical');
      
      return {
        operations: newOperations,
        isAnyLoading,
        criticalLoading,
        globalState: isAnyLoading ? 'loading' : 'idle',
      };
    });

    return id;
  },

  updateOperation: (id, updates) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(id);
      
      if (existing) {
        newOperations.set(id, { ...existing, ...updates });
      }
      
      return { operations: newOperations };
    });
  },

  completeOperation: (id) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      const newErrors = new Map(state.errors);
      
      newOperations.delete(id);
      newErrors.delete(id);
      
      const isAnyLoading = newOperations.size > 0;
      const criticalLoading = Array.from(newOperations.values()).some(op => op.priority === 'critical');
      
      return {
        operations: newOperations,
        errors: newErrors,
        isAnyLoading,
        criticalLoading,
        globalState: isAnyLoading ? 'loading' : 'success',
      };
    });
  },

  failOperation: (id, error) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      const newErrors = new Map(state.errors);
      
      newOperations.delete(id);
      newErrors.set(id, error);
      
      const isAnyLoading = newOperations.size > 0;
      const criticalLoading = Array.from(newOperations.values()).some(op => op.priority === 'critical');
      
      return {
        operations: newOperations,
        errors: newErrors,
        isAnyLoading,
        criticalLoading,
        globalState: 'error',
      };
    });
  },

  cancelOperation: (id) => {
    const operation = get().operations.get(id);
    if (operation?.onCancel) {
      operation.onCancel();
    }
    
    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.delete(id);
      
      const isAnyLoading = newOperations.size > 0;
      const criticalLoading = Array.from(newOperations.values()).some(op => op.priority === 'critical');
      
      return {
        operations: newOperations,
        isAnyLoading,
        criticalLoading,
        globalState: isAnyLoading ? 'loading' : 'idle',
      };
    });
  },

  clearOperation: (id) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      const newErrors = new Map(state.errors);
      
      newOperations.delete(id);
      newErrors.delete(id);
      
      const isAnyLoading = newOperations.size > 0;
      const criticalLoading = Array.from(newOperations.values()).some(op => op.priority === 'critical');
      
      return {
        operations: newOperations,
        errors: newErrors,
        isAnyLoading,
        criticalLoading,
        globalState: isAnyLoading ? 'loading' : 'idle',
      };
    });
  },

  clearAllOperations: () => {
    set({
      operations: new Map(),
      errors: new Map(),
      isAnyLoading: false,
      criticalLoading: false,
      globalState: 'idle',
    });
  },

  clearErrors: () => {
    set((state) => ({
      errors: new Map(),
      globalState: state.isAnyLoading ? 'loading' : 'idle',
    }));
  },

  setGlobalState: (globalState) => {
    set({ globalState });
  },
}));

// Component-specific loading hook
export interface UseLoadingOptions {
  key?: string;
  autoStart?: boolean;
  timeout?: number;
  priority?: LoadingOperation['priority'];
  description?: string;
  type?: LoadingOperation['type'];
  onTimeout?: () => void;
  onError?: (error: LoadingError) => void;
  onSuccess?: () => void;
}

export function useLoading(options: UseLoadingOptions = {}) {
  const {
    key = 'default',
    autoStart = false,
    timeout,
    priority = 'medium',
    description = 'Loading...',
    type = 'processing',
    onTimeout,
    onError,
    onSuccess,
  } = options;

  const [localState, setLocalState] = useState<LoadingState>('idle');
  const [error, setError] = useState<LoadingError | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const operationIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const {
    startOperation,
    updateOperation,
    completeOperation,
    failOperation,
    cancelOperation,
  } = useGlobalLoadingStore();

  const startLoading = useCallback((customDescription?: string) => {
    // Cancel any existing operation
    if (operationIdRef.current) {
      cancelOperation(operationIdRef.current);
    }

    // Clear local error state
    setError(null);
    setProgress(0);
    setLocalState('loading');

    // Start global operation
    operationIdRef.current = startOperation({
      description: customDescription || description,
      type,
      priority,
      progress: 0,
      cancelable: true,
      onCancel: () => {
        setLocalState('idle');
        operationIdRef.current = null;
      },
    });

    // Set up timeout if specified
    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        if (operationIdRef.current) {
          const timeoutError: LoadingError = {
            message: 'Operation timed out',
            type: 'unknown',
            code: 'TIMEOUT',
          };
          
          failOperation(operationIdRef.current, timeoutError);
          setError(timeoutError);
          setLocalState('error');
          onTimeout?.();
        }
      }, timeout);
    }

    return operationIdRef.current;
  }, [description, type, priority, timeout, onTimeout, startOperation, cancelOperation, failOperation]);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    
    if (operationIdRef.current) {
      updateOperation(operationIdRef.current, { progress: newProgress });
    }
  }, [updateOperation]);

  const stopLoading = useCallback((success: boolean = true, errorData?: LoadingError) => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (operationIdRef.current) {
      if (success) {
        completeOperation(operationIdRef.current);
        setLocalState('success');
        setProgress(100);
        onSuccess?.();
      } else if (errorData) {
        failOperation(operationIdRef.current, errorData);
        setError(errorData);
        setLocalState('error');
        onError?.(errorData);
      }
      
      operationIdRef.current = null;
    }
  }, [completeOperation, failOperation, onSuccess, onError]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (operationIdRef.current) {
      cancelOperation(operationIdRef.current);
      operationIdRef.current = null;
    }
    
    setLocalState('idle');
    setProgress(0);
    setError(null);
  }, [cancelOperation]);

  const reset = useCallback(() => {
    cancel();
    setLocalState('idle');
    setProgress(0);
    setError(null);
  }, [cancel]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startLoading();
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (operationIdRef.current) {
        cancelOperation(operationIdRef.current);
      }
    };
  }, [autoStart, startLoading, cancelOperation]);

  // Async operation wrapper
  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    operationDescription?: string
  ): Promise<T> => {
    const operationId = startLoading(operationDescription);
    
    try {
      const result = await operation();
      stopLoading(true);
      return result;
    } catch (err: any) {
      const loadingError: LoadingError = {
        message: err.message || 'Operation failed',
        type: err.code === 'NETWORK_ERROR' ? 'network' : 'unknown',
        code: err.code,
        details: err,
        retry: () => withLoading(operation, operationDescription),
      };
      
      stopLoading(false, loadingError);
      throw err;
    }
  }, [startLoading, stopLoading]);

  return {
    // State
    state: localState,
    isLoading: localState === 'loading',
    isSuccess: localState === 'success',
    isError: localState === 'error',
    isIdle: localState === 'idle',
    error,
    progress,
    
    // Actions
    start: startLoading,
    stop: stopLoading,
    cancel,
    reset,
    updateProgress,
    withLoading,
    
    // Utilities
    operationId: operationIdRef.current,
  };
}

// Async operation helper hook
export function useAsyncOperation<T = any>(
  operation: (() => Promise<T>) | null,
  dependencies: React.DependencyList = [],
  options: UseLoadingOptions & {
    immediate?: boolean;
    keepPreviousData?: boolean;
  } = {}
) {
  const {
    immediate = false,
    keepPreviousData = false,
    ...loadingOptions
  } = options;

  const [data, setData] = useState<T | null>(null);
  const loading = useLoading(loadingOptions);

  const execute = useCallback(async (customOperation?: () => Promise<T>) => {
    const op = customOperation || operation;
    if (!op) return null;

    try {
      if (!keepPreviousData) {
        setData(null);
      }
      
      const result = await loading.withLoading(op);
      setData(result);
      return result;
    } catch (error) {
      if (!keepPreviousData) {
        setData(null);
      }
      throw error;
    }
  }, [operation, loading, keepPreviousData]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && operation) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...loading,
    data,
    execute,
    refresh,
  };
}

// Global loading utilities
export const useGlobalLoading = () => {
  return useGlobalLoadingStore((state) => ({
    operations: Array.from(state.operations.values()),
    errors: Array.from(state.errors.values()),
    globalState: state.globalState,
    isAnyLoading: state.isAnyLoading,
    criticalLoading: state.criticalLoading,
    clearAllOperations: state.clearAllOperations,
    clearErrors: state.clearErrors,
  }));
};