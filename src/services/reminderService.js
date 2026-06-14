import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const LEGACY_REMINDER_IDS = [7001, 7002, 7003, 7004];
const TEST_REMINDER_ID = 7099;
const CHANNEL_ID = 'zukari-daily-reminders';
const ZUKARI_REMINDER_ID_MIN = 7100;
const ZUKARI_REMINDER_ID_MAX = 7999;

const DEFAULT_REMINDERS = [
  {
    id: 'fasting_glucose',
    type: 'glucose',
    label: 'Fasting sugar check',
    time: '07:30',
    enabled: true,
    message: 'Wakey wakey Bo$$, have you tested your fasting sugars?',
  },
  {
    id: 'lunch_glucose',
    type: 'glucose',
    label: 'Lunch sugar check',
    time: '13:30',
    enabled: true,
    message: "It's past lunch hour dude, I have not received your reading.",
  },
  {
    id: 'dinner_glucose',
    type: 'glucose',
    label: 'Dinner sugar check',
    time: '19:30',
    enabled: true,
    message: 'Dinner patrol. Check sugar before the food starts giving testimony.',
  },
  {
    id: 'bedtime_glucose',
    type: 'bedtime',
    label: 'Bedtime glucose check',
    time: '22:30',
    enabled: true,
    message: 'Bedtime sugar check. Let us not let the night shift surprise us.',
  },
];

const LEGACY_REMINDER_DEFINITIONS = [
  {
    enabledKey: 'reminderGlucose',
    timeKey: 'reminderGlucoseTime',
    id: 'glucose_check',
    type: 'glucose',
    label: 'Glucose check',
    fallbackTime: '07:30',
    message: 'Boss, umecheck sugar ama tunaishi by vibes today?',
  },
  {
    enabledKey: 'reminderMedication',
    timeKey: 'reminderMedicationTime',
    id: 'medication_time',
    type: 'medication',
    label: 'Medication time',
    fallbackTime: '21:00',
    message: 'Medication time. Future you is already clapping.',
  },
  {
    enabledKey: 'reminderInsulin',
    timeKey: 'reminderInsulinTime',
    id: 'insulin_log_check',
    type: 'insulin',
    label: 'Insulin log check',
    fallbackTime: '12:45',
    message: 'Quick insulin log check. Zukari is not judging, just monitoring with eyebrows raised.',
  },
  {
    enabledKey: 'reminderBedtime',
    timeKey: 'reminderBedtimeTime',
    id: 'bedtime_sugar_check',
    type: 'bedtime',
    label: 'Bedtime sugar check',
    fallbackTime: '22:30',
    message: 'Bedtime sugar check. Let us not let the night shift surprise us.',
  },
];

function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function hashToNotificationId(value) {
  const text = String(value || 'reminder');
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return ZUKARI_REMINDER_ID_MIN + (hash % (ZUKARI_REMINDER_ID_MAX - ZUKARI_REMINDER_ID_MIN));
}

function parseTime(value, fallback = '09:00') {
  const source = /^\d{2}:\d{2}$/.test(String(value || '')) ? value : fallback;
  const [hourText, minuteText] = source.split(':');
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 9, minute: 0 };
  }

  return { hour, minute };
}

function permissionIsGranted(status) {
  return status?.display === 'granted';
}

function cleanReminder(reminder, index = 0) {
  const fallback = DEFAULT_REMINDERS[index % DEFAULT_REMINDERS.length] || DEFAULT_REMINDERS[0];
  const id = String(reminder?.id || `${reminder?.type || 'custom'}_${Date.now()}_${index}`);

  return {
    id,
    type: reminder?.type || fallback.type || 'custom',
    label: String(reminder?.label || fallback.label || 'Zukari reminder').trim() || 'Zukari reminder',
    time: /^\d{2}:\d{2}$/.test(String(reminder?.time || '')) ? reminder.time : fallback.time || '09:00',
    enabled: Boolean(reminder?.enabled ?? true),
    message: String(reminder?.message || fallback.message || 'Boss, Zukari reminder time.').trim() || 'Boss, Zukari reminder time.',
  };
}

function legacyToReminders(preferences = {}) {
  const enabledLegacyCount = LEGACY_REMINDER_DEFINITIONS.filter((definition) =>
    Boolean(preferences?.[definition.enabledKey])
  ).length;

  if (enabledLegacyCount === 0 && preferences?.remindersEnabled === false) {
    return DEFAULT_REMINDERS.map((item) => ({ ...item, enabled: false }));
  }

  return LEGACY_REMINDER_DEFINITIONS.map((definition) => ({
    id: definition.id,
    type: definition.type,
    label: definition.label,
    time: preferences?.[definition.timeKey] || definition.fallbackTime,
    enabled: Boolean(preferences?.[definition.enabledKey] ?? true),
    message: definition.message,
  }));
}

function normalizeReminders(preferences = {}) {
  if (Array.isArray(preferences?.reminders) && preferences.reminders.length > 0) {
    return preferences.reminders.map(cleanReminder);
  }

  return legacyToReminders(preferences).map(cleanReminder);
}

function titleForReminder(reminder) {
  if (reminder.type === 'glucose') return reminder.label || 'Glucose check';
  if (reminder.type === 'insulin') return reminder.label || 'Insulin log check';
  if (reminder.type === 'medication') return reminder.label || 'Medication time';
  if (reminder.type === 'bedtime') return reminder.label || 'Bedtime sugar check';
  return reminder.label || 'Zukari reminder';
}

