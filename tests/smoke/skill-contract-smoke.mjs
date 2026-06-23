#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const base = path.resolve('/workspace/projects/openclaw-mercadopago-released-money');
const skillPath = path.join(base, 'SKILL.md');
const behaviorPath = path.join(base, 'docs/openclaw-skill-behavior.md');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fail(message) {
  throw new Error(message);
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    fail(`${label} missing required text: ${needle}`);
  }
}

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    fail(`${label} contains forbidden text: ${needle}`);
  }
}

function assertMatch(haystack, pattern, label) {
  if (!pattern.test(haystack)) {
    fail(`${label} does not match ${pattern}`);
  }
}

function walkFiles(rootDir) {
  const files = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    const relative = path.relative(rootDir, entryPath);
    if (relative.startsWith('runtime/node_modules')) {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

if (!fs.existsSync(skillPath)) {
  fail('SKILL.md does not exist');
}
if (!fs.existsSync(behaviorPath)) {
  fail('docs/openclaw-skill-behavior.md does not exist');
}

const skill = readText(skillPath);
const behavior = readText(behaviorPath);
const combined = `${skill}\n${behavior}`;

assertMatch(skill, /^---\n[\s\S]*?\n---\n/, 'SKILL.md frontmatter');
assertMatch(skill, /^name: mercadopago-finance$/m, 'SKILL.md frontmatter');
assertMatch(skill, /^version: 0\.1\.0$/m, 'SKILL.md frontmatter');
assertIncludes(skill, 'description:', 'SKILL.md frontmatter');

const requiredText = [
  'mercadopago-finance',
  'Mercado Pago Released Money',
  'openclaw-mp-finance',
  'FINANCE_API_TOKEN',
  '127.0.0.1',
  '/v1/assistant/context',
  '/v1/finance/movements',
  '/v1/finance/clarifications',
  '/v1/system/doctor',
  'No inventar saldos',
  'No inventar destinatarios',
  'No mezclar ingresos',
  'No bancos',
  'No Open Banking',
  'No scraping',
];

for (const text of requiredText) {
  assertIncludes(combined, text, 'SKILL.md and docs/openclaw-skill-behavior.md');
}

const forbiddenText = [
  'APP_USR_',
  'BEGIN OPENSSH',
  'PRIVATE KEY',
  '/home/example-user',
  '/mnt/c',
  '/srv/roy-v2',
  'raw_json',
];

for (const text of forbiddenText) {
  assertNotIncludes(combined, text, 'SKILL.md and docs/openclaw-skill-behavior.md');
}

const forbiddenProjectFiles = walkFiles(base).filter((filePath) => {
  const name = path.basename(filePath);
  return (
    name === '.env' ||
    name === 'finance.sqlite' ||
    name.endsWith('.sqlite') ||
    name.endsWith('.sqlite3') ||
    name.endsWith('.db') ||
    name.endsWith('.log')
  );
});

if (forbiddenProjectFiles.length > 0) {
  fail(`forbidden project files exist: ${forbiddenProjectFiles.join(', ')}`);
}

process.stdout.write('SKILL_CONTRACT_SMOKE_OK\n');
