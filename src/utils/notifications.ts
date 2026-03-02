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

export const notifyRepairBookingCreated = async (vehicleplate: string, scheduledDate: string) => {
  await displayLocalNotification(
    '🔧 Repair Booked',
    `Vehicle ${vehicleplate} scheduled for repair on ${new Date(scheduledDate).toLocaleDateString()}`
  );
};

export const notifyRepairStatusChanged = async (vehicleplate: string, newStatus: string) => {
  const statusMessages: Record<string, string> = {
    CONFIRMED: '✓ Your repair has been confirmed',
    IN_PROGRESS: '⏳ Your repair is now in progress',
    COMPLETED: '✅ Your repair is complete',
    CANCELLED: '❌ Your repair has been cancelled',
  };
  
  const message = statusMessages[newStatus] || `Status updated to ${newStatus}`;
  await displayLocalNotification('🔧 Repair Status Update', `${vehicleplate}: ${message}`);
};

export const notifyInspectionOverdue = async (vehicleplate: string, daysOverdue: number) => {
  await displayLocalNotification(
    '⚠️ Inspection Overdue',
    `Vehicle ${vehicleplate} inspection is ${Math.abs(daysOverdue)} days overdue. Please schedule inspection.`
  );
};

export const notifyInspectionDueSoon = async (vehicleplate: string, daysUntil: number) => {
  await displayLocalNotification(
    '📋 Inspection Due Soon',
    `Vehicle ${vehicleplate} inspection is due in ${daysUntil} days`
  );
};

export const scheduleRepairReminder = async (
  scheduledDateIso: string | null | undefined,
  vehicleplate: string
) => {
  if (!notifee) return;
  if (!scheduledDateIso) return;
  
  const scheduledAt = new Date(scheduledDateIso).getTime();
  if (!Number.isFinite(scheduledAt)) return;

  // Notify 1 hour before the scheduled repair
  const triggerAt = scheduledAt - 60 * 60 * 1000;
  if (triggerAt <= Date.now()) return;

  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: 'repair-reminders',
    name: 'Repair reminders',
    importance: AndroidImportance.HIGH,
  });

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerAt,
  };

  await notifee.createTriggerNotification(
    {
      title: '🔧 Repair Reminder',
      body: `Your repair for ${vehicleplate} starts in 1 hour.`,
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
