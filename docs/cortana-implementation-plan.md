# Cortana Implementation Plan

## Project order

Future tasks should proceed in this order:

```text
TASK-0001 — Validación documental/API Mercado Pago Released Money
TASK-0002 — Estructura pública del repositorio
TASK-0003 — Contratos de configuración y secretos
TASK-0004 — Fixtures sintéticos Released Money
TASK-0005 — Parser CSV Released Money
TASK-0006 — SQLite, migraciones y schema version
TASK-0007 — Importación idempotente y dedupe
TASK-0008 — Limpieza y clasificación de movimientos
TASK-0009 — Períodos por sueldo/ancla
TASK-0010 — Exports limpios
TASK-0011 — Contrato API y OpenAPI
TASK-0012 — API local Fastify
TASK-0013 — CLI operativo
TASK-0014 — assistant/context
TASK-0015 — SKILL.md
TASK-0016 — Installer, uninstaller y doctor
TASK-0017 — Tests de seguridad y secret scan
TASK-0018 — Documentación completa
TASK-0019 — Release checklist
TASK-0020 — Paquete candidato sin deploy
```

## Guardrails

- Do not start with frontend work.
- Do not start with installer work.
- Do not start by touching real OpenClaw.
- Do not touch VPS.
- Do not use real data.
- Do not use secrets.
- Do not install dependencies without explicit approval.
- Do not implement runtime, parser, API, CLI, or installer before the relevant task.
- Every task must produce evidence.
- Every task must preserve the Mercado Pago Released Money only scope.
- No bancos.
- No Open Banking.
- No OFX/QIF.
- No scraping.
- No multi-provider financiero.

## Task gates

Before a future task closes, it should document:

- objective;
- files created, changed, or deleted;
- commands executed;
- validation results;
- evidence path;
- risks or limitations;
- whether any debt remains.

## Current phase

TASK-0000 creates documentation only. It does not create functional code, dependencies, parser, SQLite database, local API, CLI, installer, timers, OpenClaw registration, deployment, secrets, or real financial fixtures.
