# Data flow

This document describes the intended data flow for `openclaw-mercadopago-released-money` without using real data.

## Scope boundary

The only financial source in scope is Mercado Pago Released Money.

Out of scope:

- banks;
- Open Banking;
- OFX/QIF;
- scraping;
- multi-provider aggregation;
- frontend implementation;
- direct OpenClaw/VPS deployment from this repository.

## Flow overview

```text
Mercado Pago Released Money source
  -> local operator-controlled input outside repo
  -> parser/import layer
  -> normalized movement records
  -> dedupe
  -> cleanup/classification
  -> salary-anchor periods
  -> processed store / in-memory test data
  -> API, CLI, assistant context and clean exports
```

## 1. Source acquisition

A future operator may use the documented Mercado Pago Released Money API or a manually exported CSV. Source files and credentials must stay outside the public repository.

The repository includes only synthetic fixtures for testing. It must not contain real CSV exports, real API captures or real account data.

## 2. Parser and import

The parser reads Released Money shaped input and creates normalized records with stable fields. Import logic must reject malformed rows, preserve enough provenance for audit and avoid mutating raw evidence.

The import layer reports counts for parsed rows, imported movements and duplicates. It should not invent missing recipients or categories.

## 3. Dedupe

Deduplication uses deterministic movement identity derived from stable source fields. Re-importing the same source should not create duplicate processed movements.

Ambiguous cases should be marked for review rather than silently merged when identity is unsafe.

## 4. Cleanup and classification

Cleanup separates user-facing meaning from raw provider details.

Classification rules:

- positive signed amounts are income candidates;
- negative signed amounts are expense candidates;
- `income_kind` is not used for expenses;
- `expense_category` is not used for income;
- transfers or uncertain rows may produce clarification items;
- technical rows should not be presented as normal spending.

## 5. Periods by salary anchor

Period logic groups processed movements into salary-anchor windows. This allows summaries such as current period, historical period and period-specific exports.

The current project has tests and deterministic logic, but final real persistence remains a future audited step.

## 6. Processed store boundary

SQLite is the planned processed source of truth for a future local installation. Current documentation must be honest: this repository must not ship a real operator SQLite database, and this task does not create one.

Synthetic smoke tests may use in-memory or fixture data only.

## 7. API and CLI

The API local layer exposes safe views, including `/health` and `/v1/assistant/context`. The CLI `openclaw-mp-finance` exposes operator commands such as `doctor`, `import`, `export`, `schema-version` and safe `serve --smoke`.

Both interfaces must avoid printing secrets and must use processed data, not raw private CSV files, as the normal query surface.

## 8. Clean exports

Clean exports are derived artifacts for review or downstream use. They are not the source of truth and should be regenerated from processed data.

Exports must not include raw tokens, private paths, unredacted raw API payloads or real data in public examples.

## 9. Assistant context

Assistant-facing context is compact, redacted and data-backed. The assistant should use the API or CLI and should report uncertainty rather than fabricating balances, recipients, classifications or missing imports.

## Current limitations

- No frontend is implemented.
- No real Mercado Pago API call is executed by the documentation.
- No real OpenClaw registration is performed.
- No VPS deploy, cron or systemd install is performed.
- No real `.env`, SQLite, DB or log file is created.
