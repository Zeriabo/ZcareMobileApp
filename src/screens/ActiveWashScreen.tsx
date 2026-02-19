import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../redux/types/stackParams';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWash'>;

const normalizeStatus = (raw: any) => {
  const s = String(raw || '').toUpperCase();
  if (!s) return 'PURCHASED';
  return s;
};

const getStatusCopy = (status: string) => {
  switch (status) {
    case 'PURCHASED':
      return {
        title: 'Your car wash is purchased',
        helper: 'Waiting for queue/wash start update from station.',
      };
    case 'QUEUING':
      return {
        title: 'Your car wash is in queue',
        helper: 'Your wash will start soon.',
      };
    case 'WASHING':
      return {
        title: 'Your car is being washed',
        helper: 'Live wash status from backend',
      };
    case 'FINISHED':
      return {
        title: 'Your car wash is finished',
        helper: 'Finalizing...',
      };
    case 'CANCELED':
      return {
        title: 'Your car wash is canceled',
        helper: 'This wash was canceled by provider or user.',
      };
    case 'NOT_PURCHASED':
      return {
        title: 'Your car wash is not purchased',
        helper: 'Please complete payment to continue.',
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

  const hasKnownStatus = (value: string) => Boolean(value && value !== 'PURCHASED');
  const isRetryableStatus = (code?: number) => !code || code >= 500 || code === 404 || code === 405;

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
      const base = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const noV1 = base.endsWith('/v1') ? base.slice(0, -3) : base;
      const candidates = [
        `${base}/booking/${bookingId}`,
        `${base}/v1/bookings/${bookingId}`,
        `${noV1}/v1/bookings/${bookingId}`,
      ];

      let lastError: any = null;
      let nextBackendBooking: any = null;
      for (const url of candidates) {
        try {
          const response = await axios.get(url);
          if (response?.data) {
            nextBackendBooking = response.data;
          }
          if (!nextBackendBooking) continue;
          if (!mounted) return;
          setBackendBooking(nextBackendBooking);
          setError(null);
          setLoading(false);
          dispatch({ type: 'UPDATE_BOOKING', payload: nextBackendBooking });
          return;
        } catch (e: any) {
          lastError = e;
          if (!isRetryableStatus(e?.response?.status)) break;
        }
      }

      if (mounted) {
        setLoading(false);
        setError(lastError?.response?.data?.message || lastError?.message || 'Could not fetch wash status');
      }
    };

    fetchBookingStatus();
    const timer = setInterval(fetchBookingStatus, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [bookingId, dispatch]);

  const progress = useMemo(() => {
    const backendProgress = pickProgress(backendBooking);
    const bookingProgress = pickProgress(booking);
    if (typeof backendProgress === 'number') return backendProgress;
    if (typeof bookingProgress === 'number') return bookingProgress;
    if (status.includes('FINISHED')) return 100;
    return null;
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
