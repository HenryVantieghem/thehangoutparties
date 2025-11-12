import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useGlobalLoading, LoadingOperation, LoadingError } from '../../hooks/useLoading';

// Loading spinner component
export interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color,
  style,
}) => {
  const theme = useTheme();
  
  return (
    <ActivityIndicator
      size={size}
      color={color || theme.colors.primary}
      style={style}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    />
  );
};

// Progress bar component
export interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color,
  backgroundColor,
  animated = true,
  showPercentage = false,
  style,
}) => {
  const theme = useTheme();
  const progressValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressValue.setValue(progress);
    }
  }, [progress, animated, progressValue]);

  const progressColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.surfaceVariant;

  return (
    <View style={[styles.progressContainer, style]}>
      <View
        style={[
          styles.progressBackground,
          { height, backgroundColor: bgColor },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              backgroundColor: progressColor,
              width: progressValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.progressText, { color: theme.colors.onSurface }]}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
};

// Skeleton loader component
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  animated = true,
  style,
}) => {
  const theme = useTheme();
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      
      return () => animation.stop();
    }
  }, [animated, opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: animated ? opacity : 1,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    />
  );
};

// Loading overlay for blocking interactions
export interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  progress?: number;
  cancelable?: boolean;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = 'Loading...',
  progress,
  cancelable = false,
  onCancel,
  children,
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlayContainer, { backgroundColor: theme.colors.backdrop }]}>
        <View style={[styles.overlayContent, { backgroundColor: theme.colors.surface }]}>
          {children || (
            <>
              <LoadingSpinner size="large" />
              <Text style={[styles.overlayText, { color: theme.colors.onSurface }]}>
                {text}
              </Text>
              {typeof progress === 'number' && (
                <ProgressBar
                  progress={progress}
                  showPercentage
                  style={styles.overlayProgress}
                />
              )}
              {cancelable && onCancel && (
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel loading"
                >
                  <Text style={[styles.cancelText, { color: theme.colors.onSurface }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Global loading indicator for multiple operations
export const GlobalLoadingIndicator: React.FC = () => {
  const theme = useTheme();
  const { operations, isAnyLoading, criticalLoading } = useGlobalLoading();

  if (!isAnyLoading) return null;

  const criticalOps = operations.filter(op => op.priority === 'critical');
  const highPriorityOps = operations.filter(op => op.priority === 'high');
  const currentOp = criticalOps[0] || highPriorityOps[0] || operations[0];

  return (
    <View style={[
      styles.globalIndicator,
      {
        backgroundColor: criticalLoading ? theme.colors.errorContainer : theme.colors.primaryContainer,
      }
    ]}>
      <LoadingSpinner
        size="small"
        color={criticalLoading ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer}
      />
      <Text style={[
        styles.globalIndicatorText,
        {
          color: criticalLoading ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer,
        }
      ]}>
        {currentOp?.description || 'Loading...'}
      </Text>
      {operations.length > 1 && (
        <View style={[
          styles.operationCount,
          { backgroundColor: theme.colors.outline }
        ]}>
          <Text style={[styles.operationCountText, { color: theme.colors.onSurface }]}>
            {operations.length}
          </Text>
        </View>
      )}
    </View>
  );
};

// Loading button component
export interface LoadingButtonProps {
  loading: boolean;
  onPress: () => void;
  title: string;
  loadingTitle?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  spinnerColor?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  onPress,
  title,
  loadingTitle,
  disabled = false,
  style,
  textStyle,
  spinnerColor,
}) => {
  const theme = useTheme();

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.loadingButton,
        {
          backgroundColor: isDisabled ? theme.colors.surfaceVariant : theme.colors.primary,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
    >
      {loading && (
        <LoadingSpinner
          size="small"
          color={spinnerColor || theme.colors.onPrimary}
        />
      )}
      <Text
        style={[
          styles.loadingButtonText,
          {
            color: isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary,
            marginLeft: loading ? 8 : 0,
          },
          textStyle,
        ]}
      >
        {loading ? (loadingTitle || title) : title}
      </Text>
    </TouchableOpacity>
  );
};

// Error state component
export interface ErrorStateProps {
  error: LoadingError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
  style,
}) => {
  const theme = useTheme();

  if (!error) return null;

  const errorMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : (error as LoadingError).message;

  const errorType = typeof error === 'object' && 'type' in error
    ? (error as LoadingError).type
    : 'unknown';

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return 'wifi-off';
      case 'auth':
        return 'lock';
      case 'validation':
        return 'error-outline';
      default:
        return 'error';
    }
  };

  return (
    <View style={[styles.errorContainer, style]}>
      <MaterialIcons
        name={getErrorIcon() as any}
        size={48}
        color={theme.colors.error}
      />
      <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: theme.colors.onSurface }]}>
        {errorMessage}
      </Text>
      
      <View style={styles.errorActions}>
        {onRetry && (
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={[styles.errorButtonText, { color: theme.colors.onPrimary }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity
            style={[styles.errorButton, { borderColor: theme.colors.outline }]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
          >
            <Text style={[styles.errorButtonText, { color: theme.colors.onSurface }]}>
              Dismiss
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Empty state component
export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.emptyContainer, style]}>
      <MaterialIcons
        name={icon as any}
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      )}
      
      {actionTitle && onAction && (
        <TouchableOpacity
          style={[styles.emptyAction, { backgroundColor: theme.colors.primary }]}
          onPress={onAction}
          accessibilityRole="button"
        >
          <Text style={[styles.emptyActionText, { color: theme.colors.onPrimary }]}>
            {actionTitle}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },

  // Loading Overlay
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  overlayProgress: {
    marginTop: 16,
    width: '100%',
  },
  cancelButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Global Loading Indicator
  globalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  globalIndicatorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  operationCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationCountText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Loading Button
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
  },
  loadingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Error State
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  errorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});