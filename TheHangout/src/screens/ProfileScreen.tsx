import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATIONS } from '../constants';
import { Party } from '../types';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  isVerified: boolean;
  stats: {
    partiesHosted: number;
    partiesAttended: number;
    photosShared: number;
    friendsCount: number;
    totalVibes: number;
    currentStreak: number;
  };
  badges: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    unlockedAt: string;
  }[];
  recentParties: Party[];
  achievements: {
    thisWeek: number;
    thisMonth: number;
    totalPoints: number;
    rank: string;
    nextRankProgress: number;
  };
}

const mockProfile: UserProfile = {
  id: 'current-user',
  username: 'party_explorer',
  displayName: 'Alex Rivera',
  avatar: 'https://picsum.photos/120/120?random=100',
  bio: 'Party enthusiast ✨ Always down for good vibes and great music 🎵 Weekend warrior 🔥',
  location: 'San Francisco, CA',
  joinDate: '2023-06-15',
  isVerified: true,
  stats: {
    partiesHosted: 12,
    partiesAttended: 47,
    photosShared: 156,
    friendsCount: 234,
    totalVibes: 892,
    currentStreak: 5,
  },
  badges: [
    {
      id: '1',
      name: 'Party Starter',
      icon: '🚀',
      color: COLORS.orange,
      description: 'Hosted 10+ parties',
      unlockedAt: '2024-01-10',
    },
    {
      id: '2',
      name: 'Social Butterfly',
      icon: '🦋',
      color: COLORS.pink,
      description: 'Attended 25+ parties',
      unlockedAt: '2023-12-05',
    },
    {
      id: '3',
      name: 'Photo Master',
      icon: '📸',
      color: COLORS.cyan,
      description: 'Shared 100+ photos',
      unlockedAt: '2024-01-15',
    },
    {
      id: '4',
      name: 'Vibe Curator',
      icon: '✨',
      color: COLORS.success,
      description: 'Created amazing vibes',
      unlockedAt: '2023-11-20',
    },
  ],
  recentParties: [],
  achievements: {
    thisWeek: 125,
    thisMonth: 450,
    totalPoints: 8920,
    rank: 'Party Legend',
    nextRankProgress: 0.75,
  },
};

const STAT_ITEMS = [
  { key: 'partiesHosted', label: 'Hosted', icon: 'calendar', color: COLORS.orange },
  { key: 'partiesAttended', label: 'Attended', icon: 'people', color: COLORS.cyan },
  { key: 'photosShared', label: 'Photos', icon: 'camera', color: COLORS.pink },
  { key: 'friendsCount', label: 'Friends', icon: 'heart', color: COLORS.success },
] as const;

