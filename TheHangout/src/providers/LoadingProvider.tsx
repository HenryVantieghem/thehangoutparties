import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGlobalLoadingStore, useGlobalLoading } from '../hooks/useLoading';
import { GlobalLoadingIndicator, LoadingOverlay } from '../components/ui/LoadingComponents';
import { useAuthStore } from '../stores/index';

// Loading context
interface LoadingContextType {
  // Global loading state
  isLoading: boolean;
  isCriticalLoading: boolean;
  
  // Quick access to common loading operations
  showGlobalLoader: (description: string, options?: { 
    type?: 'api' | 'navigation' | 'data' | 'upload' | 'download' | 'processing';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    progress?: number;
  }) => string;
  hideGlobalLoader: (operationId: string) => void;
  updateGlobalLoaderProgress: (operationId: string, progress: number) => void;
  
  // Batch operations
  startBatchOperation: (operations: Array<{
    description: string;
    type?: 'api' | 'navigation' | 'data' | 'upload' | 'download' | 'processing';
  }>) => string[];
  completeBatchOperation: (operationIds: string[]) => void;
  
  // Loading overlay control
  showOverlay: (text?: string, options?: { 
    cancelable?: boolean;
    progress?: number;
  }) => void;
  hideOverlay: () => void;
  
  // Error handling
  showError: (message: string, options?: {
    type?: 'network' | 'validation' | 'auth' | 'server' | 'unknown';
    retry?: () => void;
  }) => void;
  clearErrors: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

// Loading provider props
interface LoadingProviderProps {
  children: ReactNode;
  showGlobalIndicator?: boolean;
  showOverlayForCritical?: boolean;
  automaticErrorHandling?: boolean;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
  showGlobalIndicator = true,
  showOverlayForCritical = true,
  automaticErrorHandling = true,
}) => {
  const [overlayVisible, setOverlayVisible] = React.useState(false);
  const [overlayText, setOverlayText] = React.useState('Loading...');
  const [overlayProgress, setOverlayProgress] = React.useState<number | undefined>();
  const [overlayCancelable, setOverlayCancelable] = React.useState(false);
  const overlayOperationIdRef = React.useRef<string | null>(null);

  const {
    operations,
    errors,
    isAnyLoading,
    criticalLoading,
    clearAllOperations,
    clearErrors: clearGlobalErrors,
  } = useGlobalLoading();

  const {
    startOperation,
    completeOperation,
    updateOperation,
    failOperation,
    cancelOperation,
  } = useGlobalLoadingStore();

  const { loading: authLoading } = useAuthStore();

  // Auto-show overlay for critical operations
  useEffect(() => {
    if (showOverlayForCritical && criticalLoading && !overlayVisible) {
      const criticalOp = operations.find(op => op.priority === 'critical');
      if (criticalOp) {
        setOverlayVisible(true);
        setOverlayText(criticalOp.description);
        setOverlayProgress(criticalOp.progress);
        setOverlayCancelable(criticalOp.cancelable || false);
        overlayOperationIdRef.current = criticalOp.id;
      }
    } else if (!criticalLoading && overlayVisible && overlayOperationIdRef.current) {
      setOverlayVisible(false);
      overlayOperationIdRef.current = null;
    }
  }, [criticalLoading, operations, overlayVisible, showOverlayForCritical]);

  // Update overlay progress for critical operations
  useEffect(() => {
    if (overlayVisible && overlayOperationIdRef.current) {
      const operation = operations.find(op => op.id === overlayOperationIdRef.current);
      if (operation) {
        setOverlayProgress(operation.progress);
        setOverlayText(operation.description);
      }
    }
  }, [operations, overlayVisible]);

  // Clear operations when app goes to background (optional optimization)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Optionally clear non-critical operations when app goes to background
        // clearAllOperations();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Auto-clear completed operations after delay
  useEffect(() => {
    const completedOperations = operations.filter(op => 
      // No specific completion marker, but we can infer from lack of progress updates
      false // This would be implemented based on operation completion logic
    );

    if (completedOperations.length > 0) {
      const timeouts = completedOperations.map(op =>
        setTimeout(() => {
          // Auto-clear operation after 2 seconds
          // This would be called from the operation completion logic
        }, 2000)
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [operations]);

  // Context value
  const contextValue: LoadingContextType = {
    // Global state
    isLoading: isAnyLoading || authLoading,
    isCriticalLoading: criticalLoading,
    
    // Global loader control
    showGlobalLoader: (description, options = {}) => {
      return startOperation({
        description,
        type: options.type || 'processing',
        priority: options.priority || 'medium',
        progress: options.progress || 0,
      });
    },
    
    hideGlobalLoader: (operationId) => {
      completeOperation(operationId);
    },
    
    updateGlobalLoaderProgress: (operationId, progress) => {
      updateOperation(operationId, { progress });
    },
    
    // Batch operations
    startBatchOperation: (operationsList) => {
      return operationsList.map(op =>
        startOperation({
          description: op.description,
          type: op.type || 'processing',
          priority: 'medium',
        })
      );
    },
    
    completeBatchOperation: (operationIds) => {
      operationIds.forEach(id => completeOperation(id));
    },
    
    // Overlay control
    showOverlay: (text = 'Loading...', options = {}) => {
      setOverlayVisible(true);
      setOverlayText(text);
      setOverlayProgress(options.progress);
      setOverlayCancelable(options.cancelable || false);
      
      // Start a critical operation for the overlay
      overlayOperationIdRef.current = startOperation({
        description: text,
        type: 'processing',
        priority: 'critical',
        cancelable: options.cancelable,
        onCancel: options.cancelable ? () => {
          setOverlayVisible(false);
          overlayOperationIdRef.current = null;
        } : undefined,
      });
    },
    
    hideOverlay: () => {
      if (overlayOperationIdRef.current) {
        completeOperation(overlayOperationIdRef.current);
        overlayOperationIdRef.current = null;
      }
      setOverlayVisible(false);
    },
    
    // Error handling
    showError: (message, options = {}) => {
      if (automaticErrorHandling) {
        // Create a temporary operation to show the error
        const errorId = startOperation({
          description: 'Error occurred',
          type: 'processing',
          priority: 'high',
        });
        
        failOperation(errorId, {
          message,
          type: options.type || 'unknown',
          retry: options.retry,
        });
      }
    },
    
    clearErrors: () => {
      clearGlobalErrors();
    },
  };

  const handleOverlayCancel = () => {
    if (overlayOperationIdRef.current) {
      cancelOperation(overlayOperationIdRef.current);
    }
    setOverlayVisible(false);
    overlayOperationIdRef.current = null;
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      
      {/* Global loading indicator */}
      {showGlobalIndicator && <GlobalLoadingIndicator />}
      
      {/* Loading overlay for critical operations */}
      <LoadingOverlay
        visible={overlayVisible}
        text={overlayText}
        progress={overlayProgress}
        cancelable={overlayCancelable}
        onCancel={overlayCancelable ? handleOverlayCancel : undefined}
      />
    </LoadingContext.Provider>
  );
};

// Hook to use loading context
export const useLoadingContext = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};

// Higher-order component for automatic loading management
export interface WithLoadingProps {
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  loadingComponent?: React.ComponentType<any>;
  errorComponent?: React.ComponentType<any>;
  emptyComponent?: React.ComponentType<any>;
  data?: any;
}

export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    showSkeleton?: boolean;
    skeletonComponent?: React.ComponentType<any>;
    showOverlay?: boolean;
    autoRetry?: boolean;
    retryDelay?: number;
  } = {}
) {
  const {
    showSkeleton = true,
    skeletonComponent: SkeletonComponent,
    showOverlay = false,
    autoRetry = false,
    retryDelay = 3000,
  } = options;

  return React.forwardRef<any, P & WithLoadingProps>((props, ref) => {
    const {
      loading = false,
      error = null,
      onRetry,
      loadingComponent: LoadingComponent,
      errorComponent: ErrorComponent,
      emptyComponent: EmptyComponent,
      data,
      ...restProps
    } = props;

    const loadingContext = useLoadingContext();
    const retryTimeoutRef = React.useRef<NodeJS.Timeout>();

    // Auto-retry on error
    React.useEffect(() => {
      if (error && autoRetry && onRetry) {
        retryTimeoutRef.current = setTimeout(() => {
          onRetry();
        }, retryDelay);
      }

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }, [error, autoRetry, onRetry, retryDelay]);

    // Show overlay if requested
    React.useEffect(() => {
      if (showOverlay && loading) {
        loadingContext.showOverlay('Loading...');
      } else if (showOverlay && !loading) {
        loadingContext.hideOverlay();
      }
    }, [showOverlay, loading, loadingContext]);

    // Error state
    if (error) {
      if (ErrorComponent) {
        return <ErrorComponent error={error} onRetry={onRetry} />;
      }
      
      // Default error handling through context
      React.useEffect(() => {
        loadingContext.showError(
          typeof error === 'string' ? error : error.message,
          { retry: onRetry }
        );
      }, [error, onRetry, loadingContext]);
    }

    // Loading state
    if (loading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      
      if (showSkeleton && SkeletonComponent) {
        return <SkeletonComponent />;
      }
      
      // Return null to show global loading indicator
      return null;
    }

    // Empty state (if data is explicitly checked)
    if (data !== undefined && (!data || (Array.isArray(data) && data.length === 0))) {
      if (EmptyComponent) {
        return <EmptyComponent />;
      }
    }

    // Render wrapped component
    return <WrappedComponent {...(restProps as P)} ref={ref} />;
  });
}

