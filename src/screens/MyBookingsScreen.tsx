import React from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const { width } = Dimensions.get('window');

const MyBookingsScreen: React.FC = () => {
  // Filter for all active (not executed) bookings
  const bookings = useSelector((state: RootState) => 
    state.booking.bookings.filter(b => !b.executed)
  );

  const renderBookingItem = ({ item }: { item: any }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.cardTitle}>Wash Ticket</Text>
      
      <View style={styles.qrContainer}>
        {/* Use a fallback if qr_code is missing to prevent crash */}
        <QRCode 
          value={item.qr_code || item.qrCode || 'No Data'} 
          size={180} 
          backgroundColor="white"
        />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Booking ID</Text>
          <Text style={styles.value}>#{item.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Vehicle ID</Text>
          <Text style={styles.value}>{item.carId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: '#34C759' }]}>Active</Text>
        </View>
      </View>
    </View>
  );

  if (bookings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No active bookings found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wash Tickets</Text>
        <Text style={styles.headerSubtitle}>{bookings.length} active codes</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  listContent: { padding: 20 },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    // Elevation for Android
    elevation: 5,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#8E8E93', marginBottom: 15, textTransform: 'uppercase' },
  qrContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  detailsContainer: { width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: '#8E8E93' },
  value: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  message: { fontSize: 18, color: '#8E8E93' },
});

export default MyBookingsScreen;