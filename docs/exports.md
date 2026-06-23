# Exports limpios — Mercado Pago Released Money

Este documento describe la primera capa determinística de exports limpios de Mercado Pago Released Money.

## Exports disponibles

La capa genera, desde objetos ya procesados en memoria:

1. `clean-movements.csv`: CSV limpio de movimientos visibles de un período.
2. `period-summary.json`: resumen JSON de período.
3. `period-movements.jsonl`: una línea JSON por movimiento visible.
4. `manifest.json`: manifest con hashes SHA-256 y tamaños en bytes.

## Fuente de verdad y regeneración

Los exports son salidas derivadas. En la arquitectura del proyecto, SQLite será la fuente procesada de verdad. El export se regenera desde SQLite/datos procesados después de parser, importación/dedupe, limpieza/clasificación y períodos por sueldo/ancla.

El CSV raw no se edita. El CSV limpio no es fuente de verdad ni archivo maestro mutable. Cualquier corrección debe estar representada en reglas determinísticas, configuración local futura o migración documentada.

## CSV limpio

Encabezado estable:

```text
period_id,period_label,movement_id,occurred_at,amount_signed,currency,display_title,display_subtitle,movement_class,income_kind,expense_category,display_status,needs_clarification
```

Reglas:

- incluye solo movimientos visibles;
- no incluye `raw_json` completo;
- no incluye tokens, rutas privadas ni secretos;
- usa `income_kind` solo para ingresos;
- usa `expense_category` solo para egresos;
- escapa comas, comillas y saltos de línea sin dependencias externas;
- mantiene `movement_class` como clase interna, no como etiqueta contable final.

## Summary JSON

Estructura mínima actual:

```json
{
  "period_id": "2026-06",
  "period_label": "Junio 2026",
  "status": "open_or_closed",
  "salary_anchor_at": "...",
  "start_at": "...",
  "end_at": "...",
  "retention_until": "...",
  "income_total": 0,
  "expense_total": 0,
  "net_total": 0,
  "movement_count": 0,
  "visible_movement_count": 0,
  "hidden_movement_count": 0,
  "pending_clarification_count": 0,
  "expense_by_category": {},
  "income_by_kind": {},
  "data_quality": {
    "status": "ok_or_warning",
    "warnings": []
  }
}
```

`expense_total` se expresa como número positivo agregado por egresos. `net_total` se calcula como `income_total - expense_total`.

## JSONL

`period-movements.jsonl` contiene una línea JSON parseable por Node estándar por cada movimiento visible. No incluye `raw_json` completo. Puede conservar `row_hash` y `movement_hash` para trazabilidad interna si existen y no exponen secretos.

## Manifest y hashes

`manifest.json` contiene:

```json
{
  "generated_at": "...",
  "period_id": "2026-06",
  "exports": [
    {
      "type": "clean_movements_csv",
      "file_name": "clean-movements.csv",
      "sha256": "...",
      "bytes": 0
    }
  ]
}
```

Los hashes se calculan con SHA-256 usando `node:crypto` estándar. Sirven para verificar reproducibilidad del contenido exportado, no para convertir el export en fuente de verdad.

## Límites explícitos

No bancos. No Open Banking. No scraping. Esta capa no implementa API, CLI final, installer, coach, frontend, persistencia SQLite real, integración con OpenClaw real ni VPS real.

Los exports de smoke son sintéticos, generados desde fixtures sintéticos, y no deben confundirse con datos reales de Mercado Pago.
