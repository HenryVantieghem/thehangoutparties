import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Callout, Region } from 'react-native-maps';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants';
import { usePartyStore, useLocationStore } from '../stores';
import { Party } from '../types';
import { mockParties } from '../utils';
import { ComponentErrorBoundary } from '../components/ErrorBoundary';
import { usePerformance } from '../hooks/usePerformance';
import { useLoading, useAsyncOperation } from '../hooks/useLoading';
import { useLoadingContext, usePageLoading, useApiLoading } from '../providers/LoadingProvider';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingComponents';
import { MapSkeleton, PartyCardSkeleton } from '../components/skeletons/SkeletonComponents';

const { width, height } = Dimensions.get('window');

export function MapScreen() {
  const { measureAsyncOperation, measureSyncOperation, logInteraction } = usePerformance({
    componentName: 'MapScreen',
    trackRenders: true,
    trackInteractions: true,
  });

  // Loading state management
  const loadingContext = useLoadingContext();
  const pageLoading = usePageLoading('map');
  const apiLoading = useApiLoading();
  
  // Map loading states
  const locationLoading = useLoading({
    key: 'location',
    description: 'Getting your location...',
    type: 'data',
    priority: 'high',
  });
  
  const partiesLoading = useAsyncOperation(null, [], {
    key: 'parties',
    description: 'Loading nearby parties...',
    type: 'api',
    priority: 'medium',
    immediate: false,
  });

  // Store state
  const { 
    nearbyParties, 
    loading: partyStoreLoading, 
    error: partyError,
    findNearbyParties 
  } = usePartyStore();
  const { currentLocation, loading: locationStoreLoading, startTracking } = useLocationStore();
  
  const mapRef = useRef<MapView>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  
  const defaultRegion: Region = {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Initialize map and load data
  useEffect(() => {
    const initializeMap = async () => {
      try {
        pageLoading.startLoading('Initializing map...');
        
        // Get user location first
        locationLoading.start('Getting your location...');
        await measureAsyncOperation('getLocation', async () => {
          await requestLocationPermission();
        });
        locationLoading.stop(true);
        
        pageLoading.stopLoading();
      } catch (error) {
        console.error('Failed to initialize map:', error);
        locationLoading.stop(false, {
          message: 'Failed to get your location',
          type: 'network',
          retry: initializeMap,
        });
        pageLoading.stopLoading();
      }
    };

    initializeMap();
  }, []);

  useEffect(() => {
    // Center map on user location when available
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [currentLocation]);

  // Load nearby parties when location is available
  useEffect(() => {
    if (currentLocation && mapReady) {
      const loadNearbyParties = async () => {
        try {
          await partiesLoading.execute(async () => {
            return await measureAsyncOperation('loadNearbyParties', async () => {
              await findNearbyParties({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                radius: 10,
              });
              return nearbyParties;
            });
          });
        } catch (error) {
          console.error('Failed to load nearby parties:', error);
        }
      };

      loadNearbyParties();
    }
  }, [currentLocation, mapReady, findNearbyParties, partiesLoading, measureAsyncOperation, nearbyParties]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        startTracking();
      } else {
        Alert.alert(
          'Location Permission',
          'Please enable location access to see nearby parties and your current position.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handleMarkerPress = useCallback((party: Party) => {
    logInteraction('marker_press', { partyId: party.id, vibe: party.vibe });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedParty(party);
  }, [logInteraction]);

  const handleMyLocationPress = useCallback(() => {
    logInteraction('my_location_press', { hasLocation: !!currentLocation });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      requestLocationPermission();
    }
  }, [currentLocation, logInteraction]);

  const handleMapTypeToggle = useCallback(() => {
    logInteraction('map_type_toggle', { currentType: mapType });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  }, [mapType, logInteraction]);

  const getMarkerColor = useCallback((party: Party) => {
    if (party.is_trending) return COLORS.pink;
    if (party.vibe === 'lit' || party.vibe === 'banger') return COLORS.orange;
    return COLORS.cyan;
  }, []);

  const renderMarker = useCallback((party: Party) => (
    <ComponentErrorBoundary componentName={`MapMarker-${party.id}`}>
      <Marker
      key={party.id}
      coordinate={{
        latitude: party.latitude,
        longitude: party.longitude,
      }}
      onPress={() => handleMarkerPress(party)}
      pinColor={getMarkerColor(party)}
    >
      <View style={[styles.markerContainer, { borderColor: getMarkerColor(party) }]}>
        <BlurView intensity={15} style={styles.markerBlur}>
          <LinearGradient
            colors={[
              `${getMarkerColor(party)}40`,
              `${getMarkerColor(party)}20`
            ]}
            style={styles.markerGradient}
          >
            <Text style={styles.markerText}>
              {party.attendee_count}
            </Text>
            {party.is_trending && (
              <Ionicons 
                name="trending-up" 
                size={12} 
                color={COLORS.white} 
                style={styles.trendingIcon}
              />
            )}
          </LinearGradient>
        </BlurView>
      </View>
      
      <Callout tooltip>
        <BlurView intensity={20} style={styles.calloutContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.calloutGradient}
          >
            <Text style={styles.calloutTitle} numberOfLines={1}>
              {party.title}
            </Text>
            <Text style={styles.calloutDescription} numberOfLines={2}>
              {party.description}
            </Text>
            <View style={styles.calloutStats}>
              <View style={styles.calloutStat}>
                <Ionicons name="people" size={14} color={COLORS.cyan} />
                <Text style={styles.calloutStatText}>
                  {party.attendee_count}/{party.max_attendees || '∞'}
                </Text>
              </View>
              <View style={styles.calloutStat}>
                <Ionicons name="location" size={14} color={COLORS.gray400} />
                <Text style={styles.calloutStatText} numberOfLines={1}>
                  {party.address}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Callout>
    </Marker>
    </ComponentErrorBoundary>
  ), [handleMarkerPress, getMarkerColor]);

  const handleMapReady = useCallback(() => {
    logInteraction('map_ready');
    setMapReady(true);
  }, [logInteraction]);

  const isLoading = pageLoading.isLoading || locationLoading.isLoading || partiesLoading.isLoading || partyStoreLoading;
  const hasError = locationLoading.error || partiesLoading.error || partyError;

  // Show loading skeleton while map is initializing
  if (!mapReady && isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <MapSkeleton style={styles.map} />
        {/* Controls skeleton */}
        <View style={styles.controls}>
          <View style={[styles.controlButton, { backgroundColor: COLORS.gray800 }]} />
          <View style={[styles.controlButton, { backgroundColor: COLORS.gray800 }]} />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if location access failed
  if (hasError && !currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          error={hasError}
          onRetry={() => {
            locationLoading.reset();
            partiesLoading.reset();
            requestLocationPermission();
          }}
          style={styles.errorContainer}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        initialRegion={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : defaultRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onMapReady={handleMapReady}
      >
        {(nearbyParties.length > 0 ? nearbyParties : []).map(renderMarker)}
        
        {/* Loading indicator overlay for parties */}
        {partiesLoading.isLoading && (
          <View style={styles.mapLoadingOverlay}>
            <LoadingSpinner size="large" color={COLORS.primary} />
            <Text style={styles.mapLoadingText}>
              {partiesLoading.operationId ? 'Loading nearby parties...' : 'Searching...'}
            </Text>
          </View>
        )}
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Map Type Toggle */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleMapTypeToggle}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} style={styles.controlBlur}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.controlGradient}
            >
              <Ionicons 
                name={(mapType === 'standard' ? 'satellite' : 'map') as any} 
                size={24} 
                color={COLORS.white} 
              />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleMyLocationPress}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} style={styles.controlBlur}>
            <LinearGradient
              colors={currentLocation ? 
                [COLORS.cyan + '40', COLORS.cyan + '20'] :
                ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']
              }
              style={styles.controlGradient}
            >
              <Ionicons 
                name="locate" 
                size={24} 
                color={currentLocation ? COLORS.cyan : COLORS.white} 
              />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <BlurView intensity={15} style={styles.legendBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.legendGradient}
          >
            <Text style={styles.legendTitle}>Party Types</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.pink }]} />
                <Text style={styles.legendText}>Trending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.orange }]} />
                <Text style={styles.legendText}>Lit/Banger</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.cyan }]} />
                <Text style={styles.legendText}>Regular</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <BlurView intensity={15} style={styles.statsBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.statsGradient}
          >
            <Text style={styles.statsNumber}>{parties.length}</Text>
            <Text style={styles.statsLabel}>Active Parties</Text>
          </LinearGradient>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 100,
    right: SPACING.lg,
    gap: SPACING.md,
  },
  controlButton: {
    width: 50,
    height: 50,
  },
  controlBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  controlGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  legend: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.lg,
    maxWidth: width * 0.6,
  },
  legendBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  legendGradient: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
  },
  legendTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontWeight: '600' as const,
  },
  legendItems: {
    gap: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    fontWeight: '500' as const,
  },
  stats: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.lg,
  },
  statsBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  statsGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
    minWidth: 80,
  },
  statsNumber: {
    ...TYPOGRAPHY.title2,
    color: COLORS.cyan,
    fontWeight: '700' as const,
  },
  statsLabel: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  markerBlur: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  markerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.white,
    fontWeight: '700' as const,
    fontSize: 12,
  },
  trendingIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  calloutContainer: {
    width: 250,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  calloutGradient: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
  },
  calloutTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
    marginBottom: SPACING.xs,
  },
  calloutDescription: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  calloutStats: {
    gap: SPACING.xs,
  },
  calloutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  calloutStatText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    fontWeight: '500' as const,
    flex: 1,
  },
  // Loading states
  mapLoadingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mapLoadingText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.white,
    fontWeight: '500' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
});