// Utility hooks for common loading patterns
export const usePageLoading = (key: string = 'page') => {
  const context = useLoadingContext();
  const operationIdRef = React.useRef<string | null>(null);

  const startPageLoading = React.useCallback((description: string = 'Loading page...') => {
    if (operationIdRef.current) {
      context.hideGlobalLoader(operationIdRef.current);
    }
    
    operationIdRef.current = context.showGlobalLoader(description, {
      type: 'navigation',
      priority: 'high',
    });
  }, [context]);

  const stopPageLoading = React.useCallback(() => {
    if (operationIdRef.current) {
      context.hideGlobalLoader(operationIdRef.current);
      operationIdRef.current = null;
    }
  }, [context]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (operationIdRef.current) {
        context.hideGlobalLoader(operationIdRef.current);
      }
    };
  }, [context]);

  return {
    startLoading: startPageLoading,
    stopLoading: stopPageLoading,
    isLoading: operationIdRef.current !== null,
  };
};

export const useApiLoading = () => {
  const context = useLoadingContext();
  
  return React.useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: {
      description?: string;
      showOverlay?: boolean;
      onError?: (error: Error) => void;
    } = {}
  ) => {
    const {
      description = 'Loading...',
      showOverlay = false,
      onError,
    } = options;

    let operationId: string | undefined;
    
    try {
      if (showOverlay) {
        context.showOverlay(description);
      } else {
        operationId = context.showGlobalLoader(description, {
          type: 'api',
          priority: 'medium',
        });
      }

      const result = await apiCall();
      
      if (showOverlay) {
        context.hideOverlay();
      } else if (operationId) {
        context.hideGlobalLoader(operationId);
      }
      
      return result;
    } catch (error) {
      if (showOverlay) {
        context.hideOverlay();
      } else if (operationId) {
        context.hideGlobalLoader(operationId);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      context.showError(errorMessage, {
        type: 'api',
        retry: onError ? () => onError(error as Error) : undefined,
      });
      
      throw error;
    }
  }, [context]);
};