# openclaw-mp-finance CLI

`openclaw-mp-finance` is the local operator CLI for the synthetic runtime in this repository.

Implemented commands in this task:

```bash
node runtime/src/cli/index.mjs doctor
node runtime/src/cli/index.mjs schema-version
node runtime/src/cli/index.mjs import --file tests/fixtures/released-money/daily-core-valid.csv
node runtime/src/cli/index.mjs export --period current --out /workspace/evidence/TASK-0013/generated-cli-exports
node runtime/src/cli/index.mjs serve --host 127.0.0.1 --port 0 --smoke
```

Rules:

- Uses synthetic fixtures only.
- No bancos.
- No Open Banking.
- No scraping.
- No real OpenClaw or VPS integration.
- No real credentials, real CSV, real database, or real local deployment.
- The `serve --smoke` command binds only to `127.0.0.1`, uses an in-memory synthetic token, performs a health request, and closes the server.
