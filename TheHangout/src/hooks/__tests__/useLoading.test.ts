/**
 * useLoading Hooks Tests
 * 
 * Comprehensive tests for loading state management hooks:
 * - useLoading
 * - usePageLoading
 * - useAsyncOperation
 * - useOptimisticOperation
 * - useLoadingContext
 * - Global loading store functionality
 */

import { renderHook, act } from '@testing-library/react-native';
import {
  useLoading,
  usePageLoading,
  useAsyncOperation,
  useOptimisticOperation,
  useGlobalLoadingStore,
  LoadingPriority,
  LoadingOperationType,
} from '../useLoading';
import { createMockLoadingOperation, waitForAsync } from '../../__tests__/utils/testUtils';

describe('useLoading Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Reset the global loading store
    const store = useGlobalLoadingStore.getState();
    store.operations.clear();
    store.errors.clear();
    store.globalState = 'idle';
    store.isAnyLoading = false;
    store.criticalLoading = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useLoading', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useLoading());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });

    it('should start and stop loading correctly', async () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.startLoading('Test operation');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.description).toBe('Test operation');

      act(() => {
        result.current.stopLoading();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should track operation progress', () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.startLoading('Test operation');
        result.current.updateProgress(50);
      });

      expect(result.current.progress).toBe(50);
    });

    it('should handle errors correctly', () => {
      const { result } = renderHook(() => useLoading());
      const testError = new Error('Test error');

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toBe(testError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should execute async operations', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      const { result } = renderHook(() => useLoading());

      let operationResult: any;

      await act(async () => {
        operationResult = await result.current.executeOperation(
          mockAsyncFn,
          'Test async operation'
        );
      });

      expect(mockAsyncFn).toHaveBeenCalled();
      expect(operationResult).toBe('success');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle async operation errors', async () => {
      const mockError = new Error('Async error');
      const mockAsyncFn = jest.fn().mockRejectedValue(mockError);
      const { result } = renderHook(() => useLoading());

      await act(async () => {
        try {
          await result.current.executeOperation(mockAsyncFn, 'Failing operation');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should reset state correctly', () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.startLoading('Test');
        result.current.updateProgress(75);
        result.current.setError(new Error('Test error'));
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(result.current.description).toBeUndefined();
    });
  });

  describe('usePageLoading', () => {
    it('should initialize page loading', () => {
      const { result } = renderHook(() => usePageLoading('test-page'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.page).toBe('test-page');
    });

    it('should complete page loading', async () => {
      const { result } = renderHook(() => usePageLoading('test-page'));

      await act(async () => {
        result.current.complete();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle page loading errors', () => {
      const { result } = renderHook(() => usePageLoading('test-page'));
      const testError = new Error('Page load error');

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toBe(testError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should retry page loading', async () => {
      const { result } = renderHook(() => usePageLoading('test-page'));

      act(() => {
        result.current.complete();
      });

      await act(async () => {
        result.current.retry();
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useAsyncOperation', () => {
    const mockAsyncFn = jest.fn();

    beforeEach(() => {
      mockAsyncFn.mockClear();
    });

    it('should not execute immediately by default', () => {
      renderHook(() => 
        useAsyncOperation(mockAsyncFn, [], {
          key: 'test-op',
          description: 'Test operation',
        })
      );

      expect(mockAsyncFn).not.toHaveBeenCalled();
    });

    it('should execute immediately when specified', async () => {
      mockAsyncFn.mockResolvedValueOnce('success');

      renderHook(() =>
        useAsyncOperation(mockAsyncFn, [], {
          key: 'test-op',
          description: 'Test operation',
          immediate: true,
        })
      );

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(mockAsyncFn).toHaveBeenCalled();
    });

    it('should execute on dependency change', async () => {
      mockAsyncFn.mockResolvedValueOnce('success');
      const { rerender } = renderHook(
        ({ deps }) => useAsyncOperation(mockAsyncFn, deps, {
          key: 'test-op',
          description: 'Test operation',
          immediate: true,
        }),
        { initialProps: { deps: ['dep1'] } }
      );

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(mockAsyncFn).toHaveBeenCalledTimes(1);

      // Change dependencies
      rerender({ deps: ['dep2'] });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(mockAsyncFn).toHaveBeenCalledTimes(2);
    });

    it('should handle operation errors', async () => {
      const testError = new Error('Operation failed');
      mockAsyncFn.mockRejectedValueOnce(testError);

      const { result } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, [], {
          key: 'test-op',
          description: 'Failing operation',
          immediate: true,
        })
      );

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.error).toBe(testError);
    });

    it('should support manual execution', async () => {
      mockAsyncFn.mockResolvedValueOnce('manual success');

      const { result } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, [], {
          key: 'test-op',
          description: 'Manual operation',
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockAsyncFn).toHaveBeenCalled();
      expect(result.current.data).toBe('manual success');
    });

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, [], {
          key: 'test-op',
          description: 'Test operation',
        })
      );

      const store = useGlobalLoadingStore.getState();
      const operationId = Array.from(store.operations.keys())[0];

      unmount();

      // Operation should be cleaned up
      expect(store.operations.has(operationId)).toBe(false);
    });
  });

  describe('useOptimisticOperation', () => {
    const mockMutation = jest.fn();
    const mockRevert = jest.fn();

    beforeEach(() => {
      mockMutation.mockClear();
      mockRevert.mockClear();
    });

    it('should apply optimistic update immediately', async () => {
      const optimisticData = { id: 1, name: 'New Item' };
      mockMutation.mockResolvedValueOnce({ id: 1, name: 'Confirmed Item' });

      const { result } = renderHook(() =>
        useOptimisticOperation({
          mutationFn: mockMutation,
          optimisticData,
          revertFn: mockRevert,
          key: 'optimistic-test',
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      // Should start with optimistic data
      expect(result.current.optimisticData).toEqual(optimisticData);
      
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Should update with actual result
      expect(result.current.data).toEqual({ id: 1, name: 'Confirmed Item' });
    });

    it('should revert optimistic update on error', async () => {
      const optimisticData = { id: 1, name: 'New Item' };
      const testError = new Error('Mutation failed');
      mockMutation.mockRejectedValueOnce(testError);

      const { result } = renderHook(() =>
        useOptimisticOperation({
          mutationFn: mockMutation,
          optimisticData,
          revertFn: mockRevert,
          key: 'optimistic-error-test',
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(mockRevert).toHaveBeenCalled();
      expect(result.current.error).toBe(testError);
    });
  });

  describe('Global Loading Store', () => {
    it('should track multiple operations', () => {
      const store = useGlobalLoadingStore.getState();

      const operation1 = createMockLoadingOperation({
        type: 'api' as LoadingOperationType,
        priority: 'high' as LoadingPriority,
      });

      const operation2 = createMockLoadingOperation({
        id: 'test-operation-2',
        type: 'processing' as LoadingOperationType,
        priority: 'medium' as LoadingPriority,
      });

      act(() => {
        store.startOperation(operation1);
        store.startOperation(operation2);
      });

      expect(store.operations.size).toBe(2);
      expect(store.isAnyLoading).toBe(true);
    });

    it('should prioritize critical operations', () => {
      const store = useGlobalLoadingStore.getState();

      const criticalOperation = createMockLoadingOperation({
        priority: 'critical' as LoadingPriority,
      });

      act(() => {
        store.startOperation(criticalOperation);
      });

      expect(store.criticalLoading).toBe(true);
    });

    it('should complete operations correctly', () => {
      const store = useGlobalLoadingStore.getState();
      const operation = createMockLoadingOperation();

      act(() => {
        const operationId = store.startOperation(operation);
        store.completeOperation(operationId, 'success');
      });

      expect(store.operations.size).toBe(0);
      expect(store.isAnyLoading).toBe(false);
    });

    it('should handle operation errors', () => {
      const store = useGlobalLoadingStore.getState();
      const operation = createMockLoadingOperation();
      const testError = new Error('Operation failed');

      act(() => {
        const operationId = store.startOperation(operation);
        store.setOperationError(operationId, testError);
      });

      expect(store.errors.get(operation.id)).toBe(testError);
    });

    it('should update operation progress', () => {
      const store = useGlobalLoadingStore.getState();
      const operation = createMockLoadingOperation();

      act(() => {
        const operationId = store.startOperation(operation);
        store.updateOperationProgress(operationId, 75);
      });

      const updatedOperation = store.operations.get(operation.id);
      expect(updatedOperation?.progress).toBe(75);
    });

    it('should cleanup old operations', () => {
      const store = useGlobalLoadingStore.getState();
      
      // Create an old operation (older than 5 minutes)
      const oldOperation = createMockLoadingOperation({
        startTime: Date.now() - (6 * 60 * 1000), // 6 minutes ago
      });

      act(() => {
        store.startOperation(oldOperation);
        store.cleanupStaleOperations();
      });

      expect(store.operations.size).toBe(0);
    });

    it('should get operations by type', () => {
      const store = useGlobalLoadingStore.getState();
      
      const apiOperation = createMockLoadingOperation({
        id: 'api-op',
        type: 'api' as LoadingOperationType,
      });

      const processingOperation = createMockLoadingOperation({
        id: 'processing-op',
        type: 'processing' as LoadingOperationType,
      });

      act(() => {
        store.startOperation(apiOperation);
        store.startOperation(processingOperation);
      });

      const apiOperations = store.getOperationsByType('api');
      expect(apiOperations).toHaveLength(1);
      expect(apiOperations[0].type).toBe('api');
    });

    it('should get operations by priority', () => {
      const store = useGlobalLoadingStore.getState();

      const highPriorityOp = createMockLoadingOperation({
        id: 'high-op',
        priority: 'high' as LoadingPriority,
      });

      const lowPriorityOp = createMockLoadingOperation({
        id: 'low-op',
        priority: 'low' as LoadingPriority,
      });

      act(() => {
        store.startOperation(highPriorityOp);
        store.startOperation(lowPriorityOp);
      });

      const highPriorityOperations = store.getOperationsByPriority('high');
      expect(highPriorityOperations).toHaveLength(1);
      expect(highPriorityOperations[0].priority).toBe('high');
    });

    it('should calculate global loading state correctly', () => {
      const store = useGlobalLoadingStore.getState();

      // No operations
      expect(store.globalState).toBe('idle');

      // Add critical operation
      act(() => {
        store.startOperation(createMockLoadingOperation({
          priority: 'critical' as LoadingPriority,
        }));
      });

      expect(store.globalState).toBe('critical');

      // Clear operations and add high priority
      act(() => {
        store.operations.clear();
        store.startOperation(createMockLoadingOperation({
          priority: 'high' as LoadingPriority,
        }));
      });

      expect(store.globalState).toBe('loading');

      // Add error
      act(() => {
        const operation = createMockLoadingOperation();
        const operationId = store.startOperation(operation);
        store.setOperationError(operationId, new Error('Test error'));
      });

      expect(store.globalState).toBe('error');
    });

    it('should handle concurrent operations correctly', () => {
      const store = useGlobalLoadingStore.getState();

      // Start multiple operations concurrently
      act(() => {
        for (let i = 0; i < 5; i++) {
          store.startOperation(createMockLoadingOperation({
            id: `concurrent-op-${i}`,
            type: 'api' as LoadingOperationType,
          }));
        }
      });

      expect(store.operations.size).toBe(5);
      expect(store.isAnyLoading).toBe(true);

      // Complete operations one by one
      act(() => {
        const operationIds = Array.from(store.operations.keys());
        operationIds.forEach((id, index) => {
          if (index < 3) {
            store.completeOperation(id, `result-${index}`);
          }
        });
      });

      expect(store.operations.size).toBe(2);
      expect(store.isAnyLoading).toBe(true);

      // Complete remaining operations
      act(() => {
        const remainingIds = Array.from(store.operations.keys());
        remainingIds.forEach((id) => {
          store.completeOperation(id, 'final-result');
        });
      });

      expect(store.operations.size).toBe(0);
      expect(store.isAnyLoading).toBe(false);
    });
  });
});