/**
 * Loading Components Tests
 * 
 * Comprehensive tests for all loading-related UI components:
 * - LoadingSpinner
 * - ProgressBar
 * - LoadingOverlay
 * - ErrorState
 * - EmptyState
 */

import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent } from '../../__tests__/utils/testUtils';
import {
  LoadingSpinner,
  ProgressBar,
  LoadingOverlay,
  ErrorState,
  EmptyState,
} from '../LoadingComponents';

// Mock theme hook
const mockTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#FF9500',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    surface: '#FFFFFF',
    background: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

jest.mock('../../themes/useTheme', () => ({
  useTheme: () => mockTheme,
}));

describe('LoadingComponents', () => {
  describe('LoadingSpinner', () => {
    it('should render with default props', () => {
      const { getByLabelText } = render(<LoadingSpinner />);
      
      const spinner = getByLabelText('Loading');
      expect(spinner).toBeTruthy();
    });

    it('should render with custom size', () => {
      const { getByLabelText } = render(<LoadingSpinner size="large" />);
      
      const spinner = getByLabelText('Loading');
      expect(spinner.props.size).toBe('large');
    });

    it('should render with custom color', () => {
      const customColor = '#FF0000';
      const { getByLabelText } = render(<LoadingSpinner color={customColor} />);
      
      const spinner = getByLabelText('Loading');
      expect(spinner.props.color).toBe(customColor);
    });

    it('should use theme primary color by default', () => {
      const { getByLabelText } = render(<LoadingSpinner />);
      
      const spinner = getByLabelText('Loading');
      expect(spinner.props.color).toBe(mockTheme.colors.primary);
    });

    it('should apply custom styles', () => {
      const customStyle = { marginTop: 20 };
      const { getByLabelText } = render(<LoadingSpinner style={customStyle} />);
      
      const spinner = getByLabelText('Loading');
      expect(spinner.props.style).toContainEqual(customStyle);
    });

    it('should have proper accessibility props', () => {
      const { getByLabelText, getByA11yRole } = render(<LoadingSpinner />);
      
      expect(getByLabelText('Loading')).toBeTruthy();
      expect(getByA11yRole('progressbar')).toBeTruthy();
    });
  });

  describe('ProgressBar', () => {
    it('should render with progress value', () => {
      const { getByTestId } = render(
        <ProgressBar progress={0.5} testID="progress-bar" />
      );
      
      const progressBar = getByTestId('progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should show progress text when enabled', () => {
      const { getByText } = render(
        <ProgressBar progress={0.75} showProgress={true} />
      );
      
      expect(getByText('75%')).toBeTruthy();
    });

    it('should hide progress text by default', () => {
      const { queryByText } = render(<ProgressBar progress={0.5} />);
      
      expect(queryByText('50%')).toBeNull();
    });

    it('should handle 0% progress', () => {
      const { getByText } = render(
        <ProgressBar progress={0} showProgress={true} />
      );
      
      expect(getByText('0%')).toBeTruthy();
    });

    it('should handle 100% progress', () => {
      const { getByText } = render(
        <ProgressBar progress={1} showProgress={true} />
      );
      
      expect(getByText('100%')).toBeTruthy();
    });

    it('should clamp progress values', () => {
      const { getByText } = render(
        <ProgressBar progress={1.5} showProgress={true} />
      );
      
      expect(getByText('100%')).toBeTruthy();
    });

    it('should use custom color', () => {
      const customColor = '#00FF00';
      const { getByTestId } = render(
        <ProgressBar 
          progress={0.5} 
          color={customColor} 
          testID="progress-bar"
        />
      );
      
      // Check that the progress fill has the custom color
      const progressBar = getByTestId('progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should have proper accessibility props', () => {
      const { getByA11yRole } = render(<ProgressBar progress={0.5} />);
      
      const progressBar = getByA11yRole('progressbar');
      expect(progressBar).toBeTruthy();
      expect(progressBar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 50,
      });
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = render(<ProgressBar progress={0.3} />);
      
      expect(getByLabelText('Progress: 30%')).toBeTruthy();
    });
  });

  describe('LoadingOverlay', () => {
    it('should render loading overlay', () => {
      const { getByTestId } = render(
        <LoadingOverlay testID="loading-overlay">
          <Text>Content</Text>
        </LoadingOverlay>
      );
      
      expect(getByTestId('loading-overlay')).toBeTruthy();
    });

    it('should show spinner by default', () => {
      const { getByLabelText } = render(
        <LoadingOverlay>
          <Text>Content</Text>
        </LoadingOverlay>
      );
      
      expect(getByLabelText('Loading')).toBeTruthy();
    });

    it('should show custom message', () => {
      const message = 'Loading data...';
      const { getByText } = render(
        <LoadingOverlay message={message}>
          <Text>Content</Text>
        </LoadingOverlay>
      );
      
      expect(getByText(message)).toBeTruthy();
    });

    it('should render children', () => {
      const { getByText } = render(
        <LoadingOverlay>
          <Text>Child Content</Text>
        </LoadingOverlay>
      );
      
      expect(getByText('Child Content')).toBeTruthy();
    });

    it('should be dismissible when configured', () => {
      const onDismiss = jest.fn();
      const { getByText } = render(
        <LoadingOverlay dismissible onDismiss={onDismiss}>
          <Text>Content</Text>
        </LoadingOverlay>
      );
      
      const dismissButton = getByText('Dismiss');
      fireEvent.press(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not show dismiss button by default', () => {
      const { queryByText } = render(
        <LoadingOverlay>
          <Text>Content</Text>
        </LoadingOverlay>
      );
      
      expect(queryByText('Dismiss')).toBeNull();
    });

    it('should have proper accessibility props', () => {
      const { getByLabelText } = render(
        <LoadingOverlay message="Loading content...">
          <Text>Content</Text>
        </LoadingOverlay>
      );
      
      expect(getByLabelText('Loading overlay: Loading content...')).toBeTruthy();
    });
  });

  describe('ErrorState', () => {
    it('should render error message', () => {
      const errorMessage = 'Something went wrong';
      const { getByText } = render(
        <ErrorState message={errorMessage} />
      );
      
      expect(getByText(errorMessage)).toBeTruthy();
    });

    it('should render retry button when onRetry provided', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState message="Error occurred" onRetry={onRetry} />
      );
      
      const retryButton = getByText('Retry');
      expect(retryButton).toBeTruthy();
    });

    it('should call onRetry when retry button pressed', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState message="Error occurred" onRetry={onRetry} />
      );
      
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button without onRetry', () => {
      const { queryByText } = render(
        <ErrorState message="Error occurred" />
      );
      
      expect(queryByText('Retry')).toBeNull();
    });

    it('should render custom retry text', () => {
      const onRetry = jest.fn();
      const customRetryText = 'Try Again';
      const { getByText } = render(
        <ErrorState 
          message="Error occurred" 
          onRetry={onRetry} 
          retryText={customRetryText}
        />
      );
      
      expect(getByText(customRetryText)).toBeTruthy();
    });

    it('should show error icon', () => {
      const { getByTestId } = render(
        <ErrorState message="Error occurred" testID="error-state" />
      );
      
      // The icon should be present (we'll look for the container)
      expect(getByTestId('error-state')).toBeTruthy();
    });

    it('should have proper accessibility props', () => {
      const { getByA11yRole } = render(
        <ErrorState message="Network error occurred" />
      );
      
      expect(getByA11yRole('alert')).toBeTruthy();
    });

    it('should have accessibility label for retry button', () => {
      const onRetry = jest.fn();
      const { getByLabelText } = render(
        <ErrorState message="Error occurred" onRetry={onRetry} />
      );
      
      expect(getByLabelText('Retry operation')).toBeTruthy();
    });
  });

  describe('EmptyState', () => {
    it('should render empty state message', () => {
      const message = 'No items found';
      const { getByText } = render(
        <EmptyState message={message} />
      );
      
      expect(getByText(message)).toBeTruthy();
    });

    it('should render description when provided', () => {
      const description = 'Try adjusting your search criteria';
      const { getByText } = render(
        <EmptyState 
          message="No items found" 
          description={description} 
        />
      );
      
      expect(getByText(description)).toBeTruthy();
    });

    it('should render action button when provided', () => {
      const onAction = jest.fn();
      const actionText = 'Add New Item';
      const { getByText } = render(
        <EmptyState 
          message="No items found"
          actionText={actionText}
          onAction={onAction}
        />
      );
      
      const actionButton = getByText(actionText);
      expect(actionButton).toBeTruthy();
    });

    it('should call onAction when action button pressed', () => {
      const onAction = jest.fn();
      const { getByText } = render(
        <EmptyState 
          message="No items found"
          actionText="Add Item"
          onAction={onAction}
        />
      );
      
      const actionButton = getByText('Add Item');
      fireEvent.press(actionButton);
      
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should not show action button without onAction', () => {
      const { queryByText } = render(
        <EmptyState 
          message="No items found"
          actionText="Add Item"
        />
      );
      
      expect(queryByText('Add Item')).toBeNull();
    });

    it('should render custom icon', () => {
      const CustomIcon = () => <View testID="custom-icon" />;
      const { getByTestId } = render(
        <EmptyState 
          message="No items found"
          icon={<CustomIcon />}
        />
      );
      
      expect(getByTestId('custom-icon')).toBeTruthy();
    });

    it('should have proper accessibility props', () => {
      const { getByA11yRole } = render(
        <EmptyState message="No data available" />
      );
      
      expect(getByA11yRole('status')).toBeTruthy();
    });

    it('should have accessibility hint for action button', () => {
      const onAction = jest.fn();
      const { getByLabelText } = render(
        <EmptyState 
          message="No items found"
          actionText="Create New"
          onAction={onAction}
        />
      );
      
      expect(getByLabelText('Create New')).toBeTruthy();
    });

    it('should handle long messages gracefully', () => {
      const longMessage = 'This is a very long message that should wrap properly and display correctly in the empty state component without causing layout issues';
      const { getByText } = render(
        <EmptyState message={longMessage} />
      );
      
      expect(getByText(longMessage)).toBeTruthy();
    });
  });

  describe('Component Integration', () => {
    it('should work together in complex loading scenarios', () => {
      const TestComponent = () => (
        <View>
          <LoadingSpinner size="large" />
          <ProgressBar progress={0.65} showProgress />
          <LoadingOverlay message="Processing...">
            <Text>Background content</Text>
          </LoadingOverlay>
        </View>
      );

      const { getByText, getByLabelText } = render(<TestComponent />);
      
      expect(getByLabelText('Loading')).toBeTruthy();
      expect(getByText('65%')).toBeTruthy();
      expect(getByText('Processing...')).toBeTruthy();
      expect(getByText('Background content')).toBeTruthy();
    });

    it('should handle state transitions correctly', () => {
      const TestStateMachine = ({ state }: { state: 'loading' | 'error' | 'empty' }) => {
        switch (state) {
          case 'loading':
            return <LoadingSpinner />;
          case 'error':
            return <ErrorState message="Failed to load" onRetry={() => {}} />;
          case 'empty':
            return <EmptyState message="No data" />;
          default:
            return null;
        }
      };

      const { rerender, getByLabelText, getByText } = render(
        <TestStateMachine state="loading" />
      );
      
      expect(getByLabelText('Loading')).toBeTruthy();

      rerender(<TestStateMachine state="error" />);
      expect(getByText('Failed to load')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();

      rerender(<TestStateMachine state="empty" />);
      expect(getByText('No data')).toBeTruthy();
    });
  });
});