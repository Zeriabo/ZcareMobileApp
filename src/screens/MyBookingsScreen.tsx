import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const MyBookingsScreen: React.FC = () => {
   const bookings = useSelector((state: RootState) => state.booking.bookings);
 console.log(bookings)
  const activeBooking = bookings.find(b => !b.executed );

  if (!activeBooking) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No valid QR code available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your QR Code</Text>
      <QRCode value={activeBooking.qr_code} size={200} />
      <Text style={styles.info}>Booking ID: {activeBooking.id}</Text>
      <Text style={styles.info}>Car ID: {activeBooking.carId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  message: { fontSize: 18, color: 'gray' },
  info: { fontSize: 16, marginTop: 10 },
});

export default MyBookingsScreen;
