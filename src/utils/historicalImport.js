function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function looksLikeHeader(cells) {
  const joined = cells.map(normalizeHeader).join('|');
  return /date/.test(joined) && (/glucose|reading|value/.test(joined) || /context|note/.test(joined));
}

function pick(row, keys, fallback = '') {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }

  return fallback;
}

function parseNumber(value) {
  const cleaned = String(value || '').replace(/[^\d.,-]/g, '').replace(',', '.');
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  const number = match ? Number.parseFloat(match[0]) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function parseDateParts(dateValue) {
  const raw = String(dateValue || '').trim();

  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    return {
      year: Number(match[3]),
      month: Number(match[2]),
      day: Number(match[1]),
    };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
    };
  }

  return null;
}

function parseTimeParts(timeValue) {
  const raw = String(timeValue || '').trim().toLowerCase();
  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);

  if (!match) {
    return { hour: 12, minute: 0 };
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const suffix = match[3];

  if (suffix === 'pm' && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 12, minute: 0 };
  }

  return { hour, minute };
}

function buildLoggedAt(dateValue, timeValue) {
  const dateParts = parseDateParts(dateValue);
  if (!dateParts) return null;

  const timeParts = parseTimeParts(timeValue);
  const date = new Date(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    0,
    0
  );

  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseInsulinText(text, loggedAt, baseNote) {
  const raw = String(text || '').trim();
  if (!raw) return [];

  const logs = [];
  const chunks = raw.split(/[;|]+/).map((item) => item.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const units = parseNumber(chunk);
    if (!units || units <= 0) continue;

    const type = chunk
      .replace(/\b\d+(?:\.\d+)?\s*(u|unit|units)?\b/gi, '')
      .replace(/[:®()]/g, '')
      .trim() || 'Insulin';

    logs.push({
      insulinType: type,
      units,
      notes: baseNote,
      loggedAt,
      createdAt: loggedAt,
      updatedAt: loggedAt,
    });
  }

  return logs;
}

function rowFromCells(cells, headers) {
  if (headers?.length) {
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] ?? '';
      return row;
    }, {});
  }

  return {
    date: cells[0] ?? '',
    time: cells[1] ?? '',
    context: cells[2] ?? '',
    glucose: cells[3] ?? '',
    insulin_type: cells[4] ?? '',
    insulin_units: cells[5] ?? '',
    second_insulin_type: cells[6] ?? '',
    second_insulin_units: cells[7] ?? '',
    note: cells.slice(8).join(', '),
  };
}

export const HISTORICAL_IMPORT_SAMPLE = `date,time,context,glucose,insulin\n2026-05-24,10:52,Fasting glucose,16.6,NovoRapid 12u\n2026-05-24,12:59,Lunch,12.4,NovoRapid 10u\n2026-05-24,15:13,Other,5.4,\n2026-05-24,17:59,Before dinner,9.1,NovoRapid 15u; Lantus 20u`;

export const SCREENSHOT_IMPORT_DATA = `date,time,context,glucose,insulin\n2026-05-24,10:52,Fasting glucose,16.6,NovoRapid 12u\n2026-05-24,12:59,Lunch,12.4,NovoRapid 10u\n2026-05-24,15:13,Other,5.4,\n2026-05-24,17:59,Before dinner,9.1,NovoRapid 15u; Lantus 20u\n2026-05-25,07:48,Before breakfast,11.4,NovoRapid 15u\n2026-05-25,12:24,Lunch,11.5,NovoRapid 15u\n2026-05-25,23:27,Before bed,9.5,\n2026-05-26,08:42,Breakfast,10.3,NovoRapid 10u\n2026-05-26,14:01,After lunch,5.5,NovoRapid 10u\n2026-05-26,21:36,Before bed,8.7,NovoRapid 12u; Lantus 20u\n2026-05-27,12:47,Lunch,7.7,NovoRapid 12u\n2026-05-27,19:30,After dinner,5.2,NovoRapid 15u; Lantus 20u\n2026-05-28,05:31,Night,9.4,Lantus 15u\n2026-05-29,08:30,Breakfast,4.0,NovoRapid 10u\n2026-05-29,12:45,Lunch,7.1,NovoRapid 8u\n2026-05-31,13:21,After lunch,8.7,NovoRapid 10u\n2026-06-01,10:02,After breakfast,8.9,\n2026-06-02,11:03,Before lunch,8.7,\n2026-06-03,09:35,After breakfast,10.2,\n2026-06-04,01:34,Night,5.9,\n2026-06-05,14:09,After lunch,8.3,\n2026-06-06,15:11,Other,6.7,\n2026-06-08,08:58,After breakfast,11.4,\n2026-06-10,12:34,Lunch,6.9,NovoRapid 5u`;

