export const REDACTION_MARKERS = Object.freeze({
  secret: '[REDACTED_SECRET]',
  path: '[REDACTED_PATH]',
  raw: '[REDACTED_RAW]',
});

export const SECRET_VARIABLE_NAMES = Object.freeze([
  'MP_ACCESS_TOKEN',
  'FINANCE_API_TOKEN',
]);

export const PLACEHOLDER_VALUE_PATTERNS = Object.freeze([
  /^$/,
  /^replace_with_[a-z0-9_]+$/i,
  /^your_[a-z0-9_]+$/i,
  /^example[_-]?[a-z0-9_-]*$/i,
  /^placeholder$/i,
  /^changeme$/i,
  /^<[^>]+>$/,
  /^\$\{[A-Z0-9_]+\}$/,
]);

export const PROHIBITED_FILE_PATTERNS = Object.freeze([
  { name: 'env_file', test: (relativePath, basename) => basename === '.env' || (/^\.env\./.test(basename) && basename !== '.env.example') },
  { name: 'sqlite_file', test: (relativePath, basename) => /\.(sqlite|sqlite3)$/i.test(basename) || basename === 'finance.sqlite' },
  { name: 'database_file', test: (relativePath, basename) => /\.db$/i.test(basename) },
  { name: 'log_file', test: (relativePath, basename) => /\.log$/i.test(basename) },
]);

export const TEXT_SECRET_PATTERNS = Object.freeze([
  {
    id: 'mercado_pago_app_usr_token',
    description: 'Mercado Pago APP_USR style token',
    regex: /\bAPP_USR_[A-Za-z0-9_-]{8,}\b/g,
  },
  {
    id: 'bearer_token',
    description: 'Bearer token value',
    regex: /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}\b/g,
  },
  {
    id: 'private_key_block',
    description: 'Private key block',
    regex: /-----BEGIN (?:OPENSSH |RSA |EC |DSA |)?PRIVATE KEY-----/g,
  },
]);

export const PERSONAL_PATH_PATTERNS = Object.freeze([
  { id: 'home_erick', regex: /\/home\/erick\b/g },
  { id: 'windows_mount', regex: /\/mnt\/c\b/g },
  { id: 'roy_vps', regex: /\/srv\/roy-v2\b/g },
]);

export const PUBLIC_RAW_JSON_PATTERN = /\braw_json\b/g;

export function isPlaceholderValue(value) {
  const normalized = String(value ?? '').trim().replace(/^['"]|['"]$/g, '');
  return PLACEHOLDER_VALUE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isSecretVariableName(name) {
  return SECRET_VARIABLE_NAMES.includes(String(name));
}

export function looksLikeVariableAssignment(line) {
  return /^\s*(?:export\s+)?([A-Z][A-Z0-9_]{2,})\s*=\s*(.+?)\s*$/.exec(line);
}
