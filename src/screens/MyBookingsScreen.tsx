import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import { useLanguage } from '../contexts/LanguageContext';
import { deleteBooking, fetchUserBookings, updateBooking } from '../redux/actions/BookingActions';
import { RootState } from '../redux/store';
import { Colors, Spacing } from '../theme/design';
import { localizeProgramNameFromText } from '../utils/programLocalization';

const MyBookingsScreen: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
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
    const bookingTypeUpper = String(item.bookingType || '').toUpperCase();
    const washTypeLower = String(item.washType || '').toLowerCase();
    const hasDeliveryInfo =
      !!item.deliveryAddress ||
      item.deliveryLatitude !== null && item.deliveryLatitude !== undefined ||
      item.deliveryLongitude !== null && item.deliveryLongitude !== undefined;
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
    const statusLabel = (() => {
      if (statusUpper === 'FINISHED') return t('bookings.statuses.finished');
      if (statusUpper === 'WASHING') return t('bookings.statuses.washing');
      if (statusUpper === 'QUEUING') return t('bookings.statuses.queuing');
      if (statusUpper === 'CANCELED') return t('bookings.statuses.canceled');
      if (statusUpper === 'NOT_PURCHASED') return t('bookings.statuses.notPurchased');
      if (statusUpper === 'PURCHASED') return t('bookings.statuses.purchased');
      return statusUpper.replaceAll('_', ' ');
    })();
    const isTrackableWash =
      !isRepairTicket &&
      statusUpper !== 'FINISHED' &&
      statusUpper !== 'CANCELED' &&
      statusUpper !== 'NOT_PURCHASED';
    const statusColor = (() => {
      const s = statusUpper;
      if (s === 'FINISHED') return '#16A34A';
      if (s === 'WASHING' || s === 'QUEUING') return '#2563EB';
      if (s === 'CANCELED' || s === 'NOT_PURCHASED') return '#DC2626';
      if (s === 'PURCHASED') return '#0891B2';
      return '#34C759';
    })();

    const scheduledLabel = item.scheduledTime
      ? new Date(item.scheduledTime).toLocaleString()
      : t('bookings.notScheduled');

    const handleCancel = () => {
      Alert.alert(t('bookings.cancelTitle'), t('bookings.cancelConfirm'), [
        { text: t('bookings.cancelNo'), style: 'cancel' },
        {
          text: t('bookings.cancelYes'),
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(item.id);
              await dispatch(deleteBooking(item.id));
              if (userState?.token) {
                await dispatch(fetchUserBookings(userState.token));
              }
            } catch (error: any) {
              Alert.alert(t('bookings.cancelFailed'), error?.response?.data?.message || error?.message || t('bookings.tryAgainLater'));
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
        const isRepair = isRepairTicket;
        const payload = {
          carId: item.carId,
          userId: item.userId,
          stationId: item.stationId,
          washingProgramId: isRepair ? null : item.washingProgramId,
          repairShopId: isRepair ? item.repairShopId : null,
          repairSkuId: isRepair ? item.repairSkuId : null,
          repairItemName: isRepair ? item.repairItemName : null,
          repairPriceAmount: isRepair ? item.repairPriceAmount : null,
          repairPriceCurrency: isRepair ? item.repairPriceCurrency : null,
          bookingType: isRepair ? 'REPAIR' : 'WASH',
          executed: Boolean(item.executed),
          scheduledTime: base.toISOString(),
          token: userState?.token || item.token,
        };
        await dispatch(updateBooking(item.id, payload));
        if (userState?.token) {
          await dispatch(fetchUserBookings(userState.token));
        }
        Alert.alert(t('bookings.rescheduled'), t('bookings.rescheduledMessage'));
      } catch (error: any) {
        Alert.alert(t('bookings.rescheduleFailed'), error?.response?.data?.message || error?.message || t('bookings.tryAgainLater'));
      } finally {
        setProcessingId(null);
      }
    };

    return (
    <AppCard style={styles.bookingCard}>
      <Text style={styles.cardTitle}>
        {isRepairTicket ? t('bookings.ticketRepair') : t('bookings.ticketWash')}
      </Text>
      <View style={styles.qrContainer}>
        <QRCode value={item.qr_code || item.qrCode || t('bookings.noData')} size={180} backgroundColor="white" />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>
            {isRepairTicket ? t('bookings.repairStation') : t('bookings.station')}
          </Text>
          <Text style={styles.value}>
            {isRepairTicket
              ? (item.repairShopName || item.shopName || item.stationName || item.repairShopId || '-')
              : (item.stationName || '-')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('bookings.vehicleRegistration')}</Text>
          <Text style={styles.value}>{item.carRegistrationPlate || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('bookings.scheduled')}</Text>
          <Text style={styles.value}>{scheduledLabel}</Text>
        </View>
        {isRepairTicket && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('bookings.repair')}</Text>
            <Text style={styles.value}>{item.repairItemName || '-'}</Text>
          </View>
        )}
        {!isRepairTicket && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('bookings.program')}</Text>
            <Text style={styles.value}>{localizeProgramNameFromText(item.washingProgramName || item.washingProgramId, t)}</Text>
                  {!isRepairTicket && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>{t('bookings.washType')}</Text>
                      <Text style={styles.value}>
                        {isWaterlessTicket ? t('bookings.washTypeWaterlessMobile') :
                         t('bookings.washTypeRegular')}
                      </Text>
                    </View>
                  )}
                  {isWaterlessTicket && item.deliveryAddress && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>{t('bookings.deliveryAddress')}</Text>
                        <Text style={[styles.value, styles.multiLine]}>{item.deliveryAddress}</Text>
                      </View>
                      {item.deliveryPhone && (
                        <View style={styles.detailRow}>
                          <Text style={styles.label}>{t('bookings.contactPhone')}</Text>
                          <Text style={styles.value}>{item.deliveryPhone}</Text>
                        </View>
                      )}
                    </>
                  )}
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('bookings.status')}</Text>
          <Text style={[styles.value, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={handleCancel} disabled={processingId === item.id}>
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>{t('common.cancel')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleReschedule} disabled={processingId === item.id}>
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>{t('bookings.reschedulePlusOneDay')}</Text>
            )}
          </TouchableOpacity>
        </View>
        {isTrackableWash && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.trackBtn]}
            onPress={() => navigation.navigate('ActiveWash', { bookingId: Number(item.id) })}
          >
            <Text style={styles.actionText}>{t('bookings.trackLiveWash')}</Text>
          </TouchableOpacity>
        )}
        {isWaterlessTicket && 
         item.deliveryLatitude != null && 
         item.deliveryLongitude != null && 
         !item.executed && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B981', marginTop: 8 }]}
            onPress={() => navigation.navigate('DeliveryTracking', { 
              bookingId: Number(item.id),
              deliveryLatitude: item.deliveryLatitude,
              deliveryLongitude: item.deliveryLongitude,
            })}
          >
            <Text style={styles.actionText}>{t('bookings.trackDelivery')}</Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.message}>{t('bookings.noActiveBookings')}</Text>
      </View>
    );
  }

  const completedCount = allBookings.filter(b => b.executed).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <View style={styles.headerTop}>
          <AppHeader title={t('bookings.bookingTickets')} subtitle={t('bookings.activeCodes', { count: bookings.length })} />
          {completedCount > 0 && (
            <TouchableOpacity 
              style={styles.completedBadge}
              onPress={() => navigation.navigate('CompletedBookings')}
            >
              <Text style={styles.completedBadgeText}>📋</Text>
              <Text style={styles.completedBadgeCount}>{completedCount}</Text>
            </TouchableOpacity>
          )}
        </View>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#16A34A',
    borderRadius: 20,
  },
  completedBadgeText: { fontSize: 14 },
  completedBadgeCount: { fontSize: 12, fontWeight: '700', color: '#fff' },
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
  trackBtn: { width: '100%', marginTop: 8, backgroundColor: '#0891B2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  message: { fontSize: 18, color: Colors.textMuted },
});

export default MyBookingsScreen;
