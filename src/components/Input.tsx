import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';

interface InputProps extends TextInputProps {
  style?: any;
}

export function Input({ style, ...props }: InputProps) {
  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      placeholderTextColor={COLORS.gray600}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    color: COLORS.white,
    ...TYPOGRAPHY.body,
  },
});