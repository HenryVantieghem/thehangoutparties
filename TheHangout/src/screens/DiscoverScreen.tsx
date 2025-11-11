import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, API } from '../constants';
import { PartyCard, EmptyState, LoadingSpinner } from '../components';
import { usePartyStore, usePhotoStore } from '../stores';
import { Party } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { parties, fetchParties, loading } = usePartyStore();
  const { photos } = usePhotoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const doubleTapRef = useRef<{ lastTap: number; timer: NodeJS.Timeout | null }>({
    lastTap: 0,
    timer: null,
  });

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async (pageNum: number = 0) => {
    try {
      await fetchParties({
        page: pageNum,
        limit: API.PARTY_PAGINATION_LIMIT,
      });
      if (parties.length < (pageNum + 1) * API.PARTY_PAGINATION_LIMIT) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load parties:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await loadParties(0);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadParties(nextPage);
    }
  };

  const handlePartyPress = (party: Party) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PartyDetail' as never, { partyId: party.id } as never);
  };

  const handleDoubleTap = (party: Party) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (doubleTapRef.current.lastTap && now - doubleTapRef.current.lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      if (doubleTapRef.current.timer) {
        clearTimeout(doubleTapRef.current.timer);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Like party or show heart animation
      // In production: likeParty(party.id)
    } else {
      doubleTapRef.current.lastTap = now;
      doubleTapRef.current.timer = setTimeout(() => {
        handlePartyPress(party);
      }, DOUBLE_PRESS_DELAY);
    }
  };

  const renderPartyCard = ({ item, index }: { item: Party; index: number }) => {
    const partyPhotos = photos.filter((p) => p.party_id === item.id);
    
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleDoubleTap(item)}
        >
          <PartyCard
            party={item}
            photos={partyPhotos.map((p) => p.photo_url)}
            onPress={() => handlePartyPress(item)}
            onJoinPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Join party logic
            }}
            testID={`party-card-${index}`}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      message="No parties nearby"
      subtitle="Be the first to create a party in your area!"
      icon="🎉"
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Open filters
          }}
          style={styles.filterButton}
        >
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Party Feed */}
      <FlatList
        data={parties}
        renderItem={renderPartyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
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
  headerTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
  },
  filterButton: {
    padding: SPACING.xs,
  },
  filterText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
});
