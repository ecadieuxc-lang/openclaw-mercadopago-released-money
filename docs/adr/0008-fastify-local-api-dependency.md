# ADR 0008 — Fastify dependency for local API

Status: accepted for TASK-0012

## Context

The project needs a first functional local HTTP API aligned with the v1 OpenAPI contract. The API must run locally on `127.0.0.1`, expose `/health` publicly, protect `/v1/*` with an `Authorization: Bearer` header, and remain small enough for smoke validation.

## Decision

Install `fastify` as the only runtime dependency for this task, local to:

```text
runtime/package.json
runtime/package-lock.json
```

No global package installation is allowed. No additional runtime dependencies are approved in this task.

## Justification

Fastify provides a maintained local HTTP framework with clear route registration, hooks for auth, stable JSON responses, and simple lifecycle control for a smoke test that starts on `127.0.0.1` with an ephemeral port and closes at the end.

## Alternatives considered

- Node built-in `http`: avoids dependency, but would require more custom routing and error handling for the API contract.
- Express or other frameworks: not approved by this task and would add an unnecessary alternative dependency.

## Boundaries

This decision does not authorize:

- `@fastify/swagger` or `@fastify/swagger-ui`;
- `dotenv`;
- SQLite packages;
- CORS plugins;
- frontend packages;
- global installs;
- deploy tooling;
- real Mercado Pago calls;
- real OpenClaw or VPS integration.

The API remains local-first: default host `127.0.0.1`, conceptual port `3766`, CORS disabled by default, no `raw_json` responses, no token values in responses, and no persistent SQLite database created.
