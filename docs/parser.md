# Parser — Mercado Pago Released Money CSV

## Scope

This document describes the first deterministic parser for synthetic Mercado Pago Released Money CSV fixtures.

The parser is intentionally narrow:

- Mercado Pago Released Money only.
- No bancos.
- No Open Banking.
- No scraping.
- No SQLite import yet.
- No persistent dedupe yet.
- No definitive financial cleanup or classification yet.
- No real secrets, real CSV files, real SQLite databases, or real financial logs.

## Entry point

```js
parseReleasedMoneyCsv(csvText, {
  fileName: 'daily-core-valid.csv',
  sourceMode: 'fixture',
  strictColumns: true,
});
```

Input is CSV text plus minimal metadata. The parser does not require user filesystem paths.

## CSV handling

The parser detects comma or semicolon delimiters from the header row and supports standard double-quoted CSV fields, including escaped double quotes.

## Required profile

The initial profile is `released_money_daily_core` with these required columns:

```text
DATE
SOURCE_ID
EXTERNAL_REFERENCE
RECORD_TYPE
DESCRIPTION
NET_CREDIT_AMOUNT
NET_DEBIT_AMOUNT
GROSS_AMOUNT
MP_FEE_AMOUNT
CURRENCY
BALANCE_AMOUNT
SALE_DETAIL
BUSINESS_UNIT
PAYMENT_METHOD_TYPE
SEGMENT_DETAIL
```

When `strictColumns` is enabled, missing required columns throw `MISSING_REQUIRED_COLUMNS` with `missing_columns`.

## Normalized fields

Each valid row produces basic normalized fields for future import tasks:

- `row_index`
- `source_id`
- `external_reference`
- `occurred_at`
- `record_type`
- `description`
- `amount_credit`
- `amount_debit`
- `amount_signed`
- `amount_gross`
- `mp_fee_amount`
- `currency`
- `balance_after`
- `display_title`
- `sale_detail`
- `business_unit`
- `payment_method_type`
- `segment_detail`
- `raw_json`
- `row_hash`
- `movement_hash`

Rules implemented now:

- `amount_signed = NET_CREDIT_AMOUNT - NET_DEBIT_AMOUNT`.
- CLP whole-number amounts remain integers when possible.
- `display_title` uses `SALE_DETAIL`, then `BUSINESS_UNIT`, then `DESCRIPTION`.
- `raw_json` preserves all source columns for the row.
- `row_hash` is SHA-256 over a stable representation of the raw row.
- `movement_hash` is SHA-256 over normalized identity fields for future dedupe.

## Limits

This parser does not filter technical rows definitively. It exposes `record_type`, `segment_detail`, amounts and hashes so later tasks can implement import, SQLite, persistent dedupe, classification, salary period logic, exports, API, CLI, and OpenClaw integration with separate validation.
