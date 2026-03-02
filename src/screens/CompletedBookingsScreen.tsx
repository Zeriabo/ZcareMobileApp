import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import { deleteBooking, fetchUserBookings } from '../redux/actions/BookingActions';
import { RootState } from '../redux/store';
import { Colors, Spacing } from '../theme/design';

const CompletedBookingsScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const userState = useSelector((state: RootState) => state.user.user);
  const allBookings = useSelector((state: RootState) => state.booking.bookings);
  const completedBookings = useMemo(
    () => allBookings.filter(b => b.executed),
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
    const bookingTypeUpper = String(item.bookingType || '').toUpperCase();
    const washTypeLower = String(item.washType || '').toLowerCase();
    const hasDeliveryInfo =
      !!item.deliveryAddress ||
      (item.deliveryLatitude !== null && item.deliveryLatitude !== undefined) ||
      (item.deliveryLongitude !== null && item.deliveryLongitude !== undefined);
    const isRepairTicket =
      bookingTypeUpper === 'REPAIR' ||
      !!item.repairShopId ||
      !!item.repairItemName ||
      !!item.repairSkuId;
    const isWaterlessTicket =
      !isRepairTicket &&
      (
        bookingTypeUpper === 'WATERLESS_DELIVERY' ||
        washTypeLower === 'waterless' ||
        washTypeLower === 'delivery' ||
        hasDeliveryInfo
      );

    const statusUpper = String(item.status || (item.executed ? 'FINISHED' : 'PURCHASED')).toUpperCase();
    const statusLabel = statusUpper.replaceAll('_', ' ');

    const scheduledLabel = item.scheduledTime
      ? new Date(item.scheduledTime).toLocaleString()
      : 'Not scheduled';

    const completedDate = item.completedAt || item.updatedAt || item.scheduledTime
      ? new Date(item.completedAt || item.updatedAt || item.scheduledTime).toLocaleDateString()
      : 'Recently';

    const handleDelete = () => {
      Alert.alert('Delete booking', 'Are you sure you want to delete this completed booking?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(item.id);
              await dispatch(deleteBooking(item.id));
              if (userState?.token) {
                await dispatch(fetchUserBookings(userState.token));
              }
            } catch (error: any) {
              Alert.alert('Delete failed', error?.response?.data?.message || error?.message || 'Try again later');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]);
    };

    return (
      <AppCard style={styles.bookingCard}>
        <View style={styles.successHeader}>
          <Text style={styles.successBadge}>✓ COMPLETED</Text>
          <Text style={styles.completedDate}>{completedDate}</Text>
        </View>
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
            <>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Program</Text>
                <Text style={styles.value}>{item.washingProgramName || item.washingProgramId || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Wash Type</Text>
                <Text style={styles.value}>
                  {isWaterlessTicket ? '💧 Waterless Mobile' : '🏪 Regular'}
                </Text>
              </View>
            </>
          )}
          {isWaterlessTicket && item.deliveryAddress && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Delivery Address</Text>
                <Text style={[styles.value, styles.multiLine]}>{item.deliveryAddress}</Text>
              </View>
              {item.deliveryPhone && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Contact Phone</Text>
                  <Text style={styles.value}>{item.deliveryPhone}</Text>
                </View>
              )}
            </>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: '#16A34A' }]}>COMPLETED</Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionDanger]} 
            onPress={handleDelete} 
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>Delete Record</Text>
            )}
          </TouchableOpacity>
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

  if (!completedBookings.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No completed bookings yet</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <AppHeader 
          title="Completed Bookings" 
          subtitle={`${completedBookings.length} completed`} 
        />
      </View>
      <FlatList
        data={completedBookings}
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
  successHeader: {
    width: '100%',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#16A34A',
    alignItems: 'center',
  },
  successBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 1,
  },
  completedDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
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
  actionBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionDanger: { backgroundColor: Colors.danger },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  message: { fontSize: 18, color: Colors.textMuted },
  multiLine: { maxWidth: '60%' },
});

export default CompletedBookingsScreen;
