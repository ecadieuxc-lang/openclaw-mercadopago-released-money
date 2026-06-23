const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(value, fieldName = 'date') {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.code = 'INVALID_DATE';
    throw error;
  }
  return date;
}

export function addDays(value, days) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date;
}

export function addMilliseconds(value, milliseconds) {
  return new Date(parseDate(value).getTime() + Number(milliseconds));
}

export function isWeekend(value) {
  const day = parseDate(value).getUTCDay();
  return day === 0 || day === 6;
}

export function previousBusinessDay(value) {
  let date = parseDate(value);
  do {
    date = addDays(date, -1);
  } while (isWeekend(date));
  return date;
}

export function expectedSalaryDateForMonth({ year, month, expectedDay = 19, businessDayPolicy = 'previous_business_day' }) {
  const safeDay = Math.max(1, Math.min(31, Number(expectedDay)));
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, safeDay, 12, 0, 0));
  if (date.getUTCMonth() !== Number(month) - 1) {
    date.setUTCDate(0);
  }
  if (businessDayPolicy === 'previous_business_day' && isWeekend(date)) {
    return previousBusinessDay(date);
  }
  if (businessDayPolicy === 'none') {
    return date;
  }
  if (businessDayPolicy !== 'previous_business_day') {
    const error = new Error(`Unsupported business_day_policy: ${businessDayPolicy}`);
    error.code = 'UNSUPPORTED_BUSINESS_DAY_POLICY';
    throw error;
  }
  return date;
}

export { ONE_DAY_MS };
