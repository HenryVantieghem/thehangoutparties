import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants';
import { captureException } from '../utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState((prevState) => ({
      errorInfo,
      retryCount: prevState.retryCount + 1,
    }));

    // Enhanced error logging with context
    captureException(error, { 
      errorInfo,
      componentName: this.props.componentName,
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Haptic feedback to alert user
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Auto-recovery for non-critical errors (max 3 attempts)
    if (this.state.retryCount < 3 && !this.isCriticalError(error)) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleReset();
      }, 2000 * this.state.retryCount); // Exponential backoff
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      
      if (hasResetKeyChanged || resetOnPropsChange) {
        this.handleReset();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private isCriticalError = (error: Error): boolean => {
    const criticalPatterns = [
      /Network Error/i,
      /ChunkLoadError/i,
      /Authentication/i,
      /Permission denied/i,
    ];
    
    return criticalPatterns.some(pattern => pattern.test(error.message));
  };

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  handleReportError = () => {
    const { error, errorInfo, errorId, retryCount } = this.state;
    
    if (!error) return;

    const errorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      componentName: this.props.componentName,
      retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // In production, send to error reporting service
    captureException(error, errorReport);
    
    Alert.alert(
      'Error Reported',
      'Thank you for reporting this issue. Our team has been notified.',
      [{ text: 'OK', onPress: this.handleReset }]
    );
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const isRepeatingError = retryCount >= 3;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons 
              name={isRepeatingError ? "alert-circle" : "warning"} 
              size={64} 
              color={isRepeatingError ? COLORS.red : COLORS.orange} 
            />
            
            <Text style={styles.title}>
              {isRepeatingError ? "Persistent Error" : "Something went wrong"}
            </Text>
            
            <Text style={styles.message}>
              {isRepeatingError 
                ? "We're experiencing a recurring issue. Please check your connection and try restarting the app."
                : "We encountered an unexpected error. Don't worry - we'll try to recover automatically."
              }
            </Text>

            {componentName && (
              <Text style={styles.componentName}>
                Component: {componentName}
              </Text>
            )}

            {error && __DEV__ && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Debug):</Text>
                <Text style={styles.errorText} numberOfLines={4}>
                  {error.message}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>
                  Try Again {retryCount > 0 && `(${retryCount + 1})`}
                </Text>
              </TouchableOpacity>

              {isRepeatingError && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleReportError}
                  activeOpacity={0.8}
                >
                  <Ionicons name="bug" size={20} color={COLORS.cyan} />
                  <Text style={styles.secondaryButtonText}>Report Issue</Text>
                </TouchableOpacity>
              )}
            </View>

            {!isRepeatingError && retryCount > 0 && (
              <Text style={styles.autoRecoveryText}>
                Auto-recovery in progress... {retryCount}/3 attempts
              </Text>
            )}
          </View>
        </View>
      );
    }

    return children;
  }
}

// Convenience wrapper for screen-level error boundaries
export const ScreenErrorBoundary: React.FC<{ 
  children: ReactNode; 
  screenName?: string;
}> = ({ children, screenName }) => (
  <ErrorBoundary
    componentName={screenName}
    onError={(error, errorInfo) => {
      captureException(error, { 
        context: 'screen',
        screenName,
        errorInfo 
      });
    }}
    resetOnPropsChange
  >
    {children}
  </ErrorBoundary>
);

// Convenience wrapper for component-level error boundaries
export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode; 
  componentName?: string;
}> = ({ children, componentName }) => (
  <ErrorBoundary
    componentName={componentName}
    fallback={
      <View style={styles.fallbackContainer}>
        <Ionicons name="alert-circle" size={24} color={COLORS.orange} />
        <Text style={styles.fallbackText}>
          {componentName ? `${componentName} unavailable` : 'Component unavailable'}
        </Text>
        <Text style={styles.fallbackSubtext}>Please try refreshing</Text>
      </View>
    }
    onError={(error, errorInfo) => {
      captureException(error, { 
        context: 'component',
        componentName,
        errorInfo 
      });
    }}
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '700' as const,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray300,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  componentName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  errorTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.red,
    marginBottom: SPACING.xs,
    fontWeight: '600' as const,
  },
  errorText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actions: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  primaryButton: {
    backgroundColor: COLORS.cyan,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
    fontWeight: '600' as const,
  },
  autoRecoveryText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fallbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    gap: SPACING.sm,
    minHeight: 60,
  },
  fallbackText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.orange,
    fontWeight: '600' as const,
  },
  fallbackSubtext: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
});


