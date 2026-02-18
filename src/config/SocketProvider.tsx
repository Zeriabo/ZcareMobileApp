// SocketProvider.tsx
import notifee, { AndroidImportance } from '@notifee/react-native';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../redux/store';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: any) => {
  const dispatch = useDispatch<any>();
  const user = useSelector((state: RootState) => state.user.user as any);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const socket = io(process.env.EXPO_PUBLIC_SERVER_URL+':9099', { autoConnect: false });

  const parsePayload = (incoming: any) => {
    if (typeof incoming === 'string') {
      try {
        return JSON.parse(incoming);
      } catch {
        return { message: incoming };
      }
    }
    return incoming || {};
  };

  const normalizeStatus = (rawStatus: any): string => {
    const normalized = String(rawStatus || '').trim().toLowerCase();
    if (!normalized) return 'ACTIVE';
    if (normalized.includes('progress') || normalized.includes('washing')) return 'IN_PROGRESS';
    if (normalized.includes('start')) return 'STARTED';
    if (normalized.includes('complete') || normalized.includes('finish') || normalized.includes('done')) return 'COMPLETED';
    if (normalized.includes('cancel')) return 'CANCELLED';
    if (normalized.includes('fail') || normalized.includes('error')) return 'FAILED';
    return normalized.toUpperCase();
  };

  const readBookingId = (payload: any): number | null => {
    const candidate =
      payload?.bookingId ??
      payload?.booking?.id ??
      payload?.booking?.bookingId ??
      payload?.id;
    const asNumber = Number(candidate);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const applyRealtimeUpdate = async (eventName: string, incoming: any) => {
    const payload = parsePayload(incoming);
    const bookingId = readBookingId(payload);
    const status = normalizeStatus(payload?.status || eventName);
    const eventKey = `${eventName}:${bookingId ?? 'none'}:${status}:${payload?.updatedAt || payload?.timestamp || payload?.message || ''}`;

    if (seenEventsRef.current.has(eventKey)) return;
    seenEventsRef.current.add(eventKey);
    if (seenEventsRef.current.size > 200) {
      // keep memory bounded
      const first = seenEventsRef.current.values().next().value;
      if (first) seenEventsRef.current.delete(first);
    }

    const title = payload?.title || 'ZCare Update';
    const body =
      payload?.message ||
      (bookingId ? `Booking #${bookingId}: ${status.replaceAll('_', ' ')}` : status.replaceAll('_', ' '));

    await notifee.createChannel({
      id: 'zcare_updates',
      name: 'ZCare updates',
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      title,
      body,
      android: { channelId: 'zcare_updates' },
    });

    if (!bookingId) return;

    dispatch((innerDispatch: any, getState: any) => {
      const bookings = getState()?.booking?.bookings || [];
      const existing = bookings.find((b: any) => Number(b?.id) === bookingId);
      if (!existing) return;

      const next = {
        ...existing,
        status,
        executed: status === 'COMPLETED' ? true : existing.executed,
        updatedAt: payload?.updatedAt || new Date().toISOString(),
        progress: payload?.progress ?? existing?.progress,
      };
      innerDispatch({ type: 'UPDATE_BOOKING', payload: next });
    });
  };

  useEffect(() => {
    socket.connect();

    const registerPayload = {
      userId: user?.id,
      token: user?.token,
    };
    socket.emit('register_user', registerPayload);
    socket.emit('subscribe_booking_updates', registerPayload);

    const events = [
      'status_update',
      'booking_status_update',
      'booking_updated',
      'wash_started',
      'wash_in_progress',
      'wash_completed',
      'wash_failed',
      'repair_started',
      'repair_in_progress',
      'repair_completed',
      'repair_failed',
    ];

    events.forEach(eventName => {
      socket.on(eventName, async (payload: any) => {
        await applyRealtimeUpdate(eventName, payload);
      });
    });

    return () => {
      events.forEach(eventName => socket.off(eventName));
      socket.disconnect();
    };
  }, [user?.id, user?.token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
