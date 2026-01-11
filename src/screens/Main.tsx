import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStations } from '../redux/actions/stationsActions';
import { RootState } from '../redux/store';
import { Station } from '../redux/types/stationsActionTypes';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import markerIcon from '../assets/images/wash-washing.png';

const Main: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch();
  const stations: Station[] = useSelector<RootState, Station[]>(
    state => state.stations.stations
  );

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

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
      console.log('Location error:', error);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zwash</Text>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {stations.map(station => (
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
});

export default Main;
