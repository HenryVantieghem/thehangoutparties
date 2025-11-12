import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const { width, height } = Dimensions.get('window');

export function MapScreen() {
  const { parties, setParties } = usePartyStore();
  const { currentLocation, startTracking } = useLocationStore();
  
  const mapRef = useRef<MapView>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [showUserLocation, setShowUserLocation] = useState(true);
  
  const defaultRegion: Region = {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    // Load parties if not already loaded
    if (parties.length === 0) {
      setParties(mockParties);
    }
    
    // Start location tracking
    requestLocationPermission();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedParty(party);
  }, []);

  const handleMyLocationPress = useCallback(() => {
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
  }, [currentLocation]);

  const handleMapTypeToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  }, [mapType]);

  const getMarkerColor = (party: Party) => {
    if (party.is_trending) return COLORS.pink;
    if (party.vibe === 'lit' || party.vibe === 'banger') return COLORS.orange;
    return COLORS.cyan;
  };

  const renderMarker = (party: Party) => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        initialRegion={defaultRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {parties.map(renderMarker)}
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
});