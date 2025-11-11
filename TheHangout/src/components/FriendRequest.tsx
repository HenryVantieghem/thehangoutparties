import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Friend } from '../types';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { COLORS, SPACING } from '../../constants';

export interface FriendRequestProps {
  /** Friend request data */
  request: Friend;
  /** User name */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string | null;
  /** On accept handler */
  onAccept?: () => void;
  /** On decline handler */
  onDecline?: () => void;
  /** On cancel handler (for outgoing requests) */
  onCancel?: () => void;
  /** Is outgoing request */
  isOutgoing?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Friend request item component
 */
export const FriendRequest: React.FC<FriendRequestProps> = ({
  request,
  userName,
  userAvatar,
  onAccept,
  onDecline,
  onCancel,
  isOutgoing = false,
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
          uri={userAvatar}
          name={userName}
          size="medium"
          testID={testID ? `${testID}-avatar` : undefined}
        />
        <View style={styles.info}>
          <Text
            style={styles.username}
            testID={testID ? `${testID}-username` : undefined}
          >
            {userName || 'Unknown User'}
          </Text>
          <Text style={styles.status}>
            {isOutgoing ? 'Request sent' : 'Wants to be friends'}
          </Text>
        </View>
        <View style={styles.actions}>
          {isOutgoing ? (
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={onCancel}
              testID={testID ? `${testID}-cancel-button` : undefined}
            />
          ) : (
            <>
              <Button
                title="Accept"
                variant="primary"
                size="small"
                onPress={onAccept}
                style={styles.acceptButton}
                testID={testID ? `${testID}-accept-button` : undefined}
              />
              <Button
                title="Decline"
                variant="secondary"
                size="small"
                onPress={onDecline}
                testID={testID ? `${testID}-decline-button` : undefined}
              />
            </>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.sm,
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
  status: {
    fontSize: 12,
    color: COLORS.gray,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  acceptButton: {
    marginRight: SPACING.xs,
  },
});

