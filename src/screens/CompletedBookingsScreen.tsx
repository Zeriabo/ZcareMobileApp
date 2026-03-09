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
import { deleteBooking, fetchUserBookings } from '../redux/actions/BookingActions';
import { RootState } from '../redux/store';
import { Colors, Spacing } from '../theme/design';
import { localizeProgramNameFromText } from '../utils/programLocalization';

const CompletedBookingsScreen: React.FC = () => {
  const { t } = useLanguage();
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
    const statusLabel = (() => {
      if (statusUpper === 'FINISHED') return t('bookings.statuses.finished');
      if (statusUpper === 'WASHING') return t('bookings.statuses.washing');
      if (statusUpper === 'QUEUING') return t('bookings.statuses.queuing');
      if (statusUpper === 'CANCELED') return t('bookings.statuses.canceled');
      if (statusUpper === 'NOT_PURCHASED') return t('bookings.statuses.notPurchased');
      if (statusUpper === 'PURCHASED') return t('bookings.statuses.purchased');
      return statusUpper.replaceAll('_', ' ');
    })();

    const scheduledLabel = item.scheduledTime
      ? new Date(item.scheduledTime).toLocaleString()
      : t('bookings.notScheduled');

    const completedDate = item.completedAt || item.updatedAt || item.scheduledTime
      ? new Date(item.completedAt || item.updatedAt || item.scheduledTime).toLocaleDateString()
      : t('bookings.recently');

    const handleDelete = () => {
      Alert.alert(t('bookings.deleteTitle'), t('bookings.deleteConfirm'), [
        { text: t('bookings.cancelNo'), style: 'cancel' },
        {
          text: t('bookings.deleteYes'),
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(item.id);
              await dispatch(deleteBooking(item.id));
              if (userState?.token) {
                await dispatch(fetchUserBookings(userState.token));
              }
            } catch (error: any) {
              Alert.alert(t('bookings.deleteFailed'), error?.response?.data?.message || error?.message || t('bookings.tryAgainLater'));
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
          <Text style={styles.successBadge}>{t('bookings.completedBadge')}</Text>
          <Text style={styles.completedDate}>{completedDate}</Text>
        </View>
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
            <>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('bookings.program')}</Text>
                <Text style={styles.value}>{localizeProgramNameFromText(item.washingProgramName || item.washingProgramId, t)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('bookings.washType')}</Text>
                <Text style={styles.value}>
                  {isWaterlessTicket ? t('bookings.washTypeWaterlessMobile') : t('bookings.washTypeRegular')}
                </Text>
              </View>
            </>
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
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('bookings.status')}</Text>
            <Text style={[styles.value, { color: '#16A34A' }]}>{statusLabel}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionDanger]} 
            onPress={handleDelete} 
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>{t('bookings.deleteRecord')}</Text>
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
        <Text style={styles.message}>{t('bookings.noCompletedBookings')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <AppHeader 
          title={t('bookings.completedBookingsTitle')} 
          subtitle={t('bookings.completedSubtitle', { count: completedBookings.length })} 
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
