import { Preferences } from '@capacitor/preferences';
import { apiAuth } from './apiAuth';
import { apiHealth } from './apiHealth';
import { zukariStorage } from './zukariStorage';

const CACHE_KEYS = {
  glucoseLogs: 'zukari_glucose_logs',
  insulinLogs: 'zukari_insulin_logs',
  mealLogs: 'zukari_meal_logs',
  activityLogs: 'zukari_activity_logs',
  preferences: 'zukari_user_preferences',
};

function nowIso() {
  return new Date().toISOString();
}

function createClientUuid(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isNumericId(id) {
  return /^\d+$/.test(String(id || ''));
}

function formatTime(dateValue) {
  const date = new Date(dateValue || Date.now());
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function setCache(key, value) {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

async function getCache(key, fallback) {
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

async function patchCachedList(key, updater) {
  const current = await getCache(key, []);
  const next = updater(Array.isArray(current) ? current : []);
  await setCache(key, next);
  return next;
}

function sortByLoggedAtAsc(items) {
  return [...items].sort((a, b) => {
    const left = new Date(a.loggedAt || a.createdAt || 0).getTime();
    const right = new Date(b.loggedAt || b.createdAt || 0).getTime();
    return left - right;
  });
}

function asIso(value) {
  return value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString() : nowIso();
}

function glucoseFromApi(item = {}) {
  const loggedAt = item.measuredAt || item.loggedAt || item.createdAt || nowIso();
  const value = Number(item.rawValue ?? item.value ?? item.valueMmol ?? 0);

  return {
    id: String(item.id ?? item.clientUuid ?? createClientUuid('glucose')),
    serverId: item.id ?? null,
    clientUuid: item.clientUuid || null,
    value,
    val: value,
    valueMmol: Number(item.valueMmol ?? value),
    unit: item.unit || 'mmol/L',
    context: item.readingType || item.context || 'random',
    readingType: item.readingType || item.context || 'random',
    notes: item.notes ?? item.note ?? '',
    note: item.note ?? item.notes ?? 'Manual',
    loggedAt,
    measuredAt: loggedAt,
    time: formatTime(loggedAt),
    createdAt: item.createdAt || loggedAt,
    updatedAt: item.updatedAt || item.createdAt || loggedAt,
    syncStatus: 'synced',
  };
}

function glucoseToApi(input = {}) {
  const measuredAt = asIso(input.measuredAt || input.loggedAt || input.createdAt);
  const clientUuid = input.clientUuid || (!isNumericId(input.id) ? input.id : null) || createClientUuid('glucose');

  return {
    clientUuid,
    value: Number(input.value ?? input.val ?? input.rawValue ?? 0),
    unit: input.unit || 'mmol/L',
    readingType: input.readingType || input.context || 'random',
    notes: input.notes ?? input.note ?? '',
    measuredAt,
  };
}

function insulinTypeForApi(input = {}) {
  const raw = String(input.insulinType || input.type || input.insulinName || '').toLowerCase();

  if (raw.includes('lantus') || raw.includes('basal') || raw.includes('long')) return 'long_acting';
  if (raw.includes('novo') || raw.includes('rapid') || raw.includes('bolus')) return 'rapid';
  if (raw.includes('mix')) return 'mixed';
  if (raw.includes('correction')) return 'correction';

  return raw && ['rapid', 'long_acting', 'mixed', 'correction', 'basal', 'bolus', 'other'].includes(raw)
    ? raw
    : 'other';
}

function insulinFromApi(item = {}) {
  const loggedAt = item.takenAt || item.loggedAt || item.createdAt || nowIso();
  const insulinName = item.insulinName || item.insulinType || 'Insulin';
  const units = Number(item.units ?? item.dose ?? 0);

  return {
    id: String(item.id ?? item.clientUuid ?? createClientUuid('insulin')),
    serverId: item.id ?? null,
    clientUuid: item.clientUuid || null,
    insulinName,
    insulinType: insulinName,
    apiInsulinType: item.insulinType || 'other',
    type: insulinName,
    units,
    dose: units,
    notes: item.notes ?? item.note ?? '',
    note: item.note ?? item.notes ?? '',
    loggedAt,
    takenAt: loggedAt,
    time: formatTime(loggedAt),
    createdAt: item.createdAt || loggedAt,
    updatedAt: item.updatedAt || item.createdAt || loggedAt,
    syncStatus: 'synced',
  };
}

function insulinToApi(input = {}) {
  const takenAt = asIso(input.takenAt || input.loggedAt || input.createdAt);
  const insulinName = input.insulinName || input.insulinType || input.type || 'Insulin';
  const clientUuid = input.clientUuid || (!isNumericId(input.id) ? input.id : null) || createClientUuid('insulin');

  return {
    clientUuid,
    insulinName,
    insulinType: insulinTypeForApi(input),
    units: Number(input.units ?? input.dose ?? 0),
    notes: input.notes ?? input.note ?? '',
    takenAt,
  };
}

function mealFromApi(item = {}) {
  const loggedAt = item.loggedAt || item.createdAt || nowIso();
  const mealName = item.description || item.mealName || item.name || 'Meal';
  const carbs = Number(item.carbsGrams ?? item.carbsEstimate ?? item.carbs ?? 0);

  return {
    id: String(item.id ?? item.clientUuid ?? createClientUuid('meal')),
    serverId: item.id ?? null,
    clientUuid: item.clientUuid || null,
    mealName,
    name: mealName,
    mealType: item.mealType || 'meal',
    description: mealName,
    carbsEstimate: carbs,
    carbs,
    caloriesEstimate: item.calories ?? item.caloriesEstimate ?? null,
    calories: item.calories ?? item.caloriesEstimate ?? null,
    notes: item.notes ?? item.note ?? '',
    note: item.note ?? item.notes ?? '',
    loggedAt,
    time: formatTime(loggedAt),
    createdAt: item.createdAt || loggedAt,
    updatedAt: item.updatedAt || item.createdAt || loggedAt,
    syncStatus: 'synced',
  };
}

function mealToApi(input = {}) {
  const loggedAt = asIso(input.loggedAt || input.createdAt);
  const description = input.description || input.mealName || input.name || 'Meal';
  const clientUuid = input.clientUuid || (!isNumericId(input.id) ? input.id : null) || createClientUuid('meal');

  return {
    clientUuid,
    mealType: input.mealType || 'meal',
    description,
    carbsGrams: Number(input.carbsGrams ?? input.carbsEstimate ?? input.carbs ?? 0),
    calories: input.calories ?? input.caloriesEstimate ?? null,
    notes: input.notes ?? input.note ?? '',
    loggedAt,
  };
}

function normalizeUserPreferences(user, current = {}) {
  if (!user) return current;

  return {
    ...current,
    name: user.name || current.name,
    phone: user.phone ?? current.phone ?? '',
    diabetesType: user.diabetesType || current.diabetesType || 'type_1',
  };
}

async function updatePreferencesFromUser(user) {
  const current = await zukariStorage.getPreferences();
  return zukariStorage.updatePreferences(normalizeUserPreferences(user, current));
}

async function getAuthSession() {
  try {
    const session = await apiAuth.getCurrentUser();

    if (session?.user) {
      await updatePreferencesFromUser(session.user);
      return session;
    }
  } catch (error) {
    console.warn('Zukari API session refresh failed; using cached/offline session if available.', error);
  }

  const cachedApiSession = apiAuth.getCachedSession?.();
  if (cachedApiSession?.user) {
    return cachedApiSession;
  }

  return zukariStorage.getAuthSession();
}

async function loginUser(credentials) {
  const session = await apiAuth.loginUser(credentials);
  await updatePreferencesFromUser(session.user);
  await syncLocalUnsyncedToCloud();
  return session;
}

async function registerUser(payload) {
  const session = await apiAuth.registerUser(payload);
  await updatePreferencesFromUser(session.user);
  await syncLocalUnsyncedToCloud();
  return session;
}

async function logoutUser() {
  apiAuth.logoutUser();
  await zukariStorage.logoutUser();
}

async function updateCurrentUser(partial = {}) {
  try {
    const response = await apiHealth.request('/me', { method: 'PATCH', body: partial });
    const user = response.user || response.item || response.data?.user || null;

    if (user) {
      await updatePreferencesFromUser(user);
      return user;
    }
  } catch (error) {
    console.warn('Could not update API profile; saving profile locally.', error);
  }

  return zukariStorage.updateCurrentUser(partial);
}

async function getAllData() {
  const local = await zukariStorage.getAllData();
  const session = await getAuthSession();

  if (!session?.token) {
    return local;
  }

  try {
    await syncLocalUnsyncedToCloud();

    const [glucoseResponse, insulinResponse, foodResponse] = await Promise.all([
      apiHealth.listGlucose({ limit: 500 }),
      apiHealth.listInsulin({ limit: 500 }),
      apiHealth.listFood({ limit: 500 }),
    ]);

    const glucoseLogs = sortByLoggedAtAsc((glucoseResponse.items || []).map(glucoseFromApi));
    const insulinLogs = sortByLoggedAtAsc((insulinResponse.items || []).map(insulinFromApi));
    const mealLogs = sortByLoggedAtAsc((foodResponse.items || []).map(mealFromApi));

    await Promise.all([
      setCache(CACHE_KEYS.glucoseLogs, glucoseLogs),
      setCache(CACHE_KEYS.insulinLogs, insulinLogs),
      setCache(CACHE_KEYS.mealLogs, mealLogs),
    ]);

    return {
      ...local,
      glucoseLogs,
      insulinLogs,
      mealLogs,
      // Activity is still local until we add Health Connect / activity API.
      activityLogs: local.activityLogs,
    };
  } catch (error) {
    console.warn('Could not load API health logs; using local cached diary.', error);
    return local;
  }
}

async function cacheUpsert(key, item) {
  await patchCachedList(key, (items) => {
    const id = String(item.id);
    const filtered = items.filter((existing) => String(existing.id) !== id && String(existing.serverId || '') !== id);
    return sortByLoggedAtAsc([...filtered, item]);
  });

  return item;
}

async function addGlucoseLog(input) {
  const payload = glucoseToApi(input);

  try {
    const response = await apiHealth.createGlucose(payload);
    const saved = glucoseFromApi(response.item || response.data || response);
    return cacheUpsert(CACHE_KEYS.glucoseLogs, saved);
  } catch (error) {
    console.warn('Glucose API save failed; saving locally for later sync.', error);
    return zukariStorage.addGlucoseLog({ ...input, clientUuid: payload.clientUuid, syncStatus: 'unsynced' });
  }
}

async function updateGlucoseLog(id, partial) {
  if (!isNumericId(id)) {
    return zukariStorage.updateGlucoseLog(id, partial);
  }

  try {
    const response = await apiHealth.updateGlucose(id, glucoseToApi({ ...partial, id }));
    const saved = glucoseFromApi(response.item || response.data || response);
    return cacheUpsert(CACHE_KEYS.glucoseLogs, saved);
  } catch (error) {
    console.warn('Glucose API update failed; saving change locally.', error);
    return zukariStorage.updateGlucoseLog(String(id), partial);
  }
}

async function deleteGlucoseLog(id) {
  if (isNumericId(id)) {
    await apiHealth.deleteGlucose(id);
  } else {
    await zukariStorage.deleteGlucoseLog(id);
  }

  await patchCachedList(CACHE_KEYS.glucoseLogs, (items) => items.filter((item) => String(item.id) !== String(id)));
  return true;
}

async function addInsulinLog(input) {
  const payload = insulinToApi(input);

  try {
    const response = await apiHealth.createInsulin(payload);
    const saved = insulinFromApi(response.item || response.data || response);
    return cacheUpsert(CACHE_KEYS.insulinLogs, saved);
  } catch (error) {
    console.warn('Insulin API save failed; saving locally for later sync.', error);
    return zukariStorage.addInsulinLog({ ...input, clientUuid: payload.clientUuid, syncStatus: 'unsynced' });
  }
}

async function updateInsulinLog(id, partial) {
  if (!isNumericId(id)) {
    return zukariStorage.updateInsulinLog(id, partial);
  }

  try {
    const response = await apiHealth.updateInsulin(id, insulinToApi({ ...partial, id }));
    const saved = insulinFromApi(response.item || response.data || response);
    return cacheUpsert(CACHE_KEYS.insulinLogs, saved);
  } catch (error) {
    console.warn('Insulin API update failed; saving change locally.', error);
    return zukariStorage.updateInsulinLog(String(id), partial);
  }
}

async function deleteInsulinLog(id) {
  if (isNumericId(id)) {
    await apiHealth.deleteInsulin(id);
  } else {
    await zukariStorage.deleteInsulinLog(id);
  }

  await patchCachedList(CACHE_KEYS.insulinLogs, (items) => items.filter((item) => String(item.id) !== String(id)));
  return true;
}

async function addMealLog(input) {
  const payload = mealToApi(input);

  try {
    const response = await apiHealth.createFood(payload);
    const saved = mealFromApi(response.item || response.data || response);
    return cacheUpsert(CACHE_KEYS.mealLogs, saved);
  } catch (error) {
    console.warn('Food API save failed; saving locally for later sync.', error);
    return zukariStorage.addMealLog({ ...input, clientUuid: payload.clientUuid, syncStatus: 'unsynced' });
  }
}

async function updateMealLog(id, partial) {
  if (!isNumericId(id)) {
    return zukariStorage.updateMealLog(id, partial);
  }

  try {
    const response = await apiHealth.updateFood(id, mealToApi({ ...partial, id }));
    const saved = mealFromApi(response.item || response.data || response);
    return cacheUpsert(CACHE_KEYS.mealLogs, saved);
  } catch (error) {
    console.warn('Food API update failed; saving change locally.', error);
    return zukariStorage.updateMealLog(String(id), partial);
  }
}

async function deleteMealLog(id) {
  if (isNumericId(id)) {
    await apiHealth.deleteFood(id);
  } else {
    await zukariStorage.deleteMealLog(id);
  }

  await patchCachedList(CACHE_KEYS.mealLogs, (items) => items.filter((item) => String(item.id) !== String(id)));
  return true;
}

async function bulkImportGlucoseLogs(inputs = []) {
  const items = inputs.map(glucoseToApi);

  try {
    await apiHealth.importGlucose(items, 'mobile_import');
    const imported = inputs.map((input, index) => glucoseFromApi({ ...items[index], ...input, clientUuid: items[index].clientUuid }));
    await patchCachedList(CACHE_KEYS.glucoseLogs, (current) => sortByLoggedAtAsc([...current, ...imported]));
    return imported;
  } catch (error) {
    console.warn('Glucose import API failed; importing locally.', error);
    return zukariStorage.bulkImportGlucoseLogs(inputs);
  }
}

async function bulkImportInsulinLogs(inputs = []) {
  const items = inputs.map(insulinToApi);

  try {
    await apiHealth.importInsulin(items, 'mobile_import');
    const imported = inputs.map((input, index) => insulinFromApi({ ...items[index], ...input, clientUuid: items[index].clientUuid }));
    await patchCachedList(CACHE_KEYS.insulinLogs, (current) => sortByLoggedAtAsc([...current, ...imported]));
    return imported;
  } catch (error) {
    console.warn('Insulin import API failed; importing locally.', error);
    return zukariStorage.bulkImportInsulinLogs(inputs);
  }
}

async function syncLocalUnsyncedToCloud() {
  const session = apiAuth.getCachedSession?.();

  if (!session?.token) {
    return { status: 'skipped', message: 'No API session.' };
  }

  const unsynced = await zukariStorage.getUnsyncedData();
  const glucoseLogs = (unsynced.glucoseLogs || []).map(glucoseToApi);
  const insulinLogs = (unsynced.insulinLogs || []).map(insulinToApi);
  const foodLogs = (unsynced.mealLogs || []).map(mealToApi);

  if (!glucoseLogs.length && !insulinLogs.length && !foodLogs.length) {
    return { status: 'ok', synced: 0 };
  }

  try {
    const result = await apiHealth.syncImport({
      source: 'mobile_sync',
      glucoseLogs,
      insulinLogs,
      foodLogs,
    });

    // Refresh from API after sync so local cache matches server IDs.
    await getAllData();
    return result;
  } catch (error) {
    console.warn('Local-to-cloud sync failed. Records remain locally unsynced.', error);
    return { status: 'fail', message: error?.message || 'Sync failed.' };
  }
}

export const zukariCloudStore = {
  getAllData,
  getAuthSession,
  registerUser,
  loginUser,
  logoutUser,
  updateCurrentUser,

  addGlucoseLog,
  updateGlucoseLog,
  deleteGlucoseLog,
  bulkImportGlucoseLogs,

  addInsulinLog,
  updateInsulinLog,
  deleteInsulinLog,
  bulkImportInsulinLogs,

  addMealLog,
  updateMealLog,
  deleteMealLog,

  // Activity stays local until we add Health Connect/activity API tables.
  addActivityLog: zukariStorage.addActivityLog,
  updateActivityLog: zukariStorage.updateActivityLog,
  deleteActivityLog: zukariStorage.deleteActivityLog,

  getPreferences: zukariStorage.getPreferences,
  updatePreferences: zukariStorage.updatePreferences,
  migrateLegacyWelcomeFlag: zukariStorage.migrateLegacyWelcomeFlag,
  getUnsyncedData: zukariStorage.getUnsyncedData,
  clearAllLocalData: zukariStorage.clearAllLocalData,
  syncLocalUnsyncedToCloud,
};
