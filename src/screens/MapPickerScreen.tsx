import Icon from '@react-native-vector-icons/ionicons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import BackButton from '../components/ui/BackButton';
import { goBackOrHome } from '../utils/navigation';

const DEFAULT_REGION: Region = {
  latitude: 47.4979,
  longitude: 19.0402,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const MapPickerScreen: React.FC<any> = ({ route, navigation }) => {
  const { onLocationSelected, initialLatitude, initialLongitude } = route.params || {};
  
  const [region, setRegion] = useState<Region>(
    initialLatitude && initialLongitude
      ? {
          latitude: initialLatitude,
          longitude: initialLongitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : DEFAULT_REGION
  );
  
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLatitude && initialLongitude
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  );
  
  const [address, setAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    // Get user's current location on mount if no initial location
    if (!initialLatitude || !initialLongitude) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      fetchAddress(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchAddress = async (latitude: number, longitude: number) => {
    setLoadingAddress(true);
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses[0]) {
        const addr = addresses[0];
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.postalCode,
          addr.country
        ].filter(Boolean).join(', ');
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('');
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    fetchAddress(latitude, longitude);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelected?.(selectedLocation.latitude, selectedLocation.longitude, address);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => goBackOrHome(navigation)} />
        <Text style={styles.headerTitle}>Select Delivery Location</Text>
        <View style={{ width: 36 }} />
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setSelectedLocation({ latitude, longitude });
              fetchAddress(latitude, longitude);
            }}
          >
            <View style={styles.customMarker}>
              <Icon name="location" size={40} color="#10B981" />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.bottomCard}>
        <View style={styles.addressContainer}>
          {loadingAddress ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              <Icon name="location-outline" size={20} color="#10B981" />
              <Text style={styles.addressText} numberOfLines={2}>
                {address || 'Tap on the map to select a location'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.instructionRow}>
          <Icon name="hand-left-outline" size={16} color="#6B7280" />
          <Text style={styles.instructionText}>
            Tap on the map or drag the marker to adjust location
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
          onPress={confirmLocation}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 10,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    marginBottom: 12,
    minHeight: 60,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MapPickerScreen;
