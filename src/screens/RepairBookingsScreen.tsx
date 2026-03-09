import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useLanguage } from '../contexts/LanguageContext';
import {
    cancelRepairBooking,
    fetchRepairBookings,
    updateRepairBookingStatus,
} from '../redux/actions/repairActions';
import { RootState } from '../redux/store';
import { RepairBooking } from '../redux/types/repairTypes';
import { Colors, Radius, Spacing } from '../theme/design';
import { displayLocalNotification } from '../utils/notifications';

type Props = {
  navigation: any; // Navigation will be added to RootStackParamList
};

const RepairBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useLanguage();
  const dispatch = useDispatch<any>();
  const bookings = useSelector((state: RootState) => (state as any).repair?.bookings ?? []);
  const loading = useSelector((state: RootState) => (state as any).repair?.loading ?? false);
  const error = useSelector((state: RootState) => (state as any).repair?.error ?? null);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    await dispatch(fetchRepairBookings() as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (bookingId: number, newStatus: string) => {
    const localizedStatus =
      newStatus === 'PENDING'
        ? t('bookings.statuses.pending')
        : newStatus === 'CONFIRMED'
          ? t('bookings.statuses.confirmed')
          : newStatus === 'IN_PROGRESS'
            ? t('bookings.statuses.inProgress')
            : newStatus === 'COMPLETED'
              ? t('bookings.statuses.completed')
              : newStatus === 'CANCELLED' || newStatus === 'CANCELED'
                ? t('bookings.statuses.cancelled')
                : newStatus;
    Alert.alert(
      t('repair.confirmStatusChange'),
      t('repair.changeStatusTo', { status: localizedStatus }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              setUpdatingId(bookingId);
              await dispatch(
                updateRepairBookingStatus(bookingId, newStatus) as any
              );
              displayLocalNotification(
                t('repair.statusUpdated'),
                t('repair.statusChangedTo', { status: localizedStatus })
              );
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || t('repair.failedToUpdateStatus'));
            } finally {
              setUpdatingId(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleCancel = async (bookingId: number) => {
    Alert.alert(
      t('repair.cancelBookingTitle'),
      t('repair.cancelRepairBookingConfirm'),
      [
        { text: t('bookings.cancelNo'), style: 'cancel' },
        {
          text: t('repair.yesCancel'),
          onPress: async () => {
            try {
              setUpdatingId(bookingId);
              await dispatch(cancelRepairBooking(bookingId) as any);
              displayLocalNotification(
                t('repair.bookingCancelledTitle'),
                t('repair.bookingCancelledMessage')
              );
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || t('repair.failedToCancelBooking'));
            } finally {
              setUpdatingId(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'CONFIRMED':
        return '#3B82F6';
      case 'IN_PROGRESS':
        return '#10B981';
      case 'COMPLETED':
        return '#059669';
      case 'CANCELLED':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getNextActions = (status: string): string[] => {
    switch (status) {
      case 'PENDING':
        return ['CONFIRMED'];
      case 'CONFIRMED':
        return ['IN_PROGRESS'];
      case 'IN_PROGRESS':
        return ['COMPLETED'];
      case 'COMPLETED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'fi' ? 'fi-FI' : language === 'ar' ? 'ar' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('repair.repairBookingsTitle')} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('repair.loadingBookings')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AppHeader title={t('repair.repairBookingsTitle')} />

      {error && (
        <AppCard style={styles.errorCard}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </AppCard>
      )}

      {bookings.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyText}>{t('repair.noRepairBookingsYet')}</Text>
          <Text style={styles.emptySubtext}>
            {t('repair.scheduleFirstRepair')}
          </Text>
          <PrimaryButton
            label={t('repair.browseRepairShops')}
            onPress={() => navigation.navigate('RepairShop' as any)}
          />
        </AppCard>
      ) : (
        bookings.map((booking: RepairBooking) => (
          <AppCard key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.vehiclePlate}>
                  {booking.vehicleRegistrationNumber}
                </Text>
                <Text style={styles.shopId}>{t('repair.shopId')}: {booking.repairShopId}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) },
                ]}
              >
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>

            {booking.description && (
              <Text style={styles.description}>{booking.description}</Text>
            )}

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{t('bookings.scheduled')}:</Text>
              <Text style={styles.dateValue}>
                {formatDate(booking.scheduledDate)}
              </Text>
            </View>

            {booking.completedAt && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{t('bookings.completed')}:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(booking.completedAt)}
                </Text>
              </View>
            )}

            <View style={styles.createdRow}>
              <Text style={styles.createdText}>
                {t('repair.created')}: {formatDate(booking.createdAt || '')}
              </Text>
            </View>

            {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
              <View style={styles.actionsContainer}>
                {getNextActions(booking.status).length > 0 && (
                  <View style={styles.actionButtons}>
                    {getNextActions(booking.status).map((nextStatus) => (
                      <TouchableOpacity
                        key={nextStatus}
                        style={[
                          styles.actionButton,
                          styles.updateButton,
                          updatingId === booking.id && styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleStatusUpdate(booking.id!, nextStatus)
                        }
                        disabled={updatingId === booking.id}
                      >
                        {updatingId === booking.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionButtonText}>
                            ✓ {t('repair.markStatus', {
                              status:
                                nextStatus === 'PENDING'
                                  ? t('bookings.statuses.pending')
                                  : nextStatus === 'CONFIRMED'
                                    ? t('bookings.statuses.confirmed')
                                    : nextStatus === 'IN_PROGRESS'
                                      ? t('bookings.statuses.inProgress')
                                      : nextStatus === 'COMPLETED'
                                        ? t('bookings.statuses.completed')
                                        : nextStatus,
                            })}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.cancelButton,
                    updatingId === booking.id && styles.disabledButton,
                  ]}
                  onPress={() => handleCancel(booking.id!)}
                  disabled={updatingId === booking.id}
                >
                  {updatingId === booking.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>✕ {t('bookings.cancel')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </AppCard>
        ))
      )}

      <View style={styles.viewSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: Spacing.md,
  },
  bookingCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  shopId: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  createdRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createdText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  viewSpacer: {
    height: 40,
  },
});

export default RepairBookingsScreen;
