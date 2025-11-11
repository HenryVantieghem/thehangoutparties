import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export interface CardProps extends ViewProps {
  /** Custom container style */
  style?: ViewStyle;
  /** Card padding size */
  padding?: keyof typeof SPACING;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Glassmorphism card component with dark mode styling
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  testID,
  ...props
}) => {
  return (
    <View
      testID={testID}
      accessibilityRole="none"
      style={[
        styles.card,
        { padding: SPACING[padding] },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Glassmorphism effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

