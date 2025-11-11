import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { COLORS, SPACING, TYPOGRAPHY, API } from '../constants';
import { BottomSheet, PartyCard } from '../components';
import { usePartyStore, useLocationStore } from '../stores';
import { Party } from '../types';
import { calculateDistance } from '../utils';

const INITIAL_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const navigation = useNavigation();
  const { parties, fetchParties, loading } = usePartyStore();
  const { currentLocation, watchLocation } = useLocationStore();
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      loadNearbyParties();
    }
  }, [currentLocation]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        await watchLocation();
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const loadNearbyParties = async () => {
    if (!currentLocation) return;
    
    try {
      await fetchParties({
        location: currentLocation,
        radius: API.PARTIES_SEARCH_RADIUS,
      });
    } catch (error) {
      console.error('Failed to load parties:', error);
    }
  };

  const handleMarkerPress = (party: Party) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedParty(party);
    setShowBottomSheet(true);
  };

  const handlePartyJoin = async (party: Party) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await usePartyStore.getState().joinParty(party.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBottomSheet(false);
    } catch (error) {
      console.error('Failed to join party:', error);
    }
  };

  const renderMarkers = () => {
    // Limit to 50 markers max
    const displayParties = parties.slice(0, 50);
    
    return displayParties.map((party) => (
      <Marker
        key={party.id}
        coordinate={{
          latitude: party.latitude,
          longitude: party.longitude,
        }}
        onPress={() => handleMarkerPress(party)}
      >
        <View style={styles.markerContainer}>
          <View style={styles.marker}>
            <Text style={styles.markerText}>{party.attendee_count}</Text>
          </View>
        </View>
      </Marker>
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Open search
          }}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={20} color={COLORS.gray500} />
          <Text style={styles.searchText}>Search parties...</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Open filters
          }}
          style={styles.filterButton}
        >
          <Ionicons name="options" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        mapType="standard"
        customMapStyle={[
          {
            elementType: 'geometry',
            stylers: [{ color: COLORS.dark }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: COLORS.dark }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: COLORS.gray500 }],
          },
        ]}
      >
        {/* User Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Party Markers */}
        {renderMarkers()}
      </MapView>

      {/* Bottom Sheet with Party Preview */}
      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        height={0.4}
      >
        {selectedParty && (
          <View style={styles.bottomSheetContent}>
            <PartyCard
              party={selectedParty}
              onPress={() => {
                setShowBottomSheet(false);
                navigation.navigate('PartyDetail' as never, { partyId: selectedParty.id } as never);
              }}
              onJoinPress={() => handlePartyJoin(selectedParty)}
            />
          </View>
        )}
      </BottomSheet>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
        </View>
      )}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  filterButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.pink,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.white,
    fontWeight: '700',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cyan,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    alignSelf: 'center',
    marginTop: 2,
  },
  bottomSheetContent: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
