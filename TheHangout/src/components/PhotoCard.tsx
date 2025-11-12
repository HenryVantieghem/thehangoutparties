import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Photo } from '../types';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { COLORS, SPACING } from '../../constants';

export interface PhotoCardProps {
  /** Photo data */
  photo: Photo;
  /** User name who posted */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string | null;
  /** Number of comments */
  commentsCount?: number;
  /** Is photo liked by current user */
  isLiked?: boolean;
  /** On like press handler */
  onLikePress?: () => void;
  /** On comment press handler */
  onCommentPress?: () => void;
  /** On photo press handler */
  onPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Photo card component with likes and comments
 */
export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  userName,
  userAvatar,
  commentsCount = 0,
  isLiked = false,
  onLikePress,
  onCommentPress,
  onPress,
  style,
  testID,
}) => {
  return (
    <Card
      testID={testID}
      style={style ? [styles.card, style] : styles.card}
      padding="none"
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={userAvatar}
          name={userName}
          size="small"
          testID={testID ? `${testID}-avatar` : undefined}
        />
        {userName && (
          <Text
            style={styles.username}
            testID={testID ? `${testID}-username` : undefined}
          >
            {userName}
          </Text>
        )}
      </View>

      {/* Photo */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        testID={testID ? `${testID}-photo` : undefined}
      >
        <Image
          source={{ uri: photo.photo_url }}
          style={styles.photo}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onLikePress}
          style={styles.actionButton}
          testID={testID ? `${testID}-like-button` : undefined}
          accessibilityLabel={isLiked ? 'Unlike photo' : 'Like photo'}
        >
          <Text style={[styles.actionIcon, isLiked && styles.liked]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionText}>{photo.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCommentPress}
          style={styles.actionButton}
          testID={testID ? `${testID}-comment-button` : undefined}
          accessibilityLabel="View comments"
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {photo.caption && (
        <View style={styles.caption}>
          <Text
            style={styles.captionText}
            testID={testID ? `${testID}-caption` : undefined}
            numberOfLines={3}
          >
            <Text style={styles.captionUsername}>{userName} </Text>
            {photo.caption}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  username: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.darkSecondary,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.sm,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  liked: {
    color: COLORS.pink,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  caption: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  captionUsername: {
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  captionText: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
  },
});

