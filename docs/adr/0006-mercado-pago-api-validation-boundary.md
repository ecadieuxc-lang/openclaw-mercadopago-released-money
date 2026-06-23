# ADR-0006 — Mercado Pago API validation boundary

## Status

Accepted.

## Context

The project intends to use Mercado Pago Released Money / Reporte de Liberaciones as the only financial source for v1.

The desired v1 source is the Mercado Pago Released Money API, with manual CSV import as mandatory fallback. The project must not expand into banks, Open Banking, OFX/QIF, scraping, or multi-provider financial aggregation.

This task validated public official documentation only. Cortana did not use credentials, did not request a token, did not log in, and did not call authenticated Mercado Pago APIs.

## Decision

We accept advancing with official-documentation validation for the Mercado Pago Released Money API boundary.

Rules accepted by this ADR:

- No token real will be used inside Cortana.
- No credenciales reales will be requested, stored, printed, copied, or tested by Cortana.
- No authenticated Mercado Pago account call is part of this task.
- No automatic sync will be promised until a later task validates it with a real account outside Cortana and with explicit human authorization.
- The parser will be designed as tolerant to country/account/header/column variation.
- Manual CSV Mercado Pago Released Money is mandatory fallback for v1.
- A future real-token validation, if needed, must be a separate manual task outside Cortana or under a tightly scoped authorized procedure.

## Evidence basis

Official Mercado Pago documentation consulted on 2026-06-22 documents:

- Reporte de Liberaciones as a downloadable report of available balance and account movements.
- Generation by Mercado Pago account panel or API.
- API configuration, manual creation, report listing, download by `file_name`, and schedule activation/deactivation endpoints.
- CSV and XLSX download formats.
- CSV as the recommended format for importing data into other applications.
- Documented report fields such as `DATE`, `SOURCE_ID`, `EXTERNAL_REFERENCE`, `RECORD_TYPE`, `DESCRIPTION`, `NET_CREDIT_AMOUNT`, `NET_DEBIT_AMOUNT`, `GROSS_AMOUNT`, fees, taxes, payment method, balance, payout account number and sale detail.

## Consequences

Benefits:

- The project can proceed to parser and fixture design without inventing an unsupported API contract.
- The parser can be aligned with official fields while still handling variation.
- The security boundary remains clear: no real credentials or financial data in Cortana/public repo work.
- CSV manual fallback keeps v1 useful even if API availability is not confirmed for the operator account.

Tradeoffs and limits:

- API synchronization is not operationally proven.
- Real token permissions, account status behavior, country-specific column set, encoding, and error responses remain unvalidated.
- Cuentas de prueba may produce empty reports even if generation/listing flows work, per official documentation.
- A later human/manual validation may be required before enabling automatic API sync.

## Parser implications

The parser must:

- accept manual CSV Released Money as a first-class source;
- not require all officially listed columns;
- tolerate extra, missing, translated, or reordered columns;
- detect or configure CSV separator;
- treat sensitive fields as non-loggable;
- use synthetic fixtures only in public repository work;
- fail with explicit diagnostics when required fields for a chosen operation are absent.

## Doctor/preflight implications

The future doctor must verify:

- source is Mercado Pago Released Money only;
- no bancos, no Open Banking, no scraping, no multi-provider behavior;
- no real secrets present;
- no real financial data committed;
- CSV headers and delimiter look compatible;
- sensitive fields are redacted in logs;
- API sync is marked documentally validated only unless real validation evidence is supplied separately.

## Follow-up

Recommended next step: create synthetic Released Money CSV fixtures and parser profiles based on the documented columns, while preserving the boundary that API sync is not confirmed by live account testing.
