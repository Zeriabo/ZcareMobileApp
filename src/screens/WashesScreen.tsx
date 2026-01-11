import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {CarWashingProgram, Station} from '../redux/types/stationsActionTypes';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchWashesBooked} from '../redux/actions/WashesActions';
import store from '../redux/store';
import { Icon } from 'react-native-paper';


interface Props {
  route: RouteProp<{params: {station: Station}}, 'params'>;
  navigation: NavigationProp<any>;
}

const WashesScreen: React.FC<Props> = ({route, navigation}) => {
  const cars = useSelector((state: any) => state.cars.cars);
  const carWashes = useSelector((state: any) => state.washes.washes);
  const [selectedCarId, setSelectedCarId] = useState<string | undefined>(
    undefined,
  );
  const state = store.getState();
  const dispatch = useDispatch();

  const handleCarSelect = (carId: any) => {
    setSelectedCarId(carId);
    dispatch(fetchWashesBooked(carId));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Car:</Text>
      <View style={styles.carList}>
        {cars.map((car: any) => (
          <TouchableOpacity
            key={car.carId}
            style={[
              styles.carItem,
              selectedCarId === car.carId.toString() && styles.selectedCar,
            ]}
            onPress={() => handleCarSelect(car.carId.toString())}>
            <Icon name="car" size={24} color="#000" />
            <Text style={styles.carText}>{car.registerationPlate}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View >
        {carWashes ? (
          carWashes.map((wash: any) => (
            <View key={wash.id} style={styles.washItem}>
              <Text style={styles.washTitle}>Wash Details:</Text>
              <Text>Wash ID: {wash.id}</Text>
              <Text>Car: {wash.car.registerationPlate}</Text>
              <Text>Station: {wash.station.name}</Text>
              <Text>Washing Program ID: {wash.washingProgram.programType}</Text>
              <Text>
                Washing Program description: {wash.washingProgram.description}
              </Text>
            </View>
          ))
        ) : (
          <Text>No washes available for the selected car.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
