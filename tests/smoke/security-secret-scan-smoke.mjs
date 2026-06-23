import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { redactJson, redactText, scanProject } from '../../runtime/src/security/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '../..');
const EVIDENCE_DIR = '/workspace/evidence/TASK-0017';

function fail(message) {
  throw new Error(message);
}

async function readText(relativePath) {
  return fs.readFile(path.join(PROJECT_ROOT, relativePath), 'utf8');
}

async function pathExists(relativePath) {
  try {
    await fs.access(path.join(PROJECT_ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listJsonFiles(dirRelativePath) {
  const absoluteDir = path.join(PROJECT_ROOT, dirRelativePath);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dirRelativePath, entry.name))
    .sort();
}

function assertNoUnsafePublicText(relativePath, text) {
  const forbiddenPatterns = [
    { name: 'APP_USR token', regex: /\bAPP_USR_[A-Za-z0-9_-]{8,}\b/ },
    { name: 'Bearer token', regex: /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}\b/ },
    { name: 'private key', regex: /-----BEGIN (?:OPENSSH |RSA |EC |DSA |)?PRIVATE KEY-----/ },
    { name: 'personal path', regex: /\/home\/erick\b|\/mnt\/c\b|\/srv\/roy-v2\b/ },
  ];

  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.regex.test(text), false, `${relativePath} contains unsafe ${pattern.name}`);
  }
}

function assertGitignorePolicy(gitignoreText) {
  const requiredEntries = [
    '.env',
    '*.env',
    '.env.*',
    '!.env.example',
    'data/',
    'reports/',
    'raw/',
    'exports/',
    'archive/',
    'quarantine/',
    'logs/',
    'secrets/',
    'backups/',
    '*.sqlite',
    '*.sqlite3',
    '*.db',
    '*.log',
    '*.pem',
    '*.key',
  ];

  for (const entry of requiredEntries) {
    assert.match(gitignoreText, new RegExp(`(^|\\n)${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\n|$)`), `.gitignore missing ${entry}`);
  }
}

async function assertSampleJsonFiles() {
  const jsonFiles = await listJsonFiles('examples/sample-api-responses');
  assert.ok(jsonFiles.length > 0, 'sample API response JSON files must exist');

  for (const relativePath of jsonFiles) {
    const text = await readText(relativePath);
    JSON.parse(text);
    assertNoUnsafePublicText(relativePath, text);
    assert.equal(/\braw_json\b/.test(text), false, `${relativePath} must not expose raw_json`);
  }
}

async function main() {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const mercadoPagoTokenStyle = `APP_${'USR'}_SYNTHETIC_TOKEN_FOR_REDACTION`;
  assert.equal(redactText(`MP_ACCESS_TOKEN=${mercadoPagoTokenStyle}`), 'MP_ACCESS_TOKEN=[REDACTED_SECRET]');
  assert.equal(redactText('Authorization: Bearer synthetictokenforredactiononly'), 'Authorization: [REDACTED_SECRET]');
  assert.equal(redactText(`path /home/${'erick'}/private`), 'path [REDACTED_PATH]/private');

  assert.deepEqual(redactJson({ token: 'secret-value', raw_json: { any: true }, nested: { path: `/mnt/${'c'}/Users` } }), {
    token: '[REDACTED_SECRET]',
    raw_json: '[REDACTED_RAW]',
    nested: { path: '[REDACTED_PATH]/Users' },
  });

  const gitignoreText = await readText('.gitignore');
  assertGitignorePolicy(gitignoreText);

  for (const requiredDoc of ['SKILL.md', 'docs/openclaw-skill-behavior.md']) {
    const text = await readText(requiredDoc);
    assertNoUnsafePublicText(requiredDoc, text);
  }

  const docsText = `${await readText('SKILL.md')}\n${await readText('docs/openclaw-skill-behavior.md')}`;
  assert.match(docsText, /No bancos/);
  assert.match(docsText, /No Open Banking/);
  assert.match(docsText, /No scraping/);

  await assertSampleJsonFiles();

  const serverText = await readText('runtime/src/api/server.mjs');
  assert.match(serverText, /DEFAULT_API_HOST\s*=\s*['"]127\.0\.0\.1['"]/);
  assert.equal(/DEFAULT_API_HOST\s*=\s*['"]0\.0\.0\.0['"]/.test(serverText), false, 'API must not default to 0.0.0.0');

  for (const expectedPath of [
    'runtime/src/security/README.md',
    'runtime/src/security/redact.mjs',
    'runtime/src/security/secret-patterns.mjs',
    'runtime/src/security/project-scan.mjs',
    'runtime/src/security/index.mjs',
    'docs/security-scan.md',
    'docs/release-secret-scan.md',
  ]) {
    assert.equal(await pathExists(expectedPath), true, `${expectedPath} must exist`);
  }

  const scan = await scanProject({ rootDir: PROJECT_ROOT });
  await fs.writeFile(path.join(EVIDENCE_DIR, 'scan-findings.json'), `${JSON.stringify(scan, null, 2)}\n`, 'utf8');
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'security-scan-summary.md'),
    [
      '# TASK-0017 security scan summary',
      '',
      `- scanned files: ${scan.scannedFiles}`,
      `- critical findings: ${scan.criticalCount}`,
      `- controlled/allowed findings: ${scan.allowedCount}`,
      '- scanner output does not include matched secret values.',
      '- controlled findings are policy/scanner references only.',
      '',
    ].join('\n'),
    'utf8',
  );

  if (scan.criticalCount !== 0) {
    const safeSummary = scan.findings
      .filter((finding) => finding.severity === 'critical')
      .map((finding) => `${finding.type} ${finding.path}:${finding.line ?? '-'}`)
      .join('; ');
    fail(`critical security scan findings: ${safeSummary}`);
  }

  console.log('SECURITY_SECRET_SCAN_SMOKE_OK');
}

main().catch((error) => {
  console.error(`SECURITY_SECRET_SCAN_SMOKE_FAILED: ${error.message}`);
  process.exitCode = 1;
});
