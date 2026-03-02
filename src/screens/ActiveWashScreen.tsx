import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../redux/types/stackParams';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWash'>;

const normalizeStatus = (raw: any) => {
  const s = String(raw || '').toUpperCase();
  if (!s) return 'PURCHASED';
  return s;
};

const getStatusCopy = (status: string) => {
  switch (status) {
    case 'PURCHASED':
    case 'NOT_PURCHASED':
      return {
        title: 'Your car wash is purchased',
        helper: 'Waiting for queue/wash start update from station.',
      };
    case 'QUEUING':
    case 'QUEUE':
      return {
        title: 'Your car wash is in queue',
        helper: 'Your wash will start soon.',
      };
    case 'STARTED':
      return {
        title: 'Your car wash is starting',
        helper: 'Wash is being prepared.',
      };
    case 'WASHING':
    case 'IN_PROGRESS':
    case 'INPROGRESS':
      return {
        title: 'Your car is being washed',
        helper: 'Live wash in progress.',
      };
    case 'FINISHED':
      return {
        title: 'Your car wash is finished',
        helper: 'Wash completed successfully!',
      };
    case 'CANCELED':
    case 'CANCELLED':
      return {
        title: 'Your car wash is canceled',
        helper: 'This wash was canceled.',
      };
    case 'FAULT':
    case 'FAILED':
    case 'ERROR':
      return {
        title: 'Wash encountered an issue',
        helper: 'Please contact support.',
      };
    default:
      return {
        title: `Wash status: ${status.replaceAll('_', ' ')}`,
        helper: 'Live wash status from backend',
      };
  }
};

const ActiveWashScreen: React.FC<Props> = ({ route, navigation }) => {
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
        const errorMessage = e?.message || e?.details?.message || 'Could not fetch wash status';
        
        logger.error('Failed to fetch booking status', { bookingId, statusCode, errorMessage });
        
        // Show error only if it's not a temporary network issue or if mock mode didn't help
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          setError('Booking not found or unavailable');
        } else if (statusCode && statusCode >= 500) {
          setError('Server error. Retrying...');
        } else {
          setError('Connection issue. Retrying...');
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
        '✅ Wash Completed!',
        'Your car wash has been completed successfully.',
        [
          {
            text: 'View History',
            onPress: () => {
              setShowSuccessAlert(false);
              navigation.navigate('CompletedBookings');
            },
          },
          {
            text: 'Home',
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

  const statusCopy = getStatusCopy(status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {statusCopy.title}
      </Text>
      <Text style={styles.subTitle}>Booking #{bookingId}</Text>

      <View style={styles.animationFallback}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.animationText}>
          {loading ? 'Loading status from backend...' : statusCopy.helper}
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
        <Text style={styles.progressUnknown}>Progress unavailable right now. Status updates are still live.</Text>
      )}

      <Text style={styles.statusText}>Status: {status.replaceAll('_', ' ')}</Text>
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
        <Text style={styles.homeBtnText}>Back to Home</Text>
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
