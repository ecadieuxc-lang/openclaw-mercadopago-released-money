const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function periodIdFromAnchor(anchorDate) {
  const date = new Date(anchorDate);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('anchorDate must be a valid date');
    error.code = 'INVALID_ANCHOR_DATE';
    throw error;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function periodLabelFromAnchor(anchorDate, locale = 'es-CL') {
  const date = new Date(anchorDate);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('anchorDate must be a valid date');
    error.code = 'INVALID_ANCHOR_DATE';
    throw error;
  }
  if (locale === 'es-CL') {
    return `${MONTH_NAMES_ES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
