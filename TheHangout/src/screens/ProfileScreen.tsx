import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { Avatar, Badge, PartyCard, PhotoCard, Button } from '../components';
import { useAuthStore, usePartyStore, usePhotoStore, useFriendStore } from '../stores';
import { formatNumberCompact } from '../utils';
import { User } from '../types';

type ProfileTab = 'parties' | 'photos' | 'friends';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuthStore();
  const { parties } = usePartyStore();
  const { photos } = usePhotoStore();
  const { friends } = useFriendStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('parties');
  const [isOwnProfile] = useState(true); // In production, check if viewing own profile

  const userParties = parties.filter((p) => p.created_by === user?.id);
  const userPhotos = photos.filter((p) => p.user_id === user?.id);

  const handleTabChange = (tab: ProfileTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signOut();
      // Navigation handled by RootNavigator
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'parties':
        return (
          <FlatList
            data={userParties}
            renderItem={({ item }) => (
              <PartyCard
                party={item}
                onPress={() =>
                  navigation.navigate('PartyDetail' as never, { partyId: item.id } as never)
                }
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <EmptyState message="No parties yet" subtitle="Create your first party!" />
            }
          />
        );
      case 'photos':
        return (
          <FlatList
            data={userPhotos}
            numColumns={3}
            renderItem={({ item }) => (
              <PhotoCard
                photo={item}
                onPress={() =>
                  navigation.navigate('PhotoDetail' as never, { photoId: item.id } as never)
                }
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <EmptyState message="No photos yet" subtitle="Share your first moment!" />
            }
          />
        );
      case 'friends':
        return (
          <FlatList
            data={friends}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <Avatar
                  uri={item.friend?.avatar_url}
                  name={item.friend?.username}
                  size="medium"
                />
                <Text style={styles.friendName}>{item.friend?.username}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <EmptyState message="No friends yet" subtitle="Start connecting!" />
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarSection}>
            <Avatar
              uri={user?.avatar_url}
              name={user?.username}
              size="xlarge"
              style={styles.avatar}
            />
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Open avatar picker
                }}
              >
                <Ionicons name="camera" size={16} color={COLORS.dark} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.username}>{user?.username || 'User'}</Text>
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatNumberCompact(user?.friend_count || 0)}
              </Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatNumberCompact(user?.parties_attended || 0)}
              </Text>
              <Text style={styles.statLabel}>Parties</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatNumberCompact(user?.photos_posted || 0)}
              </Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {isOwnProfile ? (
              <>
                <Button
                  title="Settings"
                  variant="secondary"
                  size="medium"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to settings
                  }}
                  style={styles.actionButton}
                />
                <Button
                  title="Sign Out"
                  variant="secondary"
                  size="medium"
                  onPress={handleSignOut}
                  style={styles.actionButton}
                />
              </>
            ) : (
              <>
                <Button
                  title="Add Friend"
                  variant="primary"
                  size="medium"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Add friend logic
                  }}
                  style={styles.actionButton}
                />
                <Button
                  title="Block"
                  variant="secondary"
                  size="medium"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Block user logic
                  }}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['parties', 'photos', 'friends'] as ProfileTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const EmptyState = ({ message, subtitle }: { message: string; subtitle: string }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{message}</Text>
    <Text style={styles.emptySubtext}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    borderWidth: 3,
    borderColor: COLORS.cyan,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  username: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  bio: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
  },
  statLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray500,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.cyan,
  },
  tabText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.cyan,
  },
  tabContent: {
    padding: SPACING.md,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  friendName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    marginLeft: SPACING.md,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray600,
  },
});
