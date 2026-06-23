#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve('/workspace/projects/openclaw-mercadopago-released-money');

function fail(message) {
  console.error(`PRE_VPS_GITHUB_REVIEW_SMOKE_FAIL: ${message}`);
  process.exit(1);
}

function read(rel) {
  const full = path.join(base, rel);
  if (!fs.existsSync(full)) fail(`missing ${rel}`);
  return fs.readFileSync(full, 'utf8');
}

function requireFile(rel) {
  const full = path.join(base, rel);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) fail(`missing file ${rel}`);
}

function requireDir(rel) {
  const full = path.join(base, rel);
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) fail(`missing directory ${rel}`);
}

function requireContains(rel, needle) {
  const text = read(rel);
  if (!text.includes(needle)) fail(`${rel} missing ${needle}`);
}

function parseJson(rel) {
  try {
    JSON.parse(read(rel));
  } catch (error) {
    fail(`${rel} is not valid JSON: ${error.message}`);
  }
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (rel === 'runtime/node_modules') continue;
      walk(full, visit);
    } else if (entry.isFile()) {
      visit(full, rel);
    }
  }
}

const requiredFiles = [
  'docs/pre-vps-human-review.md',
  'docs/pre-github-publication-review.md',
  'docs/next-vps-test-plan.md',
  'README.md',
  'SECURITY.md',
  'LICENSE',
  '.gitignore',
  '.env.example',
  'SKILL.md',
  'runtime/package.json',
  'runtime/package-lock.json',
  'runtime/src/api/openapi.v1.json',
  'installer/install.sh',
  'installer/uninstall.sh',
  'installer/doctor.sh',
  'docs/release-checklist.md',
  'docs/release-readiness.md',
  'docs/package-candidate.md',
  'docs/vps-human-gate.md',
  'docs/installation.md',
  'docs/security.md',
  'docs/troubleshooting.md',
  'docs/frontend-integration.md',
  'examples/sample-released-money.csv',
  'examples/sample-config.example.json',
  'examples/sample-api-responses/health.json',
];

for (const rel of requiredFiles) requireFile(rel);
requireDir('tests/smoke');

parseJson('runtime/src/api/openapi.v1.json');
for (const entry of fs.readdirSync(path.join(base, 'examples/sample-api-responses'))) {
  if (entry.endsWith('.json')) parseJson(`examples/sample-api-responses/${entry}`);
}

const reviewDocs = [
  'docs/pre-vps-human-review.md',
  'docs/pre-github-publication-review.md',
  'docs/next-vps-test-plan.md',
];

for (const rel of reviewDocs) {
  for (const needle of [
    'GitHub publication',
    'VPS',
    'OpenClaw',
    'Mercado Pago',
    'timer',
    'sync',
  ]) {
    requireContains(rel, needle);
  }
}

for (const rel of ['docs/pre-vps-human-review.md', 'docs/pre-github-publication-review.md']) {
  const text = read(rel);
  if (!text.includes('WAIT HUMAN APPROVAL') && !text.includes('GO técnico condicionado')) fail(`${rel} missing v10 gate terms`);
  if (!/timer/i.test(text)) fail(`${rel} missing timer safety review`);
}

const forbiddenExactNames = new Set(['.env', 'finance.sqlite']);
const forbiddenSuffixes = ['.sqlite', '.sqlite3', '.db', '.db-shm', '.db-wal', '.log', '.pem', '.key'];
const forbiddenFiles = [];
walk(base, (_full, rel) => {
  const name = path.basename(rel);
  if (forbiddenExactNames.has(name) || forbiddenSuffixes.some((suffix) => name.endsWith(suffix))) {
    forbiddenFiles.push(rel);
  }
});
if (forbiddenFiles.length > 0) fail(`forbidden files found: ${forbiddenFiles.join(', ')}`);

const markerFiles = [
  'README.md',
  'SECURITY.md',
  'SKILL.md',
  'docs/pre-vps-human-review.md',
  'docs/pre-github-publication-review.md',
  'docs/next-vps-test-plan.md',
];
const criticalMarkers = [
  'BEGIN OPENSSH',
  'PRIVATE KEY',
  '/home/example-user',
  '/mnt/c',
  '/srv/roy-v2',
];
for (const rel of markerFiles) {
  const text = read(rel);
  for (const marker of criticalMarkers) {
    if (text.includes(marker)) fail(`${rel} contains critical marker ${marker}`);
  }
}

const skill = read('SKILL.md');
for (const needle of [
  'mercadopago-finance',
  '/v1/assistant/context',
  'No inventar saldos',
  'No inventar destinatarios',
]) {
  if (!skill.includes(needle)) fail(`SKILL.md missing ${needle}`);
}

const openapi = JSON.parse(read('runtime/src/api/openapi.v1.json'));
const servers = JSON.stringify(openapi.servers ?? []);
if (!servers.includes('127.0.0.1')) fail('OpenAPI does not declare 127.0.0.1 server');
const paths = openapi.paths ?? {};
if (!paths['/health']) fail('OpenAPI missing /health');
const v1Paths = Object.keys(paths).filter((key) => key.startsWith('/v1/'));
if (v1Paths.length === 0) fail('OpenAPI missing /v1/* paths');
const securityText = JSON.stringify({ global: openapi.security ?? [], schemes: openapi.components?.securitySchemes ?? {}, v1: v1Paths.map((key) => paths[key]) });
if (!securityText.includes('bearer') && !securityText.includes('Bearer')) fail('OpenAPI /v1/* paths do not reference Bearer auth');

const readme = read('README.md');
for (const needle of ['doctor', 'import', 'export', 'serve', '127.0.0.1']) {
  if (!readme.includes(needle)) fail(`README.md missing ${needle}`);
}

console.log('PRE_VPS_GITHUB_REVIEW_SMOKE_OK');
