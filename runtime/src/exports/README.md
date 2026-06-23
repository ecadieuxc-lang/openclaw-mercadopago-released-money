# Exports — Mercado Pago Released Money

Esta carpeta contiene la primera capa determinística de exports limpios para Mercado Pago Released Money.

## Alcance

- Mercado Pago Released Money solamente.
- CSV limpio regenerable por período.
- JSON summary por período.
- JSONL con movimientos visibles del período.
- Manifest con SHA-256 y tamaño en bytes.
- No bancos. No Open Banking. No scraping.
- No API, CLI final, installer, coach, cron, systemd, frontend, integración real con OpenClaw, ni persistencia SQLite real en esta capa.

## Fuente de verdad

Los exports no son fuente de verdad. Son artefactos derivados y regenerables desde SQLite/datos procesados por las capas previas: parser, importación/dedupe, limpieza/clasificación y períodos por sueldo/ancla.

El CSV raw de Mercado Pago Released Money no se edita. El CSV limpio tampoco se edita como maestro: si hay que corregir datos, la corrección debe vivir en reglas determinísticas o configuración local futura, no en el export.

## CSV limpio

`clean-movements.csv` usa encabezado estable:

```text
period_id,period_label,movement_id,occurred_at,amount_signed,currency,display_title,display_subtitle,movement_class,income_kind,expense_category,display_status,needs_clarification
```

Reglas principales:

- incluye solo movimientos visibles;
- no incluye `raw_json` completo;
- escapa comas, comillas y saltos de línea con escritor CSV local sin dependencias;
- `income_kind` aparece solo para ingresos;
- `expense_category` aparece solo para egresos;
- no debe contener tokens, rutas privadas ni secretos.

## Summary JSON

`period-summary.json` resume un período:

- `period_id`, `period_label`, `status`;
- `salary_anchor_at`, `start_at`, `end_at`, `retention_until`;
- `income_total`, `expense_total`, `net_total`;
- conteos de movimientos visibles, ocultos y pendientes de aclaración;
- `expense_by_category`;
- `income_by_kind`;
- `data_quality.status` y `data_quality.warnings`.

## JSONL

`period-movements.jsonl` escribe una línea JSON por movimiento visible. No incluye `raw_json` completo. Conserva identificadores/hash internos como `row_hash` y `movement_hash` cuando existen porque ayudan a trazabilidad sin exponer secretos.

## Manifest

`manifest.json` contiene:

- `generated_at`;
- `period_id`;
- una lista `exports` con `type`, `file_name`, `sha256` y `bytes`.

Los hashes se calculan con SHA-256 usando `node:crypto` estándar.

## Smoke tests

Los exports generados por smoke son sintéticos y deben quedar bajo `/workspace/evidence/TASK-0010/generated-exports/`. No deben confundirse con datos reales ni guardarse en el repo como información financiera real.