async function ensureAndroidChannel() {
  if (!isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Zukari reminders',
      description: 'Daily glucose, insulin, medication and custom reminders.',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  } catch (error) {
    console.warn('Could not create Zukari notification channel', error);
  }
}

async function checkPermission() {
  if (!isNativePlatform()) {
    return {
      display: 'web',
      message: 'Local notifications are available in the Android/iOS app build. Web preview cannot schedule real device reminders.',
    };
  }

  try {
    return await LocalNotifications.checkPermissions();
  } catch (error) {
    return {
      display: 'error',
      message: error?.message || 'Could not check notification permission.',
    };
  }
}

async function requestPermission() {
  if (!isNativePlatform()) {
    return {
      display: 'web',
      message: 'Open the Android/iOS app build to allow local reminders. Browser preview is just rehearsing the speech.',
    };
  }

  try {
    const current = await LocalNotifications.checkPermissions();

    if (permissionIsGranted(current)) {
      return current;
    }

    return LocalNotifications.requestPermissions();
  } catch (error) {
    return {
      display: 'error',
      message: error?.message || 'Could not request notification permission.',
    };
  }
}

async function cancelDailyReminders() {
  if (!isNativePlatform()) {
    return { cancelled: false, reason: 'web' };
  }

  const notificationsToCancel = LEGACY_REMINDER_IDS.map((id) => ({ id }));

  try {
    const pending = await LocalNotifications.getPending();
    const zukariPending = (pending?.notifications || [])
      .filter((item) => item.id >= ZUKARI_REMINDER_ID_MIN && item.id <= ZUKARI_REMINDER_ID_MAX)
      .map((item) => ({ id: item.id }));

    notificationsToCancel.push(...zukariPending);
  } catch {
    // If pending read fails, still cancel old fixed ids.
  }

  if (notificationsToCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: notificationsToCancel });
  }

  return { cancelled: true, count: notificationsToCancel.length };
}

function buildNotifications(preferences = {}) {
  return normalizeReminders(preferences)
    .filter((reminder) => Boolean(reminder.enabled))
    .map((reminder, index) => {
      const { hour, minute } = parseTime(reminder.time);

      return {
        id: hashToNotificationId(reminder.id || `${reminder.type}_${index}`),
        title: titleForReminder(reminder),
        body: reminder.message,
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        channelId: CHANNEL_ID,
        extra: {
          reminderId: reminder.id,
          reminderType: reminder.type,
        },
      };
    });
}

async function syncReminders(preferences = {}) {
  const permission = await checkPermission();

  if (!isNativePlatform()) {
    return {
      ok: false,
      platform: 'web',
      permission,
      scheduled: 0,
      message: permission.message,
    };
  }

  if (!permissionIsGranted(permission)) {
    await cancelDailyReminders();

    return {
      ok: false,
      platform: Capacitor.getPlatform(),
      permission,
      scheduled: 0,
      message: 'Notification permission is not granted yet. Tap Enable reminders first.',
    };
  }

  await ensureAndroidChannel();
  await cancelDailyReminders();

  const notifications = buildNotifications(preferences);

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }

  return {
    ok: true,
    platform: Capacitor.getPlatform(),
    permission,
    scheduled: notifications.length,
    message: notifications.length
      ? `${notifications.length} daily reminder${notifications.length === 1 ? '' : 's'} scheduled.`
      : 'All reminder switches are off. Zukari will remain respectfully quiet.',
  };
}

async function enableAndSync(preferences = {}) {
  const permission = await requestPermission();

  if (!permissionIsGranted(permission)) {
    return {
      ok: false,
      permission,
      scheduled: 0,
      message: permission.message || 'Notification permission was not granted.',
    };
  }

  return syncReminders(preferences);
}

async function sendTestReminder() {
  const permission = await requestPermission();

  if (!isNativePlatform()) {
    return {
      ok: false,
      permission,
      message: permission.message,
    };
  }

  if (!permissionIsGranted(permission)) {
    return {
      ok: false,
      permission,
      message: 'Notification permission was not granted, so the test reminder stayed in the garage.',
    };
  }

  await ensureAndroidChannel();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_REMINDER_ID,
        title: 'Zukari test reminder',
        body: 'Boss, this is the test nudge. The reminder engine has entered the chat.',
        schedule: { at: new Date(Date.now() + 4000), allowWhileIdle: true },
        channelId: CHANNEL_ID,
      },
    ],
  });

  return {
    ok: true,
    permission,
    message: 'Test reminder scheduled. Give it a few seconds to knock politely.',
  };
}

async function getStatus() {
  const permission = await checkPermission();

  if (!isNativePlatform() || !permissionIsGranted(permission)) {
    return {
      platform: isNativePlatform() ? Capacitor.getPlatform() : 'web',
      permission,
      pendingCount: 0,
    };
  }

  try {
    const pending = await LocalNotifications.getPending();
    const pendingCount = (pending?.notifications || []).filter(
      (item) => item.id >= ZUKARI_REMINDER_ID_MIN && item.id <= ZUKARI_REMINDER_ID_MAX
    ).length;

    return {
      platform: Capacitor.getPlatform(),
      permission,
      pendingCount,
    };
  } catch (error) {
    return {
      platform: Capacitor.getPlatform(),
      permission,
      pendingCount: 0,
      error: error?.message || 'Could not read pending reminders.',
    };
  }
}

export const reminderService = {
  checkPermission,
  requestPermission,
  enableAndSync,
  syncReminders,
  cancelDailyReminders,
  sendTestReminder,
  getStatus,
  buildNotifications,
  normalizeReminders,
  DEFAULT_REMINDERS,
};
