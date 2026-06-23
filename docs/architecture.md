# Architecture — openclaw-mercadopago-released-money

## Objective

`openclaw-mercadopago-released-money` is a public, generic OpenClaw skill project focused exclusively on Mercado Pago Released Money.

The project exists to let OpenClaw ask questions about released Mercado Pago money through a deterministic local backend instead of inventing financial answers inside the assistant context.

## Closed scope

In scope:

- Mercado Pago Released Money only.
- Mercado Pago Released Money API as the primary v1 source.
- Manual Mercado Pago Released Money CSV import as the v1 fallback.
- Local deterministic processing.
- SQLite as the processed source of truth.
- Synthetic fixtures and tests.

Out of scope:

- No bancos.
- No Open Banking.
- No OFX/QIF.
- No scraping.
- No multi-provider financial aggregation.
- No frontend in this phase.
- No real secrets, credentials, tokens, real CSV files, real SQLite databases, or real personal paths in the repository.

If Mercado Pago column names contain words such as `bank`, that reflects Mercado Pago data fields only. It does not mean this project supports external banking systems.

## Components

The intended project is composed of these parts:

- `SKILL.md`: lightweight public skill instructions for OpenClaw. It explains how OpenClaw should call the local backend or CLI. It must not perform accounting or parsing itself.
- Runtime: deterministic implementation for importing, normalizing, classifying, querying, and exporting Released Money data.
- Local API: local HTTP interface for OpenClaw and future consumers. It defaults to `127.0.0.1` and uses a local token for v1 routes.
- CLI: operator interface named `openclaw-mp-finance` for imports, checks, exports, diagnostics, and local queries.
- SQLite: processed source of truth after import and normalization.
- Installer: future local installer/uninstaller/doctor scripts. Not implemented in this task.
- Documentation: architecture, ADRs, threat model, user/operator docs, and release checklist.
- Examples: fictional examples only, using synthetic Mercado Pago Released Money data.
- Tests: parser, import, dedupe, classification, API, CLI, export, and security tests.

## Data flow

1. Mercado Pago Released Money API provides source records when configured by the local operator.
2. Manual Mercado Pago Released Money CSV import is available as a fallback source.
3. Raw CSV input, when used, is preserved intact as evidence.
4. Runtime validates and normalizes source records.
5. Runtime imports normalized records idempotently into SQLite.
6. SQLite stores processed records and schema metadata.
7. Runtime derives classifications, periods, balances, and export views from SQLite.
8. API and CLI read from the runtime/SQLite layer.
9. OpenClaw consults the API or CLI and reports only data-backed answers.
10. Clean CSV exports are regenerated outputs, not manually edited master records.

## Source of truth and evidence

- Processed source of truth: SQLite.
- Raw evidence: intact Mercado Pago Released Money CSV files or API response captures handled by the local operator outside the public repository.
- Clean exports: regenerated artifacts produced from SQLite for review or downstream use.

There is no editable CSV master file. If data needs correction, the correction must be represented in deterministic runtime rules, explicit local configuration, or a documented migration path.

## Relationship with OpenClaw

OpenClaw does not calculate accounting, parse CSV files, mutate SQLite directly, or fabricate missing finance data.

OpenClaw should:

- load the lightweight `SKILL.md`;
- call the local API or CLI;
- present answers grounded in backend responses;
- state uncertainty when backend data is missing;
- avoid invented transfers, invented recipients, and unsupported providers.

## Relationship with future frontends

Future Android, Windows, web, or WhatsApp interfaces may consume the local API after the backend contract is stable.

No frontend is built in this phase. The architecture starts with local runtime, SQLite, API contract, CLI, tests, and documentation so any future frontend consumes a verified backend instead of duplicating finance logic.

## Non-goals

This project does not provide banking integration, Open Banking, OFX/QIF import, scraping, financial multi-provider aggregation, production deployment, hosted SaaS, or real data storage in the public repository.
