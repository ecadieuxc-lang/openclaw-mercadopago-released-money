#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = resolve(new URL('../..', import.meta.url).pathname);
const evidenceRoot = '/workspace/evidence/TASK-0030';
const fakeBin = join(evidenceRoot, 'repair-fake-bin');
const fakeHome = join(evidenceRoot, 'repair-fake-home');
const fakeMpToken = 'APP_USR-FAKE_REPAIR_TOKEN_DO_NOT_USE_000000';
const logs = {
  openclaw: join(evidenceRoot, 'repair-fake-openclaw-calls.log'),
  systemctl: join(evidenceRoot, 'repair-fake-systemctl-calls.log'),
  npm: join(evidenceRoot, 'repair-fake-npm-calls.log'),
};

function fail(message) { console.error(`INSTALLER_REPAIR_PARTIAL_SMOKE_FAIL: ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function writeExecutable(path, content) { writeFileSync(path, content, 'utf8'); chmodSync(path, 0o755); }
function read(path) { return readFileSync(path, 'utf8'); }
function mode(path) { return (statSync(path).mode & 0o777).toString(8); }
function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, HOME: fakeHome },
    ...options,
  });
}
function extractLogPath(output) {
  const match = output.match(/^log: (.+)$/m);
  assert(match, 'installer output missing persistent log path');
  return match[1];
}

mkdirSync(evidenceRoot, { recursive: true });
rmSync(fakeBin, { recursive: true, force: true });
rmSync(fakeHome, { recursive: true, force: true });
mkdirSync(fakeBin, { recursive: true });
mkdirSync(fakeHome, { recursive: true });
for (const path of Object.values(logs)) writeFileSync(path, '', 'utf8');
writeExecutable(join(fakeBin, 'npm'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.npm}'\nmkdir -p node_modules/.package-mock\nprintf '{"mock":true}\\n' > node_modules/.package-mock/package.json\n`);
writeExecutable(join(fakeBin, 'openclaw'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.openclaw}'\nif [[ "\${1:-}" == "skills" && "\${2:-}" == "install" ]]; then\n  [[ -d "\${3:-}" && -f "\${3:-}/SKILL.md" ]] || exit 1\n  [[ "\${4:-}" == "--as" && "\${5:-}" == "mercadopago-finance" ]] || exit 1\nelif [[ "\${1:-}" == "skills" && "\${2:-}" == "list" ]]; then\n  printf 'mercadopago-finance\\n'\nelif [[ "\${1:-}" == "skills" && "\${2:-}" == "uninstall" ]]; then\n  [[ "\${3:-}" == "mercadopago-finance" ]] || exit 1\nelse\n  exit 1\nfi\n`);
writeExecutable(join(fakeBin, 'systemctl'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.systemctl}'\n`);

const initialOutput = run('bash', ['installer/install.sh', '--yes', '--home', fakeHome, '--no-openclaw', '--no-timer'], { input: `${fakeMpToken}\n` });
writeFileSync(join(evidenceRoot, 'repair-initial-partial-install-output.txt'), initialOutput, 'utf8');
assert(initialOutput.includes('INSTALL_USER_FLOW_OK'), 'initial partial install missing user marker');
assert(!read(logs.systemctl).includes('openclaw-mp-finance.timer'), 'partial setup should not create timer');

const envPath = join(fakeHome, '.config/openclaw-mercadopago-released-money/secrets/.env');
const configPath = join(fakeHome, '.config/openclaw-mercadopago-released-money/config.json');
const appPath = join(fakeHome, '.local/share/openclaw-mercadopago-released-money/app');
const wrapperPath = join(fakeHome, '.local/bin/openclaw-mp-finance');
assert(existsSync(configPath), 'partial config missing');
assert(existsSync(envPath), 'partial env missing');
assert(existsSync(appPath), 'partial app missing');
assert(existsSync(wrapperPath), 'partial wrapper missing');
const envBefore = read(envPath);
const financeToken = envBefore.match(/^FINANCE_API_TOKEN=(.+)$/m)?.[1];
assert(financeToken, 'finance token missing before repair');

const repairOutput = run('bash', ['installer/install.sh', '--yes', '--home', fakeHome, '--repair']);
writeFileSync(join(evidenceRoot, 'repair-output.txt'), repairOutput, 'utf8');
assert(repairOutput.includes('INSTALL_REPAIR_OK'), 'repair marker missing');
assert(!repairOutput.includes('Pega tu MP_ACCESS_TOKEN'), 'repair prompted despite existing token');
assert(read(envPath) === envBefore, 'repair changed existing secrets');
assert(mode(envPath) === '600', 'secrets mode changed');
assert(read(logs.systemctl).includes('--user daemon-reload'), 'repair did not reload systemd units');
assert(!read(logs.systemctl).includes('--user enable --now openclaw-mp-finance.timer'), 'repair should not enable timer by default');
assert(read(logs.openclaw).includes('skills list'), 'repair did not inspect OpenClaw state');
assert(!read(logs.openclaw).includes('skills install'), 'repair should accept already-installed OpenClaw skill');

const repairLog = extractLogPath(repairOutput);
assert(existsSync(repairLog), 'repair persistent log missing');
const allOutputs = [initialOutput, repairOutput, read(logs.openclaw), read(logs.systemctl), read(logs.npm), read(extractLogPath(initialOutput)), read(repairLog)].join('\n');
assert(!allOutputs.includes(fakeMpToken), 'MP token appeared in output/logs');
assert(!allOutputs.includes(financeToken), 'finance token appeared in output/logs');

const doctorOutput = run('bash', ['installer/doctor.sh', '--home', fakeHome]);
writeFileSync(join(evidenceRoot, 'repair-doctor-output.txt'), doctorOutput, 'utf8');
for (const expected of ['app: ok', 'wrapper: ok', 'MP_ACCESS_TOKEN: present', 'FINANCE_API_TOKEN: present', 'OpenClaw: installed', 'systemd service: installed', 'systemd timer: disabled', 'sync capability: not_implemented', 'frontend-ready: ok', 'DOCTOR_REAL_MODE_OK']) {
  assert(doctorOutput.includes(expected), `doctor output missing ${expected}`);
}
assert(!doctorOutput.includes(fakeMpToken) && !doctorOutput.includes(financeToken), 'secret printed by doctor');

console.log('INSTALL_REPAIR_OK');
console.log('PARTIAL_INSTALL_REPAIR_SMOKE_OK');
console.log('INSTALL_LOG_SECRET_REDACTION_OK');
