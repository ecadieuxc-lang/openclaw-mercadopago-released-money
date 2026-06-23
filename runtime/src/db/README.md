# DB runtime skeleton

This folder contains the minimum SQLite migration contract for Mercado Pago Released Money.

Rules:

- SQLite como fuente procesada: SQLite will store processed/normalized data after import tasks exist.
- CSV raw como evidencia: raw CSV files remain intact evidence and are not edited as a master data file.
- This task only creates schema files, migration metadata, and a schema version constant.
- No real database exists in this repository. Do not commit `finance.sqlite`, `*.sqlite`, `*.sqlite3`, `*.db`, real logs, real CSV files, or secrets.
- Mercado Pago Released Money only. No bancos, No Open Banking, No scraping.
- Do not store tokens, OAuth material, cookies, private keys, real `.env` values, or real financial data here.

Validation performed for this task:

- A Python standard-library smoke test reads `manifest.json` and `0001_initial_schema.sql`.
- The smoke test applies the migration to a SQLite database inside `tempfile.TemporaryDirectory()`.
- It verifies required tables, key columns, schema version row, indexes, synthetic inserts, and foreign-key enforcement.
- The temporary database is removed automatically when the test exits.
