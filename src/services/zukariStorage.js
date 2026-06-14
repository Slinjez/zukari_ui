import { Preferences } from '@capacitor/preferences';

const KEYS = {
  glucoseLogs: 'zukari_glucose_logs',
  insulinLogs: 'zukari_insulin_logs',
  mealLogs: 'zukari_meal_logs',
  activityLogs: 'zukari_activity_logs',
  preferences: 'zukari_user_preferences',
  authUsers: 'zukari_auth_users',
  authSession: 'zukari_auth_session',
};

const DEFAULT_PREFERENCES = {
  welcomeCompleted: false,
  name: 'Bo$$',
  phone: '',
  diabetesType: 'type_1',
  glucoseUnit: 'mmol/L',
  targetMin: 3.9,
  targetMax: 10,
  insulinTypes: ['Novorapid', 'Lantus'],
  reminderGlucose: true,
  reminderMedication: true,
  reminderInsulin: true,
  reminderBedtime: true,
  reminderGlucoseTime: '07:30',
  reminderMedicationTime: '21:00',
  reminderInsulinTime: '12:45',
  reminderBedtimeTime: '22:30',
  gender: 'not_set',
  darkMode: false,
};


function normalizePreferences(preferences = {}) {
  const insulinTypes = Array.isArray(preferences.insulinTypes)
    ? preferences.insulinTypes.filter(Boolean)
    : typeof preferences.insulinTypes === 'string'
      ? preferences.insulinTypes.split(',').map((item) => item.trim()).filter(Boolean)
      : DEFAULT_PREFERENCES.insulinTypes;
  const targetMin = Number(preferences.targetMin ?? DEFAULT_PREFERENCES.targetMin);
  const targetMax = Number(preferences.targetMax ?? DEFAULT_PREFERENCES.targetMax);

  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    insulinTypes: insulinTypes.length ? insulinTypes : DEFAULT_PREFERENCES.insulinTypes,
    targetMin: Number.isFinite(targetMin) && targetMin > 0 ? targetMin : DEFAULT_PREFERENCES.targetMin,
    targetMax: Number.isFinite(targetMax) && targetMax > targetMin ? targetMax : DEFAULT_PREFERENCES.targetMax,
    reminderGlucose: Boolean(preferences.reminderGlucose ?? DEFAULT_PREFERENCES.reminderGlucose),
    reminderMedication: Boolean(preferences.reminderMedication ?? DEFAULT_PREFERENCES.reminderMedication),
    reminderInsulin: Boolean(preferences.reminderInsulin ?? DEFAULT_PREFERENCES.reminderInsulin),
    reminderBedtime: Boolean(preferences.reminderBedtime ?? DEFAULT_PREFERENCES.reminderBedtime),
    reminderGlucoseTime: preferences.reminderGlucoseTime || DEFAULT_PREFERENCES.reminderGlucoseTime,
    reminderMedicationTime: preferences.reminderMedicationTime || DEFAULT_PREFERENCES.reminderMedicationTime,
    reminderInsulinTime: preferences.reminderInsulinTime || DEFAULT_PREFERENCES.reminderInsulinTime,
    reminderBedtimeTime: preferences.reminderBedtimeTime || DEFAULT_PREFERENCES.reminderBedtimeTime,
    gender: preferences.gender || DEFAULT_PREFERENCES.gender,
    darkMode: Boolean(preferences.darkMode ?? DEFAULT_PREFERENCES.darkMode),
  };
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function getJson(key, fallback) {
  const result = await Preferences.get({ key });

  if (!result.value) {
    return fallback;
  }

  try {
    return JSON.parse(result.value);
  } catch {
    return fallback;
  }
}

