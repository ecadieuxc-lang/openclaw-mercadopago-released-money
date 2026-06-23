import { parseCsvText } from './parse-csv.mjs';
import { validateColumns } from './validate-columns.mjs';
import { normalizeReleasedMoneyRow } from './normalize-row.mjs';

function mapRowsToObjects(rows) {
  if (rows.length === 0) {
    const error = new Error('CSV has no header row');
    error.code = 'EMPTY_CSV';
    throw error;
  }

  const columns = rows[0].map((column) => column.trim());
  const dataRows = rows.slice(1);
  const rawRows = dataRows.map((row) => {
    const raw = {};
    columns.forEach((column, index) => {
      raw[column] = row[index] ?? '';
    });
    return raw;
  });

  return { columns, rawRows };
}

export function parseReleasedMoneyCsv(csvText, options = {}) {
  const sourceMode = options.sourceMode ?? 'fixture';
  const fileName = options.fileName ?? null;
  const strictColumns = options.strictColumns ?? true;
  const parsedCsv = parseCsvText(csvText, options);
  const mapped = mapRowsToObjects(parsedCsv.rows);
  const columnValidation = validateColumns(mapped.columns, {
    profileName: options.profileName ?? 'released_money_daily_core',
    strictColumns,
  });
  const rows = mapped.rawRows.map((rawRow, index) => normalizeReleasedMoneyRow(rawRow, index + 1));

  return {
    parser: 'released_money_csv_v1',
    file_name: fileName,
    source_mode: sourceMode,
    delimiter: parsedCsv.delimiter,
    row_count: rows.length,
    columns: mapped.columns,
    column_validation: columnValidation,
    rows,
  };
}

export { RELEASED_MONEY_DAILY_CORE_COLUMNS, COLUMN_PROFILES, getColumnProfile } from './column-profiles.mjs';
export { parseCsvText, detectCsvDelimiter } from './parse-csv.mjs';
export { MissingRequiredColumnsError, validateColumns } from './validate-columns.mjs';
export { normalizeReleasedMoneyRow } from './normalize-row.mjs';
export { hashMovement, hashRawRow, sha256Hex, stableStringify } from './hash-row.mjs';
