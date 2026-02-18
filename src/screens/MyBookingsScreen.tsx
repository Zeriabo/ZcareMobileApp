import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import { deleteBooking, fetchUserBookings, updateBooking } from '../redux/actions/BookingActions';
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
  const [processingId, setProcessingId] = useState<number | null>(null);

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

    const scheduledLabel = item.scheduledTime
      ? new Date(item.scheduledTime).toLocaleString()
      : 'Not scheduled';

    const handleCancel = () => {
      Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(item.id);
              await dispatch(deleteBooking(item.id));
              if (userState?.token) {
                await dispatch(fetchUserBookings(userState.token));
              }
            } catch (error: any) {
              Alert.alert('Cancel failed', error?.response?.data?.message || error?.message || 'Try again later');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]);
    };

    const handleReschedule = async () => {
      try {
        setProcessingId(item.id);
        const base = item.scheduledTime ? new Date(item.scheduledTime) : new Date();
        base.setDate(base.getDate() + 1);
        const payload = {
          ...item,
          scheduledTime: base.toISOString(),
          token: userState?.token || item.token,
        };
        await dispatch(updateBooking(item.id, payload));
        if (userState?.token) {
          await dispatch(fetchUserBookings(userState.token));
        }
        Alert.alert('Rescheduled', 'Booking moved +1 day.');
      } catch (error: any) {
        Alert.alert('Reschedule failed', error?.response?.data?.message || error?.message || 'Try again later');
      } finally {
        setProcessingId(null);
      }
    };

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
        <View style={styles.detailRow}>
          <Text style={styles.label}>Scheduled</Text>
          <Text style={styles.value}>{scheduledLabel}</Text>
        </View>
        {isRepairTicket && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Repair</Text>
            <Text style={styles.value}>{item.repairItemName || '-'}</Text>
          </View>
        )}
        {!isRepairTicket && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Program</Text>
            <Text style={styles.value}>{item.washingProgramName || item.washingProgramId || '-'}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: '#34C759' }]}>Active</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={handleCancel} disabled={processingId === item.id}>
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>Cancel</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleReschedule} disabled={processingId === item.id}>
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>Reschedule +1d</Text>
            )}
          </TouchableOpacity>
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
  actionRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' },
  actionBtn: {
    width: '48.5%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDanger: { backgroundColor: Colors.danger },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  message: { fontSize: 18, color: Colors.textMuted },
});

export default MyBookingsScreen;
