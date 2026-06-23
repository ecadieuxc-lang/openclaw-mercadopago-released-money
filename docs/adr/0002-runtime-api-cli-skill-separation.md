# ADR-0002 — Runtime, API, CLI, and SKILL.md separation

## Status

Accepted.

## Context

OpenClaw skill text is useful for instruction and routing, but it is not the right place for deterministic finance processing. Finance imports, classification, idempotency, period logic, and exports need code that can be tested independently.

## Decision

Separate responsibilities:

- `SKILL.md` is lightweight. It instructs OpenClaw how to use the local backend or CLI. It does not calculate, parse, classify, import, or persist financial data.
- Runtime calculates and owns deterministic business behavior.
- API exposes runtime capabilities to local consumers.
- CLI operates the project for humans and automation.
- Installer installs, uninstalls, and diagnoses the local package in a later task.
- SQLite stores processed data.
- OpenClaw consults the backend/API/CLI and reports grounded results.

## Consequences

Benefits:

- Finance logic is testable outside the assistant.
- OpenClaw cannot silently invent calculations.
- CLI and API can share the same runtime behavior.
- The public skill stays small and reviewable.

Tradeoffs:

- More components must be documented and tested.
- A local backend or CLI must be available before OpenClaw can answer operational finance questions.

## Validation rule

Future tasks must not move parsing, accounting, import, or classification logic into `SKILL.md`. The skill may describe calls and constraints only.
