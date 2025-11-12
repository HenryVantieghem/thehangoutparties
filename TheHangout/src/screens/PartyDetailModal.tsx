import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { Avatar, Badge, PhotoCard, MessageBubble, Button } from '../components';
import { usePartyStore, usePhotoStore, useMessageStore, useAuthStore } from '../stores';
import { formatTimeAgo, formatDistance } from '../utils';
import { TextInput } from 'react-native';
import { User } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PartyTab = 'photos' | 'chat';

export default function PartyDetailModal() {
  const navigation = useNavigation();
  const route = useRoute();
  const partyId = (route.params as any)?.partyId;
  const { parties, joinParty, loading } = usePartyStore();
  const { photos } = usePhotoStore();
  const { messages, sendMessage } = useMessageStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<PartyTab>('photos');
  const [messageText, setMessageText] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const party = parties.find((p) => p.id === partyId);
  const partyPhotos = photos.filter((p: any) => p.party_id === partyId);
  const partyMessages = messages.filter((m: any) => m.party_id === partyId);
  const isAttending = party?.attendees?.some((a: User) => a.id === user?.id) || false;

  useEffect(() => {
    if (partyId) {
      // Load party details, photos, messages
      // Subscribe to real-time updates
    }
  }, [partyId]);

  const handleJoin = async () => {
    if (!partyId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await joinParty(partyId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to join party:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!partyId || !messageText.trim()) return;
    try {
      await sendMessage(partyId, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTabChange = (tab: PartyTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  if (!party) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Party not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Share party
            }}
            style={styles.headerButton}
          >
            <Ionicons name="share-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Photo Carousel */}
        {partyPhotos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentPhotoIndex(index);
            }}
            style={styles.carousel}
          >
            {partyPhotos.map((photo: any, index: number) => (
              <Image
                key={photo.id}
                source={{ uri: photo.photo_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="image-outline" size={48} color={COLORS.gray600} />
          </View>
        )}

        {/* Party Info */}
        <View style={styles.infoSection}>
          <Text style={styles.partyTitle}>{party.title}</Text>
          {party.description && (
            <Text style={styles.partyDescription}>{party.description}</Text>
          )}

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={COLORS.cyan} />
            <Text style={styles.infoText}>
              {party.address || `${party.latitude.toFixed(4)}, ${party.longitude.toFixed(4)}`}
            </Text>
          </View>

          {/* Attendees */}
          <View style={styles.attendeesSection}>
            <View style={styles.attendeesHeader}>
              <Text style={styles.sectionTitle}>
                {party.attendee_count} {party.attendee_count === 1 ? 'attendee' : 'attendees'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // View all attendees
                }}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attendeesList}
            >
              {party.attendees?.slice(0, 10).map((attendee) => (
                <Avatar
                  key={attendee.id}
                  uri={attendee.avatar_url}
                  name={attendee.username}
                  size="medium"
                  style={styles.attendeeAvatar}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => handleTabChange('photos')}
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'photos' && styles.tabTextActive,
              ]}
            >
              Photos ({partyPhotos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('chat')}
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'chat' && styles.tabTextActive,
              ]}
            >
              Chat ({partyMessages.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'photos' ? (
          <View style={styles.tabContent}>
            {partyPhotos.length > 0 ? (
              <FlatList
                data={partyPhotos}
                numColumns={3}
                renderItem={({ item }) => (
                  <PhotoCard
                    photo={item}
                    onPress={() =>
                      (navigation as any).navigate('PhotoDetail', { photoId: item.id })
                    }
                  />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No photos yet</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.chatContent}>
            {partyMessages.length > 0 ? (
              <FlatList
                data={partyMessages}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isOwn={item.user_id === user?.id}
                    timestamp={item.created_at}
                  />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            )}
            <View style={styles.chatInput}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.gray500}
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                style={[
                  styles.sendButton,
                  !messageText.trim() && styles.sendButtonDisabled,
                ]}
              >
                <Ionicons name="send" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionSection}>
          {isAttending ? (
            <Button
              title="Attending"
              variant="primary"
              size="large"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Leave party logic
              }}
            />
          ) : (
            <Button
              title="Join Party"
              variant="primary"
              size="large"
              onPress={handleJoin}
              loading={loading}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  carousel: {
    height: 300,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  heroPlaceholder: {
    height: 300,
    backgroundColor: COLORS.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: SPACING.lg,
  },
  partyTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  partyDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  attendeesSection: {
    marginTop: SPACING.lg,
  },
  attendeesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.white,
  },
  viewAllText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
  },
  attendeesList: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    marginRight: -SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
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
  chatContent: {
    flex: 1,
    padding: SPACING.md,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray700,
    opacity: 0.5,
  },
  actionSection: {
    padding: SPACING.lg,
  },
});
