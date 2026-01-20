import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { registerCar } from '../redux/actions/carActions';

export default function AddCar() {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const user = useSelector((state: any) => state.user.user);

  const [manufacture, setManufacture] = useState('');
  const [registrationPlate, setRegistrationPlate] = useState('');
  const [dateOfManufacture, setDateOfManufacture] = useState('');

  const handleAddCar = () => {
    dispatch(
      registerCar({
        manufacture,
        registrationPlate,
        dateOfManufacture,
        token: user.token,
      }),
    );
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* 🔙 Back Button */}
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />

        <Text style={styles.title}>Add a New Car</Text>

        <TextInput
          label="Manufacture"
          value={manufacture}
          onChangeText={setManufacture}
          style={styles.input}
        />

        <TextInput
          label="Registration Plate"
          value={registrationPlate}
          onChangeText={setRegistrationPlate}
          style={styles.input}
        />

        <TextInput
          label="Manufacture Date"
          value={dateOfManufacture}
          onChangeText={setDateOfManufacture}
          style={styles.input}
        />

        <Button mode="contained" onPress={handleAddCar} style={styles.button}>
          Add Car
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
  },
    backButton: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
});
