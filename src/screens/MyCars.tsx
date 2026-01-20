import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { deleteCar, getUserCars } from '../redux/actions/carActions';

function MyCars() {
  const user = useSelector((state: any) => state.user.user);
  const cars = useSelector((state: any) => state.cars.cars);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
const isFocused = useIsFocused();
  useEffect(() => {
    if (user?.token && isFocused) {
      dispatch(getUserCars(user.token));
    }
  }, [dispatch, user,isFocused]);

  const handleRemoveCar = (car: any) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this car?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            dispatch(deleteCar({ carId: car.carId, token: user.token })),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Cars</Text>

      {cars.length === 0 && (
        <Text style={styles.empty}>No cars registered yet</Text>
      )}

      {cars.map((car: any) => (
        <Card key={car.carId} style={styles.card}>
          <Card.Content>
            <Text style={styles.carTitle}>
              {car.manufacture} {car.registrationPlate}
            </Text>
            <Text style={styles.carInfo}>
              Manufacture Date: {car.dateOfManufacture}
            </Text>

            <Button
              mode="contained"
              style={{ marginTop: 10 }}
              onPress={() => handleRemoveCar(car)}
            >
              Remove Car
            </Button>
          </Card.Content>
        </Card>
      ))}

      <FAB
        icon="plus"
        label="Add Car"
        style={styles.fab}
        onPress={() => navigation.navigate('AddCar')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  empty: { color: 'gray', marginBottom: 10 },
  card: { marginBottom: 16, borderRadius: 8 },
  carTitle: { fontSize: 18, fontWeight: 'bold' },
  carInfo: { fontSize: 14, color: 'gray' },
  fab: {
    position: 'absolute',
    right: 0,
    bottom: -50,
  },
});

export default MyCars;
