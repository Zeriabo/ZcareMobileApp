import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { RootStackParamList } from '../redux/types/stackParams';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWash'>;

const normalizeStatus = (raw: any) => {
  const s = String(raw || '').toUpperCase();
  if (!s) return 'PURCHASED';
  return s;
};

const getStatusCopy = (status: string, t: (key: string, options?: any) => string) => {
  switch (status) {
    case 'PURCHASED':
    case 'NOT_PURCHASED':
      return {
        title: t('activeWash.purchasedTitle'),
        helper: t('activeWash.purchasedHelper'),
      };
    case 'QUEUING':
    case 'QUEUE':
      return {
        title: t('activeWash.queueTitle'),
        helper: t('activeWash.queueHelper'),
      };
    case 'STARTED':
      return {
        title: t('activeWash.startedTitle'),
        helper: t('activeWash.startedHelper'),
      };
    case 'WASHING':
    case 'IN_PROGRESS':
    case 'INPROGRESS':
      return {
        title: t('activeWash.washingTitle'),
        helper: t('activeWash.washingHelper'),
      };
    case 'FINISHED':
      return {
        title: t('activeWash.finishedTitle'),
        helper: t('activeWash.finishedHelper'),
      };
    case 'CANCELED':
    case 'CANCELLED':
      return {
        title: t('activeWash.canceledTitle'),
        helper: t('activeWash.canceledHelper'),
      };
    case 'FAULT':
    case 'FAILED':
    case 'ERROR':
      return {
        title: t('activeWash.issueTitle'),
        helper: t('activeWash.issueHelper'),
      };
    default:
      return {
        title: t('activeWash.statusTitle', { status: status.replaceAll('_', ' ') }),
        helper: t('activeWash.liveStatusHelper'),
      };
  }
};

const ActiveWashScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { bookingId } = route.params;
  const dispatch = useDispatch<any>();
  const booking = useSelector((state: any) =>
    (state.booking?.bookings || []).find((b: any) => Number(b?.id) === Number(bookingId))
  );
  const [backendBooking, setBackendBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const previousStatusRef = useRef<string | null>(null);

  const hasKnownStatus = (value: string) => Boolean(value && value !== 'PURCHASED');

  const pickProgress = (source: any): number | null => {
    const candidates = [
      source?.progress,
      source?.progressPercent,
      source?.washProgress,
      source?.booking?.progress,
      source?.booking?.progressPercent,
      source?.booking?.washProgress,
    ];
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) {
        return Math.max(0, Math.min(100, numeric));
      }
    }
    return null;
  };

  const readStatus = (source: any) =>
    normalizeStatus(
      source?.status ||
      source?.washStatus ||
      source?.bookingStatus ||
      source?.booking?.status ||
      source?.booking?.washStatus ||
      source?.booking?.bookingStatus ||
      (source?.executed ? 'FINISHED' : '')
    );
  const status = readStatus(backendBooking) || readStatus(booking);
  const visibleError = hasKnownStatus(status) ? null : error;

  useEffect(() => {
    let mounted = true;

    const fetchBookingStatus = async () => {
      // Gateway route: /booking/{id} → rewrites to /v1/bookings/{id}
      const url = `/booking/${bookingId}`;
      
      logger.debug('Fetching booking status', { url, bookingId });

      try {
        const response = await apiClient.get<any>(url);
        
        if (!mounted) return;

        // apiClient returns data directly
        if (response) {
          const data = response;
          
          logger.info('Booking status fetched', { bookingId, status: data.status });
          
          // Map backend response to expected format
          const mappedBooking = {
            id: data.id,
            status: data.status,
            executed: data.executed,
            scheduledTime: data.scheduledTime,
            bookingTime: data.scheduledTime,
            qrCode: data.qrCode,
            bookingType: data.bookingType,
            deliveryAddress: data.deliveryAddress,
            deliveryLatitude: data.deliveryLatitude,
            deliveryLongitude: data.deliveryLongitude,
            washingProgramId: data.washingProgramId,
            stationId: data.stationId,
            carId: data.carId,
            // Progress fields (may come from mock or future backend enhancement)
            progress: data.progress,
            progressPercent: data.progressPercent,
            washProgress: data.washProgress,
          };

          setBackendBooking(mappedBooking);
          setError(null);
          setLoading(false);
          dispatch({ type: 'UPDATE_BOOKING', payload: mappedBooking });
        }
      } catch (e: any) {
        if (!mounted) return;
        
        // apiClient returns ApiErrorResponse with status, message, details
        const statusCode = e?.status || e?.response?.status;
        const errorMessage = e?.message || e?.details?.message || t('activeWash.fetchStatusFailed');
        
        logger.error('Failed to fetch booking status', { bookingId, statusCode, errorMessage });
        
        // Show error only if it's not a temporary network issue or if mock mode didn't help
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          setError(t('activeWash.bookingUnavailable'));
        } else if (statusCode && statusCode >= 500) {
          setError(t('activeWash.serverRetrying'));
        } else {
          setError(t('activeWash.connectionRetrying'));
        }
        
        setLoading(false);
      }
    };

    fetchBookingStatus();
    const timer = setInterval(fetchBookingStatus, 5000); // Poll every 5 seconds
    
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [bookingId, dispatch]);

  // Handle completion success modal
  useEffect(() => {
    if (status === 'FINISHED' && !showSuccessAlert && previousStatusRef.current !== 'FINISHED') {
      setShowSuccessAlert(true);
      Alert.alert(
        t('activeWash.completedAlertTitle'),
        t('activeWash.completedAlertMessage'),
        [
          {
            text: t('activeWash.viewHistory'),
            onPress: () => {
              setShowSuccessAlert(false);
              navigation.navigate('CompletedBookings');
            },
          },
          {
            text: t('navigation.home'),
            onPress: () => {
              setShowSuccessAlert(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
    previousStatusRef.current = status;
  }, [status, showSuccessAlert, navigation]);

  const progress = useMemo(() => {
    // Try to get progress from data first
    const backendProgress = pickProgress(backendBooking);
    const bookingProgress = pickProgress(booking);
    if (typeof backendProgress === 'number') return backendProgress;
    if (typeof bookingProgress === 'number') return bookingProgress;
    
    // Estimate progress based on status
    switch (status) {
      case 'NOT_PURCHASED':
      case 'PURCHASED':
        return 0;
      case 'QUEUING':
      case 'QUEUE':
        return 15;
      case 'STARTED':
        return 25;
      case 'WASHING':
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return 60;
      case 'FINISHED':
        return 100;
      case 'CANCELED':
      case 'CANCELLED':
      case 'FAULT':
      case 'FAILED':
      case 'ERROR':
        return null; // Don't show progress for error states
      default:
        return null;
    }
  }, [backendBooking, booking, status]);

  const statusCopy = getStatusCopy(status, t);
  const translatedStatus = (() => {
    if (status === 'FINISHED') return t('bookings.statuses.finished');
    if (status === 'WASHING' || status === 'IN_PROGRESS' || status === 'INPROGRESS') return t('bookings.statuses.washing');
    if (status === 'QUEUING' || status === 'QUEUE') return t('bookings.statuses.queuing');
    if (status === 'CANCELED' || status === 'CANCELLED') return t('bookings.statuses.canceled');
    if (status === 'NOT_PURCHASED') return t('bookings.statuses.notPurchased');
    if (status === 'PURCHASED') return t('bookings.statuses.purchased');
    return status.replaceAll('_', ' ');
  })();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {statusCopy.title}
      </Text>
      <Text style={styles.subTitle}>{t('activeWash.bookingNumber', { id: bookingId })}</Text>

      <View style={styles.animationFallback}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.animationText}>
          {loading ? t('activeWash.loadingFromBackend') : statusCopy.helper}
        </Text>
      </View>

      {typeof progress === 'number' ? (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </>
      ) : (
        <Text style={styles.progressUnknown}>{t('activeWash.progressUnavailable')}</Text>
      )}

      <Text style={styles.statusText}>{t('activeWash.statusLabel')}: {translatedStatus}</Text>
      {visibleError ? <Text style={styles.errorText}>{visibleError}</Text> : null}

      <Pressable
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        }
        style={styles.homeBtn}
      >
        <Text style={styles.homeBtnText}>{t('activeWash.backToHome')}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 14,
  },
  animationFallback: {
    width: 300,
    height: 220,
    marginTop: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  animationText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 14,
  },
  progressTrack: {
    width: '92%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  progressUnknown: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  errorText: {
    marginTop: 8,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  homeBtn: {
    marginTop: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  homeBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});

export default ActiveWashScreen;
