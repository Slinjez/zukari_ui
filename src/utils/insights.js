import { AMBER, BLUE, BRAND, GREEN, RED } from '../constants/theme';
import { dayKey, formatShortDate, getLogDate } from './logFilters';
import { projectedHbA1c } from './statsHelpers';

function toValue(item, ...keys) {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function daysAgo(count) {
  const date = new Date();
  date.setDate(date.getDate() - count);
  date.setHours(0, 0, 0, 0);
  return date;
}

function withinDays(items = [], count = 7) {
  const from = daysAgo(count - 1);
  const now = new Date();

  return items.filter((item) => {
    const date = getLogDate(item);
    return date && date >= from && date <= now;
  });
}

function average(values = []) {
  const clean = values.map(Number).filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function bucketName(date) {
  const hour = date.getHours();
  if (hour < 5) return 'late night';
  if (hour < 11) return 'morning';
  if (hour < 16) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function groupByDay(days = 7) {
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    date.setHours(12, 0, 0, 0);

    return {
      key: dayKey(date),
      label: formatShortDate(date),
    };
  });
}

export function buildDailyGlucoseTrend(glucose = [], days = 7) {
  return groupByDay(days).map((day) => {
    const values = glucose
      .filter((item) => {
        const date = getLogDate(item);
        return date && dayKey(date) === day.key;
      })
      .map((item) => toValue(item, 'val', 'value'))
      .filter((value) => value > 0);

    return {
      ...day,
      value: values.length ? Number(average(values).toFixed(1)) : 0,
    };
  });
}

export function buildActivityTrend(exercises = [], days = 7) {
  return groupByDay(days).map((day) => {
    const minutes = exercises
      .filter((item) => {
        const date = getLogDate(item);
        return date && dayKey(date) === day.key;
      })
      .reduce((sum, item) => sum + toValue(item, 'duration', 'durationMinutes'), 0);

    return {
      ...day,
      value: Math.round(minutes),
    };
  });
}

export function buildCarbsGlucoseComparison({ glucose = [], meals = [] }) {
  return groupByDay(7).map((day) => {
    const mealCarbs = meals
      .filter((item) => {
        const date = getLogDate(item);
        return date && dayKey(date) === day.key;
      })
      .reduce((sum, item) => sum + toValue(item, 'carbs', 'carbsEstimate'), 0);

    const glucoseValues = glucose
      .filter((item) => {
        const date = getLogDate(item);
        return date && dayKey(date) === day.key;
      })
      .map((item) => toValue(item, 'val', 'value'))
      .filter((value) => value > 0);

    return {
      label: day.label,
      left: Math.round(mealCarbs),
      right: glucoseValues.length ? Number(average(glucoseValues).toFixed(1)) : 0,
    };
  }).filter((item) => item.left > 0 || item.right > 0);
}

export function countRangeBuckets(glucose = [], preferences = {}) {
  const targetMin = Number(preferences.targetMin ?? 3.9);
  const targetMax = Number(preferences.targetMax ?? 10);
  const safeMin = Number.isFinite(targetMin) ? targetMin : 3.9;
  const safeMax = Number.isFinite(targetMax) && targetMax > safeMin ? targetMax : 10;

  return glucose.reduce(
    (acc, item) => {
      const value = toValue(item, 'val', 'value');
      if (value <= 0) return acc;
      if (value < safeMin) acc.low += 1;
      else if (value > safeMax) acc.high += 1;
      else acc.range += 1;
      return acc;
    },
    { low: 0, range: 0, high: 0 }
  );
}

export function generateLocalInsights({ glucose = [], insulin = [], meals = [], exercises = [], preferences = {} }) {
  const unit = preferences.glucoseUnit || 'mmol/L';
  const targetMin = Number(preferences.targetMin ?? 3.9);
  const targetMax = Number(preferences.targetMax ?? 10);
  const weekGlucose = withinDays(glucose, 7);
  const weekMeals = withinDays(meals, 7);
  const weekInsulin = withinDays(insulin, 7);
  const weekExercises = withinDays(exercises, 7);
  const values = weekGlucose.map((item) => toValue(item, 'val', 'value')).filter((value) => value > 0);
  const insights = [];

  if (!values.length) {
    return [
      {
        tone: BRAND,
        title: 'Start logging to unlock insights',
        body: 'Add a few glucose readings and Zukari will start spotting patterns. Currently the detective has no crime scene.',
      },
    ];
  }

  const avg = average(values);
  const buckets = countRangeBuckets(weekGlucose, preferences);
  const tir = Math.round((buckets.range / values.length) * 100);
  const hba1c = projectedHbA1c(avg);

  insights.push({
    tone: tir >= 70 ? GREEN : AMBER,
    title: `This week you are ${tir}% in range`,
    body: `${buckets.range} of ${values.length} readings landed between ${targetMin}–${targetMax} ${unit}. ${tir >= 70 ? 'Solid work. The sugar committee is impressed.' : 'Not bad, but the sugar committee wants minutes from this meeting.'}`,
  });

  insights.push({
    tone: BRAND,
    title: `Average glucose is ${avg.toFixed(1)} ${unit}`,
    body: hba1c ? `Projected HbA1c from available logs is about ${hba1c}%. This is an estimate, not a lab result.` : 'Add more readings to improve the estimate.',
  });

  if (buckets.high > 0) {
    const bucketCounts = weekGlucose.reduce((acc, item) => {
      const value = toValue(item, 'val', 'value');
      const date = getLogDate(item);
      if (!date || value <= targetMax) return acc;
      const label = bucketName(date);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const topHighTime = Object.entries(bucketCounts).sort((a, b) => b[1] - a[1])[0];

    insights.push({
      tone: AMBER,
      title: 'High pattern spotted',
      body: topHighTime
        ? `Most highs this week happened around ${topHighTime[0]}. Worth watching that window and discussing patterns with your clinician.`
        : `You had ${buckets.high} high reading${buckets.high === 1 ? '' : 's'} this week. Zukari has raised one eyebrow.`,
    });
  }

  if (buckets.low > 0) {
    insights.push({
      tone: RED,
      title: 'Low readings need attention',
      body: `You logged ${buckets.low} low event${buckets.low === 1 ? '' : 's'} this week. Treat lows according to your care plan and mention repeated lows to your clinician.`,
    });
  }

  const fasting = weekGlucose
    .filter((item) => String(item.note || item.notes || item.context || '').toLowerCase().includes('fast'))
    .map((item) => toValue(item, 'val', 'value'))
    .filter((value) => value > 0);

  if (fasting.length >= 4) {
    const recent = average(fasting.slice(-3));
    const previous = average(fasting.slice(0, -3));

    if (previous > 0 && recent > previous + 0.5) {
      insights.push({
        tone: AMBER,
        title: 'Fasting readings are trending higher',
        body: `Recent fasting average is ${recent.toFixed(1)} ${unit}, up from ${previous.toFixed(1)} ${unit}. Dawn phenomenon may be worth discussing with your clinician.`,
      });
    }
  }

  if (weekMeals.length > weekInsulin.length + 1) {
    insights.push({
      tone: BLUE,
      title: 'Meal and insulin logs look uneven',
      body: `You logged ${weekMeals.length} meal${weekMeals.length === 1 ? '' : 's'} and ${weekInsulin.length} insulin dose${weekInsulin.length === 1 ? '' : 's'} this week. Maybe some doses were missed in the diary, not necessarily in real life.`,
    });
  }

  const activeMinutes = weekExercises.reduce((sum, item) => sum + toValue(item, 'duration', 'durationMinutes'), 0);

  if (activeMinutes > 0) {
    insights.push({
      tone: BLUE,
      title: `${Math.round(activeMinutes)} active minutes logged`,
      body: activeMinutes >= 150
        ? 'Strong movement week. The activity department approves this memo.'
        : 'Movement is logged. The body saw the effort, even if the couch is filing a complaint.',
    });
  }

  return insights.slice(0, 6);
}
