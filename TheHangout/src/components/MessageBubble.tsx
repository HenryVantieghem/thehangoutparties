import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Message } from '../types';
import { Avatar } from './Avatar';
import { COLORS, SPACING } from '../../constants';
import { formatDistanceToNow } from 'date-fns';

export interface MessageBubbleProps {
  /** Message data */
  message: Message;
  /** User name who sent the message */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string | null;
  /** Is message from current user */
  isOwn?: boolean;
  /** Message timestamp */
  timestamp?: Date | string;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Chat message bubble component
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  userName,
  userAvatar,
  isOwn = false,
  timestamp,
  style,
  testID,
}) => {
  const timeText = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : '';

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        isOwn && styles.containerOwn,
        style,
      ]}
    >
      {!isOwn && (
        <Avatar
          uri={userAvatar}
          name={userName}
          size="small"
          style={styles.avatar}
          testID={testID ? `${testID}-avatar` : undefined}
        />
      )}
      <View
        style={[
          styles.bubble,
          isOwn && styles.bubbleOwn,
        ]}
      >
        {!isOwn && userName && (
          <Text
            style={styles.username}
            testID={testID ? `${testID}-username` : undefined}
          >
            {userName}
          </Text>
        )}
        <Text
          style={[
            styles.text,
            isOwn && styles.textOwn,
          ]}
          testID={testID ? `${testID}-text` : undefined}
        >
          {message.text}
        </Text>
        {timeText && (
          <Text
            style={[
              styles.timestamp,
              isOwn && styles.timestampOwn,
            ]}
            testID={testID ? `${testID}-timestamp` : undefined}
          >
            {timeText}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'flex-end',
  },
  containerOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: SPACING.xs,
  },
  bubble: {
    maxWidth: '75%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: SPACING.sm,
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: COLORS.cyan,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.cyan,
    marginBottom: SPACING.xs,
  },
  text: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
  },
  textOwn: {
    color: COLORS.dark,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    alignSelf: 'flex-end',
  },
  timestampOwn: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

