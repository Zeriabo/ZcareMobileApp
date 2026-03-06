import { NavigationProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import YearPicker from 'react-native-month-year-picker';
import { Button, Card, HelperText, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { getUserCars, registerCar } from '../redux/actions/carActions';
import Car from '../redux/types/CarType';
import { Validators } from '../utils/validators';

interface Props {
  navigation: NavigationProp<any>;
}
const CarRegistrationForm: React.FC<Props> = ({navigation}) => {
  const [registrationPlate, setRegistrationPlate] = useState('');
  const [manufacture, setManufacture] = useState('');
  const [dateOfManufacture, setDateOfManufacture] = useState(new Date());
  const [lastInspectionDate, setLastInspectionDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'manufacture' | 'inspection'>('manufacture');
  
  // Validation errors
  const [errors, setErrors] = useState<{
    registrationPlate?: string;
    manufacture?: string;
    lastInspectionDate?: string;
  }>({});

  const token = useSelector((state: any) => state.user.user.token);
  const dispatch = useDispatch<any>();
  const normalizedToken = (token || '').trim().replace(/^Bearer\s+/i, '');
  
  const showDatePicker = (field: 'manufacture' | 'inspection') => {
    setActiveDateField(field);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate !== undefined) {
      if (activeDateField === 'manufacture') {
        setDateOfManufacture(selectedDate);
      } else {
        setLastInspectionDate(selectedDate);
        validateField('lastInspectionDate', selectedDate.toISOString().slice(0, 10));
      }
    }
    hideDatePicker();
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'registrationPlate':
        if (!Validators.required(value)) {
          newErrors.registrationPlate = 'Registration plate is required';
        } else if (!Validators.minLength(value, 3)) {
          newErrors.registrationPlate = 'Registration plate must be at least 3 characters';
        } else if (!Validators.maxLength(value, 15)) {
          newErrors.registrationPlate = 'Registration plate must not exceed 15 characters';
        } else {
          delete newErrors.registrationPlate;
        }
        break;
      case 'manufacture':
        if (!Validators.required(value)) {
          newErrors.manufacture = 'Manufacturer is required';
        } else if (!Validators.minLength(value, 2)) {
          newErrors.manufacture = 'Manufacturer must be at least 2 characters';
        } else {
          delete newErrors.manufacture;
        }
        break;
      case 'lastInspectionDate':
        if (!Validators.required(value)) {
          newErrors.lastInspectionDate = 'Last inspection date is required';
        } else {
          delete newErrors.lastInspectionDate;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const isFormValid = () => {
    return (
      registrationPlate && 
      manufacture && 
      !!lastInspectionDate &&
      Object.keys(errors).length === 0
    );
  };

  const handleRegisterCar = () => {
    // Validate before submission
    validateField('registrationPlate', registrationPlate);
    validateField('manufacture', manufacture);
    validateField('lastInspectionDate', lastInspectionDate.toISOString().slice(0, 10));

    if (!isFormValid()) {
      return;
    }

    const car: Car = {
      registrationPlate: registrationPlate,
      manufacture: manufacture,
      dateOfManufacture: dateOfManufacture,
      lastInspectionDate,
      token: token,
      deviceRegistrationToken: '',
      carId: 0,
    };
    dispatch(registerCar(car));
    if (normalizedToken) {
      dispatch(getUserCars(normalizedToken));
    }
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
            onChangeText={(text) => {
              setRegistrationPlate(text);
              validateField('registrationPlate', text);
            }}
            error={!!errors.registrationPlate}
          />
          <HelperText type="error" visible={!!errors.registrationPlate}>
            {errors.registrationPlate}
          </HelperText>

          <TextInput
            label="Manufacture"
            value={manufacture}
            onChangeText={(text) => {
              setManufacture(text);
              validateField('manufacture', text);
            }}
            error={!!errors.manufacture}
          />
          <HelperText type="error" visible={!!errors.manufacture}>
            {errors.manufacture}
          </HelperText>

          <Button onPress={() => showDatePicker('manufacture')}>Select Date of Manufacture</Button>
          <Button onPress={() => showDatePicker('inspection')}>Select Last Inspection Date</Button>
          <HelperText type="info" visible>
            Last inspection date: {lastInspectionDate.toISOString().slice(0, 10)}
          </HelperText>
          <HelperText type="error" visible={!!errors.lastInspectionDate}>
            {errors.lastInspectionDate}
          </HelperText>
          {isDatePickerVisible && (
            <YearPicker value={activeDateField === 'manufacture' ? dateOfManufacture : lastInspectionDate} onChange={handleDateChange} />
          )}
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="contained" 
            onPress={handleRegisterCar}
            disabled={!isFormValid()}
          >
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
