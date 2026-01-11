import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native'; // Import TouchableOpacity

interface CarProps {
  car: {
    registerationPlate: string;
    manufacture: string;
  };
  onRemove: () => void; // Add a callback prop for removing the car
}

const Car: React.FC<CarProps> = ({car, onRemove}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove} // Call the callback when the button is pressed
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
      <Text style={styles.infoText}>
        Registration Plate: {car.registerationPlate}
      </Text>
      <Text style={styles.infoText}>Manufacture: {car.manufacture}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  removeButton: {
    alignSelf: 'flex-end', // Align the button to the right
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Car;
