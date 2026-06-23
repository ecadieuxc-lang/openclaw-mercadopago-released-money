import Fastify from 'fastify';

import { requireBearerAuth } from './auth.mjs';
import { errorResponse, notFoundResponse } from './errors.mjs';
import { registerApiRoutes } from './routes.mjs';

export const DEFAULT_API_HOST = '127.0.0.1';
export const DEFAULT_API_PORT = 3766;

export async function createApiServer(options = {}) {
  const app = Fastify({
    logger: false,
    requestIdHeader: false,
    genReqId: (() => {
      let counter = 0;
      return () => `local-api-${(counter += 1).toString().padStart(4, '0')}`;
    })(),
    ...options.fastify,
  });

  app.addHook('preHandler', requireBearerAuth);
  await registerApiRoutes(app);

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(notFoundResponse(request));
  });

  app.setErrorHandler((error, request, reply) => {
    request.log?.error?.(error);
    reply.code(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send(
      errorResponse({
        code: error.statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR',
        request,
        details: [],
      }),
    );
  });

  return app;
}

export async function listenApiServer({ host = DEFAULT_API_HOST, port = DEFAULT_API_PORT } = {}) {
  if (host !== DEFAULT_API_HOST) {
    throw new Error('This local API only allows 127.0.0.1 by default in this task.');
  }
  const app = await createApiServer();
  const address = await app.listen({ host, port });
  return { app, address };
}
