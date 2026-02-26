// SocketProvider.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { fetchUserBookings } from '../redux/actions/BookingActions';
import { RootState } from '../redux/store';
import { logger } from '../utils/logger';
import notifee, { AndroidImportance } from '../utils/notifeeCompat';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: any) => {
  const dispatch = useDispatch<any>();
  const user = useSelector((state: RootState) => state.user.user as any);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    const socketPort = process.env.EXPO_PUBLIC_SOCKET_PORT || '9099';
    const socketHost = process.env.EXPO_PUBLIC_SOCKET_HOST || process.env.EXPO_PUBLIC_SERVER_URL || 'localhost';
    const socketUrl = `${socketHost}:${socketPort}`;

    logger.info('Initializing socket connection', { socketUrl });

    socketRef.current = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Error handling
    socketRef.current.on('connect_error', (error: any) => {
      logger.error('Socket connection error', error);
    });

    socketRef.current.on('disconnect', (reason: string) => {
      logger.info('Socket disconnected', { reason });
    });
  }
  const socket = socketRef.current;

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
    if (!normalized) return 'PURCHASED';
    if (normalized.includes('queue')) return 'QUEUING';
    if (normalized.includes('wash') || normalized.includes('progress') || normalized.includes('start')) return 'WASHING';
    if (normalized.includes('finish') || normalized.includes('complete') || normalized.includes('done')) return 'FINISHED';
    if (normalized.includes('cancel')) return 'CANCELED';
    if (normalized.includes('not_purchased') || normalized.includes('not purchased')) return 'NOT_PURCHASED';
    if (normalized.includes('purchased')) return 'PURCHASED';
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

  const readUserId = (payload: any): number | null => {
    const candidate =
      payload?.userId ??
      payload?.booking?.userId ??
      payload?.booking?.user?.id;
    const asNumber = Number(candidate);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const applyRealtimeUpdate = async (eventName: string, incoming: any) => {
    const payload = parsePayload(incoming);
    const bookingId = readBookingId(payload);
    const status = normalizeStatus(payload?.washStatus || payload?.bookingStatus || payload?.status || eventName);
    const eventUserId = readUserId(payload);
    const currentUserId = Number(user?.id);
    const eventKey = `${eventName}:${bookingId ?? 'none'}:${status}:${payload?.updatedAt || payload?.timestamp || payload?.message || ''}`;

    if (seenEventsRef.current.has(eventKey)) return;
    seenEventsRef.current.add(eventKey);
    if (seenEventsRef.current.size > 200) {
      // keep memory bounded
      const first = seenEventsRef.current.values().next().value;
      if (first) seenEventsRef.current.delete(first);
    }

    const title = payload?.title || (status === 'FINISHED' ? 'Wash finished' : 'Wash status updated');
    const body =
      payload?.message ||
      (bookingId ? `Booking #${bookingId}: ${status.replaceAll('_', ' ')}` : status.replaceAll('_', ' '));

    if (notifee) {
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
    }

    if (Number.isFinite(currentUserId) && Number.isFinite(eventUserId) && eventUserId !== currentUserId) {
      return;
    }
    if (!bookingId) {
      if (user?.token) dispatch(fetchUserBookings(user.token));
      return;
    }

    dispatch((innerDispatch: any, getState: any) => {
      const bookings = getState()?.booking?.bookings || [];
      const existing = bookings.find((b: any) => Number(b?.id) === bookingId);
      if (!existing) {
        if (user?.token) innerDispatch(fetchUserBookings(user.token));
        return;
      }

      const next = {
        ...existing,
        status,
        executed: status === 'FINISHED' ? true : existing.executed,
        updatedAt: payload?.updatedAt || new Date().toISOString(),
        progress: payload?.progress ?? existing?.progress,
      };
      innerDispatch({ type: 'UPDATE_BOOKING', payload: next });
    });

    if (user?.token) {
      dispatch(fetchUserBookings(user.token));
    }
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
