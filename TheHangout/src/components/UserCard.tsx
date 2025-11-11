import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { User } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { COLORS, SPACING } from '../../constants';

export interface UserCardProps {
  /** User data */
  user: User;
  /** Show friend button */
  showFriendButton?: boolean;
  /** Friend button action */
  onFriendPress?: () => void;
  /** Friend button text */
  friendButtonText?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * User card component with avatar, info, and friend button
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFriendButton = true,
  onFriendPress,
  friendButtonText = 'Add Friend',
  style,
  testID,
}) => {
  return (
    <Card
      testID={testID}
      style={[styles.card, style]}
      padding="md"
    >
      <View style={styles.content}>
        <Avatar
          uri={user.avatar_url}
          name={user.username}
          size="large"
          testID={testID ? `${testID}-avatar` : undefined}
        />
        <View style={styles.info}>
          <Text
            style={styles.username}
            testID={testID ? `${testID}-username` : undefined}
            accessibilityLabel={`User ${user.username}`}
          >
            {user.username}
          </Text>
          {user.bio && (
            <Text
              style={styles.bio}
              testID={testID ? `${testID}-bio` : undefined}
              numberOfLines={2}
            >
              {user.bio}
            </Text>
          )}
          <View style={styles.stats}>
            <Text style={styles.stat}>
              {user.stats.friend_count} friends
            </Text>
            <Text style={styles.stat}>
              {user.stats.parties_attended} parties
            </Text>
          </View>
        </View>
        {showFriendButton && (
          <Button
            title={friendButtonText}
            variant="secondary"
            size="small"
            onPress={onFriendPress}
            testID={testID ? `${testID}-friend-button` : undefined}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  bio: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  stats: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  stat: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: SPACING.md,
  },
});

