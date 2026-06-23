# ADR-0001 — Scope: Mercado Pago Released Money only

## Status

Accepted.

## Context

The project needs a narrow, auditable first version. Expanding to banks, Open Banking, OFX/QIF, scraping, or multi-provider finance would increase security risk, implementation ambiguity, and validation burden before the Mercado Pago Released Money use case is stable.

## Decision

The project scope is Mercado Pago Released Money only.

For v1:

- Primary source: Mercado Pago Released Money API.
- Fallback source: manual Mercado Pago Released Money CSV.
- No bancos.
- No Open Banking.
- No OFX/QIF.
- No scraping.
- No multi-provider financiero.
- No frontend in this phase.

If a Mercado Pago field contains the word `bank`, that is only a field name from Mercado Pago data. It does not create support for banks or external bank integrations.

## Consequences

Benefits:

- The public skill can be explained clearly.
- Tests can focus on one domain.
- Security review is smaller.
- OpenClaw can avoid unsupported financial claims.

Tradeoffs:

- Users with bank, OFX/QIF, Open Banking, scraped, or non-Mercado Pago data must use another tool.
- Future provider expansion would require a separate ADR and architecture review.

## Validation rule

Documentation, fixtures, code, and examples must continue to say Mercado Pago Released Money only and must not promise banks, Open Banking, OFX/QIF, scraping, or multi-provider finance.
