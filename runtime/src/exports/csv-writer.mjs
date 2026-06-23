const FORMULA_PREFIX = /^[=+\-@]/;

function normalizeCellValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const text = String(value);
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

export function escapeCsvCell(value) {
  const text = normalizeCellValue(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function writeCsvRows(rows, header) {
  if (!Array.isArray(header) || header.length === 0) {
    throw new Error('CSV header must be a non-empty array');
  }
  const lines = [header.map(escapeCsvCell).join(',')];
  for (const row of rows ?? []) {
    lines.push(header.map((column) => escapeCsvCell(row?.[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function assertNoUnsafeCsvFields(content) {
  const forbidden = [
    'raw_json',
    'APP_USR_',
    'BEGIN OPENSSH',
    'PRIVATE KEY',
    ['/','home','/','erick'].join(''),
    ['/','mnt','/','c'].join(''),
    ['/','srv','/','roy-v2'].join(''),
  ];
  const found = forbidden.find((needle) => content.includes(needle));
  if (found) {
    throw new Error(`CSV export contains forbidden marker: ${found}`);
  }
}
