# Mercado Pago Released Money ingest

This directory contains the first deterministic CSV parser for synthetic Mercado Pago Released Money fixtures.

Scope:

- Mercado Pago Released Money CSV text input only.
- Node.js standard library only.
- No SQLite writes.
- No persistent dedupe.
- No definitive financial cleanup or classification.
- No real Mercado Pago credentials, real CSV files, real logs, or real financial data.

Primary entry point:

```js
import { parseReleasedMoneyCsv } from './index.mjs';

const parsed = parseReleasedMoneyCsv(csvText, {
  fileName: 'daily-core-valid.csv',
  sourceMode: 'fixture',
  strictColumns: true,
});
```

The parser detects `;` or `,`, supports standard double-quoted CSV fields, validates the `released_money_daily_core` column profile, calculates `amount_signed = NET_CREDIT_AMOUNT - NET_DEBIT_AMOUNT`, and emits `row_hash` plus `movement_hash` for future import/dedupe tasks.
