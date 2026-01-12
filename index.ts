
import notifee, { EventType } from '@notifee/react-native';
import './src/firebase/firebase';

import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { registerRootComponent } from 'expo';
import App from './App';

// 1. In v22 Messaging, you can call getMessaging() without arguments 
// to get the [DEFAULT] app instance synchronously.
const messaging = getMessaging(); 

// 2. Handle background messages
setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  console.log('📩 Background FCM Message:', remoteMessage);
  
  // Example: If it's a data-only message, use Notifee to show it
  if (!remoteMessage.notification && remoteMessage.data) {
    await notifee.displayNotification({
      title: remoteMessage.data.title as string,
      body: remoteMessage.data.body as string,
      android: { channelId: 'default' },
    });
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('User pressed notification', detail.notification);
  }
});

registerRootComponent(App);