import { projectedHbA1c } from './statsHelpers';

export { projectedHbA1c };

function valueOf(item, ...keys) {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function logTime(item) {
  const parsed = new Date(item?.loggedAt || item?.createdAt || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByLogTime(items = []) {
  return [...items].sort((a, b) => logTime(a) - logTime(b));
}

function isToday(item) {
  const parsed = new Date(item?.loggedAt || item?.createdAt || 0);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  return parsed.getFullYear() === now.getFullYear()
    && parsed.getMonth() === now.getMonth()
    && parsed.getDate() === now.getDate();
}

export function getStats({ glucose = [], insulin = [], meals = [], exercises = [], preferences = {} }) {
  const targetMin = Number(preferences.targetMin ?? 3.9);
  const targetMax = Number(preferences.targetMax ?? 10);
  const safeMin = Number.isFinite(targetMin) && targetMin > 0 ? targetMin : 3.9;
  const safeMax = Number.isFinite(targetMax) && targetMax > safeMin ? targetMax : 10;
  const sortedGlucose = sortByLogTime(glucose);
  const latestG = sortedGlucose.length > 0 ? sortedGlucose[sortedGlucose.length - 1] : null;
  const todayMeals = meals.filter(isToday);
  const todayInsulin = insulin.filter(isToday);
  const todayExercises = exercises.filter(isToday);
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + valueOf(meal, 'carbs', 'carbsEstimate'), 0);
  const totalInsulin = todayInsulin.reduce((sum, dose) => sum + valueOf(dose, 'dose', 'units'), 0);
  const glucoseValues = glucose.map((g) => valueOf(g, 'val', 'value')).filter((value) => value > 0);
  const avgRaw = glucoseValues.length
    ? glucoseValues.reduce((sum, value) => sum + value, 0) / glucoseValues.length
    : 0;
  const avgG = glucoseValues.length ? avgRaw.toFixed(1) : '--';
  const inRange = glucoseValues.filter((value) => value >= safeMin && value <= safeMax).length;
  const tir = glucoseValues.length ? Math.round((inRange / glucoseValues.length) * 100) : 0;
  const activeMinutes = todayExercises.reduce(
    (sum, activity) => sum + valueOf(activity, 'duration', 'durationMinutes'),
    0
  );
  const novorapid = todayInsulin
    .filter((dose) => String(dose.type ?? dose.insulinType).toLowerCase().includes('novorapid'))
    .reduce((sum, dose) => sum + valueOf(dose, 'dose', 'units'), 0);
  const lantus = todayInsulin
    .filter((dose) => String(dose.type ?? dose.insulinType).toLowerCase().includes('lantus'))
    .reduce((sum, dose) => sum + valueOf(dose, 'dose', 'units'), 0);
  const low = glucoseValues.filter((value) => value < safeMin).length;
  const high = glucoseValues.filter((value) => value > safeMax).length;
  const hba1c = projectedHbA1c(avgRaw);

  return {
    latestG,
    totalCarbs,
    totalInsulin,
    avgG,
    tir,
    activeMinutes,
    novorapid,
    lantus,
    low,
    high,
    hba1c,
  };
}
