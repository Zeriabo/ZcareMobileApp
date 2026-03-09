import Icon from '@react-native-vector-icons/ionicons';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import BackButton from '../components/ui/BackButton';
import { useLanguage } from '../contexts/LanguageContext';
import { goBackOrHome } from '../utils/navigation';

interface DeliveryPerson {
  latitude: number;
  longitude: number;
  name: string;
  phone: string;
  eta: string;
}

const DeliveryTrackingScreen: React.FC<any> = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { bookingId, deliveryLatitude, deliveryLongitude } = route.params || {};
  
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: deliveryLatitude || 47.4979,
    longitude: deliveryLongitude || 19.0402,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const baseUrl = (process.env.EXPO_PUBLIC_SERVER_URL || '').trim().replace(/\/+$/, '');
  const trackingEndpoints = [
    `${baseUrl}/booking/${bookingId}/delivery-tracking`,
    `${baseUrl}/v1/bookings/${bookingId}/delivery-tracking`,
    `${baseUrl}/booking/v1/bookings/${bookingId}/delivery-tracking`,
  ];

  useEffect(() => {
    fetchDeliveryPersonLocation();
    
    const interval = setInterval(() => {
      updateDeliveryPersonLocation();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchDeliveryPersonLocation = async () => {
    try {
      for (const endpoint of trackingEndpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 5000 });
          const data = response?.data || {};
          const driverLat = Number(data.providerLatitude);
          const driverLng = Number(data.providerLongitude);
          const eta = Number(data.etaMinutes);
          if (Number.isFinite(driverLat) && Number.isFinite(driverLng)) {
            setDeliveryPerson({
              latitude: driverLat,
              longitude: driverLng,
              name: String(data.specialistName || t('deliveryTracking.washSpecialist')),
              phone: String(data.specialistPhone || ''),
              eta: `${Number.isFinite(eta) ? Math.max(1, eta) : 15} ${t('deliveryTracking.min')}`,
            });
            setLoading(false);
            return;
          }
        } catch {
          // Try next endpoint.
        }
      }

      // Fallback simulation when backend tracking endpoint is unavailable.
      setDeliveryPerson({
        latitude: deliveryLatitude - 0.005,
        longitude: deliveryLongitude - 0.005,
        name: t('deliveryTracking.washSpecialist'),
        phone: '',
        eta: `15 ${t('deliveryTracking.min')}`,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching delivery location:', error);
      Alert.alert(t('common.error'), t('deliveryTracking.couldNotLoad'));
      setLoading(false);
    }
  };

  const updateDeliveryPersonLocation = async () => {
    for (const endpoint of trackingEndpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 5000 });
        const data = response?.data || {};
        const driverLat = Number(data.providerLatitude);
        const driverLng = Number(data.providerLongitude);
        const eta = Number(data.etaMinutes);
        if (Number.isFinite(driverLat) && Number.isFinite(driverLng)) {
          setDeliveryPerson((prev) => ({
            latitude: driverLat,
            longitude: driverLng,
            name: String(data.specialistName || prev?.name || t('deliveryTracking.washSpecialist')),
            phone: String(data.specialistPhone || prev?.phone || ''),
            eta: `${Number.isFinite(eta) ? Math.max(1, eta) : 15} ${t('deliveryTracking.min')}`,
          }));
          return;
        }
      } catch {
        // Try next endpoint.
      }
    }

    // Fallback simulation if no backend tracking endpoint responds.
    setDeliveryPerson((prev) => {
      if (!prev) return prev;
      
      const latDiff = deliveryLatitude - prev.latitude;
      const lngDiff = deliveryLongitude - prev.longitude;
      
      return {
        ...prev,
        latitude: prev.latitude + latDiff * 0.1,
        longitude: prev.longitude + lngDiff * 0.1,
        eta: Math.max(5, parseInt(prev.eta) - 1) + ` ${t('deliveryTracking.min')}`, // Reduce ETA
      };
    });
  };

  const fitMapToMarkers = () => {
    if (mapRef.current && deliveryPerson) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: deliveryLatitude, longitude: deliveryLongitude },
          { latitude: deliveryPerson.latitude, longitude: deliveryPerson.longitude },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  useEffect(() => {
    if (deliveryPerson) {
      fitMapToMarkers();
    }
  }, [deliveryPerson]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>{t('deliveryTracking.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => goBackOrHome(navigation)} />
        <Text style={styles.headerTitle}>{t('deliveryTracking.trackDelivery')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={false}
      >
        {/* Delivery Destination Marker */}
        <Marker
          coordinate={{ latitude: deliveryLatitude, longitude: deliveryLongitude }}
          title={t('deliveryTracking.deliveryLocation')}
        >
          <View style={styles.destinationMarker}>
            <Icon name="home" size={24} color="#fff" />
          </View>
        </Marker>

        {/* Delivery Person Marker */}
        {deliveryPerson && (
          <Marker
            coordinate={{ latitude: deliveryPerson.latitude, longitude: deliveryPerson.longitude }}
            title={deliveryPerson.name}
          >
            <View style={styles.driverMarker}>
              <Icon name="car" size={24} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {deliveryPerson && (
          <Polyline
            coordinates={[
              { latitude: deliveryPerson.latitude, longitude: deliveryPerson.longitude },
              { latitude: deliveryLatitude, longitude: deliveryLongitude },
            ]}
            strokeColor="#10B981"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Bottom Info Card */}
      {deliveryPerson && (
        <View style={styles.infoCard}>
          <View style={styles.statusBadge}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusText}>{t('deliveryTracking.onTheWay')}</Text>
          </View>

          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Icon name="person" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{deliveryPerson.name}</Text>
              <Text style={styles.driverRole}>{t('deliveryTracking.waterlessWashSpecialist')}</Text>
            </View>
            <View style={styles.etaBadge}>
              <Icon name="time-outline" size={16} color="#10B981" />
              <Text style={styles.etaText}>{deliveryPerson.eta}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.callButton}>
              <Icon name="call" size={20} color="#fff" />
              <Text style={styles.callButtonText}>{t('deliveryTracking.callDriver')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.centerButton} onPress={fitMapToMarkers}>
              <Icon name="locate" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.instructionBox}>
            <Icon name="information-circle-outline" size={18} color="#6B7280" />
            <Text style={styles.instructionText}>
              {t('deliveryTracking.driverArriveSoonInstruction')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
  destinationMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  driverMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  driverRole: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  centerButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default DeliveryTrackingScreen;
