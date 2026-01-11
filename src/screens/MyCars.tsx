import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { deleteCar, getUserCars } from '../redux/actions/carActions';

function MyCars() {
  const user = useSelector((state: any) => state.user);
  const cars = useSelector((state: any) => state.cars.cars);
  const dispatch = useDispatch();
  const getCars = () => {
    dispatch(getUserCars(user.user.token));
  };

  useEffect(() => {
    getCars();
  }, [dispatch]);

  const handleRemoveCar = (car: any) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this car?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCar({ carId: car.carId, token: user.user.token }));
            getCars();
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>My Cars</Text>
        {cars.map((car: any, index: number) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Text style={styles.carTitle}>{car.manufacture} {car.registrationPlate}</Text>
              <Text style={styles.carInfo}>Manufacture Date: {car.dateOfManufacture}</Text>
              <Button
                mode="contained"
                onPress={() => handleRemoveCar(car)}
                style={styles.button}
              >
                Remove Car
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  carTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carInfo: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
  button: {
    marginTop: 10,
  },
});

export default MyCars;