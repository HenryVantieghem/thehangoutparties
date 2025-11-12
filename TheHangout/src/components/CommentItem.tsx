import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Comment } from '../types';
import { Avatar } from './Avatar';
import { COLORS, SPACING } from '../../constants';
import { formatDistanceToNow } from 'date-fns';

export interface CommentItemProps {
  /** Comment data */
  comment: Comment;
  /** User name who made the comment */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string | null;
  /** Comment timestamp */
  timestamp?: Date | string;
  /** Is comment from current user */
  isOwn?: boolean;
  /** On delete handler */
  onDelete?: () => void;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Comment item component with delete option
 */
export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  userName,
  userAvatar,
  timestamp,
  isOwn = false,
  onDelete,
  style,
  testID,
}) => {
  const timeText = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : '';

  return (
    <View
      testID={testID}
      style={style ? [styles.container, style] : styles.container}
    >
      <Avatar
        uri={userAvatar}
        name={userName}
        size="small"
        style={styles.avatar}
        testID={testID ? `${testID}-avatar` : undefined}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={styles.username}
            testID={testID ? `${testID}-username` : undefined}
          >
            {userName || 'Unknown'}
          </Text>
          {timeText && (
            <Text
              style={styles.timestamp}
              testID={testID ? `${testID}-timestamp` : undefined}
            >
              {timeText}
            </Text>
          )}
        </View>
        <Text
          style={styles.text}
          testID={testID ? `${testID}-text` : undefined}
        >
          {comment.text}
        </Text>
      </View>
      {isOwn && onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteButton}
          testID={testID ? `${testID}-delete-button` : undefined}
          accessibilityLabel="Delete comment"
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  avatar: {
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  username: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
    marginRight: SPACING.xs,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
  },
  text: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
  },
  deleteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600' as const,
  },
});

