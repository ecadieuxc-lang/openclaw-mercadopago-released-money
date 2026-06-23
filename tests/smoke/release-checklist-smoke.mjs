#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const base = path.resolve(path.dirname(thisFile), '..', '..');

const failures = [];

function fail(message) {
  failures.push(message);
}

function projectPath(relativePath) {
  return path.join(base, relativePath);
}

function assertFile(relativePath) {
  const absolutePath = projectPath(relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`Missing file: ${relativePath}`);
  }
}

function assertDir(relativePath) {
  const absolutePath = projectPath(relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    fail(`Missing directory: ${relativePath}`);
  }
}

function readText(relativePath) {
  const absolutePath = projectPath(relativePath);
  try {
    return fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    fail(`Cannot read ${relativePath}: ${error.message}`);
    return '';
  }
}

function parseJsonFile(relativePath) {
  const text = readText(relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function walkFiles(root, options = {}) {
  const results = [];
  const skipAbsolute = new Set((options.skip ?? []).map((item) => path.resolve(item)));

  function walk(current) {
    const resolved = path.resolve(current);
    if (skipAbsolute.has(resolved)) {
      return;
    }

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      fail(`Cannot read directory ${path.relative(base, current)}: ${error.message}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const fullResolved = path.resolve(fullPath);
      if (skipAbsolute.has(fullResolved)) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  walk(root);
  return results;
}

function assertContains(relativePath, requiredStrings) {
  const text = readText(relativePath);
  for (const required of requiredStrings) {
    if (!text.includes(required)) {
      fail(`${relativePath} does not contain required text: ${required}`);
    }
  }
}

const requiredFiles = [
  'README.md',
  'SECURITY.md',
  'LICENSE',
  'SKILL.md',
  '.env.example',
  '.gitignore',
  'runtime/package.json',
  'runtime/package-lock.json',
  'runtime/src/api/openapi.v1.json',
  'docs/release-checklist.md',
  'docs/release-readiness.md',
  'docs/security.md',
  'docs/security-scan.md',
  'docs/release-secret-scan.md',
  'docs/installation.md',
  'docs/uninstall.md',
  'docs/doctor.md',
  'docs/openclaw-skill-behavior.md',
  'tests/smoke/security-secret-scan-smoke.mjs',
  'tests/smoke/documentation-complete-smoke.mjs',
  'tests/smoke/skill-contract-smoke.mjs',
  'tests/smoke/api-local-fastify-smoke.mjs',
  'tests/smoke/cli-smoke.mjs',
];

for (const relativePath of requiredFiles) {
  assertFile(relativePath);
}

assertDir('examples/sample-api-responses');

const openapi = parseJsonFile('runtime/src/api/openapi.v1.json');
if (openapi) {
  const serverUrls = Array.isArray(openapi.servers) ? openapi.servers.map((server) => server.url) : [];
  if (!serverUrls.some((url) => typeof url === 'string' && url.includes('127.0.0.1'))) {
    fail('OpenAPI does not declare host 127.0.0.1');
  }
}

parseJsonFile('runtime/package-lock.json');

const examplesDir = projectPath('examples/sample-api-responses');
const exampleJsonFiles = walkFiles(examplesDir).filter((file) => file.endsWith('.json'));
if (exampleJsonFiles.length === 0) {
  fail('No JSON examples found under examples/sample-api-responses');
}
for (const file of exampleJsonFiles) {
  parseJsonFile(path.relative(base, file));
}

assertContains('docs/release-checklist.md', [
  '- [',
  'No bancos',
  'No Open Banking',
  'No scraping',
  'No frontend',
  '127.0.0.1',
  'Bearer auth',
  'CORS off por defecto',
  'expense_category',
  'income_kind',
  'No inventar destinatarios',
  'Timer seguro por defecto',
  'OpenClaw plural',
]);

assertContains('docs/release-readiness.md', [
  'Estado v10',
  'Qué está listo',
  'Qué no se debe prometer',
  'timer systemd --user',
  'GitHub público',
]);

assertContains('SKILL.md', [
  'mercadopago-finance',
  'openclaw-mp-finance',
  'FINANCE_API_TOKEN',
  '/v1/assistant/context',
]);

const forbiddenProjectFiles = walkFiles(base, {
  skip: [projectPath('runtime/node_modules')],
}).filter((file) => {
  const name = path.basename(file);
  return name === '.env'
    || name === 'finance.sqlite'
    || name.endsWith('.sqlite')
    || name.endsWith('.sqlite3')
    || name.endsWith('.db')
    || name.endsWith('.log');
});

if (forbiddenProjectFiles.length > 0) {
  for (const file of forbiddenProjectFiles) {
    fail(`Forbidden project file exists: ${path.relative(base, file)}`);
  }
}

const prohibitedMarkers = [
  'BEGIN OPENSSH',
  'PRIVATE KEY',
  '/home/example-user',
  '/mnt/c',
  '/srv/roy-v2',
];

for (const relativePath of [
  'README.md',
  'SECURITY.md',
  'SKILL.md',
  'docs/release-checklist.md',
  'docs/release-readiness.md',
]) {
  const text = readText(relativePath);
  for (const marker of prohibitedMarkers) {
    if (text.includes(marker)) {
      fail(`${relativePath} contains prohibited marker: ${marker}`);
    }
  }
}

assertContains('docs/release-checklist.md', [
  'No frontend en esta fase',
]);
assertContains('docs/release-readiness.md', [
  'No hay frontend incluido',
]);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`RELEASE_CHECKLIST_SMOKE_FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log('RELEASE_CHECKLIST_SMOKE_OK');
