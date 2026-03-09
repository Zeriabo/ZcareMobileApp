import { NavigationProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import YearPicker from 'react-native-month-year-picker';
import { Button, Card, HelperText, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserCars, registerCar } from '../redux/actions/carActions';
import Car from '../redux/types/CarType';
import { Validators } from '../utils/validators';

interface Props {
  navigation: NavigationProp<any>;
}
const CarRegistrationForm: React.FC<Props> = ({navigation}) => {
  const { t } = useLanguage();
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

  const normalizePickerDate = (value: any): Date | null => {
    if (value == null) return null;

    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      // Some month-year pickers may return raw year (e.g. 1995) instead of Date
      if (value >= 1900 && value <= 3000) {
        return new Date(value, 0, 1);
      }

      const fromEpoch = new Date(value);
      if (Number.isFinite(fromEpoch.getTime())) {
        return fromEpoch;
      }
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (Number.isFinite(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    const normalizedDate = normalizePickerDate(selectedDate);
    if (normalizedDate) {
      if (activeDateField === 'manufacture') {
        setDateOfManufacture(normalizedDate);
      } else {
        setLastInspectionDate(normalizedDate);
        validateField('lastInspectionDate', normalizedDate.toISOString().slice(0, 10));
      }
    }
    hideDatePicker();
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'registrationPlate':
        if (!Validators.required(value)) {
          newErrors.registrationPlate = t('cars.registrationRequired');
        } else if (!Validators.minLength(value, 3)) {
          newErrors.registrationPlate = t('cars.registrationMinLength');
        } else if (!Validators.maxLength(value, 15)) {
          newErrors.registrationPlate = t('cars.registrationMaxLength');
        } else {
          delete newErrors.registrationPlate;
        }
        break;
      case 'manufacture':
        if (!Validators.required(value)) {
          newErrors.manufacture = t('cars.manufacturerRequired');
        } else if (!Validators.minLength(value, 2)) {
          newErrors.manufacture = t('cars.manufacturerMinLength');
        } else {
          delete newErrors.manufacture;
        }
        break;
      case 'lastInspectionDate':
        if (!Validators.required(value)) {
          newErrors.lastInspectionDate = t('cars.lastInspectionRequired');
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
        <Card.Title title={t('cars.registerCar')} />
        <Card.Content>
          <TextInput
            label={t('cars.licensePlate')}
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
            label={t('cars.manufacture')}
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

          <Button onPress={() => showDatePicker('manufacture')}>{t('cars.selectDateOfManufacture')}</Button>
          <HelperText type="info" visible>
            {t('cars.dateOfManufacture')}: {dateOfManufacture.toISOString().slice(0, 10)}
          </HelperText>
          <Button onPress={() => showDatePicker('inspection')}>{t('cars.selectLastInspectionDate')}</Button>
          <HelperText type="info" visible>
            {t('cars.lastInspection')}: {lastInspectionDate.toISOString().slice(0, 10)}
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
            {t('cars.registerCar')}
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
