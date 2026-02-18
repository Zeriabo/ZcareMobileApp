import DateTimePicker from '@react-native-community/datetimepicker';
import { CardForm, useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
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
import { getStripeCustomerId, saveStripeCustomerId } from '../utils/storage';

const CheckoutForm: React.FC<any> = ({ route, navigation }) => {
  const { confirmPayment, confirmSetupIntent } = useStripe();
  const dispatch = useDispatch<any>();

  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const cars = useSelector((state: any) => state.cars?.cars || []);
  const paymentIntent = useSelector((state: any) => state.cart?.pi);
  const user = useSelector((state: any) => state.user?.user);
  const stationId = useSelector((state: any) => state.station?.selectedStation.id);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  React.useEffect(() => {
    const load = async () => {
      const existingCustomerId = await getStripeCustomerId();
      if (existingCustomerId) {
        setCustomerId(existingCustomerId);
        fetchSavedCards(existingCustomerId);
      }
    };
    load();
  }, []);

  const fetchSavedCards = async (existingCustomerId: string) => {
    if (!existingCustomerId) return;
    setLoadingCards(true);
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_SERVER_URL}/payment/saved-cards`, {
        params: { customerId: existingCustomerId },
      });
      setSavedCards(Array.isArray(response.data) ? response.data : []);
    } catch {
      setSavedCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const setupCardForFuture = async () => {
    const payload = {
      token: user?.token,
      customerId,
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Customer',
      email: user?.email || '',
    };

    const setupIntentResponse = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER_URL}/payment/create-setup-intent`,
      payload
    );

    const setupClientSecret = setupIntentResponse?.data?.clientSecret;
    const nextCustomerId = setupIntentResponse?.data?.customerId;

    if (!setupClientSecret) {
      throw new Error('Setup intent did not return a client secret');
    }

    if (nextCustomerId && nextCustomerId !== customerId) {
      setCustomerId(nextCustomerId);
      await saveStripeCustomerId(nextCustomerId);
    }

    const setupResult = await (confirmSetupIntent as any)(setupClientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: {
        billingDetails: { name: payload.name },
      },
    });

    if (setupResult?.error) {
      throw new Error(setupResult.error.message || 'Could not save card');
    }

    await fetchSavedCards(nextCustomerId || customerId || '');
  };

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

  const resolveClientSecret = (pi: any): string | null => {
    if (!pi) return null;
    if (typeof pi === 'string') return pi;
    return pi.clientSecret || pi.client_secret || pi.paymentIntentClientSecret || null;
  };

  const handlePayment = async () => {
    if (!selectedCar) return Alert.alert('Error', 'Please select a car');
    if (!cardDetails?.complete) return Alert.alert('Error', 'Please enter valid card details');
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    if (selectedDateOnly.getTime() < today.getTime()) {
        return Alert.alert('Error', 'Please select a future date');
    }
    
    const clientSecret = resolveClientSecret(paymentIntent);
    if (!clientSecret) return Alert.alert('Error', 'Payment session expired. Please go back and try again.');

    setLoading(true);
    try {
      if (saveCard) {
        await setupCardForFuture();
      }

      const result = await (confirmPayment as any)(clientSecret, {
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
        const qrCode = bookingResponse?.qrCode || bookingResponse?.qr_code;
        if (qrCode) {
          navigation.replace('QrScreen', { qrCode });
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
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Checkout</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.programCard}>
              <Text style={styles.headerSubtitle}>Selected Program</Text>
              <Text style={styles.programName}>{route.params?.program?.name || 'Wash Program'}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>€</Text>
                <Text style={styles.priceText}>{Number(route.params?.program?.price || 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Booking Details</Text>

              <TouchableOpacity style={styles.inputRow} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
                <Text style={styles.inputLabel}>Date</Text>
                <Text style={styles.inputValue}>{selectedDate.toDateString()}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.inputRow} onPress={showVehiclePicker} activeOpacity={0.8}>
                <Text style={styles.inputLabel}>Vehicle</Text>
                <Text style={[styles.inputValue, !selectedCar && { color: '#8E8E93' }]}>
                  {selectedCar
                    ? `${cars.find((c: any) => c.carId === selectedCar)?.manufacture || 'Car'} (${cars.find((c: any) => c.carId === selectedCar)?.registerationPlate || 'No Plate'})`
                    : 'Select Car'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Payment Card</Text>
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => setSaveCard(prev => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.inputLabel}>Save this card for next time</Text>
                <Text style={styles.inputValue}>{saveCard ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
              <CardForm
                style={styles.stripeCard}
                onFormComplete={(details: any) => setCardDetails(details)}
              />
              {loadingCards ? (
                <Text style={styles.savedCardHint}>Loading saved cards...</Text>
              ) : savedCards.length > 0 ? (
                <View style={styles.savedCardsWrap}>
                  <Text style={styles.savedCardsTitle}>Saved cards</Text>
                  {savedCards.map((card: any) => (
                    <Text key={card.id} style={styles.savedCardItem}>
                      {String(card.brand || '').toUpperCase()} •••• {card.last4} {card.isDefault ? '(default)' : ''}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.savedCardHint}>No saved cards yet.</Text>
              )}
            </View>

            {showPicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event, date) => {
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
  safeContainer: { flex: 1, backgroundColor: '#EEF2FF' },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#111827', fontWeight: '700' },
  headerSubtitle: { color: '#6B7280', fontSize: 12, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  programCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  programName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  currency: { fontSize: 20, fontWeight: '700', color: '#818CF8' },
  priceText: { fontSize: 40, fontWeight: '900', color: '#fff', marginLeft: 4 },
  sectionCard: {
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputLabel: { fontSize: 15, color: '#374151', fontWeight: '600' },
  inputValue: { fontSize: 15, fontWeight: '700', color: '#4F46E5', maxWidth: '62%', textAlign: 'right' },
  stripeCard: { width: '100%', height: 220, marginTop: 8 },
  savedCardsWrap: { marginTop: 10 },
  savedCardsTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  savedCardItem: { fontSize: 13, color: '#4B5563', marginBottom: 3 },
  savedCardHint: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    backgroundColor: '#FFFFFFF2',
  },
  payButton: { backgroundColor: '#4F46E5', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  payButtonText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
});

export default CheckoutForm;
