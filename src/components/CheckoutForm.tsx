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
import { goBackOrHome } from '../utils/navigation';
import { getPaymentApiBases, getSaveCardPaths } from '../utils/paymentApi';
import { clearSavedCards, getSavedCards, getStripeCustomerId, saveSavedCards, saveStripeCustomerId } from '../utils/storage';
import BackButton from './ui/BackButton';

const CheckoutForm: React.FC<any> = ({ route, navigation }) => {
  const { confirmPayment, confirmSetupIntent } = useStripe();
  const dispatch = useDispatch<any>();

  const isRepairCheckout = route?.params?.mode === 'repair' || !!route?.params?.repairBooking;
  const repairBookingDraft = route?.params?.repairBooking;

  const getInitialSelectedDate = () => {
    const fallback = new Date(Date.now() + 30 * 60 * 1000);
    if (!repairBookingDraft?.scheduledTime) return fallback;

    const raw = String(repairBookingDraft.scheduledTime).trim();
    let parsed: Date;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
      parsed = new Date(`${raw}:00`);
    } else {
      parsed = new Date(raw);
    }

    if (!Number.isFinite(parsed.getTime())) return fallback;
    return parsed;
  };

  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialSelectedDate);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [saveCardStatus, setSaveCardStatus] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const cars = useSelector((state: any) => state.cars?.cars || []);
  const paymentIntent = useSelector((state: any) => state.cart?.pi);
  const user = useSelector((state: any) => state.user?.user);
  const stationId = useSelector((state: any) => state.station?.selectedStation?.id ?? null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  React.useEffect(() => {
    if (isRepairCheckout && repairBookingDraft?.carId) {
      setSelectedCar(repairBookingDraft.carId);
    }
    const load = async () => {
      const existingCustomerId = await getStripeCustomerId();
      if (existingCustomerId) {
        setCustomerId(existingCustomerId);
      }
    };
    load();
  }, [isRepairCheckout, repairBookingDraft?.carId]);

  React.useEffect(() => {
    fetchSavedCards(customerId || '');
  }, [customerId, user?.token, user?.id, user?.email]);

  const cardIdOf = (card: any): string | null => {
    return String(card?.id || card?.paymentMethodId || card?.payment_method || card?.pmId || '') || null;
  };

  const fetchSavedCards = async (existingCustomerId: string) => {
    setLoadingCards(true);
    try {
      const response = await tryRequests(
        getApiBases().map(base => () =>
          axios.get(`${base}/payment/saved-cards`, {
            params: {
              customerId: existingCustomerId || undefined,
              userId: user?.id || undefined,
              email: user?.email || undefined,
            },
            headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
          })
        )
      );
      const cards = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.cards)
          ? response.data.cards
          : [];
      setSavedCards(cards);
      await saveSavedCards(cards);
      const defaultCard = cards.find((card: any) => card?.isDefault);
      setSelectedSavedCardId(cardIdOf(defaultCard) || cardIdOf(cards[0]) || null);
    } catch {
      const cachedCards = await getSavedCards();
      setSavedCards(cachedCards);
      const defaultCard = cachedCards.find((card: any) => card?.isDefault);
      setSelectedSavedCardId(cardIdOf(defaultCard) || cardIdOf(cachedCards[0]) || null);
    } finally {
      setLoadingCards(false);
    }
  };

  const withAuthHeaders = () => (user?.token ? { Authorization: `Bearer ${user.token}` } : undefined);
  const getApiBases = () => {
    const rawBase = process.env.EXPO_PUBLIC_SERVER_URL || '';
    return getPaymentApiBases(rawBase);
  };

  const tryRequests = async (requests: Array<() => Promise<any>>) => {
    let lastError: any = null;
    for (const request of requests) {
      try {
        return await request();
      } catch (e: any) {
        lastError = e;
        const status = e?.response?.status;
        const noResponse = !e?.response;
        if (noResponse || [404, 405, 500, 502, 503].includes(status)) {
          continue;
        }
        throw e;
      }
    }
    throw lastError || new Error('No compatible endpoint found');
  };

  const setDefaultSavedCard = async (paymentMethodId: string) => {
    const candidates = getApiBases().flatMap(base => [
      () => axios.post(`${base}/payment/saved-cards/default`, { customerId, paymentMethodId }, { headers: withAuthHeaders() }),
      () => axios.post(`${base}/payment/default-card`, { customerId, paymentMethodId }, { headers: withAuthHeaders() }),
      () => axios.put(`${base}/payment/saved-cards/${paymentMethodId}/default`, { customerId }, { headers: withAuthHeaders() }),
    ]);
    await tryRequests(candidates);
  };

  const deleteSavedCard = async (paymentMethodId: string) => {
    const candidates = getApiBases().flatMap(base => [
      () => axios.delete(`${base}/payment/saved-cards/${paymentMethodId}`, { params: { customerId }, headers: withAuthHeaders() }),
      () => axios.post(`${base}/payment/saved-cards/delete`, { customerId, paymentMethodId }, { headers: withAuthHeaders() }),
    ]);
    await tryRequests(candidates);
  };

  const persistSavedCardAfterPayment = async (paymentIntent: any) => {
    const paymentMethodId =
      paymentIntent?.paymentMethodId ||
      paymentIntent?.paymentMethod ||
      paymentIntent?.paymentMethod?.id ||
      paymentIntent?.payment_method ||
      null;
    const paymentIntentId = paymentIntent?.id || paymentIntent?.paymentIntentId || null;
    const inferredCustomerId =
      paymentIntent?.customer ||
      paymentIntent?.customerId ||
      paymentIntent?.customer_id ||
      null;

    if (!paymentMethodId) return;

    if (inferredCustomerId && inferredCustomerId !== customerId) {
      setCustomerId(inferredCustomerId);
      await saveStripeCustomerId(inferredCustomerId);
    }

    const payload = {
      customerId: inferredCustomerId || customerId || undefined,
      stripeCustomerId: inferredCustomerId || customerId || undefined,
      userId: user?.id || undefined,
      email: user?.email || undefined,
      paymentMethodId,
      paymentIntentId: paymentIntentId || undefined,
      setDefault: true,
      makeDefault: true,
      token: user?.token,
    };

    const response = await tryRequests(
      getApiBases().flatMap(base =>
        getSaveCardPaths().map(path => () => axios.post(`${base}${path}`, payload, { headers: withAuthHeaders() }))
      )
    );

    const nextCustomerId =
      response?.data?.customerId ||
      response?.data?.customer ||
      response?.data?.stripeCustomerId ||
      response?.data?.customer_id ||
      null;

    const effectiveCustomerId = nextCustomerId || inferredCustomerId || customerId || '';
    if (nextCustomerId && nextCustomerId !== customerId) {
      setCustomerId(nextCustomerId);
      await saveStripeCustomerId(nextCustomerId);
    }
    await fetchSavedCards(effectiveCustomerId);
  };

  const setupCardForFuture = async () => {
    const payload = {
      token: user?.token,
      userId: user?.id,
      customerId,
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Customer',
      email: user?.email || '',
    };

    const setupIntentResponse = await tryRequests(
      getApiBases().flatMap(base => [
        () =>
          axios.post(`${base}/payment/create-setup-intent`, payload, {
            headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
          }),
        () =>
          axios.post(`${base}/payment/setup-intent`, payload, {
            headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
          }),
      ])
    );

    const setupClientSecret =
      (typeof setupIntentResponse?.data === 'string' ? setupIntentResponse.data : null) ||
      setupIntentResponse?.data?.clientSecret ||
      setupIntentResponse?.data?.client_secret ||
      setupIntentResponse?.data?.setupIntentClientSecret ||
      setupIntentResponse?.data?.setup_intent_client_secret ||
      null;
    const nextCustomerId =
      setupIntentResponse?.data?.customerId ||
      setupIntentResponse?.data?.customer ||
      setupIntentResponse?.data?.stripeCustomerId ||
      setupIntentResponse?.data?.customer_id ||
      null;

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

    const effectiveCustomerId = nextCustomerId || customerId || '';
    if (effectiveCustomerId) {
      await fetchSavedCards(effectiveCustomerId);
    }
  };

  // Helper to show the car selection menu
  const showVehiclePicker = () => {
    const carOptions = cars.map((car: any) => `${car.manufacture} (${car.registerationPlate || 'No Plate'})`);

    if (Platform.OS === 'ios') {
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
      return;
    }

    Alert.alert(
      'Select Vehicle',
      undefined,
      [
        ...cars.map((car: any) => ({
          text: `${car.manufacture} (${car.registerationPlate || 'No Plate'})`,
          onPress: () => setSelectedCar(car.carId),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true }
    );
  };

  const resolveClientSecret = (pi: any): string | null => {
    if (!pi) return null;
    if (typeof pi === 'string') return pi;
    return pi.clientSecret || pi.client_secret || pi.paymentIntentClientSecret || null;
  };

  const formatDateTime = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const showError = (message: string) => {
    setPaymentError(message);
  };

  const handlePayment = async () => {
    setPaymentError(null);
    if (!selectedCar) return showError('Please select a car');
    if (!selectedSavedCardId && !cardDetails?.complete) {
      return showError('Please enter valid card details or choose a saved card');
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    if (selectedDateOnly.getTime() < today.getTime()) {
        return showError('Please select a future date');
    }
    
    const clientSecret = resolveClientSecret(paymentIntent);
    if (!clientSecret) return showError('Payment session expired. Please go back and try again.');

    setLoading(true);
    try {
      setSaveCardStatus(null);
      let cardSavedDuringSetup = false;
      if (saveCard) {
        try {
          await setupCardForFuture();
          cardSavedDuringSetup = true;
          setSaveCardStatus('Card saved for next time.');
        } catch (saveError: any) {
          const msg = saveError?.response?.data?.message || saveError?.message || 'Could not save card.';
          setSaveCardStatus(`Could not save card: ${msg}`);
          showError(`${msg}. Continuing with payment.`);
        }
      }

      const result = selectedSavedCardId
        ? await (confirmPayment as any)(clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
              paymentMethodId: selectedSavedCardId,
              billingDetails: { name: user?.name ?? 'Customer' },
            },
          })
        : await (confirmPayment as any)(clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
              card: cardDetails,
              billingDetails: { name: user?.name ?? 'Customer' },
            },
          });

      if (result?.error) {
        const stripeMessage =
          result.error.localizedMessage ||
          result.error.message ||
          'Payment confirmation failed.';
        console.log('[payment] Stripe confirm error:', result.error);
        showError(stripeMessage);
        return;
      }

      if (result?.paymentIntent?.status?.toLowerCase() === 'succeeded') {
        if (saveCard && !cardSavedDuringSetup) {
          try {
            await persistSavedCardAfterPayment(result.paymentIntent);
            setSaveCardStatus('Card saved for next time.');
          } catch (saveError: any) {
            const msg =
              saveError?.response?.data?.message ||
              (typeof saveError?.response?.data === 'string' ? saveError.response.data : null) ||
              saveError?.message ||
              'Could not save card.';
            setSaveCardStatus(`Could not save card: ${msg}`);
            showError(msg);
          }
        }

        let bookingResponse: any;
        if (isRepairCheckout) {
          const dt = selectedDate;
          const pad = (n: number) => String(n).padStart(2, '0');
          const ms = String(dt.getMilliseconds()).padStart(3, '0');
          const localDateTime = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}.${ms}`;
          const repairPayload = {
            ...repairBookingDraft,
            carId: selectedCar,
            userId: user?.id,
            token: user?.token,
            scheduledTime: localDateTime,
          };
          const base = process.env.EXPO_PUBLIC_SERVER_URL || '';
          try {
            bookingResponse = (await axios.post(`${base}/booking/repair`, repairPayload)).data;
          } catch (error: any) {
            if (error?.response?.status === 404) {
              bookingResponse = (await axios.post(`${base}/v1/bookings/repair`, repairPayload)).data;
            } else {
              throw error;
            }
          }
        } else {
          const washType = route.params?.washType || 'regular';
          const isWaterless = String(washType).toLowerCase() === 'waterless';

          if (!selectedCar) {
            showError('Please select a car.');
            return;
          }
          if (!isWaterless && !stationId) {
            showError('Please select a station before booking.');
            return;
          }
          if (!isWaterless && !route.params?.program?.id) {
            showError('Please select a valid washing program.');
            return;
          }
          if (isWaterless && !route.params?.deliveryAddress) {
            showError('Delivery address is required for waterless wash.');
            return;
          }
          
          const bookingPayload = {
            carId: selectedCar,
            userId: user.id,
            stationId: isWaterless ? null : stationId,
            washingProgramId: isWaterless ? (route.params?.program?.id ?? null) : route.params?.program?.id,
            scheduledTime: selectedDate.toISOString(),
            token: user.token,
            executed: false,
            washType,
            bookingType: isWaterless ? 'WATERLESS_DELIVERY' : 'WASH',
            programType: route.params?.program?.programType,
            deliveryAddress: route.params?.deliveryAddress,
            deliveryPhone: route.params?.deliveryPhone,
            deliveryNotes: route.params?.deliveryNotes,
            deliveryLatitude: route.params?.deliveryLatitude,
            deliveryLongitude: route.params?.deliveryLongitude,
          };
          bookingResponse = await dispatch(createBooking(bookingPayload));
        }

        const qrCode = bookingResponse?.qrCode || bookingResponse?.qr_code;
        if (qrCode) {
          navigation.replace('QrScreen', { qrCode });
        } else {
          showError('Payment succeeded but booking failed.');
        }
      } else {
        const status = result?.paymentIntent?.status || 'unknown';
        console.log('[payment] Unexpected payment intent status:', status, result?.paymentIntent);
        showError(`Transaction not completed (${status}).`);
      }
    } catch (error: any) {
      const backendMessage =
        typeof error?.details === 'string'
          ? error.details
          : error?.details?.message ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Payment error occurred.';
      console.log('[payment] handlePayment catch:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      showError(backendMessage);
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
              <BackButton onPress={() => goBackOrHome(navigation)} />
              <Text style={styles.headerTitle}>Checkout</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.programCard}>
              <Text style={styles.headerSubtitle}>{isRepairCheckout ? 'Selected Service' : 'Selected Program'}</Text>
              <Text style={styles.programName}>{route.params?.program?.name || (isRepairCheckout ? 'Repair Service' : 'Wash Program')}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>€</Text>
                <Text style={styles.priceText}>{Number(route.params?.program?.price || 0).toFixed(2)}</Text>
              </View>
            </View>
            {paymentError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{paymentError}</Text>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Booking Details</Text>

              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => {
                  setPickerMode('date');
                  setShowPicker(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.inputLabel}>Date</Text>
                <Text style={styles.inputValue}>{formatDateTime(selectedDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => {
                  setPickerMode('time');
                  setShowPicker(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.inputLabel}>Time</Text>
                <Text style={styles.inputValue}>
                  {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
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
                  {savedCards.map((card: any) => {
                    const cardId = cardIdOf(card) || `${card.last4}`;
                    const selected = cardId === selectedSavedCardId;
                    return (
                      <View key={cardId} style={[styles.savedCardRow, selected && styles.savedCardRowSelected]}>
                        <TouchableOpacity
                          onPress={() => setSelectedSavedCardId(cardId)}
                          activeOpacity={0.8}
                          style={{ flex: 1 }}
                        >
                          <Text style={styles.savedCardItem}>
                            {String(card.brand || '').toUpperCase()} •••• {card.last4} {card.isDefault ? '(default)' : ''}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await setDefaultSavedCard(cardId);
                              await fetchSavedCards(customerId || '');
                              setSaveCardStatus('Default card updated.');
                            } catch (e: any) {
                              showError(e?.response?.data?.message || e?.message || 'Could not set default card.');
                            }
                          }}
                          style={styles.savedCardAction}
                        >
                          <Text style={styles.savedCardActionText}>Default</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await deleteSavedCard(cardId);
                              if (selectedSavedCardId === cardId) setSelectedSavedCardId(null);
                              await fetchSavedCards(customerId || '');
                              if (savedCards.length <= 1) {
                                await clearSavedCards();
                              }
                              setSaveCardStatus('Card removed.');
                            } catch (e: any) {
                              showError(e?.response?.data?.message || e?.message || 'Could not delete card.');
                            }
                          }}
                          style={[styles.savedCardAction, styles.savedCardDanger]}
                        >
                          <Text style={[styles.savedCardActionText, styles.savedCardDangerText]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.savedCardHint}>No saved cards yet.</Text>
              )}
              {saveCardStatus ? <Text style={styles.savedCardStatus}>{saveCardStatus}</Text> : null}
            </View>

            {showPicker && (
              <DateTimePicker
                value={selectedDate}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (!date) {
                    if (Platform.OS === 'android') setShowPicker(false);
                    return;
                  }

                  setSelectedDate(prev => {
                    const next = new Date(prev);
                    if (pickerMode === 'date') {
                      next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    } else {
                      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                    }
                    return next;
                  });

                  if (Platform.OS === 'android' || event?.type === 'dismissed') {
                    setShowPicker(false);
                  }
                }}
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
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
  errorBanner: {
    marginBottom: 14,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
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
  savedCardRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedCardRowSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  savedCardItem: { fontSize: 13, color: '#4B5563' },
  savedCardAction: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  savedCardDanger: {
    borderColor: '#DC2626',
  },
  savedCardActionText: { fontSize: 11, color: '#4F46E5', fontWeight: '700' },
  savedCardDangerText: { color: '#DC2626' },
  savedCardHint: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  savedCardStatus: { marginTop: 8, fontSize: 12, color: '#4F46E5', fontWeight: '700' },
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
