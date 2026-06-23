# CLI — openclaw-mp-finance

This document describes the first functional local CLI for `openclaw-mercadopago-released-money`.

The CLI can be run without global installation:

```bash
node runtime/src/cli/index.mjs doctor
```

## Commands

### doctor

Prints stable JSON describing the synthetic runtime status.

### schema-version

Prints the schema contract version from the runtime schema module.

### import

Imports a synthetic Mercado Pago Released Money CSV fixture in memory:

```bash
node runtime/src/cli/index.mjs import --file tests/fixtures/released-money/daily-core-valid.csv
```

It uses the existing parser/import layer and reports file hash, parsed rows, new movements, and duplicate movements. It does not create persistent SQLite.

### export

Generates clean synthetic exports:

```bash
node runtime/src/cli/index.mjs export --period current --out /workspace/evidence/TASK-0013/generated-cli-exports
```

Generated files:

- `clean-movements.csv`
- `period-summary.json`
- `period-movements.jsonl`
- `manifest.json`

### serve

Smoke-tests the local Fastify API:

```bash
node runtime/src/cli/index.mjs serve --host 127.0.0.1 --port 0 --smoke
```

Rules:

- `--smoke` does not allow `0.0.0.0`.
- The server is closed after the smoke request.
- It uses a synthetic in-memory token only.
- It does not read a real `.env` file.

## Boundaries

- No bancos.
- No Open Banking.
- No scraping.
- No frontend.
- No real OpenClaw or VPS action.
- No real credentials, real CSV, persistent SQLite, database files, or deploy actions.
