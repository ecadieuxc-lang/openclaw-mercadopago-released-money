#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(new URL('../..', import.meta.url).pathname);
const docs = [
  'README.md',
  'SECURITY.md',
  'SKILL.md',
  'docs/installation.md',
  'docs/installer.md',
  'docs/configuration.md',
  'docs/frontend-integration.md',
  'docs/troubleshooting.md',
  'docs/package-candidate.md',
  'docs/release-checklist.md',
  'docs/pre-github-publication-review.md',
  'docs/pre-vps-human-review.md',
  'docs/release-readiness.md',
  'docs/release-notes-draft.md',
  'docs/next-vps-test-plan.md',
];

function fail(message) {
  console.error(`PUBLIC_DOCS_CONSISTENCY_FAIL: ${message}`);
  process.exit(1);
}
function read(rel) {
  const full = join(projectRoot, rel);
  if (!existsSync(full)) fail(`missing ${rel}`);
  return readFileSync(full, 'utf8');
}

const obsoletePatterns = [
  /dry-run-only/i,
  /solo `--dry-run`/i,
  /TASK-0020/i,
  /pre-GitHub/i,
  /pre-VPS/i,
  /Instalación interactiva v9/i,
  /habilita el timer si hay token/i,
  /sync automático listo/i,
  /OpenClaw real no está soportado/i,
];

for (const rel of docs) {
  const text = read(rel);
  for (const pattern of obsoletePatterns) {
    if (pattern.test(text)) fail(`${rel} contains obsolete language: ${pattern}`);
  }
}

const install = read('installer/install.sh');
if (install.includes('systemctl --user enable --now openclaw-mp-finance.timer')) {
  fail('installer enables timer by default');
}
if (!install.includes('installed-disabled (safe default)')) fail('installer missing disabled timer summary');
if (!install.includes('sync_capability: not implemented/validated')) fail('installer missing sync capability warning');

const doctor = read('installer/doctor.sh');
if (!doctor.includes('sync capability:')) fail('doctor missing sync capability output');
if (!doctor.includes('systemd timer: installed-disabled / not enabled by default')) fail('doctor dry-run missing timer safe default');

const requiredDocText = [
  ['README.md', 'timer systemd deshabilitado por defecto'],
  ['docs/installation.md', 'Timer seguro por defecto'],
  ['docs/installer.md', 'timer queda disabled por defecto'],
  ['docs/release-checklist.md', 'Timer seguro por defecto: disabled'],
  ['docs/release-readiness.md', 'No hay frontend incluido'],
  ['docs/package-candidate.md', 'sync_not_overpromised_ok'],
];
for (const [rel, needle] of requiredDocText) {
  if (!read(rel).includes(needle)) fail(`${rel} missing required v10 text: ${needle}`);
}

console.log('PUBLIC_DOCS_CONSISTENCY_OK');
console.log('TIMER_SAFE_DEFAULT_DOCS_OK');
console.log('SYNC_NOT_OVERPROMISED_OK');
