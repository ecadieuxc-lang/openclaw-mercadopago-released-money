import assert from 'node:assert/strict';

import { createApiServer } from '../../runtime/src/api/server.mjs';

const TEST_TOKEN = 'synthetic-local-api-smoke-token';
const TOKEN_ENV_NAME = 'FINANCE_API_TOKEN';
const FORBIDDEN_RESPONSE_MARKERS = [
  ['APP', 'USR', ''].join('_'),
  ['MP', 'ACCESS', 'TOKEN'].join('_'),
  ['FINANCE', 'API', 'TOKEN'].join('_'),
  ['PRIVATE', 'KEY'].join(' '),
  ['BEGIN', 'OPENSSH'].join(' '),
  ['/', 'home', 'erick'].join(''),
  ['/', 'mnt', 'c'].join(''),
  ['/', 'srv', 'roy-v2'].join(''),
  ['raw', 'json'].join('_'),
];

function authHeaders(token = TEST_TOKEN) {
  return { authorization: `Bearer ${token}` };
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  assertNoForbiddenMarkers(text, path);
  const json = text.length > 0 ? JSON.parse(text) : null;
  return { response, text, json };
}

function assertNoForbiddenMarkers(text, label) {
  for (const marker of FORBIDDEN_RESPONSE_MARKERS) {
    assert.equal(text.includes(marker), false, `${label} contains forbidden marker ${marker}`);
  }
}

function assertDirectionCategories(movement) {
  if (Number(movement.amount_signed) > 0) {
    assert.equal(Object.hasOwn(movement, 'expense_category'), false, `${movement.id} income has expense_category`);
  }
  if (Number(movement.amount_signed) < 0) {
    assert.equal(Object.hasOwn(movement, 'income_kind'), false, `${movement.id} expense has income_kind`);
  }
}

const oldToken = process.env[TOKEN_ENV_NAME];
process.env[TOKEN_ENV_NAME] = TEST_TOKEN;
const app = await createApiServer();
let serverClosed = false;

try {
  await app.listen({ host: '127.0.0.1', port: 0 });
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await requestJson(baseUrl, '/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.json.host, '127.0.0.1');

  const missingAuth = await requestJson(baseUrl, '/v1/system/doctor');
  assert.equal(missingAuth.response.status, 401);
  assert.equal(missingAuth.json.error.code, 'UNAUTHORIZED');

  const wrongAuth = await requestJson(baseUrl, '/v1/system/doctor', { headers: authHeaders('wrong-synthetic-token') });
  assert.equal(wrongAuth.response.status, 401);
  assert.equal(wrongAuth.json.error.code, 'UNAUTHORIZED');

  const doctor = await requestJson(baseUrl, '/v1/system/doctor', { headers: authHeaders() });
  assert.equal(doctor.response.status, 200);
  assert.equal(doctor.json.status, 'ok');

  const schema = await requestJson(baseUrl, '/v1/system/schema-version', { headers: authHeaders() });
  assert.equal(schema.response.status, 200);
  assert.equal(schema.json.schema_version, 1);
  assert.equal(schema.json.schema_name, '0001_initial_schema');

  const home = await requestJson(baseUrl, '/v1/finance/home', { headers: authHeaders() });
  assert.equal(home.response.status, 200);
  assert.equal(home.json.current_period.period_id, '2026-06');
  assert.equal(typeof home.json.totals.income_total, 'number');
  assert.equal(typeof home.json.totals.expense_total, 'number');

  const movements = await requestJson(baseUrl, '/v1/finance/movements?limit=10', { headers: authHeaders() });
  assert.equal(movements.response.status, 200);
  assert.equal(Array.isArray(movements.json.items), true);
  assert.ok(movements.json.items.length >= 3);
  for (const movement of movements.json.items) assertDirectionCategories(movement);
  assert.equal(movements.text.includes('raw_json'), false);

  const assistantContext = await requestJson(baseUrl, '/v1/assistant/context', { headers: authHeaders() });
  assert.equal(assistantContext.response.status, 200);
  assert.equal(Array.isArray(assistantContext.json.agent_rules), true);
  assert.equal(Array.isArray(assistantContext.json.highlights), true);

  const minimumJsonRoutes = [
    '/v1/system/config/public',
    '/v1/imports/status',
    '/v1/finance/periods/current',
    '/v1/finance/periods/2026-06/summary',
    '/v1/finance/history',
    '/v1/finance/clarifications',
    '/v1/finance/coach/current',
    '/v1/finance/coach/2026-06',
    '/v1/assistant/spending-summary',
    '/v1/assistant/period/2026-06',
  ];
  for (const route of minimumJsonRoutes) {
    const result = await requestJson(baseUrl, route, { headers: authHeaders() });
    assert.equal(result.response.status, 200, `${route} should respond 200`);
  }

  const clarificationAnswer = await requestJson(baseUrl, '/v1/finance/clarifications/clar_synthetic_transfer_001/answer', {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ answer: 'synthetic_review_only' }),
  });
  assert.equal(clarificationAnswer.response.status, 200);
  assert.equal(clarificationAnswer.json.persisted, false);

  const csvResponse = await fetch(`${baseUrl}/v1/exports/current-period.csv`, { headers: authHeaders() });
  const csvText = await csvResponse.text();
  assertNoForbiddenMarkers(csvText, 'csv export');
  assert.equal(csvResponse.status, 200);
  assert.match(csvResponse.headers.get('content-type') ?? '', /text\/csv/);
  assert.ok(csvText.startsWith('period_id,period_label,movement_id'));

  const summary = await requestJson(baseUrl, '/v1/exports/periods/2026-06/summary.json', { headers: authHeaders() });
  assert.equal(summary.response.status, 200);
  assert.equal(summary.json.period_id, '2026-06');
  assert.equal(typeof summary.json.net_total, 'number');
} finally {
  await app.close();
  serverClosed = true;
  if (oldToken === undefined) delete process.env[TOKEN_ENV_NAME];
  else process.env[TOKEN_ENV_NAME] = oldToken;
}

assert.equal(serverClosed, true);
process.stdout.write('API_LOCAL_FASTIFY_SMOKE_OK\n');
