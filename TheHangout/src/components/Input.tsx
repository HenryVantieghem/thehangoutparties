import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING } from '../../constants';

export interface InputProps extends TextInputProps {
  /** Input label text */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Show validation state */
  isValid?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom input style */
  inputStyle?: TextStyle;
  /** Custom label style */
  labelStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Text input component with validation, error display, and label
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  isValid,
  containerStyle,
  inputStyle,
  labelStyle,
  testID,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const showValidation = isValid !== undefined;

  return (
    <View
      style={[styles.container, containerStyle]}
      testID={testID ? `${testID}-container` : undefined}
    >
      {label && (
        <Text
          style={[styles.label, labelStyle]}
          testID={testID ? `${testID}-label` : undefined}
          accessibilityLabel={label}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          showValidation && isValid && styles.inputValid,
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={label || 'Text input'}
          accessibilityHint={error || undefined}
          style={[styles.input, inputStyle]}
          placeholderTextColor={COLORS.gray}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && (
        <Text
          style={styles.errorText}
          testID={testID ? `${testID}-error` : undefined}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    backdropFilter: 'blur(10px)',
  },
  inputFocused: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputValid: {
    borderColor: COLORS.success,
  },
  input: {
    fontSize: 16,
    color: COLORS.white,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

