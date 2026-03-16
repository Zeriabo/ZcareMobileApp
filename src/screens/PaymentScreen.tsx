import { CardField, useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Image, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';


const PaymentScreen = ({ program, user, selectedCar, selectedStation }: any) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { confirmPayment } = useStripe();
  const dispatch = useDispatch<any>();

  const handlePayPress = async () => {
    setErrorMessage(null);
    if (!cardDetails?.complete) {
      setErrorMessage(t('payment.enterCompleteCardDetails'));
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Create PaymentIntent on backend
      const paymentRequest = {
        program: {
          id: program.id,
          name: program.name,
          price: program.price,
          programType: program.programType,
        },
        stationId: selectedStation?.id ?? selectedStation?.stationId,
        paymentMethod: { paymentMethodType: 'credit_card' },
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/payment/create-payment-intent`,
        paymentRequest
      );

      const clientSecret = response.data;

      // 2️⃣ Confirm payment on device
      const { paymentIntent, error } = await (confirmPayment as any)(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: user?.name ?? 'Customer',
          },
        },
      });

      if (error) {
        setErrorMessage(`${t('payment.paymentFailed')}: ${error.message}`);
        return;
      }

      if (String(paymentIntent?.status || '').toLowerCase() === 'succeeded') {
       

        // 3️⃣ Create booking on backend (and receive QR code)
        const bookingDto = {
          token: user?.token,
          carId: selectedCar?.carId ?? selectedCar?.id,
          stationId: selectedStation?.id ?? selectedStation?.stationId,
          washingProgramId: program.id,
          scheduledTime: new Date().toISOString(),
        };

        const bookingResponse = await axios.post(
          `${process.env.EXPO_PUBLIC_SERVER_URL}/bookings`,
          bookingDto
        );

        // The backend should return: { bookingId, qrCode, status }
        const { qrCode: qrBase64 } = bookingResponse.data;
        setQrCode(qrBase64);

        dispatch({ type: 'BOOKING_SUCCESS', payload: bookingResponse.data });
      }
    } catch (err: any) {
      console.error(err);
      const apiData = err?.response?.data;
      const normalized =
        apiData?.message ||
        (typeof apiData === 'string' ? apiData : null) ||
        err?.message ||
        t('payment.paymentOrBookingFailed');
      setErrorMessage(normalized);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>{t('checkout.processing')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center' }}>
      {!qrCode ? (
        <>
          {errorMessage ? (
            <View style={{ width: '100%', backgroundColor: '#FFF1F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 8, padding: 10 }}>
              <Text style={{ color: '#B91C1C', fontWeight: '700' }}>{errorMessage}</Text>
            </View>
          ) : null}
          <CardField
            postalCodeEnabled={true}
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{ backgroundColor: '#FFFFFF', textColor: '#000000' }}
            style={{ width: '100%', height: 50, marginVertical: 30 }}
            onCardChange={(card) => setCardDetails(card)}
          />
          <Button title={t('payment.payAndGetQrCode')} onPress={handlePayPress} />
        </>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>{t('payment.yourBookingQrCode')}</Text>
          <Image
            source={{ uri: `data:image/png;base64,${qrCode}` }}
            style={{ width: 200, height: 200 }}
          />
          <Text style={{ marginTop: 10 }}>{t('payment.showCodeAtStation')}</Text>
        </View>
      )}
    </View>
  );
};

export default PaymentScreen;
