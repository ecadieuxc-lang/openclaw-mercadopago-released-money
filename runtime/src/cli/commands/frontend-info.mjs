import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

const PROJECT_NAME = 'openclaw-mercadopago-released-money';

function defaultEnvPath() {
  const home = process.env.HOME ?? '~';
  return join(home, '.config', PROJECT_NAME, 'secrets', '.env');
}

function readFinanceToken(envPath) {
  const text = readFileSync(envPath, 'utf8');
  const match = text.match(/^FINANCE_API_TOKEN=(.+)$/m);
  if (!match) {
    const error = new Error('FINANCE_API_TOKEN not found in secrets file');
    error.code = 'FINANCE_TOKEN_MISSING';
    throw error;
  }
  return match[1];
}

async function confirmSecretPrint({ yes }) {
  if (yes) return true;
  if (!process.stdin.isTTY) {
    const error = new Error('--show-token requires interactive confirmation or --yes');
    error.code = 'CONFIRMATION_REQUIRED';
    throw error;
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = await rl.question('ADVERTENCIA: se imprimirá FINANCE_API_TOKEN. Escribe MOSTRAR para continuar: ');
    return answer === 'MOSTRAR';
  } finally {
    rl.close();
  }
}

export async function runFrontendInfo(options = {}, projectRoot) {
  const envPath = String(options.env ?? defaultEnvPath());
  const showToken = options['show-token'] === true;
  const lines = [
    'FRONTEND_READY_CONTRACT_OK',
    'API base URL: http://127.0.0.1:3766',
    'Auth: Bearer token required',
    `Token location: ${envPath}`,
    'OpenAPI: runtime/src/api/openapi.v1.json',
    'Health endpoint: GET /health',
    'Assistant context: GET /v1/assistant/context',
    `Project root: ${projectRoot}`,
    'MP_ACCESS_TOKEN: never printed by this command',
  ];
  if (showToken) {
    if (!(await confirmSecretPrint({ yes: options.yes === true }))) {
      const error = new Error('Secret print not confirmed');
      error.code = 'CONFIRMATION_DECLINED';
      throw error;
    }
    lines.push('FINANCE_API_TOKEN: ' + readFinanceToken(envPath));
  } else {
    lines.push('FINANCE_API_TOKEN: hidden; use --show-token --yes only when you intentionally need to copy it');
  }
  return { ok: true, frontend_ready: true, text: lines.join('\n') };
}
