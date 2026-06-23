# Assistant context API layer

Estado: primera capa determinística en runtime. No abre servidor, no crea SQLite persistente y no implementa frontend.

## Objetivo

`assistant/context` entrega un resumen seguro para OpenClaw, WhatsApp, app móvil, app PC o cualquier frontend futuro sin obligar al consumidor a leer CSV raw ni recalcular totales.

La capa recibe objetos ya procesados por el pipeline sintético:

```text
fixtures sintéticos
  -> parser/import/dedupe
  -> cleaning/classification
  -> periods salary-anchor
  -> assistant/context
```

## Funciones

- `buildAssistantContext(...)`: construye un objeto estilo `/v1/assistant/context` con `period`, `summary`, `highlights`, `warnings`, `pending_clarifications`, `top_expense_categories`, `top_merchants` y `agent_rules`.
- `buildSpendingSummary(...)`: resumen de gastos por período. Solo agrega egresos en `expense_category`.
- `buildAssistantPeriodContext(...)`: contexto de un período específico, con totales, estado y warnings.
- `buildAgentRules(...)`: reglas explícitas para asistentes y frontends.

## Reglas no negociables para el agente

- No inventar saldos.
- No inventar destinatarios.
- No mezclar ingresos con gastos.
- No usar categorías para ingresos.
- Avisar si hay datos pendientes o incompletos.
- No dar recomendaciones de inversión.
- No bancos. No Open Banking. No scraping.

## Reglas de clasificación

- `expense_category` solo puede aparecer para movimientos negativos o agregaciones de egresos.
- `income_kind` solo puede aparecer para movimientos positivos o agregaciones de ingresos.
- Los ingresos no alimentan `top_expense_categories`.
- `expense_total` se expresa como total positivo de egresos.
- `net_total = income_total - expense_total`.
- Transferencias o movimientos ambiguos deben exponerse como warnings o aclaraciones pendientes; no se inventan destinatarios.

## Frontera de datos seguros

La salida de assistant/context:

- no contiene `raw_json`;
- no contiene CSV raw completo;
- no contiene tokens, credenciales ni rutas personales;
- no usa datos reales en smoke tests;
- usa nombres user-facing como `display_title` cuando existen.

## Límites

Esta capa no implementa API HTTP, skill final de OpenClaw, frontend, cron, systemd, deploy, persistencia SQLite real, bancos, Open Banking ni scraping.
