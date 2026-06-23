#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = resolve(new URL('../..', import.meta.url).pathname);
const evidenceRoot = '/workspace/evidence/TASK-0030';
const fakeMpToken = 'APP_USR-FAKE_INTERACTIVE_TOKEN_DO_NOT_USE_000000';
const fakeBin = join(evidenceRoot, 'fake-bin');
const fakeHome = join(evidenceRoot, 'fake-home');
const logs = {
  openclaw: join(evidenceRoot, 'fake-openclaw-calls.log'),
  systemctl: join(evidenceRoot, 'fake-systemctl-calls.log'),
  npm: join(evidenceRoot, 'fake-npm-calls.log'),
  node: join(evidenceRoot, 'fake-node-calls.log'),
};

function fail(message) {
  console.error(`REAL_INSTALLER_USER_FLOW_SMOKE_FAIL: ${message}`);
  process.exit(1);
}
function assert(condition, message) { if (!condition) fail(message); }
function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, HOME: fakeHome },
    ...options,
  });
}
function writeExecutable(path, content) {
  writeFileSync(path, content, 'utf8');
  chmodSync(path, 0o755);
}
function read(path) { return readFileSync(path, 'utf8'); }
function mode(path) { return (statSync(path).mode & 0o777).toString(8); }

mkdirSync(evidenceRoot, { recursive: true });
rmSync(fakeBin, { recursive: true, force: true });
rmSync(fakeHome, { recursive: true, force: true });
mkdirSync(fakeBin, { recursive: true });
mkdirSync(fakeHome, { recursive: true });
for (const path of Object.values(logs)) writeFileSync(path, '', 'utf8');