export function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'photos'>('stats');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.normal,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...ANIMATIONS.springConfig,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate stats after profile loads
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Navigate to settings');
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Navigate to edit profile');
  };

  const renderProfileHeader = () => (
    <Animated.View 
      style={[styles.profileHeader, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}
    >
      <BlurView intensity={15} style={styles.headerBlur}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.headerGradient}
        >
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSettingsPress}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Avatar and Basic Info */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </View>
              )}
            </View>
            
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            
            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}
            
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray400} />
              <Text style={styles.location}>{profile.location}</Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Rank Progress */}
          <View style={styles.rankSection}>
            <View style={styles.rankHeader}>
              <Text style={styles.rankTitle}>{profile.achievements.rank}</Text>
              <Text style={styles.rankPoints}>
                {profile.achievements.totalPoints.toLocaleString()} pts
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${profile.achievements.nextRankProgress * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(profile.achievements.nextRankProgress * 100)}% to next rank
              </Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );

  const renderStatsGrid = () => (
    <Animated.View 
      style={[styles.statsContainer, {
        opacity: statsAnim,
        transform: [{
          scale: statsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        }],
      }]}
    >
      <View style={styles.statsGrid}>
        {STAT_ITEMS.map((item, index) => (
          <View key={item.key} style={styles.statItem}>
            <BlurView intensity={10} style={styles.statBlur}>
              <LinearGradient
                colors={[`${item.color}20`, `${item.color}10`]}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={20} color={COLORS.white} />
                </View>
                <Text style={styles.statValue}>
                  {profile.stats[item.key as keyof typeof profile.stats]}
                </Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </LinearGradient>
            </BlurView>
          </View>
        ))}
      </View>
      
      {/* Additional Stats */}
      <View style={styles.additionalStats}>
        <BlurView intensity={10} style={styles.additionalStatsBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
            style={styles.additionalStatsGradient}
          >
            <View style={styles.statRow}>
              <View style={styles.statColumn}>
                <Text style={styles.statBigNumber}>{profile.stats.totalVibes}</Text>
                <Text style={styles.statBigLabel}>Total Vibes</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statColumn}>
                <View style={styles.streakContainer}>
                  <Text style={styles.statBigNumber}>{profile.stats.currentStreak}</Text>
                  <Ionicons name="flame" size={20} color={COLORS.orange} />
                </View>
                <Text style={styles.statBigLabel}>Day Streak</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );

  const renderBadges = () => (
    <View style={styles.badgesContainer}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.badgesGrid}>
        {profile.badges.map((badge) => (
          <TouchableOpacity key={badge.id} style={styles.badgeItem}>
            <BlurView intensity={10} style={styles.badgeBlur}>
              <LinearGradient
                colors={[`${badge.color}20`, `${badge.color}10`]}
                style={styles.badgeGradient}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPhotos = () => (
    <View style={styles.photosContainer}>
      <Text style={styles.sectionTitle}>Recent Photos</Text>
      <View style={styles.photosGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <TouchableOpacity key={index} style={styles.photoItem}>
            <Image
              source={{ uri: `https://picsum.photos/120/120?random=${index + 200}` }}
              style={styles.photo}
            />
            <BlurView intensity={20} style={styles.photoOverlay}>
              <Ionicons name="heart" size={16} color={COLORS.white} />
              <Text style={styles.photoLikes}>{Math.floor(Math.random() * 50) + 5}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <BlurView intensity={15} style={styles.tabBlur}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.tabGradient}
        >
          {(['stats', 'badges', 'photos'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </LinearGradient>
      </BlurView>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'badges':
        return renderBadges();
      case 'photos':
        return renderPhotos();
      default:
        return renderStatsGrid();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
      >
        {renderProfileHeader()}
        {renderTabButtons()}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xxxl,
  },
  profileHeader: {
    margin: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerBlur: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  headerGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.xl,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    paddingBottom: 0,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  avatarSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.cyan,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.dark,
  },
  displayName: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    fontWeight: '700' as const,
    marginBottom: SPACING.xs,
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    marginBottom: SPACING.md,
  },
  bio: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray300,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  location: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
  },
  editButton: {
    backgroundColor: COLORS.cyan,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  editButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  rankSection: {
    padding: SPACING.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rankTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  rankPoints: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
    fontWeight: '600' as const,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },
  progressText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    textAlign: 'center',
  },
  tabContainer: {
    margin: SPACING.lg,
    marginTop: 0,
  },
  tabBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  tabGradient: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: COLORS.cyan,
  },
  tabText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gray400,
    fontWeight: '600' as const,
  },
  activeTabText: {
    color: COLORS.white,
  },
  statsContainer: {
    margin: SPACING.lg,
    marginTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statItem: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
  },
  statBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  statGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    fontWeight: '700' as const,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    fontWeight: '500' as const,
  },
  additionalStats: {
    marginTop: SPACING.sm,
  },
  additionalStatsBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  additionalStatsGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
  },
  statRow: {
    flexDirection: 'row',
    padding: SPACING.lg,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.lg,
  },
  statBigNumber: {
    ...TYPOGRAPHY.display2,
    color: COLORS.white,
    fontWeight: '700' as const,
    marginBottom: SPACING.xs,
  },
  statBigLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray400,
    fontWeight: '500' as const,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    fontWeight: '700' as const,
    marginBottom: SPACING.lg,
  },
  badgesContainer: {
    margin: SPACING.lg,
    marginTop: 0,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badgeItem: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
  },
  badgeBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  badgeGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  badgeName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  badgeDescription: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 16,
  },
  photosContainer: {
    margin: SPACING.lg,
    marginTop: 0,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoItem: {
    width: (width - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    height: (width - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  photoLikes: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: '600' as const,
  },
});