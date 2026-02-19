import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import MapView, { Marker, Region } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import markerIcon from '../assets/images/wash-washing.png';
import { fetchBookings } from '../redux/actions/BookingActions';
import { fetchStations } from '../redux/actions/stationsActions';
import { RootState } from '../redux/store';
import { Station } from '../redux/types/stationsActionTypes';
import { RepairShop } from '../types/repair';
import { calculateDistanceKm } from '../utils/calulations';
import { resolveMediaUrl } from '../utils/media';

interface Props {
  navigation: any;
}

type NormalizedStation = Station & { latitude: number; longitude: number };

type MarkerCluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  stations: NormalizedStation[];
};

const DEFAULT_REGION: Region = {
  latitude: 47.4979,
  longitude: 19.0402,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const REPAIR_ENDPOINTS = ['/api/repairshops'];

const openNavigation = (lat: number, lng: number) => {
  const url = Platform.select({
    ios: `maps://?q=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
  });
  if (url) {
    Linking.openURL(url);
  }
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const mapRef = useRef<MapView>(null);

  const stations = useSelector<RootState, Station[]>(state => state.stations.stations);
  const stationsLoading = useSelector<RootState, boolean>(state => state.stations.loading);
  const stationsError = useSelector<RootState, string | null>(state => state.stations.error);

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [serviceType, setServiceType] = useState<'wash' | 'repair'>('wash');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [failedLogoMarkers, setFailedLogoMarkers] = useState<Record<string, boolean>>({});
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [repairShops, setRepairShops] = useState<RepairShop[]>([]);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const hasMapsKey =
    !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY &&
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;

  const normalizedStations = useMemo(() => {
    return stations
      .map((station) => {
        const latitude = Number(station.latitude ?? station.lat);
        const longitude = Number(station.longitude ?? station.lng);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return { ...station, latitude, longitude };
      })
      .filter((station): station is NormalizedStation => Boolean(station));
  }, [stations]);

  const sheetStations = useMemo(() => {
    const items = [...normalizedStations];
    if (!userCoords) return items;
    return items.sort((a, b) => {
      const distanceA = calculateDistanceKm(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude);
      const distanceB = calculateDistanceKm(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
      return distanceA - distanceB;
    });
  }, [normalizedStations, userCoords]);

  const sheetRepairs = useMemo(() => {
    const items = [...repairShops];
    if (!userCoords) return items;
    return items.sort((a, b) => {
      const distanceA = calculateDistanceKm(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude);
      const distanceB = calculateDistanceKm(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
      return distanceA - distanceB;
    });
  }, [repairShops, userCoords]);

  const nearestDistanceKm = useMemo(() => {
    const items = serviceType === 'wash' ? normalizedStations : repairShops;
    if (!userCoords || items.length === 0) return null;
    return Math.min(
      ...items.map(item =>
        calculateDistanceKm(userCoords.latitude, userCoords.longitude, item.latitude, item.longitude)
      )
    );
  }, [normalizedStations, repairShops, serviceType, userCoords]);

  const clusterCellSize = useMemo(() => {
    if (!currentRegion) return 0;
    return currentRegion.latitudeDelta > 0.06 ? currentRegion.latitudeDelta / 10 : 0;
  }, [currentRegion]);

  const clusteredMarkers = useMemo(() => {
    if (clusterCellSize <= 0) {
      return normalizedStations.map(station => ({
        id: station.id,
        latitude: station.latitude,
        longitude: station.longitude,
        count: 1,
        stations: [station],
      }));
    }

    const grouped = new Map<string, MarkerCluster>();
    normalizedStations.forEach(station => {
      const latBucket = Math.round(station.latitude / clusterCellSize);
      const lngBucket = Math.round(station.longitude / clusterCellSize);
      const key = `${latBucket}:${lngBucket}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          id: `cluster-${key}`,
          latitude: station.latitude,
          longitude: station.longitude,
          count: 1,
          stations: [station],
        });
        return;
      }

      const nextCount = existing.count + 1;
      existing.latitude = (existing.latitude * existing.count + station.latitude) / nextCount;
      existing.longitude = (existing.longitude * existing.count + station.longitude) / nextCount;
      existing.count = nextCount;
      existing.stations.push(station);
    });

    return Array.from(grouped.values());
  }, [clusterCellSize, normalizedStations]);

  useEffect(() => {
    if (normalizedStations.length > 0 && !selectedStationId) {
      setSelectedStationId(normalizedStations[0].id);
    }
  }, [normalizedStations, selectedStationId]);

  useEffect(() => {
    if (repairShops.length > 0 && !selectedRepairId) {
      setSelectedRepairId(repairShops[0].id);
    }
  }, [repairShops, selectedRepairId]);

  const normalizeRepairShops = (data: any[]): RepairShop[] => {
    return data
      .map((shop: any) => {
        const latitude = Number(shop?.latitude);
        const longitude = Number(shop?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        return {
          id: String(shop?.id ?? `${shop?.name}-${latitude}-${longitude}`),
          name: String(shop?.name ?? 'Repair Shop'),
          location: String(shop?.location ?? shop?.address ?? 'Location unavailable'),
          latitude,
          longitude,
          servicesOffered: Array.isArray(shop?.servicesOffered) ? shop.servicesOffered : [],
        };
      })
      .filter((shop): shop is RepairShop => Boolean(shop));
  };

  const fetchRepairShops = async () => {
    const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || '';
    setRepairLoading(true);
    setRepairError(null);

    for (const endpoint of REPAIR_ENDPOINTS) {
      try {
        const response = await axios.get(`${baseUrl}${endpoint}`);
        const normalized = normalizeRepairShops(Array.isArray(response.data) ? response.data : []);
        setRepairShops(normalized);
        setRepairLoading(false);
        return;
      } catch {
        // try next endpoint
      }
    }

    setRepairShops([]);
    setRepairError('Could not load repair shops from backend.');
    setRepairLoading(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your location to show relevant content.');
        setInitialRegion(DEFAULT_REGION);
        setCurrentRegion(DEFAULT_REGION);
        fetchRepairShops();
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const region: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      const current = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserCoords(current);
      setInitialRegion(region);
      setCurrentRegion(region);
      fetchRepairShops();
    } catch (error) {
      console.log('Location error:', error);
      setInitialRegion(DEFAULT_REGION);
      setCurrentRegion(DEFAULT_REGION);
      fetchRepairShops();
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    dispatch(fetchBookings());
    dispatch(fetchStations());
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const points =
      serviceType === 'wash'
        ? normalizedStations.map(station => ({ latitude: station.latitude, longitude: station.longitude }))
        : repairShops.map(shop => ({ latitude: shop.latitude, longitude: shop.longitude }));

    if (!mapRef.current || points.length === 0) return;
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 90, right: 70, bottom: sheetExpanded ? 340 : 220, left: 70 },
      animated: true,
    });
  }, [normalizedStations, repairShops, serviceType, sheetExpanded]);

  const refreshCurrentList = () => {
    if (serviceType === 'wash') {
      dispatch(fetchStations());
      return;
    }
    fetchRepairShops();
  };

  const handleStationClick = (station: Station) => {
    navigation.navigate('StationPage', { station });
  };

  const focusStation = (station: NormalizedStation) => {
    setSelectedStationId(station.id);
    mapRef.current?.animateToRegion(
      {
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      280
    );
  };

  const focusRepairShop = (shop: RepairShop) => {
    setSelectedRepairId(shop.id);
    mapRef.current?.animateToRegion(
      {
        latitude: shop.latitude,
        longitude: shop.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      280
    );
  };

  const onClusterPress = (cluster: MarkerCluster) => {
    if (cluster.count === 1) {
      handleStationClick(cluster.stations[0]);
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: Math.max((currentRegion?.latitudeDelta || 0.06) / 2, 0.012),
        longitudeDelta: Math.max((currentRegion?.longitudeDelta || 0.06) / 2, 0.012),
      },
      280
    );
  };

  if (loadingLocation || !initialRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!hasMapsKey) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.missingKeyTitle}>Google Maps key missing</Text>
        <Text style={styles.missingKeyText}>
          Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env and rebuild Android.
        </Text>
      </View>
    );
  }

  const itemCount = serviceType === 'wash' ? normalizedStations.length : repairShops.length;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>{serviceType === 'wash' ? 'Nearby Stations' : 'Nearby Repair Shops'}</Text>
          <Text style={styles.summaryValue}>{itemCount}</Text>
          <Text style={styles.summaryHint}>
            {nearestDistanceKm !== null ? `${nearestDistanceKm.toFixed(1)} km closest` : 'Enable location for distance'}
          </Text>
        </View>
        <View style={styles.summaryActions}>
          <Pressable onPress={() => navigation.navigate('AIAssistant')} style={({ pressed }) => [styles.aiButton, pressed && styles.refreshButtonPressed]}>
            <Text style={styles.aiButtonText}>AI</Text>
          </Pressable>
          <Pressable onPress={refreshCurrentList} style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshButtonPressed]}>
            <Text style={styles.refreshButtonText}>
              {serviceType === 'wash' ? (stationsLoading ? 'Refreshing...' : 'Refresh') : repairLoading ? 'Refreshing...' : 'Refresh'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.switchContainer}>
        <View style={styles.switchInner}>
          <View style={[styles.switchIndicator, serviceType === 'repair' && { transform: [{ translateX: 110 }] }]} />
          <TouchableOpacity style={styles.switchButton} onPress={() => setServiceType('wash')} activeOpacity={0.85}>
            <Text style={[styles.switchText, serviceType === 'wash' && styles.activeText]}>Wash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchButton} onPress={() => setServiceType('repair')} activeOpacity={0.85}>
            <Text style={[styles.switchText, serviceType === 'repair' && styles.activeText]}>Repair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={initialRegion}
        onRegionChangeComplete={setCurrentRegion}
      >
        {serviceType === 'wash' &&
          clusteredMarkers.map(cluster => {
            if (cluster.count > 1) {
              return (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                  onPress={() => onClusterPress(cluster)}
                >
                  <View style={styles.clusterBubble}>
                    <Text style={styles.clusterText}>{cluster.count}</Text>
                  </View>
                </Marker>
              );
            }

            const station = cluster.stations[0];
            const distance =
              userCoords &&
              calculateDistanceKm(userCoords.latitude, userCoords.longitude, station.latitude, station.longitude).toFixed(1);

            return (
              <Marker
                key={station.id}
                coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                title={station.name}
                description={distance ? `${station.address} - ${distance} km away` : station.address}
                onPress={() => handleStationClick(station)}
              >
                <Image
                  source={
                    station.media?.logo && !failedLogoMarkers[station.id]
                      ? { uri: resolveMediaUrl(station.media.logo) }
                      : markerIcon
                  }
                  style={styles.markerImage}
                  onError={() => setFailedLogoMarkers(prev => ({ ...prev, [station.id]: true }))}
                />
              </Marker>
            );
          })}

        {serviceType === 'repair' &&
          repairShops.map(shop => (
            <Marker
              key={`repair-${shop.id}`}
              coordinate={{ latitude: shop.latitude, longitude: shop.longitude }}
              title={shop.name}
              description={shop.location}
              onPress={() => navigation.navigate('RepairShop', { shop })}
            >
              <View style={styles.repairPin}>
                <Text style={styles.repairPinText}>R</Text>
              </View>
            </Marker>
          ))}
      </MapView>

      <View style={[styles.bottomSheet, sheetExpanded && styles.bottomSheetExpanded]}>
        <Pressable onPress={() => setSheetExpanded(prev => !prev)} style={styles.sheetHandleWrap}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{serviceType === 'wash' ? 'Stations' : 'Repair Shops'}</Text>
          <Text style={styles.sheetToggle}>{sheetExpanded ? 'Collapse' : 'Expand'}</Text>
        </Pressable>

        {sheetExpanded && (
          <ScrollView style={styles.sheetList} contentContainerStyle={styles.sheetListContent}>
            {serviceType === 'wash' &&
              sheetStations.map(station => {
                const distance =
                  userCoords &&
                  calculateDistanceKm(userCoords.latitude, userCoords.longitude, station.latitude, station.longitude).toFixed(1);
                const isSelected = selectedStationId === station.id;
                return (
                  <View key={`sheet-${station.id}`} style={[styles.sheetItem, isSelected && styles.sheetItemSelected]}>
                    <View style={styles.sheetItemInfo}>
                      <Text style={styles.sheetItemTitle} numberOfLines={1}>{station.name}</Text>
                      <Text style={styles.sheetItemAddress} numberOfLines={1}>{station.address}</Text>
                      <Text style={styles.sheetItemMeta}>{distance ? `${distance} km away` : 'Distance unavailable'}</Text>
                    </View>
                    <View style={styles.sheetActions}>
                      <Pressable onPress={() => focusStation(station)} style={styles.focusButton}>
                        <Text style={styles.focusButtonText}>Focus</Text>
                      </Pressable>
                      <Pressable onPress={() => handleStationClick(station)} style={styles.openButton}>
                        <Text style={styles.openButtonText}>Open</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

            {serviceType === 'repair' &&
              sheetRepairs.map(shop => {
                const distance =
                  userCoords &&
                  calculateDistanceKm(userCoords.latitude, userCoords.longitude, shop.latitude, shop.longitude).toFixed(1);
                const isSelected = selectedRepairId === shop.id;
                return (
                  <View key={`sheet-repair-${shop.id}`} style={[styles.sheetItem, isSelected && styles.sheetItemSelected]}>
                    <View style={styles.sheetItemInfo}>
                      <Text style={styles.sheetItemTitle} numberOfLines={1}>{shop.name}</Text>
                      <Text style={styles.sheetItemAddress} numberOfLines={1}>{shop.location}</Text>
                      <Text style={styles.sheetItemMeta}>{distance ? `${distance} km away` : 'Distance unavailable'}</Text>
                    </View>
                    <View style={styles.sheetActions}>
                      <Pressable onPress={() => focusRepairShop(shop)} style={styles.focusButton}>
                        <Text style={styles.focusButtonText}>Focus</Text>
                      </Pressable>
                      <Pressable onPress={() => navigation.navigate('RepairShop', { shop })} style={styles.openButton}>
                        <Text style={styles.openButtonText}>Open</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
          </ScrollView>
        )}
      </View>

      {serviceType === 'wash' && stationsLoading && (
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.statusText}>Loading stations...</Text>
        </View>
      )}

      {serviceType === 'repair' && repairLoading && (
        <View style={styles.statusCard}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.statusText}>Loading repair shops...</Text>
        </View>
      )}

      {serviceType === 'wash' && stationsError && !stationsLoading && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Could not load stations.</Text>
          <Pressable onPress={refreshCurrentList} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {serviceType === 'repair' && repairError && !repairLoading && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{repairError}</Text>
          <Pressable onPress={refreshCurrentList} style={styles.retryButton}>
            <Text style={styles.retryText}>Refresh</Text>
          </Pressable>
        </View>
      )}

      {serviceType === 'wash' && !stationsLoading && !stationsError && normalizedStations.length === 0 && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>No stations found in this area yet.</Text>
        </View>
      )}

      {serviceType === 'repair' && !repairLoading && repairShops.length === 0 && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>No repair shops found in this area yet.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingKeyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  missingKeyText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  summaryCard: {
    position: 'absolute',
    top: 56,
    left: 14,
    right: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 30,
    backgroundColor: 'rgba(17,24,39,0.9)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryHint: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshButtonPressed: {
    opacity: 0.85,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryActions: {
    gap: 8,
  },
  aiButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  switchContainer: {
    position: 'absolute',
    bottom: 94,
    alignSelf: 'center',
    zIndex: 30,
  },
  switchInner: {
    flexDirection: 'row',
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 4,
    elevation: 6,
  },
  switchIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 25,
    left: 0,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchText: {
    fontWeight: '600',
    color: '#000',
  },
  activeText: {
    color: '#fff',
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  repairPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repairPinText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  clusterBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 86,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    zIndex: 25,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  bottomSheetExpanded: {
    height: '56%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sheetToggle: {
    color: '#4F46E5',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  sheetList: {
    flex: 1,
  },
  sheetListContent: {
    paddingHorizontal: 14,
    paddingBottom: 26,
    gap: 10,
  },
  sheetItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetItemSelected: {
    borderColor: '#818CF8',
  },
  sheetItemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  sheetItemTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetItemAddress: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  sheetItemMeta: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 4,
  },
  sheetActions: {
    gap: 6,
  },
  focusButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  focusButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  openButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusCard: {
    position: 'absolute',
    bottom: 332,
    alignSelf: 'center',
    backgroundColor: 'rgba(17,24,39,0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default HomeScreen;
