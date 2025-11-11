import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants';

export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'small' | 'large';
  /** Spinner color */
  color?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Centered loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = COLORS.cyan,
  style,
  testID,
}) => {
  return (
    <View
      testID={testID}
      accessibilityLabel="Loading"
      accessibilityRole="none"
      style={[styles.container, style]}
    >
      <ActivityIndicator
        size={size}
        color={color}
        testID={testID ? `${testID}-indicator` : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
});

