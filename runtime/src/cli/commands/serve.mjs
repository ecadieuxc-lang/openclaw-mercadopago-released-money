import { createApiServer } from '../../api/server.mjs';

const TOKEN_ENV_NAME = 'FINANCE_API_TOKEN';
const SYNTHETIC_TOKEN = 'synthetic-cli-smoke-token';

function makeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeHost(host) {
  return typeof host === 'string' && host.length > 0 ? host : '127.0.0.1';
}

function normalizePort(port) {
  const parsed = Number.parseInt(String(port || '3766'), 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    throw makeError('INVALID_PORT', 'Invalid API port');
  }
  return parsed;
}

function requireLocalHost(host, mode) {
  if (host !== '127.0.0.1') {
    throw makeError('HOST_NOT_ALLOWED', `${mode} serve only allows host 127.0.0.1`);
  }
}

async function runSmokeServe({ host, port }) {
  requireLocalHost(host, 'Smoke');

  const oldToken = process.env[TOKEN_ENV_NAME];
  process.env[TOKEN_ENV_NAME] = SYNTHETIC_TOKEN;

  const app = await createApiServer();

  try {
    await app.listen({ host, port });
    const address = app.server.address();
    const resolvedPort = address && typeof address === 'object' ? address.port : port;
    const url = `http://${host}:${resolvedPort}`;

    const response = await fetch(`${url}/health`);
    const health = await response.json();

    if (!response.ok || health.status !== 'ok') {
      throw makeError('SMOKE_HEALTH_FAILED', 'Smoke health request failed');
    }

    return { ok: true, mode: 'synthetic', url, smoke: { health: 'ok' } };
  } finally {
    await app.close();
    if (oldToken === undefined) delete process.env[TOKEN_ENV_NAME];
    else process.env[TOKEN_ENV_NAME] = oldToken;
  }
}

async function runRealServe({ host, port }) {
  requireLocalHost(host, 'Real');

  const configuredToken = process.env[TOKEN_ENV_NAME];
  if (typeof configuredToken !== 'string' || configuredToken.length === 0) {
    throw makeError('FINANCE_API_TOKEN_REQUIRED', 'FINANCE_API_TOKEN is required to start real serve');
  }

  const app = await createApiServer();
  let closed = false;

  async function closeAndExit(code) {
    if (!closed) {
      closed = true;
      await app.close();
    }
    process.exit(code);
  }

  process.once('SIGTERM', () => {
    closeAndExit(0).catch(() => process.exit(1));
  });

  process.once('SIGINT', () => {
    closeAndExit(0).catch(() => process.exit(1));
  });

  await app.listen({ host, port });

  const address = app.server.address();
  const resolvedPort = address && typeof address === 'object' ? address.port : port;
  const url = `http://${host}:${resolvedPort}`;

  process.stdout.write(JSON.stringify({
    ok: true,
    mode: 'real',
    url,
    auth: 'bearer_required',
    service: 'openclaw-mercadopago-released-money-local-api'
  }) + '\n');

  await new Promise(() => {});
}

export async function runServe({ host, port, smoke } = {}) {
  const resolvedHost = normalizeHost(host);
  const resolvedPort = normalizePort(port);

  if (smoke === true) {
    return runSmokeServe({ host: resolvedHost, port: resolvedPort });
  }

  return runRealServe({ host: resolvedHost, port: resolvedPort });
}
