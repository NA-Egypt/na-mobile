import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set default notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
};

/**
 * Maps day names or indices to standard weekday (1 = Sunday, 2 = Monday, ..., 7 = Saturday for Expo trigger)
 */
export const getWeekdayIndex = (dayName: string, dayId?: string | number): number => {
  const normalized = (dayName || '').toLowerCase().trim();
  if (normalized.includes('أحد') || normalized.includes('sun') || String(dayId) === '1') return 1;
  if (normalized.includes('إثنين') || normalized.includes('اثنين') || normalized.includes('mon') || String(dayId) === '2') return 2;
  if (normalized.includes('ثلاثاء') || normalized.includes('tue') || String(dayId) === '3') return 3;
  if (normalized.includes('أربعاء') || normalized.includes('اربعاء') || normalized.includes('wed') || String(dayId) === '4') return 4;
  if (normalized.includes('خميس') || normalized.includes('thu') || String(dayId) === '5') return 5;
  if (normalized.includes('جمعة') || normalized.includes('fri') || String(dayId) === '6') return 6;
  if (normalized.includes('سبت') || normalized.includes('sat') || String(dayId) === '7') return 7;
  return 1;
};

/**
 * Parses time string like "19:30:00", "07:30 PM", or "19:30" into { hours, minutes }
 */
export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  if (!timeStr) return { hours: 18, minutes: 0 };
  const clean = timeStr.trim().toUpperCase();

  // Check 12-hour format
  const isPM = clean.includes('PM') || clean.includes('م');
  const isAM = clean.includes('AM') || clean.includes('ص');
  const digits = clean.replace(/[^0-9:]/g, '');
  const parts = digits.split(':').map((p) => parseInt(p, 10) || 0);

  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return { hours: Math.min(Math.max(hours, 0), 23), minutes: Math.min(Math.max(minutes, 0), 59) };
};

export interface ScheduleReminderParams {
  meetingId: string;
  groupName: string;
  dayName: string;
  dayId?: string | number;
  startTime: string;
  cityName?: string;
  offsetHours: 1 | 2;
  isAr?: boolean;
}

export const scheduleMeetingReminder = async ({
  meetingId,
  groupName,
  dayName,
  dayId,
  startTime,
  cityName,
  offsetHours,
  isAr = true,
}: ScheduleReminderParams): Promise<string | null> => {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const weekday = getWeekdayIndex(dayName, dayId);
    const { hours: origHours, minutes } = parseTimeString(startTime);

    let targetHours = origHours - offsetHours;
    let targetWeekday = weekday;

    if (targetHours < 0) {
      targetHours += 24;
      targetWeekday = targetWeekday === 1 ? 7 : targetWeekday - 1;
    }

    const title = isAr
      ? `تذكير بميعاد الاجتماع: ${groupName}`
      : `Meeting Reminder: ${groupName}`;

    const reminderOffsetLabel = isAr
      ? offsetHours === 1
        ? 'خلال ساعة'
        : 'خلال ساعتين'
      : offsetHours === 1
      ? 'in 1 hour'
      : 'in 2 hours';

    const body = isAr
      ? `سيبدأ اجتماع "${groupName}" (${dayName} الساعة ${startTime}) ${cityName ? `في ${cityName}` : ''} ${reminderOffsetLabel}.`
      : `The meeting "${groupName}" (${dayName} at ${startTime}) ${cityName ? `in ${cityName}` : ''} will start ${reminderOffsetLabel}.`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { meetingId, type: 'meeting_reminder', offsetHours },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: targetWeekday,
        hour: targetHours,
        minute: minutes,
      },
    });

    return notificationId;
  } catch (e) {
    console.error('Failed to schedule meeting notification:', e);
    return null;
  }
};

export const cancelMeetingReminder = async (notificationId: string): Promise<void> => {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (e) {
    console.warn('Failed to cancel notification:', e);
  }
};
