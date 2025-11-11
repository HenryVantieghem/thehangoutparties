import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export interface EmptyStateProps {
  /** Main message text */
  message: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional emoji or icon */
  icon?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom message style */
  messageStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Empty state component for no data messages
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  subtitle,
  icon = '📭',
  style,
  messageStyle,
  testID,
}) => {
  return (
    <View
      testID={testID}
      accessibilityLabel={`Empty state: ${message}`}
      accessibilityRole="none"
      style={[styles.container, style]}
    >
      {icon && (
        <Text
          style={styles.icon}
          testID={testID ? `${testID}-icon` : undefined}
          accessibilityHidden
        >
          {icon}
        </Text>
      )}
      <Text
        style={[styles.message, messageStyle]}
        testID={testID ? `${testID}-message` : undefined}
      >
        {message}
      </Text>
      {subtitle && (
        <Text
          style={styles.subtitle}
          testID={testID ? `${testID}-subtitle` : undefined}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    minHeight: 200,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