writeExecutable(join(fakeBin, 'npm'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.npm}'\nrm -rf node_modules\nln -s '${projectRoot}/runtime/node_modules' node_modules\n`);
writeExecutable(join(fakeBin, 'openclaw'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.openclaw}'\nif [[ "\${1:-}" == "skills" && "\${2:-}" == "install" ]]; then\n  skill_path="\${3:-}"\n  if [[ "$skill_path" == */SKILL.md ]]; then\n    printf 'Skill path is not a directory: %s\\n' "$skill_path" >&2\n    exit 1\n  fi\n  if [[ ! -d "$skill_path" ]]; then\n    printf 'Skill path is not a directory: %s\\n' "$skill_path" >&2\n    exit 1\n  fi\n  if [[ ! -f "$skill_path/SKILL.md" ]]; then\n    printf 'Skill directory missing SKILL.md: %s\\n' "$skill_path" >&2\n    exit 1\n  fi\n  if [[ "\${4:-}" != "--as" || "\${5:-}" != "mercadopago-finance" ]]; then\n    printf 'Unexpected install alias arguments\\n' >&2\n    exit 1\n  fi\nelif [[ "\${1:-}" == "skills" && "\${2:-}" == "list" ]]; then\n  :\nelif [[ "\${1:-}" == "skills" && "\${2:-}" == "uninstall" ]]; then\n  if [[ "\${3:-}" != "mercadopago-finance" ]]; then\n    printf 'Unexpected uninstall skill\\n' >&2\n    exit 1\n  fi\nelse\n  printf 'Unexpected openclaw args: %s\\n' "$*" >&2\n  exit 1\nfi\n`);
writeExecutable(join(fakeBin, 'systemctl'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.systemctl}'\n`);
writeExecutable(join(fakeBin, 'node'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.node}'\nexec /usr/bin/env -i PATH='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' HOME='${fakeHome}' node "$@"\n`);

const installOutput = run('bash', ['installer/install.sh', '--yes', '--home', fakeHome], { input: `${fakeMpToken}\n` });
writeFileSync(join(evidenceRoot, 'install-user-flow-output.txt'), installOutput, 'utf8');
assert(installOutput.includes('INSTALL_USER_FLOW_OK'), 'install output missing INSTALL_USER_FLOW_OK');
assert(!installOutput.includes('No reconozco el prefijo típico'), 'APP_USR- generated false warning');
assert(installOutput.includes('Nota: si tu shell no reconoce openclaw-mp-finance'), 'PATH note missing');
assert(installOutput.includes(`${fakeHome}/.local/bin/openclaw-mp-finance frontend-info`), 'absolute frontend-info command missing');

const configPath = join(fakeHome, '.config/openclaw-mercadopago-released-money/config.json');
const envPath = join(fakeHome, '.config/openclaw-mercadopago-released-money/secrets/.env');
const appPath = join(fakeHome, '.local/share/openclaw-mercadopago-released-money/app');
const wrapperPath = join(fakeHome, '.local/bin/openclaw-mp-finance');
assert(existsSync(configPath), 'config missing');
assert(existsSync(envPath), '.env missing');
assert(mode(envPath) === '600', `.env mode is ${mode(envPath)}, expected 600`);
assert(existsSync(appPath), 'app missing');
assert(existsSync(wrapperPath), 'wrapper missing');
assert((statSync(wrapperPath).mode & 0o111) !== 0, 'wrapper not executable');

const envText = read(envPath).trim();
const tokenMatch = envText.match(/^FINANCE_API_TOKEN=(.+)$/m);
assert(tokenMatch, 'FINANCE_API_TOKEN missing');
const tokenValue = tokenMatch[1];
assert(envText.includes(`MP_ACCESS_TOKEN=${fakeMpToken}`), 'MP_ACCESS_TOKEN was not stored from controlled stdin');
const combinedOutput = installOutput + read(logs.openclaw) + read(logs.systemctl) + read(logs.npm);
assert(!combinedOutput.includes(tokenValue), 'FINANCE_API_TOKEN value appeared in output/logs');
assert(!combinedOutput.includes(fakeMpToken), 'MP_ACCESS_TOKEN value appeared in output/logs');
assert(read(logs.openclaw).includes(`skills install ${appPath} --as mercadopago-finance`), 'openclaw was not invoked with the installed skill directory');
assert(!read(logs.openclaw).includes('SKILL.md --as mercadopago-finance'), 'openclaw install was invoked with SKILL.md instead of a directory');
assert(read(logs.npm).includes('ci --omit=dev'), 'npm ci --omit=dev was not invoked');
assert(read(logs.systemctl).includes('--user daemon-reload'), 'systemctl --user daemon-reload missing');
assert(!read(logs.systemctl).includes('--user enable --now openclaw-mp-finance.timer'), 'timer should not be enabled by default');

const doctorOutput = run('bash', ['installer/doctor.sh', '--home', fakeHome]);
writeFileSync(join(evidenceRoot, 'doctor-real-mode-output.txt'), doctorOutput, 'utf8');
assert(doctorOutput.includes('DOCTOR_REAL_MODE_OK'), 'doctor did not pass');
assert(doctorOutput.includes('wrapper file: ok'), 'doctor wrapper file status missing');
assert(doctorOutput.includes('wrapper in PATH: warn'), 'doctor wrapper PATH warning missing');
assert(!doctorOutput.includes(tokenValue), 'token value appeared in doctor output');

const frontendInfo = run(wrapperPath, ['frontend-info']);
writeFileSync(join(evidenceRoot, 'real-flow-frontend-info-output.json'), frontendInfo, 'utf8');
assert(frontendInfo.includes('FRONTEND_READY_CONTRACT_OK'), 'absolute wrapper frontend-info failed');

const uninstallOutput = run('bash', ['installer/uninstall.sh', '--yes', '--home', fakeHome, '--keep-data']);
writeFileSync(join(evidenceRoot, 'uninstall-real-mode-output.txt'), uninstallOutput, 'utf8');
assert(uninstallOutput.includes('UNINSTALL_REAL_MODE_OK'), 'uninstall output missing marker');
assert(!existsSync(appPath), 'app was not removed by uninstall');
assert(!existsSync(wrapperPath), 'wrapper was not removed by uninstall');
assert(existsSync(configPath), 'config was not preserved with --keep-data');
assert(existsSync(envPath), 'secrets were not preserved with --keep-data');
assert(read(logs.systemctl).includes('--user disable --now openclaw-mp-finance.timer'), 'systemctl disable timer missing');
assert(read(logs.openclaw).includes('skills uninstall mercadopago-finance'), 'openclaw skills uninstall missing');
assert(!uninstallOutput.includes(tokenValue), 'token value appeared in uninstall output');

const unsafeEntries = execFileSync('find', [fakeHome, '-type', 'l', '-o', '-type', 'f', '-o', '-type', 'd'], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean).filter((path) => !path.startsWith(fakeHome));
assert(unsafeEntries.length === 0, `paths outside fake home detected: ${unsafeEntries.join(', ')}`);

console.log('REAL_INSTALLER_USER_FLOW_SMOKE_OK');
console.log('OPENCLAW_SKILLS_PLURAL_OK');
console.log('OPENCLAW_INSTALL_DIRECTORY_OK');
