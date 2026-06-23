import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const base = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function fail(message) {
  console.error(`DOCUMENTATION_COMPLETE_SMOKE_FAIL: ${message}`);
  process.exit(1);
}

function read(relPath) {
  const fullPath = join(base, relPath);
  if (!existsSync(fullPath)) fail(`missing ${relPath}`);
  return readFileSync(fullPath, 'utf8');
}

function assertIncludes(relPath, patterns) {
  const text = read(relPath);
  for (const pattern of patterns) {
    const ok = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
    if (!ok) fail(`${relPath} missing ${pattern.toString()}`);
  }
}

const requiredDocs = [
  'README.md',
  'SECURITY.md',
  'SKILL.md',
  '.env.example',
  '.gitignore',
  'docs/architecture.md',
  'docs/installation.md',
  'docs/configuration.md',
  'docs/mercado-pago.md',
  'docs/data-model.md',
  'docs/data-flow.md',
  'docs/api-contract.md',
  'docs/openapi.md',
  'docs/api-local-fastify.md',
  'docs/cli.md',
  'docs/assistant-context.md',
  'docs/openclaw-skill-behavior.md',
  'docs/security.md',
  'docs/security-scan.md',
  'docs/release-secret-scan.md',
  'docs/threat-model.md',
  'docs/troubleshooting.md',
  'docs/frontend-integration.md',
  'docs/cortana-implementation-plan.md',
  'docs/dependencies.md',
  'docs/doctor.md',
  'docs/installer.md',
  'docs/uninstall.md',
];

for (const relPath of requiredDocs) read(relPath);

assertIncludes('README.md', [
  'Mercado Pago Released Money',
  /No bancos|no hace ni promete:[\s\S]*bancos/i,
  /No Open Banking|Open Banking/i,
  /No scraping|scraping/i,
  '127.0.0.1',
  '/v1/assistant/context',
  'mercadopago-finance',
  'openclaw-mp-finance',
]);

assertIncludes('docs/installation.md', ['dry-run']);
assertIncludes('docs/security.md', ['.env', '127.0.0.1']);
assertIncludes('docs/api-contract.md', ['/health', '/v1/assistant/context']);
assertIncludes('docs/openclaw-skill-behavior.md', ['SKILL.md', 'mercadopago-finance']);
assertIncludes('docs/cli.md', ['openclaw-mp-finance']);
assertIncludes('docs/frontend-integration.md', [
  /No frontend is implemented|no frontend/i,
  /future frontend|futuro frontend/i,
  /local API|API local/i,
]);

const publicMainSurfaces = [
  'README.md',
  'SECURITY.md',
  'SKILL.md',
  'docs/security.md',
  'docs/frontend-integration.md',
  'docs/troubleshooting.md',
  'docs/data-flow.md',
  'docs/api-contract.md',
  'docs/openclaw-skill-behavior.md',
];

const forbiddenSensitiveMarkers = [
  /APP_USR_/,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /sk-[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
];

for (const relPath of publicMainSurfaces) {
  const text = read(relPath);
  for (const pattern of forbiddenSensitiveMarkers) {
    if (pattern.test(text)) fail(`${relPath} contains forbidden marker ${pattern}`);
  }
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const rel = relative(base, fullPath);
    if (rel === 'runtime/node_modules' || rel.startsWith('runtime/node_modules/')) continue;
    const st = statSync(fullPath);
    if (st.isDirectory()) walk(fullPath, acc);
    else acc.push(rel);
  }
  return acc;
}

const forbiddenFiles = walk(base).filter((relPath) => {
  const name = relPath.split('/').pop();
  if (name === '.env') return true;
  if (name === 'finance.sqlite') return true;
  if (/\.(sqlite|sqlite3|db|log)$/i.test(name)) return true;
  return false;
});

if (forbiddenFiles.length > 0) {
  fail(`forbidden files present: ${forbiddenFiles.join(', ')}`);
}

console.log('DOCUMENTATION_COMPLETE_SMOKE_OK');
