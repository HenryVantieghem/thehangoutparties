import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    variant === 'secondary' && styles.secondaryText,
    variant === 'ghost' && styles.ghostText,
    variant === 'danger' && styles.dangerText,
  ];

  if (variant === 'primary') {
    return (
      <LinearGradient
        colors={[COLORS.cyan, COLORS.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientButton, disabled && styles.disabled]}
      >
        <TouchableOpacity
          {...props}
          disabled={disabled || loading}
          style={[styles.gradientInner, buttonStyle]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              {icon}
              <Text style={textStyle}>{title}</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <TouchableOpacity
      {...props}
      disabled={disabled || loading}
      style={[
        buttonStyle,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.cyan} />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  
  // Sizes
  sm: {
    height: 40,
    paddingHorizontal: SPACING.lg,
  },
  md: {
    height: 48,
    paddingHorizontal: SPACING.xl,
  },
  lg: {
    height: 56,
    paddingHorizontal: SPACING.xl,
  },

  // Variants
  gradientButton: {
    borderRadius: RADIUS.md,
  },
  gradientInner: {
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
  },

  // Text styles
  text: {
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  smText: {
    ...TYPOGRAPHY.bodySmall,
  },
  mdText: {
    ...TYPOGRAPHY.body,
  },
  lgText: {
    ...TYPOGRAPHY.bodyBold,
  },
  secondaryText: {
    color: COLORS.cyan,
  },
  ghostText: {
    color: COLORS.cyan,
  },
  dangerText: {
    color: COLORS.white,
  },

  disabled: {
    opacity: 0.5,
  },
});