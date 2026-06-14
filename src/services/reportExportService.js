import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { countRangeBuckets, generateLocalInsights } from '../utils/insights';
import { getLogDate } from '../utils/logFilters';
import { projectedHbA1c } from '../utils/statsHelpers';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugDate() {
  return new Date().toISOString().slice(0, 10);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeRange(range = {}) {
  const mode = range?.mode || range || '7d';
  const now = new Date();
  const todayStart = startOfToday();
  let from = addDays(todayStart, -6);
  let to = now;
  let label = 'Last 7 days';

  if (mode === '30d') {
    from = addDays(todayStart, -29);
    label = 'Last 30 days';
  }

  if (mode === '90d') {
    from = addDays(todayStart, -89);
    label = 'Last 90 days';
  }

  if (mode === 'all') {
    return {
      mode,
      from: null,
      to: null,
      label: 'All logged data',
    };
  }

  if (mode === 'custom') {
    const parsedFrom = range?.startDate ? new Date(`${range.startDate}T00:00:00`) : null;
    const parsedTo = range?.endDate ? new Date(`${range.endDate}T23:59:59`) : null;

    from = parsedFrom && !Number.isNaN(parsedFrom.getTime()) ? parsedFrom : todayStart;
    to = parsedTo && !Number.isNaN(parsedTo.getTime()) ? parsedTo : endOfToday();

    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }

    label = `${formatDateOnly(from)} to ${formatDateOnly(to)}`;
  }

  return { mode, from, to, label };
}

function filterByRange(items = [], range = {}) {
  const selected = normalizeRange(range);
  const list = Array.isArray(items) ? items : [];

  if (!selected.from || !selected.to) {
    return list;
  }

  return list.filter((item) => {
    const date = getLogDate(item);
    return date && date >= selected.from && date <= selected.to;
  });
}

