import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../redux/types/stackParams';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWash'>;

const normalizeStatus = (raw: any) => {
  const s = String(raw || '').toUpperCase();
  if (!s) return 'ACTIVE';
  return s;
};

const ActiveWashScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const booking = useSelector((state: any) =>
    (state.booking?.bookings || []).find((b: any) => Number(b?.id) === Number(bookingId))
  );

  const status = normalizeStatus(booking?.status || (booking?.executed ? 'COMPLETED' : 'ACTIVE'));
  const [fallbackProgress, setFallbackProgress] = useState(8);

  useEffect(() => {
    const done = status.includes('COMPLETED');
    if (done) {
      setFallbackProgress(100);
      return;
    }

    const timer = setInterval(() => {
      setFallbackProgress(prev => Math.min(prev + 2, 92));
    }, 2500);
    return () => clearInterval(timer);
  }, [status]);

  const progress = useMemo(() => {
    if (typeof booking?.progress === 'number' && Number.isFinite(booking.progress)) {
      return Math.max(0, Math.min(100, booking.progress));
    }
    if (status.includes('COMPLETED')) return 100;
    if (status.includes('STARTED')) return Math.max(fallbackProgress, 15);
    if (status.includes('IN_PROGRESS') || status.includes('WASHING')) return Math.max(fallbackProgress, 30);
    return fallbackProgress;
  }, [booking?.progress, status, fallbackProgress]);

  const isDone = status.includes('COMPLETED');
  const isFailed = status.includes('FAILED') || status.includes('CANCELLED');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isDone ? 'Wash completed' : isFailed ? 'Wash interrupted' : 'Your car is being washed'}
      </Text>
      <Text style={styles.subTitle}>Booking #{bookingId}</Text>

      <View style={styles.animationFallback}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.animationText}>
          {isDone ? 'Finalizing...' : 'Live wash status tracking'}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>

      <Text style={styles.statusText}>Status: {status.replaceAll('_', ' ')}</Text>

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
  statusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
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
