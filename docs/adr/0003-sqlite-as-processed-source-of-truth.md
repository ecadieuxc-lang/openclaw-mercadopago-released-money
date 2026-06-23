# ADR-0003 — SQLite as processed source of truth

## Status

Accepted.

## Context

Mercado Pago Released Money data may arrive from an API or from a manually exported CSV. Raw files are evidence, but they are not a safe long-term editable master because manual edits can hide provenance and create inconsistent imports.

## Decision

Use SQLite as the processed source of truth.

Data roles:

- SQLite: processed source of truth after validation, normalization, import, dedupe, and migrations.
- Raw CSV: intact evidence when manual Mercado Pago Released Money CSV fallback is used.
- Clean CSV: regenerated export from SQLite, not a manually edited master.
- API source data: source input handled by runtime import logic.

There is no editable CSV master file.

## Consequences

Benefits:

- Idempotent import and dedupe can be enforced.
- Migrations can version schema changes.
- Exports can be regenerated consistently.
- Raw evidence remains unmodified.

Tradeoffs:

- SQLite schema and migration discipline are required.
- Users must not treat clean CSV exports as the authoritative database.

## Validation rule

Future implementation must test import idempotency, schema versioning, dedupe, and regeneration of clean exports from SQLite.
