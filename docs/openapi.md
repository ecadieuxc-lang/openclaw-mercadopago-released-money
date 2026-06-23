# OpenAPI v1

El contrato machine-readable vive en:

```text
runtime/src/api/openapi.v1.json
```

Características requeridas:

- OpenAPI 3.x válido y parseable como JSON.
- Server conceptual: `http://127.0.0.1:3766`.
- `/health` público sin token.
- Rutas `/v1/*` protegidas por `financeBearerAuth` con `Authorization: Bearer <FINANCE_API_TOKEN>`.
- CORS desactivado por defecto en la futura implementación.
- No exponer `MP_ACCESS_TOKEN` ni `FINANCE_API_TOKEN` en respuestas.
- No exponer `raw_json` por defecto.
- No bancos. No Open Banking. No scraping.

Este archivo es contrato. No implementa servidor, rutas Fastify ni runtime HTTP.

## Schemas incluidos

El JSON OpenAPI declara al menos:

- `HealthResponse`
- `DoctorResponse`
- `SchemaVersionResponse`
- `ImportsStatusResponse`
- `FinanceHomeResponse`
- `Movement`
- `MovementListResponse`
- `PeriodSummaryResponse`
- `Clarification`
- `AssistantContextResponse`
- `ErrorResponse`

## Reglas de seguridad documental

Los ejemplos de OpenAPI son sintéticos. Cualquier mención a `FINANCE_API_TOKEN` es nombre de variable/contrato, no valor real. Ninguna respuesta debe contener tokens, secretos, CSV reales, SQLite real ni rutas personales.
