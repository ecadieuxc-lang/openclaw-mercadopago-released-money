import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const base = path.resolve(path.dirname(__filename), '../..');
const apiPath = path.join(base, 'runtime/src/api/openapi.v1.json');
const examplesDir = path.join(base, 'examples/sample-api-responses');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const openapi = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
assert(openapi.openapi, 'missing openapi');
assert(openapi.info, 'missing info');
assert(openapi.paths, 'missing paths');
assert(openapi.components?.securitySchemes?.financeBearerAuth, 'missing financeBearerAuth');

const requiredEndpoints = [
  '/health',
  '/v1/system/doctor',
  '/v1/system/config/public',
  '/v1/system/schema-version',
  '/v1/imports/status',
  '/v1/finance/home',
  '/v1/finance/movements',
  '/v1/finance/periods/current',
  '/v1/finance/periods/{period_id}/summary',
  '/v1/finance/history',
  '/v1/finance/clarifications',
  '/v1/finance/clarifications/{id}/answer',
  '/v1/finance/coach/current',
  '/v1/finance/coach/{period_id}',
  '/v1/assistant/context',
  '/v1/assistant/spending-summary',
  '/v1/assistant/period/{period_id}',
  '/v1/exports/current-period.csv',
  '/v1/exports/periods/{period_id}.csv',
  '/v1/exports/periods/{period_id}/summary.json'
];
for (const endpoint of requiredEndpoints) {
  assert(openapi.paths[endpoint], `missing endpoint ${endpoint}`);
}
assert(Array.isArray(openapi.paths['/health'].get.security) && openapi.paths['/health'].get.security.length === 0, '/health must be public');
assert(Array.isArray(openapi.security) && openapi.security.some((entry) => Object.hasOwn(entry, 'financeBearerAuth')), 'global bearer security missing');
for (const endpoint of requiredEndpoints.filter((item) => item.startsWith('/v1/'))) {
  const methods = Object.values(openapi.paths[endpoint]);
  assert(methods.length > 0, `missing methods for ${endpoint}`);
  for (const op of methods) {
    const localSecurity = op.security;
    const inheritsGlobal = localSecurity === undefined && openapi.security?.some((entry) => Object.hasOwn(entry, 'financeBearerAuth'));
    const hasLocalBearer = Array.isArray(localSecurity) && localSecurity.some((entry) => Object.hasOwn(entry, 'financeBearerAuth'));
    assert(inheritsGlobal || hasLocalBearer, `${endpoint} must declare or inherit bearer security`);
  }
}

const forbiddenPatterns = [/MP_ACCESS_TOKEN/, /FINANCE_API_TOKEN/, /APP_USR_/, /BEGIN OPENSSH/, /PRIVATE KEY/, /\/home\/erick/, /\/mnt\/c/, /\/srv\/roy-v2/, /raw_json/];
const parsedExamples = new Map();
for (const fileName of fs.readdirSync(examplesDir).filter((name) => name.endsWith('.json'))) {
  const fullPath = path.join(examplesDir, fileName);
  const text = fs.readFileSync(fullPath, 'utf8');
  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${fileName} contains forbidden pattern ${pattern}`);
  }
  parsedExamples.set(fileName, JSON.parse(text));
}

for (const fileName of ['finance-home.json', 'movements.json', 'assistant-context.json']) {
  const text = JSON.stringify(parsedExamples.get(fileName));
  assert(text.includes('Mercado Pago Released Money'), `${fileName} missing scope metadata`);
}

const movements = parsedExamples.get('movements.json').items;
assert(Array.isArray(movements), 'movements items must be an array');
for (const movement of movements) {
  if (movement.amount_signed > 0) {
    assert(!Object.hasOwn(movement, 'expense_category'), `income ${movement.id} must not contain expense_category`);
  }
  if (movement.amount_signed < 0) {
    assert(!Object.hasOwn(movement, 'income_kind'), `expense ${movement.id} must not contain income_kind`);
  }
}

console.log('API_CONTRACT_OPENAPI_SMOKE_OK');
