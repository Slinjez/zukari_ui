export const HISTORY_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All' },
];

export function getLogDate(log = {}) {
  const raw = log.loggedAt || log.createdAt || log.updatedAt || log.time;
  const parsed = raw ? new Date(raw) : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function toDateTimeLocalValue(value = new Date()) {
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return toDateTimeLocalValue(new Date());
  }

  const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function dateTimeLocalToIso(value) {
  const parsed = value ? new Date(value) : new Date();

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

export function formatLoggedAt(logOrDate) {
  const parsed = logOrDate instanceof Date ? logOrDate : getLogDate(logOrDate);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return 'Just now';
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(date) {
  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString([], { month: 'short', day: '2-digit' });
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function filterLogs(logs = [], filter = 'today') {
  const list = Array.isArray(logs) ? logs : [];

  if (filter === 'all') {
    return list;
  }

  const now = new Date();
  let from = startOfToday();

  if (filter === '7d') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  }

  if (filter === '30d') {
    from = new Date(now);
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  }

  return list.filter((item) => {
    const loggedAt = getLogDate(item);
    return loggedAt && loggedAt >= from && loggedAt <= now;
  });
}

export function sortLogsDesc(logs = []) {
  return [...logs].sort((a, b) => {
    const left = getLogDate(a)?.getTime() ?? 0;
    const right = getLogDate(b)?.getTime() ?? 0;
    return right - left;
  });
}

export function dayKey(date) {
  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'unknown';
  }

  return parsed.toISOString().slice(0, 10);
}
