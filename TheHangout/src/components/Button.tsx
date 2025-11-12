import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, ACCESSIBILITY, TYPOGRAPHY } from '../constants';
import { 
  createButtonAccessibility, 
  useAccessibility, 
  AccessibilityAnnouncements 
} from '../utils/accessibility';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'error' | 'warning';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button text */
  title: string;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button interaction */
  disabled?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
  
  // Enhanced accessibility props
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
  /** Enable haptic feedback on press */
  hapticFeedback?: boolean;
  /** Announce button press to screen readers */
  announcePress?: boolean;
  /** Auto focus this button when rendered */
  autoFocus?: boolean;
}

/**
 * Button component with variants, sizes, loading, and disabled states
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  hapticFeedback = true,
  announcePress = false,
  autoFocus = false,
  onPress,
  ...props
}) => {
  const buttonRef = useRef<TouchableOpacity>(null);
  const { announceForScreenReader, isReduceMotionEnabled } = useAccessibility();
  const isDisabled = disabled || loading;

  useEffect(() => {
    // Auto-focus if requested and not disabled
    if (autoFocus && !isDisabled && buttonRef.current) {
      const timer = setTimeout(() => {
        buttonRef.current?.focus();
      }, ACCESSIBILITY.ANNOUNCEMENTS.NAVIGATION_DELAY);
      
      return () => clearTimeout(timer);
    }
  }, [autoFocus, isDisabled]);

  const handlePress = async () => {
    if (isDisabled || !onPress) return;

    // Haptic feedback for better UX
    if (hapticFeedback) {
      await Haptics.impactAsync(
        size === 'large' 
          ? Haptics.ImpactFeedbackStyle.Medium 
          : Haptics.ImpactFeedbackStyle.Light
      );
    }

    // Screen reader announcement
    if (announcePress) {
      announceForScreenReader(
        `${accessibilityLabel || title} activated`, 
        'assertive'
      );
    }

    onPress();
  };

  // Create accessibility configuration
  const accessibilityConfig = createButtonAccessibility(
    accessibilityLabel || title,
    accessibilityHint || (loading ? 'Button is loading, please wait' : undefined),
    isDisabled,
    false
  );

  // Get appropriate loading indicator color
  const getLoadingColor = (): string => {
    switch (variant) {
      case 'primary':
        return COLORS.dark;
      case 'secondary':
      case 'outline':
      case 'ghost':
        return COLORS.cyan;
      case 'success':
        return COLORS.white;
      case 'error':
        return COLORS.white;
      case 'warning':
        return COLORS.dark;
      default:
        return COLORS.cyan;
    }
  };

  return (
    <TouchableOpacity
      ref={buttonRef}
      testID={testID}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      
      // Enhanced accessibility props
      {...accessibilityConfig}
      accessibilityState={{
        ...accessibilityConfig.accessibilityState,
        busy: loading,
      }}
      
      {...props}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'large' ? 'large' : 'small'}
            color={getLoadingColor()}
            testID={`${testID}-loading`}
          />
          <Text
            style={[
              styles.text,
              styles[`${variant}Text`],
              styles[`${size}Text`],
              styles.loadingText,
              textStyle,
            ]}
          >
            Loading...
          </Text>
        </View>
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              styles[`${variant}Text`],
              styles[`${size}Text`],
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  
  // Variants with WCAG AA compliant colors
  primary: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: COLORS.cyan,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.cyanAccessible,
    borderWidth: 2,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  error: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  warning: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  
  // Sizes with proper accessibility touch targets
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: ACCESSIBILITY.MIN_TOUCH_TARGET.HEIGHT, // 44px minimum
    minWidth: ACCESSIBILITY.MIN_TOUCH_TARGET.WIDTH,   // 44px minimum
  },
  medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: ACCESSIBILITY.MIN_TOUCH_TARGET.HEIGHT + 4, // 48px
    minWidth: ACCESSIBILITY.MIN_TOUCH_TARGET.WIDTH + 8,   // 52px
  },
  large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    minHeight: ACCESSIBILITY.MIN_TOUCH_TARGET.HEIGHT + 8, // 52px
    minWidth: ACCESSIBILITY.MIN_TOUCH_TARGET.WIDTH + 16,  // 60px
  },
  
  // Text styles with proper typography and contrast
  text: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: SPACING.xs,
  },
  
  // Variant text styles - WCAG AA compliant
  primaryText: {
    color: COLORS.dark, // High contrast on cyan background
  },
  secondaryText: {
    color: COLORS.cyanAccessible, // Enhanced contrast on dark background
  },
  outlineText: {
    color: COLORS.cyanAccessible, // Enhanced contrast
  },
  ghostText: {
    color: COLORS.cyanAccessible, // Enhanced contrast
  },
  successText: {
    color: COLORS.white, // High contrast on success background
  },
  errorText: {
    color: COLORS.white, // High contrast on error background
  },
  warningText: {
    color: COLORS.dark, // High contrast on warning background
  },
  
  // Size text styles with accessible font sizes
  smallText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediumText: {
    fontSize: 16,
    lineHeight: 24,
  },
  largeText: {
    fontSize: ACCESSIBILITY.FONT_SIZES.LARGE_TEXT, // 18pt for better readability
    lineHeight: 26,
  },
  
  // States with proper accessibility indicators
  disabled: {
    opacity: 0.6,
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
  },
  disabledText: {
    color: COLORS.textTertiary, // Still meets AA contrast ratio
  },
  
  // Loading state styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    marginLeft: SPACING.xs,
  },
});

