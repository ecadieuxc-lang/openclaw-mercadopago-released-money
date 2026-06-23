#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = join(__filename, '..', '..', '..');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fileExists(relativePath) {
  return existsSync(join(projectRoot, relativePath));
}

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const rel = relative(projectRoot, fullPath);
    if (rel === 'runtime/node_modules' || rel.startsWith('runtime/node_modules/')) {
      continue;
    }
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

const shellScripts = [
  'installer/install.sh',
  'installer/uninstall.sh',
  'installer/doctor.sh',
];

for (const script of shellScripts) {
  run('bash', ['-n', join(projectRoot, script)]);
}

run('bash', ['installer/install.sh', '--help']);
run('bash', ['installer/uninstall.sh', '--help']);
run('bash', ['installer/doctor.sh', '--help']);
run('bash', ['installer/install.sh', '--dry-run', '--no-openclaw', '--no-timer']);
run('bash', ['installer/uninstall.sh', '--dry-run', '--keep-data']);
const doctorOutput = run('bash', ['installer/doctor.sh', '--dry-run']);
assert(!/^missing:/m.test(doctorOutput), `doctor dry-run reported a missing file:\n${doctorOutput}`);
assert(!doctorOutput.includes('docs/api-openapi.yaml'), 'doctor dry-run references obsolete docs/api-openapi.yaml path');
for (const expectedDoctorLine of [
  'ok: runtime/src/api/openapi.v1.json',
  'ok: docs/openapi.md',
  'ok: docs/api-contract.md',
  'ok: docs/api-local-fastify.md',
]) {
  assert(doctorOutput.includes(expectedDoctorLine), `doctor dry-run missing expected line: ${expectedDoctorLine}`);
}

const requiredFiles = [
  'installer/systemd/openclaw-mp-finance.service.template',
  'installer/systemd/openclaw-mp-finance.timer.template',
  'installer/cron/openclaw-mp-finance.cron.template',
  'docs/installation.md',
  'docs/uninstall.md',
  'docs/doctor.md',
  'docs/installer.md',
  'runtime/src/api/openapi.v1.json',
  'docs/openapi.md',
  'docs/api-contract.md',
  'docs/api-local-fastify.md',
];

for (const requiredFile of requiredFiles) {
  assert(fileExists(requiredFile), `missing required file: ${requiredFile}`);
}

const forbiddenRepoFileNames = new Set(['.env', 'finance.sqlite']);
const forbiddenExtensions = ['.sqlite', '.sqlite3', '.db', '.log'];
for (const file of walkFiles(projectRoot)) {
  const name = file.split('/').pop();
  assert(!forbiddenRepoFileNames.has(name), `forbidden generated file present: ${relative(projectRoot, file)}`);
  assert(!forbiddenExtensions.some((ext) => name.endsWith(ext)), `forbidden generated file present: ${relative(projectRoot, file)}`);
}

const scannedTextFiles = [
  'installer/install.sh',
  'installer/uninstall.sh',
  'installer/doctor.sh',
  'docs/installation.md',
  'docs/uninstall.md',
  'docs/doctor.md',
  'docs/installer.md',
];
const forbiddenPatterns = [
  /APP_USR_/,
  /BEGIN OPENSSH/,
  /PRIVATE KEY/,
  /\/home\/erick/,
  /\/mnt\/c/,
  /\/srv\/roy-v2/,
];
for (const relPath of scannedTextFiles) {
  const content = readFileSync(join(projectRoot, relPath), 'utf8');
  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(content), `forbidden token or personal path marker found in ${relPath}`);
  }
}

const psOutput = run('ps', ['-eo', 'pid=,comm=,args=']);
const liveNodeProcesses = psOutput
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => {
    const columns = line.split(/\s+/, 3);
    const pid = Number(columns[0]);
    const commandName = columns[1];
    return commandName === 'node' && pid !== process.pid;
  });
assert(liveNodeProcesses.length === 0, `unexpected live node process: ${liveNodeProcesses.join('; ')}`);

for (const relPath of scannedTextFiles) {
  assert(statSync(join(projectRoot, relPath)).isFile(), `not a regular file: ${relPath}`);
}

process.stdout.write('INSTALLER_DRY_RUN_SMOKE_OK\n');
