import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createImportState, importReportFromCsvFile } from '../../runtime/src/import/index.mjs';
import { cleanImportedMovements } from '../../runtime/src/movements/index.mjs';
import { buildSalaryAnchorPeriods } from '../../runtime/src/periods/index.mjs';
import { CLEAN_MOVEMENTS_CSV_HEADER, writePeriodExports } from '../../runtime/src/exports/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const fixturesDir = join(projectRoot, 'tests', 'fixtures', 'released-money');
const evidenceDir = '/workspace/evidence/TASK-0010';
const generatedExportsDir = join(evidenceDir, 'generated-exports');
const fixtures = ['daily-core-period-anchors.csv', 'daily-core-valid.csv', 'daily-core-salary.csv'];
const forbiddenMarkers = [
  'raw_json',
  'APP_USR_',
  'BEGIN OPENSSH',
  'PRIVATE KEY',
  ['/', 'home', '/', 'erick'].join(''),
  ['/', 'mnt', '/', 'c'].join(''),
  ['/', 'srv', '/', 'roy-v2'].join(''),
];

async function importAndCleanFixture(fileName, state) {
  const imported = await importReportFromCsvFile({
    filePath: join(fixturesDir, fileName),
    sourceMode: 'manual_csv',
    parserProfile: 'released_money_daily_core',
    state,
  });
  const rawByHash = new Map(imported.raw_rows.map((row) => [row.row_hash, row.raw_json]));
  return cleanImportedMovements(imported).map((movement) => {
    const raw = rawByHash.get(movement.row_hash) ?? {};
    return {
      ...movement,
      description: raw.DESCRIPTION ?? movement.display_subtitle,
      sale_detail: raw.SALE_DETAIL ?? movement.display_title,
      payment_method_type: raw.PAYMENT_METHOD_TYPE ?? null,
    };
  });
}

function assertNoForbiddenMarkers(name, content) {
  for (const marker of forbiddenMarkers) {
    assert.equal(content.includes(marker), false, `${name} must not contain ${marker}`);
  }
}

function assertCategoryRules(records) {
  for (const record of records) {
    if (Number(record.amount_signed) > 0) {
      assert.equal(record.expense_category, '', `income ${record.movement_id} must not have expense_category`);
    }
    if (Number(record.amount_signed) < 0) {
      assert.equal(record.income_kind, '', `expense ${record.movement_id} must not have income_kind`);
    }
  }
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && inQuotes && line[index + 1] === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

const state = createImportState();
const movements = [];
for (const fixture of fixtures) {
  movements.push(...await importAndCleanFixture(fixture, state));
}

const periodResult = buildSalaryAnchorPeriods(movements, {
  min_amount: 100000,
  confidence_required: 'high',
  payment_method_types: ['bank_transfer'],
  association_window_minutes: 180,
  periods: { retain_previous_period_days: 7 },
});
assert.ok(periodResult.periods.length > 0, 'at least one period must be exported');
const period = periodResult.periods[0];
await mkdir(generatedExportsDir, { recursive: true });
const exportResult = await writePeriodExports({
  outputDir: generatedExportsDir,
  period,
  movements,
  periodMovements: periodResult.period_movements,
  generatedAt: '2026-06-22T19:05:06.000Z',
});

const cleanCsv = await readFile(join(generatedExportsDir, 'clean-movements.csv'), 'utf8');
const summaryText = await readFile(join(generatedExportsDir, 'period-summary.json'), 'utf8');
const jsonlText = await readFile(join(generatedExportsDir, 'period-movements.jsonl'), 'utf8');
const manifestText = await readFile(join(generatedExportsDir, 'manifest.json'), 'utf8');

assert.equal(cleanCsv.split('\n')[0], CLEAN_MOVEMENTS_CSV_HEADER.join(','), 'CSV header must be stable');
assertNoForbiddenMarkers('clean-movements.csv', cleanCsv);
assertNoForbiddenMarkers('period-movements.jsonl', jsonlText);
assertNoForbiddenMarkers('period-summary.json', summaryText);
assertNoForbiddenMarkers('manifest.json', manifestText);

const summary = JSON.parse(summaryText);
assert.equal(summary.period_id, period.period_id);
const jsonlRecords = jsonlText.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
assert.ok(jsonlRecords.length > 0, 'JSONL must include visible movements');
assertCategoryRules(jsonlRecords);
const manifest = JSON.parse(manifestText);
assert.equal(manifest.period_id, period.period_id);
assert.ok(manifest.exports.length >= 3, 'manifest must include export entries');
for (const entry of manifest.exports) {
  assert.match(entry.sha256, /^[a-f0-9]{64}$/, `${entry.file_name} must have SHA-256`);
  assert.ok(entry.bytes > 0, `${entry.file_name} must have byte count`);
}

const summaryLines = [
  '# TASK-0010 exports summary',
  '',
  '- Data: synthetic fixtures only.',
  `- Fixtures used: ${fixtures.join(', ')}`,
  `- Exported period: ${summary.period_id} (${summary.period_label})`,
  `- Movements exported: ${jsonlRecords.length}`,
  `- income_total: ${summary.income_total}`,
  `- expense_total: ${summary.expense_total}`,
  `- net_total: ${summary.net_total}`,
  '- Files generated:',
  ...exportResult.files.map((file) => `  - ${file.fileName}`),
  '- Hashes generated:',
  ...manifest.exports.map((entry) => `  - ${entry.file_name}: ${entry.sha256}`),
  '- Confirmation: these exports come from synthetic fixtures and are not real financial data.',
  '',
];
await writeFile(join(evidenceDir, 'exports-summary.md'), summaryLines.join('\n'), 'utf8');

console.log(JSON.stringify({
  fixtures,
  period_id: summary.period_id,
  period_label: summary.period_label,
  exported_movements: jsonlRecords.length,
  income_total: summary.income_total,
  expense_total: summary.expense_total,
  net_total: summary.net_total,
  generated_files: manifest.exports.map((entry) => entry.file_name),
}));
console.log('EXPORTS_SMOKE_OK');
