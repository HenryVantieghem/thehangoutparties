import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager } from 'react-native';

interface PerformanceConfig {
  componentName?: string;
  trackRenders?: boolean;
  trackInteractions?: boolean;
}

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
}

// Global performance tracking
const performanceTracker = new Map<string, PerformanceMetrics>();

export const usePerformance = (config: PerformanceConfig = {}) => {
  const {
    componentName = 'UnknownComponent',
    trackRenders = true,
    trackInteractions = true,
  } = config;

  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderTimeRef = useRef(0);

  useEffect(() => {
    if (trackRenders) {
      const startTime = performance.now();
      renderCountRef.current += 1;
      
      // Defer performance calculation to avoid affecting render
      const cleanup = () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        renderTimesRef.current.push(renderTime);
        lastRenderTimeRef.current = renderTime;
        
        // Keep only last 10 render times to prevent memory leaks
        if (renderTimesRef.current.length > 10) {
          renderTimesRef.current = renderTimesRef.current.slice(-10);
        }
        
        // Update global metrics
        const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
        const maxRenderTime = Math.max(...renderTimesRef.current);
        
        performanceTracker.set(componentName, {
          renderCount: renderCountRef.current,
          lastRenderTime: renderTime,
          averageRenderTime: avgRenderTime,
          maxRenderTime,
        });
        
        // Log warning for slow renders in development
        if (__DEV__ && renderTime > 16.67) { // 60fps threshold
          console.warn(
            `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
          );
        }
      };
      
      // Use interaction manager to defer performance tracking
      InteractionManager.runAfterInteractions(cleanup);
    }
  });

  const measureAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (__DEV__) {
        console.log(`⏱️  ${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (__DEV__) {
        console.error(`❌ ${componentName}.${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName]);

  const measureSyncOperation = useCallback(<T>(
    operationName: string,
    operation: () => T
  ): T => {
    const startTime = performance.now();
    try {
      const result = operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (__DEV__ && duration > 5) { // Log operations taking more than 5ms
        console.log(`⏱️  ${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (__DEV__) {
        console.error(`❌ ${componentName}.${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName]);

  const logInteraction = useCallback((interactionName: string, metadata?: any) => {
    if (trackInteractions && __DEV__) {
      console.log(`👆 ${componentName} interaction: ${interactionName}`, metadata);
    }
  }, [componentName, trackInteractions]);

  const getMetrics = useCallback(() => {
    return performanceTracker.get(componentName) || {
      renderCount: renderCountRef.current,
      lastRenderTime: lastRenderTimeRef.current,
      averageRenderTime: 0,
      maxRenderTime: 0,
    };
  }, [componentName]);

  return {
    measureAsyncOperation,
    measureSyncOperation,
    logInteraction,
    getMetrics,
  };
};

// Utility function to get all performance metrics
export const getAllPerformanceMetrics = () => {
  return Object.fromEntries(performanceTracker.entries());
};

// Utility function to reset performance tracking
export const resetPerformanceTracking = (componentName?: string) => {
  if (componentName) {
    performanceTracker.delete(componentName);
  } else {
    performanceTracker.clear();
  }
};