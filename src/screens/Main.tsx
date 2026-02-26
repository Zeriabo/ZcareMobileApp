import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import markerIcon from '../assets/images/wash-washing.png';
import { fetchStations } from '../redux/actions/stationsActions';
import { RootState } from '../redux/store';
import { Station } from '../redux/types/stationsActionTypes';

const Main: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const stations: Station[] = useSelector<RootState, Station[]>(
    state => state.stations.stations
  );
  const normalizedStations = stations
    .map(station => {
      const latitude = Number(station.latitude ?? station.lat);
      const longitude = Number(station.longitude ?? station.lng);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { ...station, latitude, longitude };
    })
    .filter((station): station is Station & { latitude: number; longitude: number } => Boolean(station));

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const hasMapsKey =
    !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY &&
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'We need access to your location to show relevant content.'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      // Location error handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchStations());
    getCurrentLocation();
  }, []);

  const handleStationClick = (station: Station) => {
    navigation.navigate('StationPage', { station });
  };

  if (loading || !initialRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zwash</Text>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {normalizedStations.map(station => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            title={station.name}
            description={station.address}
            onPress={() => handleStationClick(station)}
          >
            <Image source={markerIcon} style={{ width: 30, height: 30 }} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', margin: 10, textAlign: 'center' },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missingKeyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  missingKeyText: { fontSize: 14, color: '#4b5563', textAlign: 'center', paddingHorizontal: 20 },
});

export default Main;
