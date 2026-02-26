import { io } from 'socket.io-client';
import { logger } from '../utils/logger';

const socketPort = process.env.EXPO_PUBLIC_SOCKET_PORT || '9099';
const socketHost = process.env.EXPO_PUBLIC_SOCKET_HOST || process.env.EXPO_PUBLIC_SERVER_URL || 'localhost';
const socketUrl = `${socketHost}:${socketPort}`;

logger.info('Initializing socket connection', { socketUrl });

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

export default socket;