function average(values = []) {
  const clean = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function formatDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getReadingValue(item) {
  return toNumber(item?.val ?? item?.value);
}

function getInsulinValue(item) {
  return toNumber(item?.dose ?? item?.units);
}

function getMealCarbs(item) {
  return toNumber(item?.carbs ?? item?.carbsEstimate);
}

function getActivityMinutes(item) {
  return toNumber(item?.duration ?? item?.durationMinutes);
}

function sortedByLoggedAt(items = []) {
  return [...items].sort((a, b) => {
    const left = getLogDate(a)?.getTime() ?? 0;
    const right = getLogDate(b)?.getTime() ?? 0;
    return left - right;
  });
}

function getReportModel({ glucose = [], insulin = [], meals = [], exercises = [], stats = {}, preferences = {} }, options = {}) {
  const range = normalizeRange(options.range || { mode: '7d' });
  const unit = preferences?.glucoseUnit || 'mmol/L';
  const targetMin = toNumber(preferences?.targetMin, 3.9);
  const targetMax = toNumber(preferences?.targetMax, 10);
  const reportGlucose = sortedByLoggedAt(filterByRange(glucose, range));
  const reportInsulin = sortedByLoggedAt(filterByRange(insulin, range));
  const reportMeals = sortedByLoggedAt(filterByRange(meals, range));
  const reportExercises = sortedByLoggedAt(filterByRange(exercises, range));
  const values = reportGlucose.map(getReadingValue).filter((value) => value > 0);
  const buckets = countRangeBuckets(reportGlucose, preferences);
  const total = buckets.low + buckets.range + buckets.high;
  const tir = total ? Math.round((buckets.range / total) * 100) : 0;
  const highEvents = reportGlucose.filter((item) => getReadingValue(item) > targetMax);
  const lowEvents = reportGlucose.filter((item) => {
    const value = getReadingValue(item);
    return value > 0 && value < targetMin;
  });
  const averageGlucose = average(values);

  return {
    generatedAt: new Date(),
    range,
    patientName: preferences?.name || 'Zukari user',
    phone: preferences?.phone || '',
    diabetesType: preferences?.diabetesType || 'not set',
    unit,
    targetMin,
    targetMax,
    averageGlucose,
    projectedHba1c: averageGlucose ? projectedHbA1c(averageGlucose) : null,
    tir,
    lowEvents,
    highEvents,
    buckets,
    glucose: reportGlucose,
    insulin: reportInsulin,
    meals: reportMeals,
    exercises: reportExercises,
    totalInsulin: reportInsulin.reduce((sum, item) => sum + getInsulinValue(item), 0),
    totalCarbs: reportMeals.reduce((sum, item) => sum + getMealCarbs(item), 0),
    totalActivity: reportExercises.reduce((sum, item) => sum + getActivityMinutes(item), 0),
    stats,
    insights: generateLocalInsights({ glucose: reportGlucose, insulin: reportInsulin, meals: reportMeals, exercises: reportExercises, preferences }),
  };
}

function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  const sliceSize = 512;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

function browserDownload(filename, data, mimeType, isBase64 = false) {
  const blob = isBase64 ? base64ToBlob(data, mimeType) : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function saveAndShareFile({ filename, data, mimeType, title, text, isBase64 = false }) {
  const base64Data = isBase64 ? data : textToBase64(data);

  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: `zukari/${filename}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    await Share.share({
      title,
      text,
      url: result.uri,
      dialogTitle: title,
    });

    return {
      ok: true,
      uri: result.uri,
      shared: true,
      message: `${filename} saved and share sheet opened.`,
    };
  }

  browserDownload(filename, data, mimeType, isBase64);

  return {
    ok: true,
    shared: false,
    message: `${filename} downloaded. On mobile, the native share sheet will open.`,
  };
}

function safeAutoTable(doc, options) {
  if (typeof autoTable === 'function') {
    autoTable(doc, options);
    return;
  }

  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  }
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120, 105, 92);
    doc.text('Zukari report. Not a medical prescription. Developed by THIGA LABS.', 14, 286);
    doc.text(`Page ${page} of ${pageCount}`, 180, 286, { align: 'right' });
  }
}

function addSectionTitle(doc, title, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(43, 22, 9);
  doc.text(title, 14, y);
  return y + 6;
}

function getLastAutoTableY(doc, fallback) {
  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : fallback;
}

function buildPdf(model) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const brand = [134, 96, 0];
  const dark = [43, 22, 9];
  const muted = [127, 107, 91];

  doc.setFillColor(...brand);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Zukari Doctor Summary', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated ${formatDateTime(model.generatedAt)} · ${model.range.label}`, 14, 24);

  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Patient details', 14, 44);

  safeAutoTable(doc, {
    startY: 48,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5, textColor: dark },
    body: [
      ['Name', model.patientName, 'Diabetes type', model.diabetesType],
      ['Phone', model.phone || 'Not set', 'Target range', `${model.targetMin}-${model.targetMax} ${model.unit}`],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', textColor: muted },
      2: { fontStyle: 'bold', textColor: muted },
    },
  });

  let y = getLastAutoTableY(doc, 62);

  safeAutoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Metric', 'Value'], ['Metric', 'Value']],
    body: [
      ['Average glucose', model.averageGlucose ? `${model.averageGlucose.toFixed(1)} ${model.unit}` : '--', 'Time in range', `${model.tir}%`],
      ['Projected HbA1c', model.projectedHba1c ? `${model.projectedHba1c}%` : '--', 'Readings', String(model.glucose.length)],
      ['Low events', String(model.lowEvents.length), 'High events', String(model.highEvents.length)],
      ['Total insulin', `${model.totalInsulin.toFixed(1)} units`, 'Total carbs', `${Math.round(model.totalCarbs)} g`],
      ['Activity', `${Math.round(model.totalActivity)} min`, 'Report period', model.range.label],
    ],
    styles: { fontSize: 9, cellPadding: 2.2 },
    headStyles: { fillColor: brand, textColor: [255, 255, 255] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: muted },
      2: { fontStyle: 'bold', textColor: muted },
    },
  });

  y = getLastAutoTableY(doc, 96);
  y = addSectionTitle(doc, 'Smart local insights', y);

  const insightRows = model.insights.map((item) => [item.title, item.body]);
  safeAutoTable(doc, {
    startY: y,
    head: [['Insight', 'Observation']],
    body: insightRows.length ? insightRows : [['No insights yet', 'Add more logs to unlock useful patterns.']],
    styles: { fontSize: 8.5, cellPadding: 2.2, valign: 'top' },
    headStyles: { fillColor: [245, 238, 229], textColor: dark },
    columnStyles: { 0: { cellWidth: 48, fontStyle: 'bold' }, 1: { cellWidth: 132 } },
  });

  y = getLastAutoTableY(doc, 126);
  y = addSectionTitle(doc, 'High and low events', y);

  const highLowRows = [...model.lowEvents, ...model.highEvents]
    .sort((a, b) => (getLogDate(a)?.getTime() ?? 0) - (getLogDate(b)?.getTime() ?? 0))
    .map((item) => {
      const value = getReadingValue(item);
      return [
        formatDateTime(item.loggedAt || item.createdAt),
        value < model.targetMin ? 'Low' : 'High',
        `${value.toFixed(1)} ${item.unit || model.unit}`,
        item.note || item.notes || item.context || '',
      ];
    });

  safeAutoTable(doc, {
    startY: y,
    head: [['Date/time', 'Status', 'Reading', 'Note']],
    body: highLowRows.length ? highLowRows : [['-', 'None', '-', 'No high or low events in this period.']],
    styles: { fontSize: 8.5, cellPadding: 2, valign: 'top' },
    headStyles: { fillColor: [245, 238, 229], textColor: dark },
  });

  y = getLastAutoTableY(doc, 160);
  y = addSectionTitle(doc, 'Glucose readings', y);
  safeAutoTable(doc, {
    startY: y,
    head: [['Date/time', 'Reading', 'Unit', 'Note']],
    body: model.glucose.length
      ? model.glucose.map((item) => [
          formatDateTime(item.loggedAt || item.createdAt),
          getReadingValue(item).toFixed(1),
          item.unit || model.unit,
          item.note || item.notes || item.context || '',
        ])
      : [['-', '-', model.unit, 'No glucose readings in this period.']],
    styles: { fontSize: 8, cellPadding: 1.8, valign: 'top' },
    headStyles: { fillColor: brand, textColor: [255, 255, 255] },
  });

  y = getLastAutoTableY(doc, 190);
  y = addSectionTitle(doc, 'Insulin doses', y);
  safeAutoTable(doc, {
    startY: y,
    head: [['Date/time', 'Type', 'Units', 'Note']],
    body: model.insulin.length
      ? model.insulin.map((item) => [
          formatDateTime(item.loggedAt || item.createdAt),
          item.type || item.insulinType || 'Insulin',
          getInsulinValue(item).toFixed(1),
          item.note || item.notes || '',
        ])
      : [['-', '-', '-', 'No insulin logs in this period.']],
    styles: { fontSize: 8, cellPadding: 1.8, valign: 'top' },
    headStyles: { fillColor: [245, 238, 229], textColor: dark },
  });

  y = getLastAutoTableY(doc, 220);
  y = addSectionTitle(doc, 'Meals', y);
  safeAutoTable(doc, {
    startY: y,
    head: [['Date/time', 'Meal', 'Carbs', 'Note']],
    body: model.meals.length
      ? model.meals.map((item) => [
          formatDateTime(item.loggedAt || item.createdAt),
          item.name || item.mealName || 'Meal',
          `${Math.round(getMealCarbs(item))} g`,
          item.note || item.notes || '',
        ])
      : [['-', '-', '-', 'No meal logs in this period.']],
    styles: { fontSize: 8, cellPadding: 1.8, valign: 'top' },
    headStyles: { fillColor: [245, 238, 229], textColor: dark },
  });

  y = getLastAutoTableY(doc, 246);
  y = addSectionTitle(doc, 'Activity', y);
  safeAutoTable(doc, {
    startY: y,
    head: [['Date/time', 'Activity', 'Minutes', 'Note']],
    body: model.exercises.length
      ? model.exercises.map((item) => [
          formatDateTime(item.loggedAt || item.createdAt),
          item.type || item.activityName || 'Activity',
          String(Math.round(getActivityMinutes(item))),
          item.note || item.notes || '',
        ])
      : [['-', '-', '-', 'No activity logs in this period.']],
    styles: { fontSize: 8, cellPadding: 1.8, valign: 'top' },
    headStyles: { fillColor: [245, 238, 229], textColor: dark },
  });

  addFooter(doc);
  return doc;
}

