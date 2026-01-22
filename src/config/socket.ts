import { io } from 'socket.io-client';

export const socket = io('http://192.168.1.241:9099', {
  autoConnect: false,
});
