#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCliArgs, parsePort, requireOption } from './args.mjs';
import { writeErrorJson, writeJson } from './output.mjs';
import { runDoctor } from './commands/doctor.mjs';
import { runSchemaVersion } from './commands/schema-version.mjs';
import { runImport } from './commands/import.mjs';
import { runExport } from './commands/export.mjs';
import { runServe } from './commands/serve.mjs';
import { runFrontendInfo } from './commands/frontend-info.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..');

function publicError(error) {
  return {
    code: error.code ?? 'CLI_ERROR',
    message: error.message ?? 'CLI command failed',
    details: error.details ?? {},
  };
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseCliArgs(argv);

  if (command === 'doctor') return runDoctor();
  if (command === 'frontend-info') return runFrontendInfo(options, PROJECT_ROOT);
  if (command === 'schema-version') return runSchemaVersion();
  if (command === 'import') return runImport({ file: requireOption(options, 'file') });
  if (command === 'export') {
    return runExport({
      period: requireOption(options, 'period'),
      out: requireOption(options, 'out'),
      projectRoot: PROJECT_ROOT,
    });
  }
  if (command === 'serve') {
    return runServe({
      host: String(options.host ?? '127.0.0.1'),
      port: parsePort(options.port ?? '3766'),
      smoke: options.smoke === true,
    });
  }

  const error = new Error('Unknown command. Supported commands: doctor, frontend-info, schema-version, import, export, serve');
  error.code = 'UNKNOWN_COMMAND';
  throw error;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    writeJson(await main());
  } catch (error) {
    writeErrorJson(publicError(error));
    process.exitCode = 1;
  }
}

export const CLI_NAME = 'openclaw-mp-finance';
