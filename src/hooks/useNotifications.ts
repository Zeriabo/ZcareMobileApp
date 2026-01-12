import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';

export const useNotifications = () => {
  useEffect(() => {
    // We declare unsubscribe outside so we can call it in the cleanup function
    let unsubscribeMessaging: () => void;

    const setup = async () => {
      // 1. Request permissions
      await notifee.requestPermission();

      // 2. Create a channel (Required for Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // 3. Get FCM Token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // 4. Listen for foreground messages
      unsubscribeMessaging = messaging().onMessage(async remoteMessage => {
        await notifee.displayNotification({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          android: {
            channelId: 'default',
          },
        });
      });
    };

    setup();

    // Cleanup listener when the component unmounts
    return () => {
      if (unsubscribeMessaging) unsubscribeMessaging();
    };
  }, []);
};