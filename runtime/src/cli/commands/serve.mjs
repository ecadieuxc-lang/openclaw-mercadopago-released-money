import { createApiServer } from '../../api/server.mjs';

const TOKEN_ENV_NAME = 'FINANCE_API_TOKEN';
const SYNTHETIC_TOKEN = 'synthetic-cli-smoke-token';

export async function runServe({ host, port, smoke }) {
  if (smoke !== true) {
    const error = new Error('Only --smoke mode is implemented for serve in this task');
    error.code = 'SERVE_REQUIRES_SMOKE';
    throw error;
  }
  if (host !== '127.0.0.1') {
    const error = new Error('Smoke serve only allows host 127.0.0.1');
    error.code = 'SMOKE_HOST_NOT_ALLOWED';
    throw error;
  }

  const oldToken = process.env[TOKEN_ENV_NAME];
  process.env[TOKEN_ENV_NAME] = SYNTHETIC_TOKEN;
  const app = await createApiServer();
  let closed = false;

  try {
    await app.listen({ host, port });
    const address = app.server.address();
    const url = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${url}/health`);
    const health = await response.json();
    if (!response.ok || health.status !== 'ok') {
      const error = new Error('Smoke health request failed');
      error.code = 'SMOKE_HEALTH_FAILED';
      throw error;
    }
    return { ok: true, mode: 'synthetic', url, smoke: { health: 'ok' } };
  } finally {
    await app.close();
    closed = true;
    if (oldToken === undefined) delete process.env[TOKEN_ENV_NAME];
    else process.env[TOKEN_ENV_NAME] = oldToken;
  }
}
