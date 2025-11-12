import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../ui/LoadingComponents';
import { useTheme } from '../../hooks/useTheme';

// Party card skeleton
export interface PartyCardSkeletonProps {
  style?: ViewStyle;
  showImage?: boolean;
}

export const PartyCardSkeleton: React.FC<PartyCardSkeletonProps> = ({
  style,
  showImage = true,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.partyCard, { backgroundColor: theme.colors.surface }, style]}>
      {showImage && (
        <Skeleton
          width="100%"
          height={200}
          borderRadius={12}
          style={styles.partyImage}
        />
      )}
      
      <View style={styles.partyContent}>
        <View style={styles.partyHeader}>
          <Skeleton width="70%" height={20} borderRadius={6} />
          <Skeleton width={60} height={24} borderRadius={12} />
        </View>
        
        <Skeleton
          width="100%"
          height={16}
          borderRadius={4}
          style={styles.partyDescription}
        />
        <Skeleton width="80%" height={16} borderRadius={4} />
        
        <View style={styles.partyMeta}>
          <View style={styles.partyLocation}>
            <Skeleton width={16} height={16} borderRadius={8} />
            <Skeleton width="60%" height={14} borderRadius={4} />
          </View>
          
          <View style={styles.partyStats}>
            <Skeleton width={40} height={14} borderRadius={4} />
            <Skeleton width={30} height={14} borderRadius={4} />
          </View>
        </View>
        
        <View style={styles.partyFooter}>
          <View style={styles.partyAttendees}>
            {[...Array(3)].map((_, index) => (
              <Skeleton
                key={index}
                width={32}
                height={32}
                borderRadius={16}
                style={index > 0 ? { marginLeft: -8 } : undefined}
              />
            ))}
            <Skeleton width={40} height={14} borderRadius={4} style={{ marginLeft: 8 }} />
          </View>
          
          <Skeleton width={80} height={36} borderRadius={18} />
        </View>
      </View>
    </View>
  );
};

// User profile skeleton
export interface UserProfileSkeletonProps {
  style?: ViewStyle;
  variant?: 'card' | 'list' | 'full';
}

export const UserProfileSkeleton: React.FC<UserProfileSkeletonProps> = ({
  style,
  variant = 'card',
}) => {
  const theme = useTheme();

  if (variant === 'list') {
    return (
      <View style={[styles.userList, { backgroundColor: theme.colors.surface }, style]}>
        <Skeleton width={48} height={48} borderRadius={24} />
        
        <View style={styles.userListContent}>
          <Skeleton width="60%" height={16} borderRadius={4} />
          <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>
    );
  }

  if (variant === 'full') {
    return (
      <View style={[styles.userFull, { backgroundColor: theme.colors.surface }, style]}>
        <View style={styles.userFullHeader}>
          <Skeleton width="100%" height={120} borderRadius={12} />
          
          <View style={styles.userFullAvatar}>
            <Skeleton width={80} height={80} borderRadius={40} />
          </View>
        </View>
        
        <View style={styles.userFullContent}>
          <Skeleton width="50%" height={24} borderRadius={6} />
          <Skeleton width="30%" height={16} borderRadius={4} style={{ marginTop: 4 }} />
          
          <Skeleton
            width="90%"
            height={16}
            borderRadius={4}
            style={{ marginTop: 12 }}
          />
          <Skeleton width="70%" height={16} borderRadius={4} style={{ marginTop: 4 }} />
          
          <View style={styles.userFullStats}>
            <View style={styles.userStat}>
              <Skeleton width={32} height={20} borderRadius={4} />
              <Skeleton width={40} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.userStat}>
              <Skeleton width={32} height={20} borderRadius={4} />
              <Skeleton width={40} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.userStat}>
              <Skeleton width={32} height={20} borderRadius={4} />
              <Skeleton width={40} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
          
          <Skeleton width="100%" height={44} borderRadius={22} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  // Card variant
  return (
    <View style={[styles.userCard, { backgroundColor: theme.colors.surface }, style]}>
      <Skeleton width={64} height={64} borderRadius={32} />
      
      <View style={styles.userCardContent}>
        <Skeleton width="70%" height={18} borderRadius={4} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
        
        <View style={styles.userCardStats}>
          <Skeleton width={40} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

// Message skeleton
export interface MessageSkeletonProps {
  style?: ViewStyle;
  isOwn?: boolean;
  showAvatar?: boolean;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  style,
  isOwn = false,
  showAvatar = true,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.message, isOwn && styles.messageOwn, style]}>
      {showAvatar && !isOwn && (
        <Skeleton width={32} height={32} borderRadius={16} />
      )}
      
      <View style={[
        styles.messageContent,
        isOwn && styles.messageContentOwn,
        !showAvatar && styles.messageContentNoAvatar,
      ]}>
        <View style={[
          styles.messageBubble,
          { backgroundColor: theme.colors.surfaceVariant },
          isOwn && { backgroundColor: theme.colors.primaryContainer },
        ]}>
          <Skeleton
            width={Math.random() * 60 + 40 + '%'}
            height={16}
            borderRadius={4}
          />
          
          {Math.random() > 0.6 && (
            <Skeleton
              width={Math.random() * 40 + 30 + '%'}
              height={16}
              borderRadius={4}
              style={{ marginTop: 4 }}
            />
          )}
        </View>
        
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      
      {showAvatar && isOwn && (
        <Skeleton width={32} height={32} borderRadius={16} />
      )}
    </View>
  );
};

