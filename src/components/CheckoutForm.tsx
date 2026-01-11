import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { HeaderBackButton } from '@react-navigation/elements';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { createBooking } from '../redux/actions/BookingActions';

type Props = {
  route: any;
  navigation: any;
};

const CheckoutForm: React.FC<Props> = ({ route, navigation }) => {
  const { confirmPayment } = useStripe();
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);

  const dispatch = useDispatch();


  const cars = useSelector((state: any) => state.cars?.cars || []);
  const paymentIntent = useSelector((state: any) => state.cart?.pi);
  const user = useSelector((state: any) => state.user?.user);
  const stationId = useSelector((state: any) => state.station?.selectedStation);

  const onChange = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };
const handlePayment = async () => {
  if (!selectedCar) return Alert.alert('Please select a car');
  if (!cardDetails?.complete) return Alert.alert('Please enter valid card details');
  if (selectedDate <= new Date()) return Alert.alert('Please select a future date');
  if (!paymentIntent) return Alert.alert('Payment not ready');

  try {
    const result = await confirmPayment(paymentIntent, {
      paymentMethodType: 'Card',
      paymentMethodData: {
        card: cardDetails,
      
      billingDetails: {
        name: user?.name ?? 'Customer',
      },
      },
    });

    console.log('Stripe confirmPayment result:', result);

    const status = result?.paymentIntent?.status?.toLowerCase();

    if (status === 'succeeded') {

      const bookingPayload = {
        carId: selectedCar,
        userId: user.id,
        stationId,
        washingProgramId: route.params?.program?.id,
        token: user.token,
        executed: false,
      };

      const bookingResponse: any = await dispatch(createBooking(bookingPayload));
  console.log('Booking response:', bookingResponse);

     if (bookingResponse?.qrCode) {
    navigation.navigate('QrScreen', { qrCode: bookingResponse.qrCode });
  } else {
    Alert.alert('Booking failed', 'No QR code returned from server.');
  }
    } else {
      Alert.alert('Payment failed. Please try again.');
    }
  } catch (error: any) {
    console.error('Payment error:', error);
    Alert.alert('Payment error', error?.message || 'Unexpected error occurred');
  }
};



  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

 return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <HeaderBackButton onPress={() => navigation.goBack()} />
        <View style={styles.card}>
          <Text style={styles.title}>Checkout</Text>

          {/* Date Picker */}
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onChange}
              minimumDate={new Date()}
            />
          )}

          {/* Car Picker */}
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedCar} onValueChange={setSelectedCar}>
              <Picker.Item label="Select a Car" value={null} />
              {cars.map((car: any) => (
                <Picker.Item key={car.carId} label={car.manufacture} value={car.carId} />
              ))}
            </Picker>
          </View>

          {/* Card Input */}
          <CardField
            postalCodeEnabled
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{ backgroundColor: '#fff', textColor: '#000', borderRadius: 8 }}
            style={styles.cardField}
            onCardChange={setCardDetails}
          />

          {/* Pay Button */}
          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <Text style={styles.payButtonText}>Pay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { padding: 20, alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  datePickerButton: { width: '100%', padding: 12, backgroundColor: '#eaeaea', borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  dateText: { fontSize: 16, color: '#333' },
  pickerContainer: { width: '100%', backgroundColor: '#eaeaea', borderRadius: 8, marginBottom: 15 },
  cardField: { width: '100%', height: 50, marginVertical: 20 },
  payButton: { width: '100%', paddingVertical: 12, borderRadius: 8, backgroundColor: '#007AFF', alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default CheckoutForm;