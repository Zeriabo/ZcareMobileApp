import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from './notifeeCompat';

export const displayLocalNotification = async (title: string, body: string) => {
  if (!notifee) return;

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

export const scheduleBookingReminder = async (
  scheduledTimeIso: string | null | undefined,
  label: string
) => {
  if (!notifee) return;
  if (!scheduledTimeIso) return;
  const scheduledAt = new Date(scheduledTimeIso).getTime();
  if (!Number.isFinite(scheduledAt)) return;

  const triggerAt = scheduledAt - 60 * 60 * 1000;
  if (triggerAt <= Date.now()) return;

  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: 'booking-reminders',
    name: 'Booking reminders',
    importance: AndroidImportance.HIGH,
  });

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerAt,
  };

  await notifee.createTriggerNotification(
    {
      title: `${label} reminder`,
      body: 'Your booking starts in 1 hour.',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    },
    trigger
  );
};
