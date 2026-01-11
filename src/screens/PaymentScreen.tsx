import { CardField, useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';


const PaymentScreen = ({ program, user, selectedCar, selectedStation }: any) => {
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { confirmPayment } = useStripe();
  const dispatch = useDispatch();

  const handlePayPress = async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Please enter complete card details');
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
        paymentMethod: { paymentMethodType: 'card' },
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/payment/create-payment-intent`,
        paymentRequest
      );

      const clientSecret = response.data;

      // 2️⃣ Confirm payment on device
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        type: 'Card',
        billingDetails: {
          name: user?.name ?? 'Customer',
        },
      });

      if (error) {
        Alert.alert(`Payment failed: ${error.message}`);
        return;
      }

      if (paymentIntent?.status === 'Succeeded' || paymentIntent?.status === 'succeeded') {
       

        // 3️⃣ Create booking on backend (and receive QR code)
        const bookingDto = {
          token: user?.token,
          carId: selectedCar?.id,
          stationId: selectedStation?.id,
          washingProgramId: program.id,
        };

        const bookingResponse = await axios.post(
          `${Config.REACT_APP_SERVER_URL}/bookings`,
          bookingDto
        );

        // The backend should return: { bookingId, qrCode, status }
        const { qrCode: qrBase64 } = bookingResponse.data;
        setQrCode(qrBase64);

        dispatch({ type: 'BOOKING_SUCCESS', payload: bookingResponse.data });
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Payment or booking failed', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Processing payment...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center' }}>
      {!qrCode ? (
        <>
          <CardField
            postalCodeEnabled
            placeholder={{ number: '4242 4242 4242 4242' }}
            cardStyle={{ backgroundColor: '#FFFFFF', textColor: '#000000' }}
            style={{ width: '100%', height: 50, marginVertical: 30 }}
            onCardChange={(card) => setCardDetails(card)}
          />
          <Button title="Pay and Get QR Code" onPress={handlePayPress} />
        </>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Your Booking QR Code</Text>
          <Image
            source={{ uri: `data:image/png;base64,${qrCode}` }}
            style={{ width: 200, height: 200 }}
          />
          <Text style={{ marginTop: 10 }}>Show this code at the wash station</Text>
        </View>
      )}
    </View>
  );
};

export default PaymentScreen;
