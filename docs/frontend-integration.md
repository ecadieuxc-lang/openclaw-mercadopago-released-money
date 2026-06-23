# Frontend and channel integration

No frontend is implemented in this repository at this stage.

This document defines how a future frontend, chat channel, desktop tool or OpenClaw surface should integrate without duplicating finance logic or reading private source files.

## Integration principle

Future clients must consume the local API or CLI outputs. They should not:

- parse raw Mercado Pago CSV files directly;
- read `.env` files;
- read SQLite files directly;
- call Mercado Pago with the operator token from the browser;
- implement independent dedupe/classification logic;
- scrape Mercado Pago;
- add banks, Open Banking, OFX/QIF or multi-provider scope.

## Recommended API surface

A future frontend should start with these endpoints:

- `GET /health` for basic local service availability;
- `GET /v1/system/doctor` for redacted diagnostics;
- `GET /v1/finance/home` for dashboard data;
- `GET /v1/finance/movements` for paginated movement views;
- `GET /v1/finance/periods/current` for salary-anchor period status;
- `GET /v1/finance/clarifications` for pending ambiguous items;
- `GET /v1/assistant/context` for compact assistant context;
- `GET /v1/exports/current-period.csv` for clean derived export download.

See `docs/api-contract.md`, `docs/openapi.md` and `docs/api-local-fastify.md`.

## Authentication

The local API binds to `127.0.0.1` by default. `/health` is public. `/v1/*` routes require local Bearer authentication in a future real installation.

A frontend must never display, store in repository files, log or send the operator's Mercado Pago token to third-party services. A browser-based future UI should not hold the Mercado Pago token directly.

## Data handling

The UI should display processed records returned by the backend. It should preserve distinctions between:

- income and expense;
- expense categories and income kinds;
- confirmed records and clarification-required records;
- processed clean exports and raw source files.

If the API says data is incomplete, the UI must show that state rather than filling gaps.

## Error handling

A future client should handle:

- API offline: suggest running `openclaw-mp-finance doctor`;
- unauthorized: report local authentication failure without asking for token value in chat/logs;
- clarification required: ask for the minimum non-secret clarification;
- import incomplete: show data freshness and avoid final claims;
- export unavailable: explain that exports are derived and require processed data first.

## Current status

Current repository status:

- no frontend code;
- no frontend dependency;
- no CORS dependency;
- no public deployment;
- no VPS integration;
- no real OpenClaw registration;
- no real Mercado Pago API execution with credentials.

Future frontend work should be a separate audited task with its own scope, validation, security review and dependency approval.


## Frontend-ready v7

No se construye Android, Windows, web ni WhatsApp. La conexión futura usa:

- API base URL: `http://127.0.0.1:3766`
- Auth: Bearer token required
- Token location: `~/.config/openclaw-mercadopago-released-money/secrets/.env`
- OpenAPI: `runtime/src/api/openapi.v1.json`
- Health endpoint: `GET /health`
- Assistant context: `GET /v1/assistant/context`

Comando seguro recomendado: `~/.local/bin/openclaw-mp-finance frontend-info`. Por defecto no imprime secretos. `--show-token` exige confirmación o `--yes` y nunca muestra `MP_ACCESS_TOKEN`.

Si `~/.local/bin` ya está en `PATH`, el comando corto `openclaw-mp-finance frontend-info` también funciona. En sesiones SSH no interactivas puede faltar ese directorio en `PATH`; en ese caso usar la ruta absoluta anterior o reconectar la sesión.
