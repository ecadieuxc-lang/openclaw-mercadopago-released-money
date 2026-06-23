# Assistant context

Esta carpeta implementa la primera capa determinística de `assistant/context` para Mercado Pago Released Money.

Entradas esperadas:

- movimientos ya importados, limpiados y clasificados;
- períodos construidos por sueldo/ancla;
- vínculos `period_movements` generados por el runtime existente.

Salidas principales:

- `buildAssistantContext(...)`: objeto compacto estilo `/v1/assistant/context` para OpenClaw, WhatsApp, app móvil, app PC o frontends futuros.
- `buildSpendingSummary(...)`: resumen de gasto por período; usa `expense_category` solo desde egresos.
- `buildAssistantPeriodContext(...)`: contexto seguro de un período específico con totales, estado, warnings y aclaraciones pendientes.
- `buildAgentRules(...)`: reglas explícitas para el agente.

Reglas de seguridad y clasificación:

- No inventar saldos.
- No inventar destinatarios.
- No mezclar ingresos con gastos.
- No usar categorías para ingresos.
- `expense_category` solo corresponde a movimientos negativos o agregaciones de egresos.
- `income_kind` solo corresponde a movimientos positivos o agregaciones de ingresos.
- Avisar si hay datos pendientes o incompletos.
- No dar recomendaciones de inversión.
- No bancos. No Open Banking. No scraping.

Límites:

- No lee CSV raw directamente.
- No devuelve `raw_json`.
- No crea SQLite persistente.
- No abre servidores.
- No toca OpenClaw real, VPS ni datos reales.