function buildCsv(model) {
  const rows = [
    ['section', 'date_time', 'name_or_type', 'value', 'unit', 'notes'],
    ...model.glucose.map((item) => [
      'glucose',
      formatDateTime(item.loggedAt || item.createdAt),
      item.context || 'reading',
      getReadingValue(item),
      item.unit || model.unit,
      item.note || item.notes || '',
    ]),
    ...model.insulin.map((item) => [
      'insulin',
      formatDateTime(item.loggedAt || item.createdAt),
      item.type || item.insulinType || 'insulin',
      getInsulinValue(item),
      'units',
      item.note || item.notes || '',
    ]),
    ...model.meals.map((item) => [
      'meal',
      formatDateTime(item.loggedAt || item.createdAt),
      item.name || item.mealName || 'meal',
      getMealCarbs(item),
      'g carbs',
      item.note || item.notes || '',
    ]),
    ...model.exercises.map((item) => [
      'activity',
      formatDateTime(item.loggedAt || item.createdAt),
      item.type || item.activityName || 'activity',
      getActivityMinutes(item),
      'minutes',
      item.note || item.notes || '',
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export async function exportDoctorSummaryPdf(data, options = {}) {
  const model = getReportModel(data, options);
  const doc = buildPdf(model);
  const filename = `zukari-doctor-summary-${slugDate()}.pdf`;
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1];

  return saveAndShareFile({
    filename,
    data: base64,
    mimeType: 'application/pdf',
    isBase64: true,
    title: 'Zukari doctor summary',
    text: `Zukari ${model.range.label} doctor summary for ${model.patientName}.`,
  });
}

export async function exportCsvFile(data, options = {}) {
  const model = getReportModel(data, options);
  const csv = buildCsv(model);
  const filename = `zukari-export-${slugDate()}.csv`;

  return saveAndShareFile({
    filename,
    data: csv,
    mimeType: 'text/csv;charset=utf-8',
    title: 'Zukari CSV export',
    text: `Zukari ${model.range.label} CSV export for ${model.patientName}.`,
  });
}

export function buildDoctorSummaryHtml(data, options = {}) {
  const model = getReportModel(data, options);
  const insightRows = model.insights
    .map((item) => `<li><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.body)}</li>`)
    .join('');

  const readingRows = model.glucose
    .map((item) => `
      <tr>
        <td>${escapeHtml(formatDateTime(item.loggedAt || item.createdAt))}</td>
        <td>${escapeHtml(getReadingValue(item).toFixed(1))}</td>
        <td>${escapeHtml(item.unit || model.unit)}</td>
        <td>${escapeHtml(item.note || item.notes || item.context || '')}</td>
      </tr>
    `)
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Zukari doctor summary</title>
  <style>
    body { font-family: Arial, sans-serif; color: #2b1609; margin: 32px; line-height: 1.45; }
    h1, h2 { margin-bottom: 6px; }
    .muted { color: #7f6b5b; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
    .card { border: 1px solid #e8d9c7; border-radius: 12px; padding: 12px; background: #fffaf5; }
    .label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #7f6b5b; }
    .value { font-size: 24px; font-weight: 900; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e8d9c7; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #f7efe7; }
    li { margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Zukari doctor summary</h1>
  <div class="muted">Generated ${escapeHtml(formatDateTime(model.generatedAt))} · ${escapeHtml(model.range.label)}</div>
  <p><strong>Patient:</strong> ${escapeHtml(model.patientName)}<br>
  <strong>Diabetes type:</strong> ${escapeHtml(model.diabetesType)}<br>
  <strong>Target range:</strong> ${escapeHtml(model.targetMin)}-${escapeHtml(model.targetMax)} ${escapeHtml(model.unit)}</p>

  <div class="cards">
    <div class="card"><div class="label">Average glucose</div><div class="value">${model.averageGlucose ? model.averageGlucose.toFixed(1) : '--'}</div></div>
    <div class="card"><div class="label">Time in range</div><div class="value">${model.tir}%</div></div>
    <div class="card"><div class="label">Low events</div><div class="value">${model.lowEvents.length}</div></div>
    <div class="card"><div class="label">High events</div><div class="value">${model.highEvents.length}</div></div>
  </div>

  <h2>Smart local insights</h2>
  <ul>${insightRows || '<li>No insights yet.</li>'}</ul>

  <h2>Glucose readings</h2>
  <table>
    <thead><tr><th>Date/time</th><th>Reading</th><th>Unit</th><th>Note</th></tr></thead>
    <tbody>${readingRows || '<tr><td colspan="4">No glucose readings in this period.</td></tr>'}</tbody>
  </table>

  <p><strong>Important:</strong> This report is not a medical prescription. Developed by THIGA LABS.</p>
</body>
</html>`;
}

export async function exportDoctorSummaryHtml(data, options = {}) {
  const html = buildDoctorSummaryHtml(data, options);
  const filename = `zukari-doctor-summary-${slugDate()}.html`;

  return saveAndShareFile({
    filename,
    data: html,
    mimeType: 'text/html;charset=utf-8',
    title: 'Zukari HTML report',
    text: 'Zukari doctor-friendly HTML report.',
  });
}

// Backward-compatible name from the earlier export build.
export async function exportWeeklyCsv(data, options = {}) {
  return exportCsvFile(data, options);
}

export const reportExportService = {
  exportDoctorSummaryPdf,
  exportCsvFile,
  exportDoctorSummaryHtml,
  exportWeeklyCsv,
  buildDoctorSummaryHtml,
};
