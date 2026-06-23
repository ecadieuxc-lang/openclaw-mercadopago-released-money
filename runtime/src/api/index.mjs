import { DEFAULT_API_HOST, DEFAULT_API_PORT, listenApiServer } from './server.mjs';

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { address } = await listenApiServer({ host: DEFAULT_API_HOST, port: DEFAULT_API_PORT });
    process.stdout.write(`Local API listening on ${address}\n`);
  } catch (error) {
    process.stderr.write(`Local API failed to start: ${error.message}\n`);
    process.exitCode = 1;
  }
}

export { createApiServer, listenApiServer, DEFAULT_API_HOST, DEFAULT_API_PORT } from './server.mjs';
