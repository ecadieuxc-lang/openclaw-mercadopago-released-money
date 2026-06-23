# Periods runtime layer

Pure Node.js period construction for Mercado Pago Released Money.

Scope of this directory:

- Detect synthetic salary_anchor candidates from positive incomes.
- Build deterministic periods anchored by reliable salary movements.
- Associate nearby bonus incomes without opening duplicate periods.
- Close the previous period when a later reliable salary anchor appears.
- Expose `period_id`, `period_label`, `closed_at`, and `retention_until` fields compatible with the documented SQLite v1 contract.

Out of scope:

- No bancos.
- No Open Banking.
- No scraping.
- No API, CLI, installer, coach, exports, cron, deploy, real SQLite persistence, real CSV files, or credentials.

The layer is intentionally pure: it receives movement objects produced by the existing parser/importer and cleaning/classification layer, and returns plain objects. It does not write a database.
