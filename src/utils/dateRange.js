export const DATA_MIN_DATE = '2026-10-05';
export const DATA_MAX_DATE = '2026-10-11';

export const DEFAULT_RANGE = { start: DATA_MIN_DATE, end: DATA_MAX_DATE };

export const RANGE_PRESETS = {
  week: { ...DEFAULT_RANGE },
  weekdays: { start: DATA_MIN_DATE, end: '2026-10-09' }
};

const WORKDAYS_PER_WEEK = 5;
const DAYS_PER_WEEK = 7;

const parseDate = (value) => new Date(`${value}T00:00:00`);

export const isFullWeekRange = (range) =>
  !!range && range.start === DATA_MIN_DATE && range.end === DATA_MAX_DATE;

export const normalizeRange = (range) => {
  if (!range || !range.start || !range.end) return DEFAULT_RANGE;
  return range.start <= range.end
    ? { start: range.start, end: range.end }
    : { start: range.end, end: range.start };
};

export const isInRange = (date, range) => {
  if (!date) return false;
  const r = normalizeRange(range);
  return date >= r.start && date <= r.end;
};

export const filterByRange = (records, range, key = 'date') =>
  (records || []).filter((record) => isInRange(record[key], range));

export const daysInRange = (range) => {
  const r = normalizeRange(range);
  const ms = parseDate(r.end) - parseDate(r.start);
  return Math.floor(ms / 86400000) + 1;
};

export const isWorkday = (date) => {
  const day = parseDate(date).getDay();
  return day >= 1 && day <= 5;
};

export const workdaysInRange = (range) => {
  const r = normalizeRange(range);
  let count = 0;
  const cursor = parseDate(r.start);
  const end = parseDate(r.end);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

export const meetingLimitFactor = (range) => workdaysInRange(range) / WORKDAYS_PER_WEEK;

export const learningTargetFactor = (range) => daysInRange(range) / DAYS_PER_WEEK;

export const formatRangeLabel = (range) => {
  const r = normalizeRange(range);
  const fmt = (value) =>
    parseDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (r.start === r.end) return fmt(r.start);
  return `${fmt(r.start)} – ${fmt(r.end)}`;
};
