import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import { fetchUserBookings } from '../redux/actions/BookingActions';
import { RootState } from '../redux/store';
import { Colors, Spacing } from '../theme/design';

const MyBookingsScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const userState = useSelector((state: RootState) => state.user.user);
  const allBookings = useSelector((state: RootState) => state.booking.bookings);
  const bookings = useMemo(
    () => allBookings.filter(b => !b.executed),
    [allBookings]
  );

  const [loading, setLoading] = useState(true);

  // Fetch bookings every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userState?.token) {
        setLoading(true);
        dispatch(fetchUserBookings(userState.token)).finally(() => setLoading(false));
      }
    }, [dispatch, userState])
  );

  const renderBookingItem = ({ item }: { item: any }) => {
    const isRepairTicket =
      item.bookingType === 'REPAIR' ||
      !!item.repairShopId ||
      !!item.repairItemName ||
      !item.washingProgramId;

    return (
    <AppCard style={styles.bookingCard}>
      <Text style={styles.cardTitle}>
        {isRepairTicket ? 'Repair Ticket' : 'Wash Ticket'}
      </Text>
      <View style={styles.qrContainer}>
        <QRCode value={item.qr_code || item.qrCode || 'No Data'} size={180} backgroundColor="white" />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>
            {isRepairTicket ? 'Repair station' : 'Station'}
          </Text>
          <Text style={styles.value}>
            {isRepairTicket
              ? (item.repairShopName || item.shopName || item.stationName || item.repairShopId || '-')
              : (item.stationName || '-')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Vehicle registration</Text>
          <Text style={styles.value}>{item.carRegistrationPlate || '-'}</Text>
        </View>
        {isRepairTicket && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Repair</Text>
            <Text style={styles.value}>{item.repairItemName || '-'}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: '#34C759' }]}>Active</Text>
        </View>
      </View>
    </AppCard>
    );
  };

  // Skeleton Loader
  const BookingSkeleton = () => (
    <SkeletonPlaceholder>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={styles.bookingCard}>
          <View style={{ width: 120, height: 20, borderRadius: 4, marginBottom: 15 }} />
          <View style={{ width: 180, height: 180, borderRadius: 12, backgroundColor: '#E0E0E0', marginBottom: 15 }} />
          <View style={{ width: '100%', height: 15, borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '60%', height: 15, borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '80%', height: 15, borderRadius: 4 }} />
        </View>
      ))}
    </SkeletonPlaceholder>
  );

  if (loading) return <BookingSkeleton />;

  if (!bookings.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No active bookings found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <AppHeader title="Booking tickets" subtitle={`${bookings.length} active codes`} />
      </View>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  listContent: { padding: Spacing.md },
  bookingCard: {
    marginBottom: 25,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMuted, marginBottom: 15, textTransform: 'uppercase' },
  qrContainer: {
    padding: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsContainer: { width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: Colors.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: Colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  message: { fontSize: 18, color: Colors.textMuted },
});

export default MyBookingsScreen;
