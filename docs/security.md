# Security

This project handles personal finance data in a future local installation. The public repository must remain free of real secrets, real CSV exports, real databases and real logs.

## Current status

The repository contains documentation, contracts, synthetic fixtures, smoke tests and partial local runtime layers. It does not contain real Mercado Pago credentials, real CSV files, a real SQLite database, production logs, deploy configuration for a VPS or an installed OpenClaw skill.

## Secret storage rule

Real secrets must live outside the repository. In a future authorized local installation:

- `MP_ACCESS_TOKEN` belongs in a private `.env` path outside the repo;
- `FINANCE_API_TOKEN` belongs in the same private secret location or an equivalent local secret store;
- non-secret config may live in a user config file outside the repo;
- the API should bind to `127.0.0.1` by default;
- v1 API routes require local Bearer authentication;
- `/health` may remain public and must not expose private data.

Do not print, copy, commit, summarize or log token values.

## Repository exclusions

The repository must not contain:

- real `.env` files;
- Mercado Pago access tokens;
- API tokens;
- OAuth material, cookies, sessions, passwords or private keys;
- real Mercado Pago Released Money CSV exports;
- real SQLite, `.db`, `.sqlite` or `.sqlite3` files;
- real financial logs;
- screenshots or examples that identify real people, businesses, phones, addresses, accounts or balances.

`.env.example` is allowed only as a placeholder template with non-secret values.

## Runtime and API safety

The local API contract is intentionally conservative:

- default host: `127.0.0.1`;
- no `0.0.0.0` binding for smoke mode;
- CORS disabled by default;
- protected routes under `/v1/*`;
- no raw CSV returned by default;
- no raw Mercado Pago access token returned ever;
- no secret values in errors;
- redacted diagnostics only.

## OpenClaw and assistant safety

The `mercadopago-finance` skill behavior must:

- call the local backend or CLI instead of reading raw private files;
- avoid asking the user for token values;
- avoid inventing balances, recipients or categories;
- report missing data as unavailable;
- suggest `openclaw-mp-finance doctor` when the backend is unavailable;
- refuse banks, Open Banking, scraping and unrelated financial providers.

## Scan and release checks

Before release, run the repository secret scan and documentation smoke tests. See:

- `docs/security-scan.md`
- `docs/release-secret-scan.md`
- `tests/smoke/documentation-complete-smoke.mjs`

A release is blocked if the scan finds real secrets, real finance data, real DB/log files, or documentation claiming that deploy/OpenClaw/VPS/real Mercado Pago API operation exists when it has not been validated.


## Secretos v7

`MP_ACCESS_TOKEN` se lee sin eco de pantalla y no se imprime. `FINANCE_API_TOKEN` se genera localmente y tampoco se imprime. Ambos viven solo en `~/.config/openclaw-mercadopago-released-money/secrets/.env` con directorio 700 y archivo 600. Doctor reporta presencia/ausencia sin valores.
