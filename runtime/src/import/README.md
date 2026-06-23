# Import and dedupe layer

This directory contains the deterministic first import layer for Mercado Pago Released Money CSV files.

## Public API

```js
import { createImportState, importReportFromCsvFile } from './index.mjs';

const state = createImportState();
const result = await importReportFromCsvFile({
  filePath: '/path/to/released-money.csv',
  sourceMode: 'manual_csv',
  parserProfile: 'released_money_daily_core',
  state,
});
```

`state` is an in-memory import state for tests and future repository code. This task does not create a persistent SQLite database. A future repository layer can use the same hashes against SQLite unique constraints.

## Output contract

The result contains:

- `source_report`: provider, report type, source mode, `file_hash`, row count, column count, column profile and status.
- `raw_rows`: raw row records with `row_hash`, `raw_json`, date, record type, description, source id and external reference.
- `movements`: movement records with `movement_hash`, `row_hash`, occurred date, `amount_signed`, gross amount, Mercado Pago fee, currency, balances and display fields.
- `dedupe`: file duplicate flag, duplicate row hashes, duplicate movement hashes and conflicts.
- `counts`: parsed rows, new rows/movements, duplicate rows/movements and conflict count.

## Hashes

- `file_hash` is SHA-256 over the original CSV bytes. Reimporting the same file is idempotent because the file hash is stable.
- `row_hash` comes from the existing parser/normalizer and is based on stable JSON for the raw row.
- `movement_hash` comes from the existing parser/normalizer and is based on stable movement identity fields.

## Duplicates and conflicts

Duplicates inside the same report are reported in `duplicate_row_hashes` or `duplicate_movement_hashes`. They are not hidden silently.

If a stored hash is seen again with a different canonical payload, the import layer records a conflict for future review instead of overwriting data silently. Real SHA-256 collisions are not expected, but the explicit conflict path keeps the contract auditable.

## SQLite relationship

SQLite is the processed source of truth for future runtime operation. This task only prepares records compatible with the v1 tables (`source_reports`, `raw_rows`, and `movements`) and validates that contract with a temporary SQLite smoke test. The raw CSV remains original evidence and is not modified.

## Limits of this task

This is not the cleanup/classification layer. TASK-0008 is expected to decide final cleaning and classification behavior. This layer does not detect salary anchors, close periods, create clarifications, export reports, expose an API, run a CLI, install services, or contact OpenClaw.

No bancos. No Open Banking. No scraping. No real data. No secrets. No `.env` files. No persistent SQLite database is created by this import layer.
