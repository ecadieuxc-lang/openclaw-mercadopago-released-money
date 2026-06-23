import { readFile } from 'node:fs/promises';

import { parseReleasedMoneyCsv } from '../ingest/index.mjs';
import { dedupeImportRecords, createImportState } from './dedupe.mjs';
import { hashFile } from './file-hash.mjs';
import { makeImportResult, makeMovements, makeRawRows, makeSourceReport } from './import-result.mjs';

export async function importReportFromCsvFile(options) {
  const {
    filePath,
    sourceMode = 'manual_csv',
    parserProfile = 'released_money_daily_core',
    state = createImportState(),
  } = options ?? {};

  if (!filePath) {
    const error = new Error('filePath is required');
    error.code = 'IMPORT_FILE_PATH_REQUIRED';
    throw error;
  }

  const [csvText, fileHash] = await Promise.all([
    readFile(filePath, 'utf8'),
    hashFile(filePath),
  ]);

  const parsed = parseReleasedMoneyCsv(csvText, {
    fileName: filePath,
    sourceMode,
    profileName: parserProfile,
    strictColumns: true,
  });

  const sourceReport = makeSourceReport({ filePath, fileHash, parsed, sourceMode });
  const rawRows = makeRawRows(parsed, sourceReport);
  const movements = makeMovements(parsed, sourceReport);
  const { dedupe, counts } = dedupeImportRecords({ state, sourceReport, rawRows, movements });

  return makeImportResult({ sourceReport, rawRows, movements, dedupe, counts });
}

export { createImportState } from './dedupe.mjs';
