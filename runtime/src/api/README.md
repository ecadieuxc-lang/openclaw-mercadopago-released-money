# Runtime API

Este directorio contiene el contrato OpenAPI y la primera implementación local Fastify de la API v1 de Mercado Pago Released Money.

Archivos relevantes:

- `openapi.v1.json`: contrato OpenAPI 3.x machine-readable.
- `auth.mjs`: auth Bearer para `/v1/*`.
- `errors.mjs`: errores JSON estables.
- `responses.mjs`: datos sintéticos seguros y exports derivados.
- `routes.mjs`: rutas HTTP v1.
- `server.mjs`: creación de instancia Fastify y listener local.
- `index.mjs`: entrada local opcional.

Reglas de implementación:

- Host por defecto: `127.0.0.1`.
- Puerto conceptual: `3766`.
- `/health` público sin token.
- Toda ruta `/v1/*` requiere `Authorization: Bearer`.
- CORS desactivado por defecto.
- No imprimir ni responder `MP_ACCESS_TOKEN`.
- No imprimir ni responder valores de token local.
- No exponer raw financiero ni `raw_json` por defecto.
- No exponer CSV raw por defecto; los CSV son exports limpios derivados.
- No bancos. No Open Banking. No scraping.

La implementación de TASK-0012 usa fixtures sintéticos en memoria. No abre `0.0.0.0`, no crea `.env`, no crea SQLite persistente y no toca OpenClaw real ni VPS real.
