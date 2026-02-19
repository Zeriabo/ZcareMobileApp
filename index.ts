// index.ts
import { registerRootComponent } from 'expo';
import App from './App';
import notifee, { EventType, isNotifeeAvailable } from './src/utils/notifeeCompat';

if (isNotifeeAvailable && notifee) {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('User pressed notification', detail.notification);
    }
  });

  (async () => {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
    console.log('Notifee default channel created', channelId);
  })();
} else {
  console.warn('Notifee native module is unavailable in this runtime.');
}


registerRootComponent(App);
