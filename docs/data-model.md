# Modelo de datos v1

Este documento describe el modelo inicial para Mercado Pago Released Money.

Decisiones de alcance:

- Mercado Pago Released Money solamente.
- No bancos.
- No Open Banking.
- No scraping.
- SQLite como fuente procesada.
- CSV raw como evidencia.

La base SQLite futura será la fuente procesada después de importar y normalizar datos. El CSV raw no se edita ni se convierte en archivo maestro mutable; queda como evidencia externa/importada. Esta tarea no implementa una DB real persistente ni importación persistente.

## Tablas principales

### schema_migrations

Registra la versión de esquema aplicada. La v1 usa `version=1` y `name=0001_initial_schema`.

### source_reports

Representa un reporte fuente de Mercado Pago Released Money. Guarda proveedor, tipo de reporte, hash del archivo, rango temporal opcional, estado, conteos y perfil de columnas. `file_hash` permite identificar reportes duplicados sin guardar secretos.

### raw_rows

Representa filas crudas normalizadas como JSON por importación. Se relaciona con `source_reports`. Mantiene `row_index`, `row_hash`, campos descriptivos mínimos y el JSON original de la fila procesada. El CSV raw completo sigue siendo evidencia, no la fuente procesada editable.

### movements

Representa movimientos financieros procesados. Cada movimiento apunta a su reporte y fila cruda. Los montos CLP se guardan como enteros, no floats.

Campos financieros clave:

- `amount_signed`: monto neto con signo; positivo para ingresos y negativo para egresos.
- `amount_gross`: monto bruto cuando existe.
- `mp_fee_amount`: comisión Mercado Pago cuando existe.
- `balance_after` y `balance_before`: saldos procesados cuando estén disponibles.
- `movement_class`: clase general del movimiento.
- `income_kind`: clasificación de ingresos.
- `expense_category`: categoría para egresos.

Regla de dominio: categorías solo para egresos; ingresos se clasifican con `income_kind`.

### periods

Agrupa movimientos por períodos basados en sueldo/ancla, no por mes calendario puro. Guarda etiqueta, ancla salarial, inicio, cierre opcional, totales, saldos, cantidad de movimientos y retención.

### period_movements

Tabla puente entre períodos y movimientos. Permite incluir un movimiento en un período determinado con `included_at`.

### clarifications

Registra preguntas necesarias cuando el runtime no debe inventar datos. Por ejemplo, transferencias dudosas pueden crear aclaraciones en vez de inventar destinatarios.

### aliases

Guarda alias seguros para identificación local futura. Puede almacenar hashes o últimos cuatro caracteres cuando corresponda, sin secretos ni datos reales en fixtures públicos.

### coach_reports

Guarda reportes de coach generados desde datos procesados de un período. Incluye hash de input para reproducibilidad.

### exports

Registra exports regenerables. Los exports limpios son salidas derivadas, no evidencia raw ni fuente maestra editable.

## Relaciones

- `raw_rows.report_id` referencia `source_reports.id`.
- `movements.report_id` referencia `source_reports.id`.
- `movements.raw_row_id` referencia `raw_rows.id`.
- `period_movements.period_id` referencia `periods.id`.
- `period_movements.movement_id` referencia `movements.id`.
- `clarifications.movement_id` referencia `movements.id`.
- `coach_reports.period_id` referencia `periods.id`.
- `exports.period_id` referencia `periods.id` opcionalmente.

## Límites v1

- No DB real todavía.
- No import persistente todavía.
- No deduplicación real persistente todavía.
- No API, CLI, installer ni OpenClaw real en esta tarea.
- No datos financieros reales, secretos, logs reales ni SQLite persistente dentro del repositorio.
