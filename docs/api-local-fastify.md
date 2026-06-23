# API local Fastify — TASK-0012

Estado: primera implementación local funcional con Fastify y datos sintéticos seguros.

## Alcance

- Host por defecto: `127.0.0.1`.
- Puerto conceptual: `3766`.
- `/health` es público y no requiere token.
- Toda ruta `/v1/*` requiere `Authorization: Bearer` con token local en variable de entorno del proceso.
- CORS no está habilitado por defecto.
- No se devuelve `raw_json` por defecto.
- No se devuelve valor de `MP_ACCESS_TOKEN` ni valor de token local.
- No se crea `.env` real.
- No se crea SQLite persistente, `.db`, `.sqlite`, logs reales ni CSV reales.
- No bancos. No Open Banking. No scraping.

## Dependencia

La dependencia runtime local instalada es `fastify`, registrada en `runtime/package.json` y `runtime/package-lock.json`.

Justificación completa: `docs/adr/0008-fastify-local-api-dependency.md`.

## Archivos de implementación

- `runtime/src/api/auth.mjs`: auth Bearer para `/v1/*`.
- `runtime/src/api/errors.mjs`: formato estable de errores JSON.
- `runtime/src/api/responses.mjs`: respuestas sintéticas y exports seguros.
- `runtime/src/api/routes.mjs`: rutas v1 alineadas con el contrato OpenAPI.
- `runtime/src/api/server.mjs`: creación de instancia Fastify y listener local.
- `runtime/src/api/index.mjs`: entrada local opcional para el puerto conceptual.

## Rutas implementadas

```http
GET /health
GET /v1/system/doctor
GET /v1/system/config/public
GET /v1/system/schema-version
GET /v1/imports/status
GET /v1/finance/home
GET /v1/finance/movements
GET /v1/finance/periods/current
GET /v1/finance/periods/:period_id/summary
GET /v1/finance/history
GET /v1/finance/clarifications
POST /v1/finance/clarifications/:id/answer
GET /v1/finance/coach/current
GET /v1/finance/coach/:period_id
GET /v1/assistant/context
GET /v1/assistant/spending-summary
GET /v1/assistant/period/:period_id
GET /v1/exports/current-period.csv
GET /v1/exports/periods/:period_id.csv
GET /v1/exports/periods/:period_id/summary.json
```

## Datos

La API usa fixtures sintéticos en memoria. No sincroniza Mercado Pago real, no lee secretos reales y no toca OpenClaw real ni VPS real.

Las reglas de movimientos se mantienen:

- `expense_category` solo aparece en egresos.
- `income_kind` solo aparece en ingresos.
- Transferencias dudosas quedan como aclaraciones; no se inventan destinatarios.

## Smoke test

El smoke test está en:

```text
tests/smoke/api-local-fastify-smoke.mjs
```

El smoke levanta el servidor en `127.0.0.1` con puerto efímero, valida `/health`, auth de `/v1/*`, schema version, home, movements, assistant context, CSV export y summary JSON, y cierra el servidor al terminar.

Salida esperada:

```text
API_LOCAL_FASTIFY_SMOKE_OK
```
