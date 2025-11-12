import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants';
import { Party } from '../types';
import { 
  useResponsive, 
  createResponsiveStyle, 
  getImageDimensions 
} from '../utils/responsive';
import { 
  createListItemAccessibility, 
  createButtonAccessibility,
  createImageAccessibility 
} from '../utils/accessibility';

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
  
  // Get responsive values
  const {
    spacing,
    radius,
    typography,
    touchTargets,
    isTablet,
    isLandscape,
    getColumnWidth,
    getImageDimensions,
    width: screenWidth,
  } = useResponsive();

  // Calculate responsive card dimensions
  const cardWidth = isTablet 
    ? getColumnWidth(isLandscape ? 2 : 1) // 2 columns landscape, 1 portrait on tablet
    : screenWidth - (spacing.lg * 2); // Full width minus margins on phone

  const imageAspectRatio = 16 / 9; // Standard aspect ratio
  const imageHeight = isTablet ? 160 : 200; // Smaller images on tablet

  const handleLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
    onLike();
  };

  const handleJoin = async () => {
    await Haptics.impactAsync(
      isTablet ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy
    );
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

  // Create responsive styles
  const responsiveStyles = createResponsiveStyle({
    default: {
      container: {
        width: cardWidth,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
      },
      blurContainer: {
        borderRadius: radius.xl,
      },
      gradient: {
        borderRadius: radius.xl,
      },
      imageContainer: {
        height: imageHeight,
      },
      partyImage: {
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
      },
      liveIndicator: {
        top: spacing.md,
        left: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
      },
      liveDot: {
        marginRight: spacing.xs,
      },
      trendingBadge: {
        top: spacing.md,
        right: spacing.md + 44,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
      },
      trendingText: {
        marginLeft: spacing.xs,
      },
      likeButton: {
        top: spacing.md,
        right: spacing.md,
      },
      content: {
        padding: spacing.lg,
      },
      titleRow: {
        marginBottom: spacing.sm,
      },
      title: {
        marginRight: spacing.sm,
      },
      hostAvatar: {
        marginRight: spacing.xs,
      },
      description: {
        marginBottom: spacing.md,
      },
      detailsRow: {
        marginBottom: spacing.md,
      },
      detailText: {
        marginLeft: spacing.xs,
      },
      tagsContainer: {
        marginBottom: spacing.md,
      },
      tag: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
      },
      joinButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        marginRight: spacing.md,
      },
      joinButtonText: {
        marginLeft: spacing.xs,
      },
      statItem: {
        marginLeft: spacing.md,
      },
      statText: {
        marginLeft: spacing.xs,
      },
    },
    tablet: {
      container: {
        marginHorizontal: spacing.md,
        marginVertical: spacing.md,
      },
      content: {
        padding: spacing.xl,
      },
    },
    landscape: {
      imageContainer: {
        height: isTablet ? 140 : 180, // Smaller images in landscape
      },
    },
  });

  // Accessibility configuration
  const cardAccessibility = createListItemAccessibility(
    `${party.title} party`,
    `${party.description}, ${party.attendee_count || 0} attendees`,
    undefined,
    true
  );

  const likeButtonAccessibility = createButtonAccessibility(
    `${isLiked ? 'Unlike' : 'Like'} ${party.title}`,
    isLiked ? 'Remove from favorites' : 'Add to favorites',
    false,
    isLiked
  );

  const joinButtonAccessibility = createButtonAccessibility(
    `${isJoined ? 'Leave' : 'Join'} ${party.title}`,
    isJoined ? 'Leave this party' : 'Join this party',
    false,
    isJoined
  );

  return (
    <TouchableOpacity
      style={[styles.container, responsiveStyles.container]}
      onPress={onPress}
      activeOpacity={0.9}
      {...cardAccessibility}
    >
      <BlurView intensity={20} style={[styles.blurContainer, responsiveStyles.blurContainer]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={[styles.gradient, responsiveStyles.gradient]}
        >
          {/* Header Image */}
          <View style={[styles.imageContainer, responsiveStyles.imageContainer]}>
            <Image
              source={{ uri: party.photo_url || 'https://picsum.photos/400/200' }}
              style={[styles.partyImage, responsiveStyles.partyImage]}
            />
            
            {/* Live Indicator */}
            {getTimeStatus().includes('Live') && (
              <View style={[styles.liveIndicator, responsiveStyles.liveIndicator]}>
                <View style={[styles.liveDot, responsiveStyles.liveDot]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            
            {/* Trending Badge */}
            {party.is_trending && (
              <View style={[styles.trendingBadge, responsiveStyles.trendingBadge]}>
                <Ionicons name="trending-up" size={16} color={COLORS.white} />
                <Text style={[styles.trendingText, responsiveStyles.trendingText]}>Trending</Text>
              </View>
            )}
            
            {/* Like Button */}
            <TouchableOpacity
              style={[styles.likeButton, responsiveStyles.likeButton, isLiked && styles.likeButtonActive]}
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
          <View style={[styles.content, responsiveStyles.content]}>
            {/* Title and Host */}
            <View style={[styles.titleRow, responsiveStyles.titleRow]}>
              <Text style={[styles.title, responsiveStyles.title]} numberOfLines={2}>
                {party.title}
              </Text>
              <View style={styles.hostInfo}>
                <Image
                  source={{ uri: party.creator?.avatar_url || 'https://picsum.photos/32/32' }}
                  style={[styles.hostAvatar, responsiveStyles.hostAvatar]}
                />
                <Text style={styles.hostName} numberOfLines={1}>
                  {party.creator?.username}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={[styles.description, responsiveStyles.description]} numberOfLines={2}>
              {party.description}
            </Text>

            {/* Details Row */}
            <View style={[styles.detailsRow, responsiveStyles.detailsRow]}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.gray400} />
                <Text style={[styles.detailText, responsiveStyles.detailText]}>{getTimeStatus()}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray400} />
                <Text style={[styles.detailText, responsiveStyles.detailText]}>{getDistance()}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color={COLORS.gray400} />
                <Text style={[styles.detailText, responsiveStyles.detailText]}>
                  {party.attendee_count || 0}/{party.max_attendees || '∞'}
                </Text>
              </View>
            </View>

            {/* Tags */}
            {party.tags && party.tags.length > 0 && (
              <View style={[styles.tagsContainer, responsiveStyles.tagsContainer]}>
                {party.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={[styles.tag, responsiveStyles.tag]}>
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
                style={[styles.joinButton, responsiveStyles.joinButton, isJoined && styles.joinButtonActive]}
                onPress={handleJoin}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isJoined ? "checkmark" : "add"}
                  size={18}
                  color={isJoined ? COLORS.dark : COLORS.white}
                />
                <Text style={[styles.joinButtonText, responsiveStyles.joinButtonText, isJoined && styles.joinButtonTextActive]}>
                  {isJoined ? 'Joined' : 'Join Party'}
                </Text>
              </TouchableOpacity>

              <View style={styles.stats}>
                <View style={[styles.statItem, responsiveStyles.statItem]}>
                  <Ionicons name="heart" size={14} color={COLORS.pink} />
                  <Text style={[styles.statText, responsiveStyles.statText]}>{Math.floor(party.engagement_score * 10)}</Text>
                </View>
                
                <View style={[styles.statItem, responsiveStyles.statItem]}>
                  <Ionicons name="chatbubble" size={14} color={COLORS.cyan} />
                  <Text style={[styles.statText, responsiveStyles.statText]}>{party.view_count}</Text>
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
    // Width handled by responsiveStyles
  },
  blurContainer: {
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  gradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    position: 'relative',
  },
  partyImage: {
    width: '100%',
    height: '100%',
  },
  liveIndicator: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  liveText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  trendingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.9)',
  },
  trendingText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  likeButton: {
    position: 'absolute',
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
    // Padding handled by responsiveStyles
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    fontWeight: '700' as const,
    flex: 1,
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
  },
  hostName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    fontWeight: '500' as const,
    flex: 1,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray300,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    fontWeight: '500' as const,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  tagText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.cyan,
    fontWeight: '500' as const,
  },
  moreTagsText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    fontWeight: '500' as const,
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
    flex: 1,
  },
  joinButtonActive: {
    backgroundColor: COLORS.white,
  },
  joinButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
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
  },
  statText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    fontWeight: '500' as const,
  },
});