// Photo grid skeleton
export interface PhotoGridSkeletonProps {
  style?: ViewStyle;
  columns?: number;
  count?: number;
}

export const PhotoGridSkeleton: React.FC<PhotoGridSkeletonProps> = ({
  style,
  columns = 3,
  count = 9,
}) => {
  const itemSize = 100; // Approximate size for each photo
  
  return (
    <View style={[styles.photoGrid, { gap: 8 }, style]}>
      {[...Array(count)].map((_, index) => (
        <Skeleton
          key={index}
          width={itemSize}
          height={itemSize}
          borderRadius={8}
        />
      ))}
    </View>
  );
};

// List skeleton for generic lists
export interface ListSkeletonProps {
  style?: ViewStyle;
  itemCount?: number;
  itemHeight?: number;
  showDivider?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  style,
  itemCount = 5,
  itemHeight = 60,
  showDivider = true,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.list, style]}>
      {[...Array(itemCount)].map((_, index) => (
        <React.Fragment key={index}>
          <View style={[styles.listItem, { height: itemHeight }]}>
            <Skeleton width={40} height={40} borderRadius={20} />
            
            <View style={styles.listItemContent}>
              <Skeleton width="70%" height={16} borderRadius={4} />
              <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
            
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
          
          {showDivider && index < itemCount - 1 && (
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// Search results skeleton
export const SearchResultsSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.searchResults, style]}>
      <View style={styles.searchSection}>
        <Skeleton width="40%" height={18} borderRadius={4} />
        
        <View style={styles.searchItems}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.searchItem}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={styles.searchItemContent}>
                <Skeleton width="60%" height={16} borderRadius={4} />
                <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <Skeleton width="30%" height={18} borderRadius={4} />
        
        <View style={styles.searchItems}>
          {[...Array(2)].map((_, index) => (
            <PartyCardSkeleton key={index} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </View>
    </View>
  );
};

// Map skeleton for location-based content
export const MapSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();

  return (
    <View style={[styles.map, { backgroundColor: theme.colors.surfaceVariant }, style]}>
      <Skeleton width="100%" height="100%" borderRadius={0} />
      
      {/* Mock markers */}
      <View style={styles.mapMarkers}>
        {[...Array(5)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.mapMarker,
              {
                top: Math.random() * 60 + 20 + '%',
                left: Math.random() * 60 + 20 + '%',
              },
            ]}
          >
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Party Card
  partyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  partyImage: {
    margin: 0,
  },
  partyContent: {
    padding: 16,
  },
  partyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partyDescription: {
    marginTop: 8,
  },
  partyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  partyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  partyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  partyAttendees: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // User Profile
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  userCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  userCardStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },

  userList: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userListContent: {
    flex: 1,
    marginLeft: 12,
  },

  userFull: {
    borderRadius: 16,
  },
  userFullHeader: {
    position: 'relative',
    height: 120,
  },
  userFullAvatar: {
    position: 'absolute',
    bottom: -40,
    left: 16,
  },
  userFullContent: {
    padding: 16,
    paddingTop: 48,
  },
  userFullStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  userStat: {
    alignItems: 'center',
  },

  // Message
  message: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  messageOwn: {
    flexDirection: 'row-reverse',
  },
  messageContent: {
    flex: 1,
    marginLeft: 8,
  },
  messageContentOwn: {
    marginLeft: 0,
    marginRight: 8,
    alignItems: 'flex-end',
  },
  messageContentNoAvatar: {
    marginLeft: 40,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },

  // Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // List
  list: {
    // No specific styles needed
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },

  // Search Results
  searchResults: {
    padding: 16,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchItems: {
    marginTop: 12,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  searchItemContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Map
  map: {
    position: 'relative',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapMarkers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapMarker: {
    position: 'absolute',
  },
});