import assert from 'node:assert/strict';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const BASE = '/workspace/projects/openclaw-mercadopago-released-money';
const CLI = join(BASE, 'runtime', 'src', 'cli', 'index.mjs');
const FIXTURES = join(BASE, 'tests', 'fixtures', 'released-money');
const OUT = '/workspace/evidence/TASK-0013/generated-cli-exports';
const FORBIDDEN = [
  'raw_json',
  ['MP', 'ACCESS', 'TOKEN'].join('_'),
  ['FINANCE', 'API', 'TOKEN'].join('_'),
  ['APP', 'USR', ''].join('_'),
  ['BEGIN', 'OPENSSH'].join(' '),
  ['PRIVATE', 'KEY'].join(' '),
  ['/', 'home', 'erick'].join(''),
  ['/', 'mnt', 'c'].join(''),
  ['/', 'srv', 'roy-v2'].join(''),
];

function runCli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], { cwd: BASE, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr, combined: `${stdout}${stderr}` }));
  });
}

function assertSafeOutput(label, text) {
  for (const marker of FORBIDDEN) {
    assert.equal(text.includes(marker), false, `${label} contains forbidden marker ${marker}`);
  }
}

function parseJsonOutput(result, stream = 'stdout') {
  const text = result[stream].trim();
  assert.ok(text.length > 0, `${stream} must contain JSON`);
  return JSON.parse(text);
}

function assertDirectionFields(record) {
  if (Number(record.amount_signed) > 0) {
    assert.equal(record.expense_category ?? '', '', `${record.movement_id} income must not have expense_category`);
  }
  if (Number(record.amount_signed) < 0) {
    assert.equal(record.income_kind ?? '', '', `${record.movement_id} expense must not have income_kind`);
  }
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const doctor = await runCli(['doctor']);
assert.equal(doctor.code, 0);
assertSafeOutput('doctor', doctor.combined);
assert.equal(parseJsonOutput(doctor).ok, true);

const schema = await runCli(['schema-version']);
assert.equal(schema.code, 0);
assertSafeOutput('schema-version', schema.combined);
const schemaJson = parseJsonOutput(schema);
assert.equal(schemaJson.schema_version, 1);
assert.equal(schemaJson.schema_name, '0001_initial_schema');

const validImport = await runCli(['import', '--file', join(FIXTURES, 'daily-core-valid.csv')]);
assert.equal(validImport.code, 0);
assertSafeOutput('valid import', validImport.combined);
const validImportJson = parseJsonOutput(validImport);
assert.equal(validImportJson.ok, true);
assert.ok(validImportJson.new_movements > 0);

const invalidImport = await runCli(['import', '--file', join(FIXTURES, 'daily-core-missing-columns.csv')]);
assert.notEqual(invalidImport.code, 0);
assertSafeOutput('invalid import', invalidImport.combined);
assert.match(invalidImport.combined, /MISSING_REQUIRED_COLUMNS/);

const exportResult = await runCli(['export', '--period', 'current', '--out', OUT]);
assert.equal(exportResult.code, 0);
assertSafeOutput('export', exportResult.combined);
const exportJson = parseJsonOutput(exportResult);
assert.equal(exportJson.ok, true);
for (const file of ['clean-movements.csv', 'period-summary.json', 'period-movements.jsonl', 'manifest.json']) {
  assert.ok(exportJson.generated_files.includes(file), `${file} must be reported`);
  await readFile(join(OUT, file), 'utf8');
}

const cleanCsv = await readFile(join(OUT, 'clean-movements.csv'), 'utf8');
const summaryText = await readFile(join(OUT, 'period-summary.json'), 'utf8');
const jsonlText = await readFile(join(OUT, 'period-movements.jsonl'), 'utf8');
const manifestText = await readFile(join(OUT, 'manifest.json'), 'utf8');
assertSafeOutput('clean export csv', cleanCsv);
assertSafeOutput('summary export json', summaryText);
assertSafeOutput('jsonl export', jsonlText);
assertSafeOutput('manifest export json', manifestText);
JSON.parse(summaryText);
JSON.parse(manifestText);
const jsonlRecords = jsonlText.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
assert.ok(jsonlRecords.length > 0, 'JSONL must contain visible movements');
for (const record of jsonlRecords) assertDirectionFields(record);

const serve = await runCli(['serve', '--host', '127.0.0.1', '--port', '0', '--smoke']);
assert.equal(serve.code, 0);
assertSafeOutput('serve', serve.combined);
const serveJson = parseJsonOutput(serve);
assert.equal(serveJson.ok, true);
assert.match(serveJson.url, /^http:\/\/127\.0\.0\.1:\d+$/);

process.stdout.write('CLI_OPERATIVO_SMOKE_OK\n');
