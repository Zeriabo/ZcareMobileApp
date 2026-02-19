import { NativeModules, Platform } from 'react-native';

type NotifeePackage = typeof import('@notifee/react-native');

const loadNotifee = (): NotifeePackage | null => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  if (!NativeModules.NotifeeApiModule) return null;
  try {
    return require('@notifee/react-native') as NotifeePackage;
  } catch {
    return null;
  }
};

const notifeePackage = loadNotifee();

const fallbackAndroidImportance = {
  HIGH: 4,
};

const fallbackEventType = {
  PRESS: 1,
};

const fallbackTriggerType = {
  TIMESTAMP: 0,
};

export const isNotifeeAvailable = !!notifeePackage?.default;
export const AndroidImportance = notifeePackage?.AndroidImportance ?? fallbackAndroidImportance;
export const EventType = notifeePackage?.EventType ?? fallbackEventType;
export const TriggerType = notifeePackage?.TriggerType ?? fallbackTriggerType;
export type TimestampTrigger = import('@notifee/react-native').TimestampTrigger;
export default notifeePackage?.default ?? null;
