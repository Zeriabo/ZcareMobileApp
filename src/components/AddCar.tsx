import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { MotiView } from 'moti';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Circle, Input, Text, YStack } from 'tamagui';
import { registerCar } from '../redux/actions/carActions';

export default function AddCar() {
  const dispatch = useDispatch<any>();
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
      })
    );
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$4"
        backgroundColor="$background"
      >
        <YStack
          width="100%"
          maxWidth={400}
          backgroundColor="$background"
          borderRadius="$5"
          padding="$4"
          elevation={3}
          space="$4"
        >
          {/* 🔙 Back Button */}
          <Circle
            size={36}
            backgroundColor="$gray3"
            alignItems="center"
            justifyContent="center"
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="black" />
          </Circle>

          <Text fontSize={24} fontWeight="700" textAlign="center">
            Add a New Car
          </Text>

          {/* Inputs */}
          <Input
            value={manufacture}
            onChangeText={setManufacture}
            placeholder="Manufacture"
            borderRadius="$3"
            paddingVertical="$2"
            paddingHorizontal="$3"
          />

          <Input
            value={registrationPlate}
            onChangeText={setRegistrationPlate}
            placeholder="Registration Plate"
            borderRadius="$3"
            paddingVertical="$2"
            paddingHorizontal="$3"
          />

          <Input
            value={dateOfManufacture}
            onChangeText={setDateOfManufacture}
            placeholder="Manufacture Date (YYYY)"
            borderRadius="$3"
            paddingVertical="$2"
            paddingHorizontal="$3"
          />

          {/* Add Car Button */}
          <MotiView
            from={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 120 }}
          >
            <Button
              size="$fit"
              backgroundColor="$green10"
              color="white"
              borderRadius="$3"
              paddingHorizontal="$5"
              paddingVertical="$3"
              pressStyle={{ scale: 0.96, backgroundColor: '$green9' }}
              onPress={handleAddCar}
            >
              Add Car
            </Button>
          </MotiView>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
