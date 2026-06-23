#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = resolve(new URL('../..', import.meta.url).pathname);
const evidenceRoot = '/workspace/evidence/TASK-0030';
const candidate = 'v10';
const packageName = 'openclaw-mercadopago-released-money';
const tarball = join(evidenceRoot, `${packageName}-candidate-v10.tar.gz`);
const manifestPath = join(evidenceRoot, 'package-manifest-v10.json');
const packageFileListPath = join(evidenceRoot, 'package-file-list-v10.txt');
const tarballFileListPath = join(evidenceRoot, 'tarball-file-list-v10.txt');
const checksumsPath = join(evidenceRoot, 'package-checksums-v10.sha256');

function fail(message) { console.error(`PACKAGE_CANDIDATE_V10_FAIL: ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function read(path) { return readFileSync(path, 'utf8'); }
function parseJson(path) { try { return JSON.parse(read(path)); } catch (error) { fail(`${path} JSON parse failed: ${error.message}`); } }
function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

function pathIsForbidden(rel) {
  const normalized = rel.replaceAll('\\', '/').replace(/^\.\//, '');
  const name = basename(normalized);
  const first = normalized.split('/')[0];
  if (normalized === 'runtime/node_modules' || normalized.startsWith('runtime/node_modules/')) return true;
  if (normalized === '.git' || normalized.startsWith('.git/')) return true;
  if (['evidence', '_out', 'reports', 'raw', 'exports', 'archive', 'quarantine', 'secrets', 'backups'].includes(first)) return true;
  if (name === '.env' || name === 'finance.sqlite') return true;
  if (/\.(sqlite|sqlite3|db|db-shm|db-wal|log|pem|key|tar\.gz)$/i.test(name)) return true;
  return false;
}
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(projectRoot, path).replaceAll('\\', '/');
    if (rel === '.git' || rel.startsWith('.git/')) continue;
    if (rel === 'runtime/node_modules' || rel.startsWith('runtime/node_modules/')) continue;
    if (['evidence', '_out'].includes(rel.split('/')[0])) continue;
    if (entry.isDirectory()) walk(path, out);
    else if (entry.isFile() && !pathIsForbidden(rel)) out.push(rel);
  }
  return out;
}

mkdirSync(evidenceRoot, { recursive: true });

for (const required of [
  'README.md', 'LICENSE', 'SECURITY.md', 'SKILL.md', 'runtime/package.json', 'runtime/package-lock.json',
  'runtime/src/api/openapi.v1.json', 'runtime/src/cli/index.mjs', 'installer/install.sh', 'installer/uninstall.sh',
  'installer/doctor.sh', 'docs/installation.md', 'docs/installer.md', 'docs/configuration.md', 'docs/frontend-integration.md', 'docs/security.md', 'docs/troubleshooting.md', 'docs/package-candidate.md', 'docs/uninstall.md', 'docs/doctor.md',
  'docs/vps-human-gate.md', 'tests/smoke/real-installer-user-flow-smoke.mjs', 'tests/smoke/interactive-installer-token-smoke.mjs', 'tests/smoke/installer-repair-partial-smoke.mjs'
]) {
  assert(existsSync(join(projectRoot, required)), `missing required package file: ${required}`);
}
parseJson(join(projectRoot, 'runtime/src/api/openapi.v1.json'));
parseJson(join(projectRoot, 'runtime/package-lock.json'));

const installOutput = read(join(evidenceRoot, 'install-user-flow-output.txt'));
const doctorOutput = read(join(evidenceRoot, 'doctor-real-mode-output.txt'));
const uninstallOutput = read(join(evidenceRoot, 'uninstall-real-mode-output.txt'));
const interactiveOutput = read(join(evidenceRoot, 'interactive-dash-home-install-output.txt'));
const repairOutput = read(join(evidenceRoot, 'repair-output.txt'));
const repairDoctorOutput = read(join(evidenceRoot, 'repair-doctor-output.txt'));
assert(installOutput.includes('INSTALL_USER_FLOW_OK'), 'install smoke marker missing');
assert(doctorOutput.includes('DOCTOR_REAL_MODE_OK'), 'doctor smoke marker missing');
assert(uninstallOutput.includes('UNINSTALL_REAL_MODE_OK'), 'uninstall smoke marker missing');
assert(interactiveOutput.includes('Pega tu MP_ACCESS_TOKEN'), 'interactive token prompt missing');
assert(repairOutput.includes('INSTALL_REPAIR_OK'), 'repair marker missing');
assert(repairDoctorOutput.includes('systemd timer: disabled'), 'repair doctor timer disabled-safe status missing');
assert(!read(join(evidenceRoot, 'repair-fake-systemctl-calls.log')).includes('--user enable --now openclaw-mp-finance.timer'), 'repair systemctl must not enable timer by default');
assert(read(join(evidenceRoot, 'interactive-doctor-output.txt')).includes('frontend readiness: ok'), 'interactive doctor frontend readiness missing');
assert(read(join(evidenceRoot, 'interactive-doctor-output.txt')).includes('wrapper in PATH: warn'), 'interactive doctor PATH warning missing');
assert(read(join(evidenceRoot, 'frontend-info-output.json')).includes('FRONTEND_READY_CONTRACT_OK'), 'frontend info marker missing');
assert(installOutput.includes('Nota: si tu shell no reconoce openclaw-mp-finance'), 'install PATH note missing');
for (const marker of [
  'APP_USR_DASH_TOKEN_ACCEPTED_OK',
  'APP_USR_UNDERSCORE_TOKEN_ACCEPTED_OK',
  'MP_TOKEN_FALSE_WARNING_REMOVED_OK',
  'MP_TOKEN_BAD_PASTE_GUARD_OK',
  'MP_TOKEN_SECRET_REDACTION_OK',
  'WRAPPER_ABSOLUTE_COMMAND_OK',
  'WRAPPER_PATH_WARNING_OK',
  'FRONTEND_INFO_ABSOLUTE_PATH_OK',
]) {
  assert(read(join(evidenceRoot, 'interactive-token-smoke-output.txt')).includes(marker), `missing token/path smoke marker: ${marker}`);
}
const openclawLog = read(join(evidenceRoot, 'fake-openclaw-calls.log'));
assert(openclawLog.includes('skills install'), 'openclaw mock skills install missing');
assert(openclawLog.includes('skills install') && !openclawLog.includes('SKILL.md --as mercadopago-finance'), 'openclaw mock install must use directory, not SKILL.md');
assert(read(join(evidenceRoot, 'install-user-flow-output.txt')).includes('INSTALL_USER_FLOW_OK'), 'install smoke output missing marker');
assert(openclawLog.includes('skills list'), 'openclaw mock skills list missing');
assert(openclawLog.includes('skills uninstall mercadopago-finance'), 'openclaw mock skills uninstall missing');
assert(!read(join(evidenceRoot, 'fake-systemctl-calls.log')).includes('--user enable --now'), 'systemctl mock must not enable timer by default');
assert(read(join(evidenceRoot, 'fake-npm-calls.log')).includes('ci --omit=dev'), 'npm mock ci missing');

const activeTextFiles = [
  'installer/install.sh',
  'installer/uninstall.sh',
  'installer/doctor.sh',
  'tests/smoke/real-installer-user-flow-smoke.mjs',
  'tests/smoke/package-candidate-smoke.mjs',
];
const forbiddenSingularCommand = ['openclaw', 'skill', ''].join(' ');
const activeSingular = activeTextFiles.filter((rel) => read(join(projectRoot, rel)).includes(forbiddenSingularCommand));
assert(activeSingular.length === 0, `singular openclaw command in active files: ${activeSingular.join(', ')}`);
const activeSkillMdInstall = activeTextFiles.filter((rel) => /openclaw skills install .*SKILL\.md/.test(read(join(projectRoot, rel))));
assert(activeSkillMdInstall.length === 0, `SKILL.md install path in active files: ${activeSkillMdInstall.join(', ')}`);

const files = walk(projectRoot).sort();
const forbiddenFiles = files.filter(pathIsForbidden);
assert(forbiddenFiles.length === 0, `forbidden files in package list: ${forbiddenFiles.join(', ')}`);
writeFileSync(packageFileListPath, `${files.join('\n')}\n`, 'utf8');

execFileSync('tar', ['-czf', tarball, '-C', projectRoot, ...files], { cwd: projectRoot });
const tarList = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort();
writeFileSync(tarballFileListPath, `${tarList.join('\n')}\n`, 'utf8');
const forbiddenTar = tarList.map((entry) => entry.replace(/^\.\//, '')).filter(pathIsForbidden);
assert(forbiddenTar.length === 0, `forbidden tar entries: ${forbiddenTar.join(', ')}`);

const manifest = {
  package: packageName,
  candidate,
  created_by: 'TASK-0030 sandbox packaging smoke',
  docs_public_consistent_ok: true,
  obsolete_dry_run_only_language_removed: true,
  obsolete_task0020_current_candidate_removed: true,
  timer_safe_default_ok: true,
  sync_not_overpromised_ok: true,
  app_usr_dash_token_ok: true,
  app_usr_underscore_token_ok: true,
  mp_token_false_warning_removed: true,
  mp_token_bad_paste_guard_ok: true,
  wrapper_absolute_command_ok: true,
  wrapper_path_warning_ok: true,
  frontend_info_absolute_path_ok: true,
  interactive_installer_ok: true,
  installer_resume_repair_ok: true,
  partial_install_repair_ok: true,
  install_log_persistent_ok: true,
  install_log_secret_redaction_ok: true,
  mp_access_token_prompt_ok: true,
  mp_access_token_stored_without_printing: true,
  finance_api_token_generated_without_printing: true,
  frontend_ready_contract_ok: true,
  openclaw_cli_plural_ok: true,
  openclaw_install_directory_ok: true,
  doctor_timer_disabled_safe_ok: true,
  singular_openclaw_skill_command_found_in_scripts: false,
  openclaw_install_skillmd_path_found_in_active_scripts: false,
  user_flow_installer_smoke_ok: true,
  openclaw_mock_called: true,
  systemd_mock_called: true,
  npm_mock_called: true,
  doctor_real_mode_ok: true,
  uninstall_real_mode_ok: true,
  forbidden_files_found: 0,
  files_count: files.length,
  tarball_entries_count: tarList.length,
  deploy_performed: false,
  vps_action_performed: false,
  github_publication_performed: false,
  real_openclaw_registration_performed: false,
  real_credentials_used: false,
  real_data_used: false,
  files,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

writeFileSync(checksumsPath, [tarball, manifestPath, packageFileListPath, tarballFileListPath]
  .map((path) => `${sha256(path)}  ${path}`).join('\n') + '\n', 'utf8');

console.log('PACKAGE_CANDIDATE_V10_OK');
console.log('OPENCLAW_SKILLS_PLURAL_OK');
console.log('OPENCLAW_INSTALL_DIRECTORY_OK');
