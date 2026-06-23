import { unauthorizedResponse } from './errors.mjs';

const TOKEN_ENV_NAME = 'FINANCE_API_TOKEN';

function readConfiguredToken() {
  const token = process.env[TOKEN_ENV_NAME];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

function bearerTokenFromHeader(header) {
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function isV1Path(pathname) {
  return typeof pathname === 'string' && pathname.startsWith('/v1/');
}

export function validateBearerAuth(request) {
  const expectedToken = readConfiguredToken();
  if (!expectedToken) return false;
  const presentedToken = bearerTokenFromHeader(request.headers.authorization);
  return presentedToken === expectedToken;
}

export async function requireBearerAuth(request, reply) {
  if (!isV1Path(request.url)) return;
  if (validateBearerAuth(request)) return;

  reply.code(401).type('application/json').send(unauthorizedResponse(request));
}
