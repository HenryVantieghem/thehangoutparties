import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AvatarProps {
  /** Image URL for avatar */
  uri?: string | null;
  /** User's name for fallback initials */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom image style */
  imageStyle?: ImageStyle;
  /** Test ID for testing */
  testID?: string;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

/**
 * User avatar component with fallback to initials
 */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'medium',
  style,
  imageStyle,
  testID,
}) => {
  const avatarSize = SIZE_MAP[size];
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <View
      testID={testID}
      accessibilityLabel={name ? `Avatar for ${name}` : 'User avatar'}
      accessibilityRole="image"
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
            imageStyle,
          ]}
          testID={testID ? `${testID}-image` : undefined}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: avatarSize * 0.4 },
            ]}
            testID={testID ? `${testID}-initials` : undefined}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.darkSecondary,
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.dark,
    fontWeight: '700' as const,
  },
});