async function setJson(key, value) {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

function baseLog() {
  const createdAt = nowIso();

  return {
    id: createId(),
    createdAt,
    updatedAt: createdAt,
    syncStatus: 'unsynced',
  };
}

function sortByCreatedAtAsc(items) {
  return [...items].sort((a, b) => {
    const left = new Date(a.loggedAt || a.createdAt || 0).getTime();
    const right = new Date(b.loggedAt || b.createdAt || 0).getTime();
    return left - right;
  });
}

function normalizeGlucoseLog(log) {
  const value = Number(log.value ?? log.val ?? 0);
  const loggedAt = log.loggedAt || log.createdAt || nowIso();
  const createdAt = log.createdAt || loggedAt;

  return {
    ...log,
    id: log.id || createId(),
    value,
    val: value,
    unit: log.unit || 'mmol/L',
    context: log.context || 'random',
    notes: log.notes ?? log.note ?? '',
    note: log.note ?? log.notes ?? 'Manual',
    loggedAt,
    time: formatTime(new Date(loggedAt)),
    createdAt,
    updatedAt: log.updatedAt || createdAt,
    syncStatus: log.syncStatus || 'unsynced',
  };
}

function normalizeInsulinLog(log) {
  const insulinType = log.insulinType ?? log.type ?? 'Novorapid';
  const units = Number(log.units ?? log.dose ?? 0);
  const loggedAt = log.loggedAt || log.createdAt || nowIso();
  const createdAt = log.createdAt || loggedAt;

  return {
    ...log,
    id: log.id || createId(),
    insulinType,
    type: insulinType,
    units,
    dose: units,
    notes: log.notes ?? log.note ?? '',
    note: log.note ?? log.notes ?? '',
    loggedAt,
    time: formatTime(new Date(loggedAt)),
    createdAt,
    updatedAt: log.updatedAt || createdAt,
    syncStatus: log.syncStatus || 'unsynced',
  };
}

function normalizeMealLog(log) {
  const mealName = log.mealName ?? log.name ?? 'Meal';
  const carbsEstimate = Number(log.carbsEstimate ?? log.carbs ?? 0);
  const loggedAt = log.loggedAt || log.createdAt || nowIso();
  const createdAt = log.createdAt || loggedAt;

  return {
    ...log,
    id: log.id || createId(),
    mealName,
    name: mealName,
    carbsEstimate,
    carbs: carbsEstimate,
    caloriesEstimate: log.caloriesEstimate,
    notes: log.notes ?? log.note ?? '',
    note: log.note ?? log.notes ?? '',
    loggedAt,
    time: formatTime(new Date(loggedAt)),
    createdAt,
    updatedAt: log.updatedAt || createdAt,
    syncStatus: log.syncStatus || 'unsynced',
  };
}

function normalizeActivityLog(log) {
  const activityName = log.activityName ?? log.type ?? 'Walking';
  const durationMinutes = Number(log.durationMinutes ?? log.duration ?? 0);
  const loggedAt = log.loggedAt || log.createdAt || nowIso();
  const createdAt = log.createdAt || loggedAt;

  return {
    ...log,
    id: log.id || createId(),
    activityName,
    type: activityName,
    durationMinutes,
    duration: durationMinutes,
    notes: log.notes ?? log.note ?? '',
    note: log.note ?? log.notes ?? '',
    loggedAt,
    time: formatTime(new Date(loggedAt)),
    createdAt,
    updatedAt: log.updatedAt || createdAt,
    syncStatus: log.syncStatus || 'unsynced',
  };
}

async function appendLog(key, normalizer, input) {
  const current = await getJson(key, []);
  const normalizedCurrent = sortByCreatedAtAsc(current.map(normalizer));
  const nextLog = normalizer({ ...baseLog(), ...input });
  const next = [...normalizedCurrent, nextLog];

  await setJson(key, next);
  return nextLog;
}

async function updateLog(key, normalizer, id, partial) {
  const current = await getJson(key, []);
  const normalizedCurrent = sortByCreatedAtAsc(current.map(normalizer));
  let updatedLog = null;

  const next = normalizedCurrent.map((item) => {
    if (item.id !== id) return item;

    updatedLog = normalizer({
      ...item,
      ...partial,
      id,
      updatedAt: nowIso(),
      syncStatus: 'unsynced',
    });

    return updatedLog;
  });

  if (!updatedLog) {
    throw new Error('Log entry not found. It may have already been deleted.');
  }

  const sorted = sortByCreatedAtAsc(next);
  await setJson(key, sorted);
  return updatedLog;
}

async function deleteLog(key, normalizer, id) {
  const current = await getJson(key, []);
  const normalizedCurrent = current.map(normalizer);
  const next = normalizedCurrent.filter((item) => item.id !== id);

  await setJson(key, sortByCreatedAtAsc(next));
  return true;
}


function normalizeIdentifier(identifier = '') {
  return String(identifier).trim().toLowerCase();
}

async function digestText(text) {
  const input = String(text || '');

  try {
    if (globalThis.crypto?.subtle && globalThis.TextEncoder) {
      const encoded = new TextEncoder().encode(input);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fall through to the lightweight fallback below for older webviews.
  }

  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fallback-${(hash >>> 0).toString(16)}`;
}

async function passwordHash(identifier, password) {
  return digestText(`${normalizeIdentifier(identifier)}:${String(password || '')}:zukari-local-auth-v1`);
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    identifier: user.identifier,
    phone: user.phone || '',
    diabetesType: user.diabetesType || 'type_1',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getAuthUsers() {
  const users = await getJson(KEYS.authUsers, []);
  return Array.isArray(users) ? users : [];
}

async function setAuthUsers(users) {
  await setJson(KEYS.authUsers, users);
}

async function setAuthSession(user) {
  const cleanUser = publicUser(user);

  if (!cleanUser) {
    await Preferences.remove({ key: KEYS.authSession });
    return null;
  }

  const session = {
    user: cleanUser,
    signedInAt: nowIso(),
  };

  await setJson(KEYS.authSession, session);
  return session;
}

async function getAuthSession() {
  const session = await getJson(KEYS.authSession, null);

  if (!session?.user?.id) {
    return null;
  }

  const users = await getAuthUsers();
  const storedUser = users.find((user) => user.id === session.user.id);

  if (!storedUser) {
    await Preferences.remove({ key: KEYS.authSession });
    return null;
  }

  return {
    ...session,
    user: publicUser(storedUser),
  };
}

async function registerUser(input = {}) {
  const name = String(input.name || '').trim();
  const identifier = normalizeIdentifier(input.identifier || input.email || input.phone);
  const phone = String(input.phone || '').trim();
  const diabetesType = input.diabetesType || 'type_1';
  const password = String(input.password || '');

  if (!name) {
    throw new Error('Name is required.');
  }

  if (!identifier) {
    throw new Error('Email or phone is required.');
  }

  if (password.length < 6) {
    throw new Error('Password should be at least 6 characters.');
  }

  const users = await getAuthUsers();
  const exists = users.some((user) => normalizeIdentifier(user.identifier) === identifier);

  if (exists) {
    throw new Error('An account with that email or phone already exists.');
  }

  const createdAt = nowIso();
  const user = {
    id: createId(),
    name,
    identifier,
    phone,
    diabetesType,
    passwordHash: await passwordHash(identifier, password),
    createdAt,
    updatedAt: createdAt,
  };

  await setAuthUsers([...users, user]);
  const session = await setAuthSession(user);
  await updatePreferences({ name, phone, diabetesType });

  return { user: session.user, session };
}

async function loginUser(input = {}) {
  const identifier = normalizeIdentifier(input.identifier || input.email || input.phone);
  const password = String(input.password || '');

  if (!identifier || !password) {
    throw new Error('Enter your email/phone and password.');
  }

  const users = await getAuthUsers();
  const user = users.find((item) => normalizeIdentifier(item.identifier) === identifier);

  if (!user) {
    throw new Error('No local account found for those details.');
  }

  const candidateHash = await passwordHash(identifier, password);

  if (candidateHash !== user.passwordHash) {
    throw new Error('Incorrect password.');
  }

  const session = await setAuthSession(user);
  await updatePreferences({ name: user.name, phone: user.phone || '', diabetesType: user.diabetesType || 'type_1' });

  return { user: session.user, session };
}

async function logoutUser() {
  await Preferences.remove({ key: KEYS.authSession });
}

async function updateCurrentUser(partial = {}) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return null;
  }

  const users = await getAuthUsers();
  const updatedUsers = users.map((user) => {
    if (user.id !== session.user.id) return user;

    return {
      ...user,
      name: partial.name ?? user.name,
      phone: partial.phone ?? user.phone,
      diabetesType: partial.diabetesType ?? user.diabetesType,
      updatedAt: nowIso(),
    };
  });

  await setAuthUsers(updatedUsers);
  const updatedUser = updatedUsers.find((user) => user.id === session.user.id);
  const updatedSession = await setAuthSession(updatedUser);

  return updatedSession?.user || null;
}

async function getGlucoseLogs() {
  const logs = await getJson(KEYS.glucoseLogs, []);
  return sortByCreatedAtAsc(logs.map(normalizeGlucoseLog));
}

async function addGlucoseLog(input) {
  return appendLog(KEYS.glucoseLogs, normalizeGlucoseLog, input);
}

async function updateGlucoseLog(id, partial) {
  return updateLog(KEYS.glucoseLogs, normalizeGlucoseLog, id, partial);
}

async function deleteGlucoseLog(id) {
  return deleteLog(KEYS.glucoseLogs, normalizeGlucoseLog, id);
}

async function bulkImportLogs(key, normalizer, inputs = []) {
  const current = await getJson(key, []);
  const normalizedCurrent = current.map(normalizer);
  const imported = inputs.map((input) => normalizer({ ...baseLog(), ...input, syncStatus: 'unsynced' }));
  const next = sortByCreatedAtAsc([...normalizedCurrent, ...imported]);

  await setJson(key, next);
  return imported;
}

async function bulkImportGlucoseLogs(inputs = []) {
  return bulkImportLogs(KEYS.glucoseLogs, normalizeGlucoseLog, inputs);
}

async function bulkImportInsulinLogs(inputs = []) {
  return bulkImportLogs(KEYS.insulinLogs, normalizeInsulinLog, inputs);
}

async function getInsulinLogs() {
  const logs = await getJson(KEYS.insulinLogs, []);
  return sortByCreatedAtAsc(logs.map(normalizeInsulinLog));
}

async function addInsulinLog(input) {
  return appendLog(KEYS.insulinLogs, normalizeInsulinLog, input);
}

async function updateInsulinLog(id, partial) {
  return updateLog(KEYS.insulinLogs, normalizeInsulinLog, id, partial);
}

async function deleteInsulinLog(id) {
  return deleteLog(KEYS.insulinLogs, normalizeInsulinLog, id);
}

async function getMealLogs() {
  const logs = await getJson(KEYS.mealLogs, []);
  return sortByCreatedAtAsc(logs.map(normalizeMealLog));
}

async function addMealLog(input) {
  return appendLog(KEYS.mealLogs, normalizeMealLog, input);
}

async function updateMealLog(id, partial) {
  return updateLog(KEYS.mealLogs, normalizeMealLog, id, partial);
}

async function deleteMealLog(id) {
  return deleteLog(KEYS.mealLogs, normalizeMealLog, id);
}

async function getActivityLogs() {
  const logs = await getJson(KEYS.activityLogs, []);
  return sortByCreatedAtAsc(logs.map(normalizeActivityLog));
}

async function addActivityLog(input) {
  return appendLog(KEYS.activityLogs, normalizeActivityLog, input);
}

async function updateActivityLog(id, partial) {
  return updateLog(KEYS.activityLogs, normalizeActivityLog, id, partial);
}

async function deleteActivityLog(id) {
  return deleteLog(KEYS.activityLogs, normalizeActivityLog, id);
}

async function getPreferences() {
  const stored = await getJson(KEYS.preferences, DEFAULT_PREFERENCES);
  return normalizePreferences(stored);
}

async function updatePreferences(partial) {
  const current = await getPreferences();
  const updated = normalizePreferences({ ...current, ...partial });

  await setJson(KEYS.preferences, updated);
  return updated;
}

async function getAllData() {
  const [glucoseLogs, insulinLogs, mealLogs, activityLogs, preferences] = await Promise.all([
    getGlucoseLogs(),
    getInsulinLogs(),
    getMealLogs(),
    getActivityLogs(),
    getPreferences(),
  ]);

  return {
    glucoseLogs,
    insulinLogs,
    mealLogs,
    activityLogs,
    preferences,
  };
}

async function getUnsyncedData() {
  const { glucoseLogs, insulinLogs, mealLogs, activityLogs } = await getAllData();

  return {
    glucoseLogs: glucoseLogs.filter((x) => x.syncStatus === 'unsynced'),
    insulinLogs: insulinLogs.filter((x) => x.syncStatus === 'unsynced'),
    mealLogs: mealLogs.filter((x) => x.syncStatus === 'unsynced'),
    activityLogs: activityLogs.filter((x) => x.syncStatus === 'unsynced'),
  };
}

async function clearAllLocalData() {
  await Promise.all(Object.values(KEYS).map((key) => Preferences.remove({ key })));
}

async function migrateLegacyWelcomeFlag() {
  const preferences = await getPreferences();

  if (preferences.welcomeCompleted) {
    return preferences;
  }

  try {
    const legacyDone = window.localStorage?.getItem('zukari_welcome_done') === 'yes';

    if (legacyDone) {
      return updatePreferences({ welcomeCompleted: true });
    }
  } catch {
    // Browser storage may be unavailable. Preferences remains the source of truth.
  }

  return preferences;
}

export const zukariStorage = {
  getAllData,
  getAuthSession,
  registerUser,
  loginUser,
  logoutUser,
  updateCurrentUser,
  getGlucoseLogs,
  addGlucoseLog,
  updateGlucoseLog,
  deleteGlucoseLog,
  bulkImportGlucoseLogs,
  getInsulinLogs,
  addInsulinLog,
  updateInsulinLog,
  deleteInsulinLog,
  bulkImportInsulinLogs,
  getMealLogs,
  addMealLog,
  updateMealLog,
  deleteMealLog,
  getActivityLogs,
  addActivityLog,
  updateActivityLog,
  deleteActivityLog,
  getPreferences,
  updatePreferences,
  getUnsyncedData,
  clearAllLocalData,
  migrateLegacyWelcomeFlag,
};
