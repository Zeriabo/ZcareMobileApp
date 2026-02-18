import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Circle, Text, YStack } from 'tamagui';
import { deleteCar, getUserCars } from '../redux/actions/carActions';

function MyCars() {
  const user = useSelector((state: any) => state.user.user);
  const cars = useSelector((state: any) => state.cars.cars);
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
console.log(cars)
  useEffect(() => {
    if (user?.token && isFocused) {
      dispatch(getUserCars(user.token));
    }
  }, [dispatch, user, isFocused]);

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
    <YStack padding="$4" space="$4">
      <Text fontSize={22} fontWeight="700">
        My Cars
      </Text>

      {cars.length === 0 && (
        <Text color="$gray10">No cars registered yet</Text>
      )}

      {cars.map((car: any) => (
        <Card
          key={car.carId}
          padding="$3"
          borderRadius="$4"
          backgroundColor="$background"
          elevation={3}
        >
          <YStack space="$2">
            <Text fontSize={18} fontWeight="700">
              {car.manufacture} {car.registerationPlate}
            </Text>
            <Text fontSize={14} color="$gray10">
               Manufacture Year: {new Date(car.dateOfManufacture).getFullYear()}
            </Text>

            {/* Remove Car Button */}
            <Button
              size="$fit"
              backgroundColor="$red10"
              color="white"
              borderRadius="$3"
              paddingHorizontal="$4"
              pressStyle={{ scale: 0.95, backgroundColor: '$red9' }}
              onPress={() => handleRemoveCar(car)}
            >
              Remove Car
            </Button>
          </YStack>
        </Card>
      ))}

      <Circle
        position="absolute"
        right="$4"

        size={56}
        backgroundColor="$green10"
        alignItems="center"
        justifyContent="center"
        elevation={6}
        onPress={() => navigation.navigate('AddCar')}
      >
        <Text fontSize={32} color="white">
          +
        </Text>
      </Circle>
    </YStack>
  );
}

export default MyCars;
