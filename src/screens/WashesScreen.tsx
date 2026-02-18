import { NavigationProp, RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWashesBooked } from '../redux/actions/WashesActions';
import { RootState } from '../redux/store';
import { Station } from '../redux/types/stationsActionTypes';
import { Wash } from '../redux/types/washesActionTypes';


interface Props {
  route: RouteProp<{params: {station: Station}}, 'params'>;
  navigation: NavigationProp<any>;
}

const WashesScreen: React.FC<Props> = ({route, navigation}) => {
  const cars = useSelector((state: RootState) => state.cars.cars);
  const carWashes = useSelector((state: RootState) => state.washes.washes);
  const washesLoading = useSelector((state: RootState) => state.washes.loading);
  const washesError = useSelector((state: RootState) => state.washes.error);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const dispatch = useDispatch<any>();

  const handleCarSelect = (carId: number) => {
    setSelectedCarId(carId);
    dispatch(fetchWashesBooked(carId));
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select a Car:</Text>
      <View style={styles.carList}>
        {cars.map((car: any) => (
          <TouchableOpacity
            key={car.carId}
            style={[
              styles.carItem,
              selectedCarId === car.carId && styles.selectedCar,
            ]}
            onPress={() => handleCarSelect(car.carId)}>
            <Ionicons name="car" size={24} color="#000" />
            <Text style={styles.carText}>{car.registerationPlate}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.washesWrap}>
        {washesLoading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.helperText}>Loading washes...</Text>
          </View>
        ) : washesError ? (
          <Text style={styles.helperText}>{washesError}</Text>
        ) : carWashes && carWashes.length > 0 ? (
          carWashes.map((wash: Wash) => (
            <View key={wash.id} style={styles.washItem}>
              <Text style={styles.washTitle}>Wash Details:</Text>
              <Text>Wash ID: {wash.id}</Text>
              <Text>Car: {(wash.car as any)?.registerationPlate || (wash.car as any)?.registrationPlate}</Text>
              <Text>Station: {wash.station?.name}</Text>
              <Text>Program: {wash.washingProgram?.programType}</Text>
              <Text>
                Description: {wash.washingProgram?.description}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.helperText}>
            {selectedCarId ? 'No washes available for the selected car.' : 'Choose a car to see wash history.'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  carList: {
    marginBottom: 20,
  },
  carItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedCar: {
    backgroundColor: '#f0f0f0',
  },
  carText: {
    marginLeft: 10,
    fontWeight: '600',
  },
  washesWrap: {
    marginBottom: 24,
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  washItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  washTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  
});

export default WashesScreen;
