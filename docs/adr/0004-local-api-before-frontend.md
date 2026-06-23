# ADR-0004 — Local API before frontend

## Status

Accepted.

## Context

A frontend before a stable backend can spread finance logic across multiple clients and make validation harder. The project first needs a deterministic local contract that OpenClaw and future clients can consume.

## Decision

Build the local API before any frontend.

API constraints:

- The API is local by default.
- The default bind address is `127.0.0.1`.
- v1 routes require a local token.
- The API reads through the runtime and SQLite layer.
- Frontend work is not part of this phase.

Future consumers may include Android, Windows, web, or WhatsApp clients, but only after the API contract and backend behavior are validated.

## Consequences

Benefits:

- One backend contract for OpenClaw, CLI-adjacent tooling, and later frontends.
- Less duplicate finance logic.
- Smaller attack surface during initial development.

Tradeoffs:

- No user-facing graphical interface exists in the first phase.
- API contract design must happen before client work.

## Validation rule

No task should start with frontend implementation, real OpenClaw integration, VPS deployment, or installer-first work before the local runtime/API/CLI foundation is validated.
