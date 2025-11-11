import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Party } from '../types';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { COLORS, SPACING } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 200;

export interface PartyCardProps {
  /** Party data */
  party: Party;
  /** Attendee avatars */
  attendeeAvatars?: Array<{ id: string; uri?: string | null; name: string }>;
  /** Party photos for carousel */
  photos?: string[];
  /** On card press handler */
  onPress?: () => void;
  /** On join press handler */
  onJoinPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Party card component with photo carousel and preview
 */
export const PartyCard: React.FC<PartyCardProps> = ({
  party,
  attendeeAvatars = [],
  photos = [],
  onPress,
  onJoinPress,
  style,
  testID,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const displayPhotos = party.photo ? [party.photo, ...photos] : photos;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={`Party: ${party.title}`}
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.9}
      style={style}
    >
      <Card style={styles.card} padding="none">
        {/* Photo Carousel */}
        {displayPhotos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setCurrentPhotoIndex(index);
            }}
            style={styles.carousel}
            testID={testID ? `${testID}-carousel` : undefined}
          >
            {displayPhotos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
                testID={testID ? `${testID}-photo-${index}` : undefined}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No photos</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text
                style={styles.title}
                testID={testID ? `${testID}-title` : undefined}
                numberOfLines={1}
              >
                {party.title}
              </Text>
              {party.description && (
                <Text
                  style={styles.description}
                  testID={testID ? `${testID}-description` : undefined}
                  numberOfLines={2}
                >
                  {party.description}
                </Text>
              )}
            </View>
            <Badge
              text={party.attendees}
              variant="count"
              testID={testID ? `${testID}-attendees-badge` : undefined}
            />
          </View>

          {/* Attendees */}
          {attendeeAvatars.length > 0 && (
            <View style={styles.attendees}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarsScroll}
              >
                {attendeeAvatars.slice(0, 10).map((attendee) => (
                  <Avatar
                    key={attendee.id}
                    uri={attendee.uri}
                    name={attendee.name}
                    size="small"
                    style={styles.avatar}
                  />
                ))}
                {party.attendees > 10 && (
                  <View style={styles.moreAvatars}>
                    <Text style={styles.moreText}>
                      +{party.attendees - 10}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          {onJoinPress && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={onJoinPress}
              testID={testID ? `${testID}-join-button` : undefined}
            >
              <Text style={styles.joinButtonText}>Join Party</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  carousel: {
    height: CAROUSEL_HEIGHT,
  },
  photo: {
    width: SCREEN_WIDTH - SPACING.lg * 2,
    height: CAROUSEL_HEIGHT,
    resizeMode: 'cover',
  },
  placeholder: {
    height: CAROUSEL_HEIGHT,
    backgroundColor: COLORS.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  attendees: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  avatarsScroll: {
    flexDirection: 'row',
  },
  avatar: {
    marginRight: -SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  moreAvatars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  moreText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  joinButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.cyan,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: COLORS.dark,
    fontWeight: '600',
    fontSize: 14,
  },
});

