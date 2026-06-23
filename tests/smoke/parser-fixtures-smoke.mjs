import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseReleasedMoneyCsv } from '../../runtime/src/ingest/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const fixturesDir = join(projectRoot, 'tests', 'fixtures', 'released-money');

function readProjectFile(...parts) {
  return readFileSync(join(projectRoot, ...parts), 'utf8');
}

function parseFixture(fileName) {
  const csvText = readFileSync(join(fixturesDir, fileName), 'utf8');
  return parseReleasedMoneyCsv(csvText, {
    fileName,
    sourceMode: 'fixture',
    strictColumns: true,
  });
}

const valid = parseFixture('daily-core-valid.csv');
assert.equal(valid.delimiter, ';');
assert.equal(valid.row_count, 8);
assert.equal(valid.rows[0].amount_signed, 120000);
assert.equal(valid.rows[1].amount_signed, -15000);
assert.equal(valid.rows[0].display_title, 'Venta Demo Uno');
assert.ok(valid.rows.every((row) => row.row_hash && row.movement_hash));

const commaValid = parseFixture('daily-core-comma-valid.csv');
assert.equal(commaValid.delimiter, ',');
assert.equal(commaValid.row_count, 4);

const duplicates = parseFixture('daily-core-duplicates.csv');
const movementHashes = duplicates.rows.map((row) => row.movement_hash);
assert.ok(new Set(movementHashes).size < movementHashes.length, 'expected at least one duplicate movement_hash');

let missingColumnsError = null;
try {
  parseFixture('daily-core-missing-columns.csv');
} catch (error) {
  missingColumnsError = error;
}
assert.ok(missingColumnsError, 'missing columns fixture should fail');
assert.equal(missingColumnsError.code, 'MISSING_REQUIRED_COLUMNS');
assert.ok(missingColumnsError.missing_columns.includes('BALANCE_AMOUNT'));
assert.ok(missingColumnsError.missing_columns.includes('SEGMENT_DETAIL'));

const technicalRows = parseFixture('daily-core-technical-rows.csv');
assert.equal(technicalRows.row_count, 8);
assert.ok(technicalRows.rows.some((row) => row.record_type === 'initial_available_balance'));
assert.ok(technicalRows.rows.some((row) => row.record_type === 'total'));

const salary = parseFixture('daily-core-salary.csv');
assert.equal(salary.row_count, 6);
assert.ok(salary.rows.some((row) => row.amount_signed > 0));
assert.ok(salary.rows.some((row) => row.amount_signed < 0));

const sampleCsv = readProjectFile('examples', 'sample-released-money.csv');
const sample = parseReleasedMoneyCsv(sampleCsv, {
  fileName: 'examples/sample-released-money.csv',
  sourceMode: 'fixture',
  strictColumns: true,
});
assert.equal(sample.row_count, 3);

console.log(JSON.stringify({
  fixtures: {
    'daily-core-valid.csv': valid.row_count,
    'daily-core-comma-valid.csv': commaValid.row_count,
    'daily-core-duplicates.csv': duplicates.row_count,
    'daily-core-technical-rows.csv': technicalRows.row_count,
    'daily-core-salary.csv': salary.row_count,
    'examples/sample-released-money.csv': sample.row_count,
  },
  missing_columns_rejected: missingColumnsError.code,
  duplicate_movement_hash_detected: true,
  amount_signed_confirmed: true,
  hashes_confirmed: true,
}));
console.log('PARSER_FIXTURE_SMOKE_OK');
