import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  PERSONAL_PATH_PATTERNS,
  PROHIBITED_FILE_PATTERNS,
  PUBLIC_RAW_JSON_PATTERN,
  TEXT_SECRET_PATTERNS,
  isPlaceholderValue,
  isSecretVariableName,
  looksLikeVariableAssignment,
} from './secret-patterns.mjs';

const DEFAULT_IGNORED_DIRS = new Set([
  '.git',
  'runtime/node_modules',
  'node_modules',
  'coverage',
  'dist',
  'build',
]);

const DEFAULT_IGNORED_FILES = new Set([
  'runtime/package-lock.json',
  'runtime/node_modules/.package-lock.json',
]);

const CONTROLLED_REFERENCE_PATHS = [
  '.env.example',
  'docs/',
  'docs/secrets-policy.md',
  'docs/security-scan.md',
  'docs/release-secret-scan.md',
  'docs/threat-model.md',
  'runtime/src/',
  'runtime/src/security/',
  'tests/smoke/',
  'tests/smoke/security-secret-scan-smoke.mjs',
];

const PUBLIC_RESPONSE_PATHS = [
  'examples/sample-api-responses/',
  'SKILL.md',
  'docs/openclaw-skill-behavior.md',
];

function normalizeRelative(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function shouldIgnoreRelative(relativePath) {
  const normalized = normalizeRelative(relativePath);
  if (DEFAULT_IGNORED_FILES.has(normalized)) return true;
  if (normalized.startsWith('evidence/') || normalized.startsWith('_out/') || normalized.startsWith('_in/')) return true;
  for (const ignoredDir of DEFAULT_IGNORED_DIRS) {
    if (normalized === ignoredDir || normalized.startsWith(`${ignoredDir}/`)) return true;
  }
  return false;
}

function isControlledReference(relativePath) {
  const normalized = normalizeRelative(relativePath);
  return CONTROLLED_REFERENCE_PATHS.some((entry) => normalized === entry || normalized.startsWith(entry));
}

function isPublicResponseSurface(relativePath) {
  const normalized = normalizeRelative(relativePath);
  return PUBLIC_RESPONSE_PATHS.some((entry) => normalized === entry || normalized.startsWith(entry));
}

function lineNumberForOffset(text, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

function makeFinding({ type, severity = 'critical', path: filePath, line = null, message }) {
  return { type, severity, path: filePath, line, message };
}

async function walkProject(rootDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = normalizeRelative(path.relative(rootDir, absolutePath));
      if (shouldIgnoreRelative(relativePath)) continue;
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (entry.isFile()) {
        files.push({ absolutePath, relativePath, basename: entry.name });
      }
    }
  }

  await walk(rootDir);
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return files;
}

function scanProhibitedFile(file) {
  const findings = [];
  for (const pattern of PROHIBITED_FILE_PATTERNS) {
    if (pattern.test(file.relativePath, file.basename)) {
      findings.push(makeFinding({
        type: 'prohibited_file',
        path: file.relativePath,
        message: `Prohibited public package file detected: ${pattern.name}`,
      }));
    }
  }
  return findings;
}

function scanTextFile(file, text) {
  const findings = [];
  const controlledReference = isControlledReference(file.relativePath);

  const lines = text.split(/\r?\n/);
  lines.forEach((lineText, index) => {
    const assignment = looksLikeVariableAssignment(lineText);
    if (!assignment) return;
    const [, name, value] = assignment;
    if (!isSecretVariableName(name)) return;
    findings.push(makeFinding({
      type: isPlaceholderValue(value) ? 'secret_assignment_placeholder' : 'possible_secret_assignment',
      severity: isPlaceholderValue(value) || controlledReference ? 'allowed' : 'critical',
      path: file.relativePath,
      line: index + 1,
      message: isPlaceholderValue(value)
        ? `${name} appears with a placeholder value.`
        : `${name} appears assigned to a non-placeholder value; value redacted from output.`,
    }));
  });

  for (const pattern of TEXT_SECRET_PATTERNS) {
    for (const match of text.matchAll(pattern.regex)) {
      findings.push(makeFinding({
        type: pattern.id,
        severity: controlledReference ? 'allowed' : 'critical',
        path: file.relativePath,
        line: lineNumberForOffset(text, match.index ?? 0),
        message: controlledReference
          ? `Controlled scanner/policy reference: ${pattern.description}.`
          : `Possible secret detected: ${pattern.description}; value redacted from output.`,
      }));
    }
  }

  for (const pattern of PERSONAL_PATH_PATTERNS) {
    for (const match of text.matchAll(pattern.regex)) {
      findings.push(makeFinding({
        type: `personal_path_${pattern.id}`,
        severity: controlledReference ? 'allowed' : 'critical',
        path: file.relativePath,
        line: lineNumberForOffset(text, match.index ?? 0),
        message: controlledReference
          ? 'Controlled policy/scanner reference to a prohibited path.'
          : 'Prohibited personal path detected; path redacted from output.',
      }));
    }
  }

  if (isPublicResponseSurface(file.relativePath)) {
    for (const match of text.matchAll(PUBLIC_RAW_JSON_PATTERN)) {
      findings.push(makeFinding({
        type: 'public_raw_json_reference',
        path: file.relativePath,
        line: lineNumberForOffset(text, match.index ?? 0),
        message: 'raw_json appears in public-facing content.',
      }));
    }
  }

  if (file.relativePath === 'runtime/src/api/server.mjs' && /DEFAULT_API_HOST\s*=\s*['"]0\.0\.0\.0['"]/.test(text)) {
    findings.push(makeFinding({
      type: 'api_public_default_host',
      path: file.relativePath,
      message: 'API default host must not be 0.0.0.0.',
    }));
  }

  return findings;
}

export async function scanProject({ rootDir }) {
  if (!rootDir) throw new Error('scanProject requires rootDir');

  const files = await walkProject(rootDir);
  const findings = [];

  for (const file of files) {
    findings.push(...scanProhibitedFile(file));
    let text;
    try {
      text = await fs.readFile(file.absolutePath, 'utf8');
    } catch (error) {
      if (error.code === 'ERR_INVALID_ARG_VALUE') continue;
      throw error;
    }
    findings.push(...scanTextFile(file, text));
  }

  const criticalFindings = findings.filter((finding) => finding.severity === 'critical');
  const allowedFindings = findings.filter((finding) => finding.severity === 'allowed');

  return {
    rootDir,
    scannedFiles: files.length,
    criticalCount: criticalFindings.length,
    allowedCount: allowedFindings.length,
    findings,
  };
}
