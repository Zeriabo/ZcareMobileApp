// index.ts
import notifee, { EventType } from '@notifee/react-native';
import { registerRootComponent } from 'expo';
import App from './App';


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
  console.log('✅ Notifee default channel created', channelId);
})();


registerRootComponent(App);
