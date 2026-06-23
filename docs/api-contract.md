# API contract v1 — Mercado Pago Released Money

Estado: contrato documental. No implementa servidor Fastify, runtime HTTP, puertos ni persistencia.

## Scope

La API v1 futura expone datos procesados y limpios de `openclaw-mercadopago-released-money` para OpenClaw, CLI, apps futuras y otros canales locales.

- Proveedor: Mercado Pago.
- Reporte: Released Money.
- Host por defecto: `127.0.0.1`.
- Puerto conceptual: `3766`.
- `/health` es público y no requiere token.
- Toda ruta `/v1/*` requiere `Authorization: Bearer <FINANCE_API_TOKEN>`.
- CORS desactivado por defecto.
- No se expone `MP_ACCESS_TOKEN` nunca.
- No se imprime ni devuelve `FINANCE_API_TOKEN`.
- No se expone `raw_json` por defecto.
- No se exponen CSV raw por defecto; los exports son derivados limpios.
- No bancos. No Open Banking. No scraping.

Los ejemplos usan valores sintéticos. El backend futuro debe responder lenguaje user-facing en campos visibles (`display_title`, `display_subtitle`, `display_status`) y conservar clases internas solo como soporte diagnóstico.

## Authentication

`GET /health` no declara seguridad.

Todas las rutas bajo `/v1/*` requieren token Bearer local:

```http
Authorization: Bearer <FINAN...N>
```

El token se configura fuera del repositorio, no se imprime, no se registra en logs y no aparece en respuestas.

## Error format

Errores estables JSON:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required for this endpoint.",
    "request_id": "sample-request-001",
    "details": []
  }
}
```

No deben incluir tokens, rutas privadas, payloads financieros completos ni secretos.

## Endpoints mínimos

| Método | Ruta | Auth | Descripción |
|---|---|---:|---|
| GET | `/health` | no | Estado básico del proceso local futuro. |
| GET | `/v1/system/doctor` | sí | Diagnóstico seguro sin imprimir secretos. |
| GET | `/v1/system/config/public` | sí | Configuración pública redactada. |
| GET | `/v1/system/schema-version` | sí | Versión de esquema procesado. |
| GET | `/v1/imports/status` | sí | Estado de importaciones Mercado Pago Released Money. |
| GET | `/v1/finance/home` | sí | Resumen inicial para UI/CLI/OpenClaw. |
| GET | `/v1/finance/movements` | sí | Movimientos visibles paginados. |
| GET | `/v1/finance/periods/current` | sí | Período actual por sueldo/ancla. |
| GET | `/v1/finance/periods/{period_id}/summary` | sí | Resumen de período específico. |
| GET | `/v1/finance/history` | sí | Historial compacto de períodos. |
| GET | `/v1/finance/clarifications` | sí | Preguntas pendientes por datos dudosos. |
| POST | `/v1/finance/clarifications/{id}/answer` | sí | Registra respuesta local del operador. |
| GET | `/v1/finance/coach/current` | sí | Reporte coach del período actual. |
| GET | `/v1/finance/coach/{period_id}` | sí | Reporte coach de un período. |
| GET | `/v1/assistant/context` | sí | Contexto compacto seguro para asistente. |
| GET | `/v1/assistant/spending-summary` | sí | Resumen de gasto apto para asistente. |
| GET | `/v1/assistant/period/{period_id}` | sí | Contexto de período apto para asistente. |
| GET | `/v1/exports/current-period.csv` | sí | CSV limpio derivado del período actual. |
| GET | `/v1/exports/periods/{period_id}.csv` | sí | CSV limpio derivado de un período. |
| GET | `/v1/exports/periods/{period_id}/summary.json` | sí | Summary JSON derivado de un período. |

## Movements contract

`GET /v1/finance/movements` usa paginación básica:

- `limit`: entero, defecto 50, máximo futuro recomendado 200.
- `cursor`: cursor opaco opcional.
- Respuesta: `items`, `page.limit`, `page.next_cursor`, `page.has_more`.

Reglas no negociables:

- Los movimientos separan `income_kind` y `expense_category`.
- `income_kind` solo aplica a ingresos (`amount_signed > 0`).
- `expense_category` solo aplica a egresos (`amount_signed < 0`).
- Para `amount_signed === 0`, ambos campos son `null` o se omiten de la vista user-facing.
- Transferencias dudosas se exponen como aclaraciones y/o `needs_clarification=true`; no se inventan destinatarios.
- Los montos CLP se expresan como enteros.
- `movement_class` es interno y no una etiqueta contable final para el usuario.

## Clean data boundary

La API local responde desde datos procesados, normalizados y clasificados. No devuelve raw financiero por defecto. No devuelve CSV raw por defecto. Los exports son regenerados desde datos procesados, no son fuente maestra mutable.

## Future implementation note

Este contrato no abre puertos, no crea servidor Fastify, no crea SQLite persistente, no crea `.env`, no instala dependencias y no toca OpenClaw/VPS real.
