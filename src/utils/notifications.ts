import notifee, { AndroidImportance } from '@notifee/react-native';

export const displayLocalNotification = async (title: string, body: string) => {
  // Request permissions (required for iOS)
  await notifee.requestPermission();

  // Create a channel (required for Android, ignored on iOS)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  // Display the notification
  await notifee.displayNotification({
    title: title,
    body: body,
    ios: {
      foregroundPresentationOptions: {
        badge: true,
        sound: true,
        banner: true,
        list: true,
      },
    },
    android: {
      channelId,
      smallIcon: 'ic_launcher', // ensure this exists in your res/drawable
      pressAction: {
        id: 'default',
      },
    },
  });
};