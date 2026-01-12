import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { CardForm, useStripe } from '@stripe/stripe-react-native';
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
    if (selectedDate < new Date()) return Alert.alert('Please select a future date');
    if (!paymentIntent) return Alert.alert('Payment not ready');

    try {
      const result = await confirmPayment(paymentIntent, {
        paymentMethodType: 'Card',
        paymentMethodData: {  
          card: cardDetails,
          billingDetails: { name: user?.name ?? 'Customer' },
        },
      });

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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{route.params?.program?.name}</Text>
        </View>

        {/* Checkout Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Checkout</Text>

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

          {/* Stripe CardForm */}
          <CardForm
            style={{ width: '100%', height: 120 }}
            postalCodeEnabled
            autofocus
            onFormComplete={(details) => setCardDetails(details)}
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
  safeContainer: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 15,
  },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 18, color: '#007AFF', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flexShrink: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 15 },
  datePickerButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  dateText: { fontSize: 16, color: '#333' },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    marginBottom: 15,
  },
  payButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginTop: 15,
  },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default CheckoutForm;
