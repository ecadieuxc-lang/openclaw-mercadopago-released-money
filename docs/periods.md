# Períodos por sueldo/ancla

Esta capa define períodos financieros determinísticos para Mercado Pago Released Money. No usa meses calendario puros como frontera principal: el período se abre con un sueldo/ancla confiable.

## Período por sueldo/ancla

Un movimiento positivo puede ser sueldo/ancla cuando cumple reglas configurables:

- `amount_signed > 0`;
- monto mínimo configurable;
- texto configurable en `description`, `sale_detail` o `display_title`;
- `payment_method_type` configurable si el movimiento lo expone;
- confianza `high`, `medium` o `low`.

Por defecto, solo un sueldo de confianza suficiente abre período. Si no se detecta sueldo confiable, la capa no inventa un período cerrado.

## Nombre por mes del sueldo

`period_id` y `period_label` se calculan desde el mes del sueldo/ancla, no desde el mes calendario de cierre.

Ejemplo: sueldo/ancla en junio de 2026 produce:

- `period_id`: `2026-06`
- `period_label`: `Junio 2026`

Si el período cierra en julio por la aparición de otro sueldo, el primer período conserva el nombre del mes del sueldo original.

## Día esperado y día hábil anterior

La configuración documental permite `salary_detection.expected_day` y `business_day_policy=previous_business_day`. La utilidad `expectedSalaryDateForMonth` calcula el día esperado del mes y, si cae en fin de semana, retrocede al día hábil anterior. Esta tarea deja esa política como contrato determinístico para reglas futuras; no implementa calendario de feriados.

## Sueldo vs bono cercano

Un bono cercano es un ingreso positivo con texto/clasificación de bono dentro de una ventana configurable desde el sueldo/ancla. La ventana se expresa en minutos, por defecto 180.

Un bono cercano se asocia al período abierto como `associated_bonus`, pero no abre un segundo período si no cumple regla de sueldo principal o si está dentro de la ventana configurada.

## Cierre por nuevo sueldo

Cuando aparece un nuevo sueldo/ancla confiable:

1. el período actual se cierra justo antes del nuevo sueldo;
2. el nuevo sueldo abre un período nuevo;
3. los movimientos posteriores quedan asociados al nuevo período hasta que aparezca otro sueldo confiable.

Los movimientos anteriores al primer sueldo quedan con estado `unassigned_before_first_anchor`.

## Retención posterior de 7 días

Cada período cerrado expone `retention_until = closed_at + 7 días` por defecto. Esta retención es un contrato de datos para revisiones posteriores; no significa que el período siga abierto para cálculo normal.

## Si no se detecta sueldo

La capa no inventa cierres ni períodos cerrados. Devuelve cero períodos y deja los movimientos como no asignados antes de un ancla confiable.

## Relación con SQLite v1

La salida incluye objetos compatibles con las tablas documentales `periods` y `period_movements`:

- `period_id`;
- `period_label`;
- `anchor_movement_id`;
- `opened_at`;
- `closed_at`;
- `retention_until`;
- totales y conteos;
- vínculos movimiento-período con `role` e `included_at`.

Esta tarea no escribe SQLite persistente. La persistencia real queda para tareas futuras.

## Límites de esta task

No se implementa API, CLI final, installer, cron, systemd, coach, exports finales, frontend, persistencia SQLite real ni integración con OpenClaw/VPS real. Solo se usan fixtures sintéticos, parser/importer existente y limpieza/clasificación existente.

No bancos. No Open Banking. No scraping.
