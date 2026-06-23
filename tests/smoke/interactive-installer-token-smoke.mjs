#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = resolve(new URL('../..', import.meta.url).pathname);
const evidenceRoot = '/workspace/evidence/TASK-0030';
const fakeBin = join(evidenceRoot, 'interactive-fake-bin');
const logs = {
  openclaw: join(evidenceRoot, 'interactive-fake-openclaw-calls.log'),
  systemctl: join(evidenceRoot, 'interactive-fake-systemctl-calls.log'),
  npm: join(evidenceRoot, 'interactive-fake-npm-calls.log'),
};
const dashToken = 'APP_USR-FAKE_INTERACTIVE_TOKEN_DO_NOT_USE_000000';
const underscoreToken = 'APP_USR_FAKE_INTERACTIVE_TOKEN_DO_NOT_USE_000000';

function fail(message) { console.error(`INTERACTIVE_INSTALLER_TOKEN_SMOKE_FAIL: ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function writeExecutable(path, content) { writeFileSync(path, content, 'utf8'); chmodSync(path, 0o755); }
function read(path) { return readFileSync(path, 'utf8'); }
function mode(path) { return (statSync(path).mode & 0o777).toString(8); }
function run(command, args, options = {}) {
  const { home = join(evidenceRoot, 'unused-home'), ...execOptions } = options;
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, HOME: home },
    ...execOptions,
  });
}
function setupHome(name) {
  const home = join(evidenceRoot, name);
  rmSync(home, { recursive: true, force: true });
  mkdirSync(home, { recursive: true });
  return home;
}
function envPath(home) { return join(home, '.config/openclaw-mercadopago-released-money/secrets/.env'); }
function installWithToken(name, input) {
  const home = setupHome(name);
  const output = run('bash', ['installer/install.sh', '--yes', '--home', home], { input, home });
  writeFileSync(join(evidenceRoot, `${name}-install-output.txt`), output, 'utf8');
  assert(output.includes('INSTALL_USER_FLOW_OK'), `${name}: install marker missing`);
  assert(existsSync(envPath(home)), `${name}: .env missing`);
  assert(mode(envPath(home)) === '600', `${name}: .env mode ${mode(envPath(home))} expected 600`);
  return { home, output, envText: read(envPath(home)) };
}

mkdirSync(evidenceRoot, { recursive: true });
rmSync(fakeBin, { recursive: true, force: true });
mkdirSync(fakeBin, { recursive: true });
for (const path of Object.values(logs)) writeFileSync(path, '', 'utf8');

writeExecutable(join(fakeBin, 'npm'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.npm}'\nrm -rf node_modules\nln -s '${projectRoot}/runtime/node_modules' node_modules\n`);
writeExecutable(join(fakeBin, 'openclaw'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.openclaw}'\nif [[ "\${1:-}" == "skills" && "\${2:-}" == "install" ]]; then\n  [[ -d "\${3:-}" && -f "\${3:-}/SKILL.md" ]] || exit 1\n  [[ "\${4:-}" == "--as" && "\${5:-}" == "mercadopago-finance" ]] || exit 1\nelif [[ "\${1:-}" == "skills" && "\${2:-}" == "list" ]]; then\n  :\nelif [[ "\${1:-}" == "skills" && "\${2:-}" == "uninstall" ]]; then\n  [[ "\${3:-}" == "mercadopago-finance" ]] || exit 1\nelse\n  exit 1\nfi\n`);
writeExecutable(join(fakeBin, 'systemctl'), `#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' "cwd=$(pwd) args=$*" >> '${logs.systemctl}'\n`);

const dash = installWithToken('interactive-dash-home', `${dashToken}\n`);
assert(dash.envText.includes(`MP_ACCESS_TOKEN=${dashToken}`), 'dash token not stored');
assert(!dash.output.includes('No reconozco el prefijo típico'), 'APP_USR- generated false warning');
assert(!dash.output.includes('ADVERTENCIA: el token no empieza'), 'old APP_USR_ warning appeared for dash token');
assert(!dash.output.includes(dashToken), 'dash token printed in installer output');

const underscore = installWithToken('interactive-underscore-home', `${underscoreToken}\n`);
assert(underscore.envText.includes(`MP_ACCESS_TOKEN=${underscoreToken}`), 'underscore token not stored');
assert(!underscore.output.includes('No reconozco el prefijo típico'), 'APP_USR_ generated false warning');
assert(!underscore.output.includes(underscoreToken), 'underscore token printed in installer output');

const badPaste = installWithToken('interactive-bad-paste-home', `MP_ACCESS_TOKEN=${dashToken}\n${dashToken}\n`);
assert(badPaste.output.includes('Detecté que pegaste la línea completa'), 'bad paste guard message missing');
assert(badPaste.envText.includes(`MP_ACCESS_TOKEN=${dashToken}`), 'bad paste reprompt did not store clean token');

const quotePaste = installWithToken('interactive-quote-home', `"${dashToken}\n${dashToken}\n`);
assert(quotePaste.output.includes('Detecté comillas iniciales'), 'quote guard message missing');
assert(quotePaste.envText.includes(`MP_ACCESS_TOKEN=${dashToken}`), 'quote reprompt did not store clean token');

const whitespace = installWithToken('interactive-whitespace-home', `  ${dashToken}  \n`);
assert(whitespace.envText.includes(`MP_ACCESS_TOKEN=${dashToken}`), 'whitespace token was not stored trimmed');
assert(!whitespace.envText.includes(`MP_ACCESS_TOKEN=  ${dashToken}`), 'leading whitespace stored in token');
assert(!whitespace.envText.includes(`${dashToken}  `), 'trailing whitespace stored in token');

const combinedInstallOutputs = dash.output + underscore.output + badPaste.output + quotePaste.output + whitespace.output;
const combinedToolLogs = read(logs.openclaw) + read(logs.systemctl) + read(logs.npm);
for (const token of [dashToken, underscoreToken]) {
  assert(!combinedToolLogs.includes(token), 'MP token appeared in tool logs');
}
assert(!read(logs.systemctl).includes('--user enable --now openclaw-mp-finance.timer'), 'timer should not be enabled by default');
assert(read(logs.openclaw).includes('skills install'), 'openclaw skills install missing');

const doctorOutput = run('bash', ['installer/doctor.sh', '--home', dash.home], { home: dash.home });
writeFileSync(join(evidenceRoot, 'interactive-doctor-output.txt'), doctorOutput, 'utf8');
assert(doctorOutput.includes('MP_ACCESS_TOKEN: present (value not printed)'), 'doctor MP presence missing');
assert(doctorOutput.includes('FINANCE_API_TOKEN: present (value not printed)'), 'doctor finance presence missing');
assert(doctorOutput.includes('wrapper file: ok'), 'doctor wrapper file status missing');
assert(doctorOutput.includes('wrapper in PATH: warn'), 'doctor wrapper PATH warning missing');
assert(doctorOutput.includes('frontend readiness: ok'), 'frontend readiness missing');
assert(!doctorOutput.includes(dashToken), 'secret printed by doctor');

const wrapperPath = join(dash.home, '.local/bin/openclaw-mp-finance');
const frontendInfo = run(wrapperPath, ['frontend-info'], { home: dash.home });
writeFileSync(join(evidenceRoot, 'frontend-info-output.json'), frontendInfo, 'utf8');
assert(frontendInfo.includes('FRONTEND_READY_CONTRACT_OK'), 'frontend marker missing');
assert(frontendInfo.includes('API base URL: http://127.0.0.1:3766'), 'base URL missing');
assert(!frontendInfo.includes(dashToken), 'secret printed by frontend-info');

console.log('APP_USR_DASH_TOKEN_ACCEPTED_OK');
console.log('APP_USR_UNDERSCORE_TOKEN_ACCEPTED_OK');
console.log('MP_TOKEN_FALSE_WARNING_REMOVED_OK');
console.log('MP_TOKEN_BAD_PASTE_GUARD_OK');
console.log('MP_TOKEN_SECRET_REDACTION_OK');
console.log('WRAPPER_ABSOLUTE_COMMAND_OK');
console.log('WRAPPER_PATH_WARNING_OK');
console.log('FRONTEND_INFO_ABSOLUTE_PATH_OK');
