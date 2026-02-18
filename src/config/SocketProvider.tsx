// SocketProvider.tsx
import notifee from '@notifee/react-native';
import React, { createContext, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: any) => {
  const socket = io(process.env.EXPO_PUBLIC_SERVER_URL+':9099', { autoConnect: false });

  useEffect(() => {
    socket.connect();

    socket.on('status_update', async (message: string) => {
      await notifee.displayNotification({
        title: 'ZCare Update',
        body: message,
        android: { channelId: 'zcare_updates' },
      });
    });

    return () => {
      socket.off('status_update');
      socket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
