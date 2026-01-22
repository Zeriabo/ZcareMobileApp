import DateTimePicker from '@react-native-community/datetimepicker';
import { CardForm, useStripe } from '@stripe/stripe-react-native';
import React, { useLayoutEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { createBooking } from '../redux/actions/BookingActions';

const CheckoutForm: React.FC<any> = ({ route, navigation }) => {
  const { confirmPayment } = useStripe();
  const dispatch = useDispatch();

  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cars = useSelector((state: any) => state.cars?.cars || []);
  const paymentIntent = useSelector((state: any) => state.cart?.pi);
  const user = useSelector((state: any) => state.user?.user);
  const stationId = useSelector((state: any) => state.station?.selectedStation);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Helper to show the car selection menu
  const showVehiclePicker = () => {
    const carOptions = cars.map((car: any) => `${car.manufacture} (${car.registerationPlate || 'No Plate'})`);
    
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', ...carOptions],
        cancelButtonIndex: 0,
        title: 'Select Vehicle',
      },
      (buttonIndex) => {
        if (buttonIndex > 0) {
          setSelectedCar(cars[buttonIndex - 1].carId);
        }
      }
    );
  };

  const handlePayment = async () => {
    if (!selectedCar) return Alert.alert('Error', 'Please select a car');
    if (!cardDetails?.complete) return Alert.alert('Error', 'Please enter valid card details');
    
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate.setHours(0,0,0,0) < today) {
        return Alert.alert('Error', 'Please select a future date');
    }
    
    if (!paymentIntent) return Alert.alert('Error', 'Payment session expired.');

    setLoading(true);
    try {
      const result = await confirmPayment(paymentIntent, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          card: cardDetails,
          billingDetails: { name: user?.name ?? 'Customer' },
        },
      });

      if (result?.paymentIntent?.status?.toLowerCase() === 'succeeded') {
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
          Alert.alert('Booking Error', 'Payment succeeded but booking failed.');
        }
      } else {
        Alert.alert('Payment Failed', 'Transaction declined.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Payment error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <View style={styles.headerTextCenter}>
                <Text style={styles.headerSubtitle}>Confirm Booking</Text>
                <Text style={styles.headerTitle}>{route.params?.program?.name || 'Wash Program'}</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.currency}>€</Text>
              <Text style={styles.priceText}>{route.params?.program?.price || '0.00'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Booking Details</Text>
              
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowPicker(true)}>
                <Text style={styles.inputLabel}>Date</Text>
                <Text style={styles.inputValue}>{selectedDate.toDateString()}</Text>
              </TouchableOpacity>

              {/* CLEAN VEHICLE SELECTION */}
              <TouchableOpacity style={styles.inputRow} onPress={showVehiclePicker}>
                <Text style={styles.inputLabel}>Vehicle</Text>
                <Text style={[styles.inputValue, !selectedCar && { color: '#8E8E93' }]}>
                  {selectedCar ? cars.find((c: any) => c.carId === selectedCar)?.manufacture : 'Select Car'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Payment Card</Text>
              <CardForm
                style={styles.stripeCard}
                postalCodeEnabled
                onFormComplete={(details) => setCardDetails(details)}
              />
            </View>

            {showPicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
              />
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payButton, loading && { backgroundColor: '#A2C8FF' }]} 
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payButtonText}>Pay Now</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  closeButton: { padding: 10 },
  closeIcon: { fontSize: 22, color: '#1C1C1E' },
  headerTextCenter: { alignItems: 'center', flex: 1 },
  headerSubtitle: { color: '#8E8E93', fontSize: 13, textTransform: 'uppercase' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginVertical: 25 },
  currency: { fontSize: 24, fontWeight: '600', color: '#007AFF' },
  priceText: { fontSize: 52, fontWeight: '800', color: '#1C1C1E' },
  section: { marginBottom: 30 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  inputLabel: { fontSize: 16, color: '#3A3A3C' },
  inputValue: { fontSize: 16, fontWeight: '500', color: '#007AFF' },
  stripeCard: { width: '100%', height: 220, marginTop: 10 },
  footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8', backgroundColor: '#FFF' },
  payButton: { backgroundColor: '#007AFF', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  payButtonText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
});

export default CheckoutForm;