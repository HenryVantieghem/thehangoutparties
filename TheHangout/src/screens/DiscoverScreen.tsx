import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { PartyCard } from '../components/PartyCard';
import { EmptyState } from '../components/EmptyState';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { usePartyStore, useLocationStore } from '../stores';
import { Party } from '../types';
import { mockParties } from '../utils';

const { width } = Dimensions.get('window');

export function DiscoverScreen() {
  const navigation = useNavigation();
  const { parties, setParties, loading, setLoading } = usePartyStore();
  const { currentLocation, startTracking } = useLocationStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'trending' | 'nearby'>('all');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadInitialParties();
    requestLocationAndTrack();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const requestLocationAndTrack = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      startTracking();
    }
  };

  const loadInitialParties = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load mock parties for now
      setParties(mockParties.slice(0, 10));
      setHasMore(mockParties.length > 10);
    } catch (error) {
      console.error('Failed to load parties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setParties(mockParties.slice(0, 10));
      setHasMore(mockParties.length > 10);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || parties.length === 0) return;
    
    setLoadingMore(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentLength = parties.length;
      const newParties = mockParties.slice(currentLength, currentLength + 10);
      
      if (newParties.length > 0) {
        setParties([...parties, ...newParties]);
        setHasMore(currentLength + newParties.length < mockParties.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [parties, loadingMore, hasMore]);

  const handlePartyPress = useCallback((party: Party) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PartyDetail' as never, { partyId: party.id } as never);
  }, [navigation]);

  const handleLikeParty = useCallback(async (partyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement like functionality
    console.log('Liked party:', partyId);
  }, []);

  const handleJoinParty = useCallback(async (partyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement join functionality
    console.log('Joined party:', partyId);
  }, []);

  const handleFilterChange = useCallback((newFilter: typeof filter) => {
    Haptics.selectionAsync();
    setFilter(newFilter);
    
    // Filter parties based on selection
    if (newFilter === 'trending') {
      const trending = mockParties.filter(p => p.is_trending);
      setParties(trending.slice(0, 10));
    } else if (newFilter === 'nearby') {
      // Sort by distance if location available
      if (currentLocation) {
        const sorted = [...mockParties].sort((a, b) => {
          // Simple distance calculation (would use proper distance formula)
          const distA = Math.abs(a.latitude - currentLocation.latitude) + 
                       Math.abs(a.longitude - currentLocation.longitude);
          const distB = Math.abs(b.latitude - currentLocation.latitude) + 
                       Math.abs(b.longitude - currentLocation.longitude);
          return distA - distB;
        });
        setParties(sorted.slice(0, 10));
      }
    } else {
      setParties(mockParties.slice(0, 10));
    }
  }, [currentLocation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.subtitle}>
        {currentLocation ? '📍 Parties near you' : 'Find parties happening now'}
      </Text>
      
      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        {(['all', 'trending', 'nearby'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            onPress={() => handleFilterChange(filterType)}
            style={[
              styles.filterPill,
              filter === filterType && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === filterType && styles.filterPillTextActive,
              ]}
            >
              {filterType === 'all' && '🎉 All'}
              {filterType === 'trending' && '🔥 Trending'}
              {filterType === 'nearby' && '📍 Nearby'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderParty = ({ item, index }: { item: Party; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, 50 + index * 10],
            }),
          },
        ],
      }}
    >
      <PartyCard
        party={item}
        onPress={() => handlePartyPress(item)}
        onLike={() => handleLikeParty(item.id)}
        onJoin={() => handleJoinParty(item.id)}
        currentUserId="current-user-id"
      />
    </Animated.View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.cyan} />
        <Text style={styles.loadingMoreText}>Loading more parties...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="calendar-outline"
      title="No parties yet"
      message="Be the first to start a party in your area!"
      actionText="Create Party"
      onAction={() => navigation.navigate('CreateParty' as never)}
    />
  );

  if (loading && parties.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.loadingText}>Finding parties...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={parties}
        renderItem={renderParty}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={5}
      />
      
      {/* Floating Map Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('Map' as never);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="map" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    marginBottom: SPACING.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterPillActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  filterPillText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray400,
    fontWeight: '600' as const,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: SPACING.sm,
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray500,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});