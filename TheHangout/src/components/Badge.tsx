import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export type BadgeVariant = 'achievement' | 'status' | 'count';

export interface BadgeProps {
  /** Badge text or count */
  text: string | number;
  /** Badge variant style */
  variant?: BadgeVariant;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Badge component for achievements, status, or counts
 */
export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'achievement',
  style,
  textStyle,
  testID,
}) => {
  const displayText = typeof text === 'number' ? text.toString() : text;

  return (
    <View
      testID={testID}
      accessibilityLabel={`Badge: ${displayText}`}
      accessibilityRole="text"
      style={[
        styles.badge,
        styles[variant],
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`${variant}Text`],
          textStyle,
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
  },
  achievement: {
    backgroundColor: COLORS.cyan,
  },
  status: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  count: {
    backgroundColor: COLORS.pink,
  },
  text: {
    fontWeight: '600' as const,
    fontSize: 12,
  },
  achievementText: {
    color: COLORS.dark,
  },
  statusText: {
    color: COLORS.cyan,
  },
  countText: {
    color: COLORS.white,
  },
});


