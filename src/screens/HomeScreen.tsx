import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { NavigationRoute, NavigationScreenProp } from 'react-navigation';
import { useDispatch, useSelector } from 'react-redux';
import markerIcon from '../assets/images/wash-washing.png';
import { fetchBookings } from '../redux/actions/BookingActions';
import { fetchStations } from '../redux/actions/stationsActions';
import { RootState } from '../redux/store';
import { Station } from '../redux/types/stationsActionTypes';
import { calculateDistanceKm } from '../utils/calulations';
import { resolveMediaUrl } from '../utils/media';

interface Props {
  navigation: NavigationScreenProp<NavigationRoute>;
}


const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const stations: Station[] = useSelector<RootState, Station[]>(
    state => state.stations.stations
  );

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'wash' | 'repair'>('wash');
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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
setUserCoords({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
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
    dispatch(fetchBookings());
    dispatch(fetchStations());
    getCurrentLocation();
    //fetchRepairShops()
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
<View style={styles.switchContainer}>
  <View style={styles.switchInner}>
    <View
      style={[
        styles.switchIndicator,
        serviceType === 'repair' && { transform: [{ translateX: 110 }] },
      ]}
    />

    <TouchableOpacity
      style={styles.switchButton}
      onPress={() => setServiceType('wash')}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.switchText,
          serviceType === 'wash' && styles.activeText,
        ]}
      >
        Wash
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.switchButton}
      onPress={() => setServiceType('repair')}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.switchText,
          serviceType === 'repair' && styles.activeText,
        ]}
      >
        Repair
      </Text>
    </TouchableOpacity>
  </View>
</View>

<MapView style={styles.map} showsUserLocation initialRegion={initialRegion}>
  {serviceType === 'wash' &&
    stations.map((station) => {
      const distance =
        userCoords &&
        calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          station.latitude,
          station.longitude
        ).toFixed(1); // distance in km

      return (
        <Marker
          key={station.id}
          coordinate={{
            latitude: station.latitude,
            longitude: station.longitude,
          }}
          title={station.name}
          description={
            distance
              ? `${station.address} - ${distance} km away`
              : station.address
          }
          onPress={() => handleStationClick(station)}
        >
            <Image
    source={
      station.media?.logo
        ? { uri: resolveMediaUrl(station.media.logo) }
        : markerIcon
    }
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#fff',
      backgroundColor: '#fff',
    }} />
        </Marker>
      );
    })}

  {serviceType === 'repair' &&
    stations.map((station) => (
      <Marker
        key={`repair-${station.id}`}
        coordinate={{
          latitude: station.latitude + 0.0005,
          longitude: station.longitude + 0.0005,
        }}
        title="Repair Shop"
      />
    ))}
</MapView>


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

switchContainer: {
  position: 'absolute',
  bottom: 40, // moves it up from the bottom
  alignSelf: 'center',
  zIndex: 20,
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

});

export default HomeScreen;