export function parseHistoricalImport(text, preferences = {}) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const result = {
    glucoseLogs: [],
    insulinLogs: [],
    errors: [],
    skipped: 0,
  };

  if (!lines.length) {
    result.errors.push('Paste at least one CSV row. Zukari cannot import vibes alone.');
    return result;
  }

  let headers = null;
  let startIndex = 0;
  const firstCells = splitCsvLine(lines[0]);

  if (looksLikeHeader(firstCells)) {
    headers = firstCells.map(normalizeHeader);
    startIndex = 1;
  }

  for (let index = startIndex; index < lines.length; index += 1) {
    const cells = splitCsvLine(lines[index]);
    const row = rowFromCells(cells, headers);
    const displayLine = index + 1;

    const date = pick(row, ['date', 'reading_date', 'logged_date', 'day']);
    const time = pick(row, ['time', 'reading_time', 'logged_time', 'hour']);
    const context = pick(row, ['context', 'meal', 'event', 'note', 'notes', 'category'], 'Manual');
    const note = pick(row, ['note', 'notes', 'comment', 'comments'], context || 'Historical import');
    const glucoseValue = parseNumber(pick(row, ['glucose', 'reading', 'value', 'glucose_mmol_l', 'mmol_l', 'blood_sugar']));
    const loggedAt = buildLoggedAt(date, time);

    if (!loggedAt) {
      result.errors.push(`Line ${displayLine}: date/time could not be understood.`);
      result.skipped += 1;
      continue;
    }

    if (!glucoseValue || glucoseValue <= 0) {
      result.errors.push(`Line ${displayLine}: glucose reading is missing or invalid.`);
      result.skipped += 1;
      continue;
    }

    result.glucoseLogs.push({
      value: glucoseValue,
      val: glucoseValue,
      unit: preferences?.glucoseUnit || 'mmol/L',
      context,
      notes: note || context || 'Historical import',
      note: context || note || 'Historical import',
      loggedAt,
      createdAt: loggedAt,
      updatedAt: loggedAt,
    });

    const insulinText = pick(row, ['insulin', 'insulin_logs', 'dose', 'doses']);
    result.insulinLogs.push(...parseInsulinText(insulinText, loggedAt, context || note || 'Historical import'));

    const compactInsulinText = pick(row, ['insulin_type', 'type']);
    if (compactInsulinText && /\d/.test(compactInsulinText)) {
      result.insulinLogs.push(...parseInsulinText(compactInsulinText, loggedAt, context || note || 'Historical import'));
    }

    const insulinType = pick(row, ['insulin_type', 'type']);
    const insulinUnits = parseNumber(pick(row, ['insulin_units', 'units']));
    if (insulinType && insulinUnits && insulinUnits > 0) {
      result.insulinLogs.push({
        insulinType,
        units: insulinUnits,
        notes: context || note || 'Historical import',
        loggedAt,
        createdAt: loggedAt,
        updatedAt: loggedAt,
      });
    }

    const secondInsulinType = pick(row, ['second_insulin_type', 'basal_type']);
    const secondInsulinUnits = parseNumber(pick(row, ['second_insulin_units', 'basal_units']));
    if (secondInsulinType && secondInsulinUnits && secondInsulinUnits > 0) {
      result.insulinLogs.push({
        insulinType: secondInsulinType,
        units: secondInsulinUnits,
        notes: context || note || 'Historical import',
        loggedAt,
        createdAt: loggedAt,
        updatedAt: loggedAt,
      });
    }
  }

  return result;
}
