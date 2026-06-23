# Security Policy

This repository must not contain real secrets or real financial data.

## Sensitive data scope

A future local installation may process Mercado Pago Released Money movements, amounts, dates, descriptions and operational metadata. Treat all such data as private.

The public repository must contain only documentation, contracts, code, synthetic fixtures and placeholders.

## Do not publish sensitive data

Do not upload or include in issues, pull requests, examples, tests, logs, screenshots or documentation:

- real Mercado Pago access tokens;
- local API token values;
- OAuth credentials or device codes;
- real `.env` files;
- real Mercado Pago Released Money CSV exports;
- real SQLite databases or `.db` files;
- real financial logs;
- cookies, sessions, private keys or passwords;
- private local paths, phone numbers, real balances, real recipients or real names.

Use only synthetic examples and placeholders.

## Current project status

This repository currently contains documentation, smoke tests, synthetic fixtures and partial local runtime layers for parser/import, dedupe/classification, periods, clean exports, CLI, API contract/local Fastify smoke, assistant context, security scanning and dry-run installer tooling.

It does not contain or perform:

- real Mercado Pago API execution with real credentials;
- real OpenClaw registration;
- real VPS deploy;
- real cron/systemd install;
- final persistent SQLite operation with real data;
- frontend implementation.

## Local API security baseline

The documented local API defaults to `127.0.0.1`. `/health` is public and must not expose private data. `/v1/*` routes require local bearer authentication in a future real install. Token values must live outside the repository and must never be printed in logs, errors or documentation.

## Vulnerability reports

When reporting a vulnerability, describe behavior, affected component and reproduction steps without including secrets or real account data. If reproduction data is needed, use synthetic data that cannot identify a real person, account, transaction or business.

## Related documents

- `docs/security.md`
- `docs/secrets-policy.md`
- `docs/threat-model.md`
- `docs/security-scan.md`
- `docs/release-secret-scan.md`
