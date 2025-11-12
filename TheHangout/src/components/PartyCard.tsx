import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants';
import { Party } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - SPACING.lg * 2;

export interface PartyCardProps {
  party: Party;
  onPress: () => void;
  onLike: () => void;
  onJoin: () => void;
  currentUserId: string;
}

export function PartyCard({ party, onPress, onLike, onJoin, currentUserId }: PartyCardProps) {
  const [isLiked, setIsLiked] = useState(false); // Would check user likes
  const [isJoined, setIsJoined] = useState(party.attendees?.some(a => a.id === currentUserId) || false);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
    onLike();
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsJoined(!isJoined);
    onJoin();
  };

  const getTimeStatus = () => {
    const now = new Date();
    const createdTime = new Date(party.created_at);
    const hoursAgo = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60 * 60));

    if (party.status === 'ended') {
      return 'Ended';
    } else if (party.status === 'active') {
      if (hoursAgo < 1) {
        return '🔴 Live now';
      } else if (hoursAgo < 24) {
        return `${hoursAgo}h ago`;
      } else {
        return `${Math.floor(hoursAgo / 24)}d ago`;
      }
    }
    return 'Starting soon';
  };

  const getDistance = () => {
    const distance = Math.random() * 5 + 0.1;
    return `${distance.toFixed(1)} mi away`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.gradient}
        >
          {/* Header Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: party.photo_url || 'https://picsum.photos/400/200' }}
              style={styles.partyImage}
            />
            
            {/* Live Indicator */}
            {getTimeStatus().includes('Live') && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            
            {/* Trending Badge */}
            {party.is_trending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={16} color={COLORS.white} />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}
            
            {/* Like Button */}
            <TouchableOpacity
              style={[styles.likeButton, isLiked && styles.likeButtonActive]}
              onPress={handleLike}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? COLORS.pink : COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title and Host */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {party.title}
              </Text>
              <View style={styles.hostInfo}>
                <Image
                  source={{ uri: party.creator?.avatar_url || 'https://picsum.photos/32/32' }}
                  style={styles.hostAvatar}
                />
                <Text style={styles.hostName} numberOfLines={1}>
                  {party.creator?.username}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {party.description}
            </Text>

            {/* Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.gray400} />
                <Text style={styles.detailText}>{getTimeStatus()}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray400} />
                <Text style={styles.detailText}>{getDistance()}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color={COLORS.gray400} />
                <Text style={styles.detailText}>
                  {party.attendee_count || 0}/{party.max_attendees || '∞'}
                </Text>
              </View>
            </View>

            {/* Tags */}
            {party.tags && party.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {party.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {party.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{party.tags.length - 3}</Text>
                )}
              </View>
            )}

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.joinButton, isJoined && styles.joinButtonActive]}
                onPress={handleJoin}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isJoined ? "checkmark" : "add"}
                  size={18}
                  color={isJoined ? COLORS.dark : COLORS.white}
                />
                <Text style={[styles.joinButtonText, isJoined && styles.joinButtonTextActive]}>
                  {isJoined ? 'Joined' : 'Join Party'}
                </Text>
              </TouchableOpacity>

              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={14} color={COLORS.pink} />
                  <Text style={styles.statText}>{Math.floor(party.engagement_score * 10)}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble" size={14} color={COLORS.cyan} />
                  <Text style={styles.statText}>{party.view_count}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  blurContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  gradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.xl,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  partyImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  liveIndicator: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginRight: SPACING.xs,
  },
  liveText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    fontWeight: '700' as const as const,
  },
  trendingBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md + 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.9)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  trendingText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    fontWeight: '600' as const as const,
    marginLeft: SPACING.xs,
  },
  likeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    fontWeight: '700' as const as const,
    flex: 1,
    marginRight: SPACING.sm,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: SPACING.xs,
  },
  hostName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    fontWeight: '500' as const as const,
    flex: 1,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray300,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
    fontWeight: '500' as const as const,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.cyan,
    fontWeight: '500' as const as const,
  },
  moreTagsText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    fontWeight: '500' as const as const,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cyan,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    flex: 1,
    marginRight: SPACING.md,
  },
  joinButtonActive: {
    backgroundColor: COLORS.white,
  },
  joinButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: '600' as const as const,
  },
  joinButtonTextActive: {
    color: COLORS.dark,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  statText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    marginLeft: SPACING.xs,
    fontWeight: '500' as const as const,
  },
});

