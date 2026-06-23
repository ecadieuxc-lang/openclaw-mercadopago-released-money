#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = join(__filename, '..', '..', '..');
const evidenceRoot = '/workspace/evidence/TASK-0023';
const fakeHome = join(evidenceRoot, 'fake-home');
const projectName = 'openclaw-mercadopago-released-money';

const configFile = join(fakeHome, '.config', projectName, 'config.json');
const envFile = join(fakeHome, '.config', projectName, 'secrets', '.env');
const appDir = join(fakeHome, '.local', 'share', projectName, 'app');
const reportsDir = join(fakeHome, '.local', 'share', projectName, 'reports');
const wrapper = join(fakeHome, '.local', 'bin', 'openclaw-mp-finance');

function fail(message) {
  console.error(`REAL_INSTALLER_FAKE_HOME_SMOKE_FAIL: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  writeFileSync(join(evidenceRoot, `${label}-output.txt`), output, 'utf8');
  if (result.status !== 0) {
    fail(`${label} failed with exit ${result.status}:\n${output}`);
  }
  return output;
}

function mode(path) {
  return (statSync(path).mode & 0o777).toString(8).padStart(3, '0');
}

function walkFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(appDir, full).replaceAll('\\', '/');
    if (rel === 'runtime/node_modules' || rel.startsWith('runtime/node_modules/')) continue;
    if (entry.isDirectory()) walkFiles(full, files);
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isForbiddenAppFile(path) {
  const rel = relative(appDir, path).replaceAll('\\', '/');
  const name = basename(rel);
  if (name === '.env') return true;
  if (name === 'finance.sqlite') return true;
  if (/\.(sqlite|sqlite3|db|db-shm|db-wal|log|pem|key)$/i.test(name)) return true;
  if (rel === '.git' || rel.startsWith('.git/')) return true;
  if (rel === 'evidence' || rel.startsWith('evidence/')) return true;
  if (rel === '_out' || rel.startsWith('_out/')) return true;
  return false;
}

mkdirSync(evidenceRoot, { recursive: true });
if (existsSync(fakeHome)) rmSync(fakeHome, { recursive: true, force: true });
mkdirSync(fakeHome, { recursive: true });

const installOutput = run('install-real-fake-home', 'bash', [
  'installer/install.sh',
  '--yes',
  '--no-openclaw',
  '--no-timer',
  '--offline',
  '--skip-npm-install',
  '--home',
  fakeHome,
]);

assert(existsSync(configFile), 'config.json was not created');
assert(existsSync(envFile), 'secrets/.env was not created');
const envContent = readFileSync(envFile, 'utf8');
const tokenMatch = envContent.match(/^FINANCE_API_TOKEN=(.+)$/m);
assert(tokenMatch, 'FINANCE_API_TOKEN missing from secrets/.env');
const tokenValue = tokenMatch[1];
assert(tokenValue.length >= 32, 'FINANCE_API_TOKEN is unexpectedly short');
assert(!installOutput.includes(tokenValue), 'installer output printed FINANCE_API_TOKEN value');
assert(!/^MP_ACCESS_TOKEN=/m.test(envContent), 'offline secrets/.env contains MP_ACCESS_TOKEN');
assert(mode(join(fakeHome, '.config', projectName)) === '700', 'config dir permissions are not 700');
assert(mode(join(fakeHome, '.config', projectName, 'secrets')) === '700', 'secrets dir permissions are not 700');
assert(mode(envFile) === '600', 'secrets/.env permissions are not 600');

for (const rel of [
  'SKILL.md',
  'runtime/src/api/openapi.v1.json',
  'docs/openapi.md',
  'docs/api-contract.md',
]) {
  assert(existsSync(join(appDir, rel)), `installed app missing ${rel}`);
}
assert(existsSync(wrapper), 'wrapper openclaw-mp-finance missing');
assert((statSync(wrapper).mode & 0o111) !== 0, 'wrapper openclaw-mp-finance is not executable');

const forbidden = walkFiles(appDir).filter(isForbiddenAppFile).map((path) => relative(appDir, path).replaceAll('\\', '/'));
assert(forbidden.length === 0, `forbidden files in installed app: ${forbidden.join(', ')}`);

const doctorOutput = run('doctor-real-fake-home', 'bash', ['installer/doctor.sh', '--home', fakeHome]);
assert(doctorOutput.includes('DOCTOR_REAL_MODE_OK'), 'doctor output missing DOCTOR_REAL_MODE_OK');
assert(!doctorOutput.includes(tokenValue), 'doctor output printed FINANCE_API_TOKEN value');

const uninstallOutput = run('uninstall-real-fake-home', 'bash', [
  'installer/uninstall.sh',
  '--yes',
  '--home',
  fakeHome,
  '--keep-data',
]);
assert(uninstallOutput.includes('UNINSTALL_REAL_MODE_OK'), 'uninstall output missing UNINSTALL_REAL_MODE_OK');
assert(!existsSync(appDir), 'installed app was not removed');
assert(!existsSync(wrapper), 'wrapper was not removed');
for (const rel of ['raw', 'exports', 'archive', 'quarantine']) {
  assert(existsSync(join(reportsDir, rel)), `reports/${rel} was not preserved`);
}
assert(existsSync(configFile), 'config.json was not preserved');
assert(existsSync(envFile), 'secrets/.env was not preserved');

process.stdout.write('REAL_INSTALLER_FAKE_HOME_SMOKE_OK\n');
