import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, TextInput, Button} from 'react-native-paper';
import YearPicker from 'react-native-month-year-picker';
import {useDispatch, useSelector} from 'react-redux';
import {getUserCars, registerCar} from '../redux/actions/carActions';
import Car from '../redux/types/CarType';
import {NavigationProp, RouteProp} from '@react-navigation/native';

interface Props {
  navigation: NavigationProp<any>;
}
const CarRegistrationForm: React.FC<Props> = ({navigation}) => {
  const [registrationPlate, setRegistrationPlate] = useState('');
  const [manufacture, setManufacture] = useState('');
  const [dateOfManufacture, setDateOfManufacture] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const token = useSelector((state: any) => state.user.user.token);
  const dispatch = useDispatch();
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate !== undefined) {
      setDateOfManufacture(selectedDate);
    }
    hideDatePicker();
  };

  const handleRegisterCar = () => {
    const car: Car = {
      registrationPlate: registrationPlate,
      manufacture: manufacture,
      dateOfManufacture: dateOfManufacture,
      token: token,
      deviceRegistrationToken: '',
      carId: 0,
    };
    dispatch(registerCar(car));
    dispatch(getUserCars(token));
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Register a Car" />
        <Card.Content>
          <TextInput
            label="Registration Plate"
            value={registrationPlate}
            onChangeText={text => setRegistrationPlate(text)}
          />
          <TextInput
            label="Manufacture"
            value={manufacture}
            onChangeText={text => setManufacture(text)}
          />
          <Button onPress={showDatePicker}>Select Date of Manufacture</Button>
          {isDatePickerVisible && (
            <YearPicker value={dateOfManufacture} onChange={handleDateChange} />
          )}
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button mode="contained" onPress={handleRegisterCar}>
            Register Car
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default CarRegistrationForm;
