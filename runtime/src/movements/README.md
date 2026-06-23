# Movements — Mercado Pago Released Money

This directory contains the first deterministic movement-cleaning and classification layer for Mercado Pago Released Money.

Scope boundaries:

- Mercado Pago Released Money only.
- No bancos.
- No Open Banking.
- No scraping.
- No real CSV files, credentials, tokens, persistent SQLite files, API, CLI, exports, coach, installer, or OpenClaw integration in this layer.

Implemented modules:

- `technical-rows.mjs`: marks audit/technical rows as hidden and keeps unresolved negative `reserve_for_payment` holds visible for review.
- `display-fields.mjs`: builds `display_title`, `display_subtitle`, `display_status`, `is_visible`, and `needs_clarification`.
- `classify-movement.mjs`: applies basic income and expense classification.
- `clean-movement.mjs`: combines technical-row handling, display fields, and classification while enforcing the domain rule that `expense_category` is only for egresos and `income_kind` is only for ingresos.
- `index.mjs`: exports the public helpers and `cleanImportedMovements()` for import results.

The official amount is always `amount_signed` from the parser/importer (`NET_CREDIT_AMOUNT - NET_DEBIT_AMOUNT`). `GROSS_AMOUNT` is not used as the sole official amount.
