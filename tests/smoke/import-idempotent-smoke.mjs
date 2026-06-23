import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createImportState, importReportFromCsvFile } from '../../runtime/src/import/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const fixturesDir = join(projectRoot, 'tests', 'fixtures', 'released-money');

function fixturePath(fileName) {
  return join(fixturesDir, fileName);
}

async function importFixture(fileName, state = createImportState()) {
  return importReportFromCsvFile({
    filePath: fixturePath(fileName),
    sourceMode: 'manual_csv',
    parserProfile: 'released_money_daily_core',
    state,
  });
}

const state = createImportState();
const first = await importFixture('daily-core-valid.csv', state);
assert.equal(first.source_report.provider, 'mercado_pago');
assert.equal(first.source_report.report_type, 'released_money');
assert.equal(first.source_report.source_mode, 'manual_csv');
assert.equal(first.source_report.row_count, 8);
assert.ok(first.source_report.file_hash);
assert.equal(first.counts.parsed_rows, 8);
assert.ok(first.counts.new_raw_rows > 0);
assert.ok(first.counts.new_movements > 0);
assert.equal(first.counts.duplicate_movements, 0);
assert.ok(first.raw_rows.every((row) => row.row_hash && row.raw_json));
assert.ok(first.movements.every((movement) => movement.movement_hash && movement.row_hash));
assert.ok(first.movements.every((movement) => Number.isFinite(movement.amount_signed)));

const second = await importFixture('daily-core-valid.csv', state);
assert.equal(second.source_report.file_hash, first.source_report.file_hash);
assert.equal(second.dedupe.file_duplicate, true);
assert.equal(second.counts.new_raw_rows, 0);
assert.equal(second.counts.new_movements, 0);
assert.equal(second.counts.duplicate_raw_rows, first.raw_rows.length);
assert.equal(second.counts.duplicate_movements, first.movements.length);

const duplicates = await importFixture('daily-core-duplicates.csv', createImportState());
assert.ok(
  duplicates.dedupe.duplicate_movement_hashes.length > 0 || duplicates.dedupe.duplicate_row_hashes.length > 0,
  'daily-core-duplicates.csv should report duplicates inside the report',
);

let missingColumnsCode = null;
try {
  await importFixture('daily-core-missing-columns.csv', createImportState());
} catch (error) {
  missingColumnsCode = error.code;
}
assert.equal(missingColumnsCode, 'MISSING_REQUIRED_COLUMNS');

const sample = await importReportFromCsvFile({
  filePath: join(projectRoot, 'examples', 'sample-released-money.csv'),
  sourceMode: 'manual_csv',
  parserProfile: 'released_money_daily_core',
  state: createImportState(),
});
assert.equal(sample.source_report.row_count, 3);
assert.ok(sample.movements.every((movement) => movement.movement_hash));

const forbiddenPersistentFiles = [
  join(projectRoot, 'finance.sqlite'),
  join(projectRoot, 'finance.sqlite3'),
  join(projectRoot, 'finance.db'),
  join(projectRoot, '.env'),
];
assert.equal(forbiddenPersistentFiles.some((filePath) => existsSync(filePath)), false);

console.log(JSON.stringify({
  fixtures: {
    'daily-core-valid.csv': {
      parsed_rows: first.counts.parsed_rows,
      first_new_movements: first.counts.new_movements,
      second_new_movements: second.counts.new_movements,
      second_duplicate_movements: second.counts.duplicate_movements,
    },
    'daily-core-duplicates.csv': {
      duplicate_row_hashes: duplicates.dedupe.duplicate_row_hashes.length,
      duplicate_movement_hashes: duplicates.dedupe.duplicate_movement_hashes.length,
    },
    'daily-core-missing-columns.csv': missingColumnsCode,
    'examples/sample-released-money.csv': sample.counts.parsed_rows,
  },
  stable_file_hash: first.source_report.file_hash === second.source_report.file_hash,
  row_hashes_present: first.raw_rows.every((row) => Boolean(row.row_hash)),
  movement_hashes_present: first.movements.every((movement) => Boolean(movement.movement_hash)),
}));
console.log('MISSING_REQUIRED_COLUMNS');
console.log('IMPORT_IDEMPOTENT_SMOKE_OK');
