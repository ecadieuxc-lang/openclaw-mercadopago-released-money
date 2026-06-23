# Repository Structure

Public scaffold for `openclaw-mercadopago-released-money`.

- `runtime/src/cli/commands`: future CLI command modules.
- `runtime/src/config`: future local configuration loading and validation.
- `runtime/src/mercado-pago`: future Mercado Pago Released Money API integration.
- `runtime/src/manual-import`: future manual CSV fallback import flow.
- `runtime/src/ingest`: future ingestion orchestration.
- `runtime/src/db`: future local SQLite storage boundaries.
- `runtime/src/movements`: future movement domain logic.
- `runtime/src/periods`: future period and date-range logic.
- `runtime/src/clarifications`: future clarification handling.
- `runtime/src/exports`: future safe export code.
- `runtime/src/coach`: future coaching layer.
- `runtime/src/assistant`: future agent-facing response support.
- `runtime/src/api`: future local API routes and schemas.
- `runtime/src/logging`: future safe logging.
- `runtime/src/validation`: future input validation.
- `installer`: future installation assets; not functional yet.
- `examples`: only synthetic or public-safe examples.
- `tests`: future tests and synthetic fixtures.

All empty directories are retained with `.gitkeep` placeholders. No functional runtime code is included in this task.
