# Importación idempotente y deduplicación

Esta página documenta la primera capa determinística de importación para archivos CSV Mercado Pago Released Money.

## Objetivo

Convertir un CSV ya parseado por `runtime/src/ingest` en registros listos para persistir en SQLite, sin crear una base de datos persistente dentro del repositorio y sin instalar dependencias.

## Flujo de importación

1. Leer el CSV original desde disco.
2. Calcular `file_hash` SHA-256 sobre los bytes del archivo.
3. Parsear el CSV con el parser existente de Mercado Pago Released Money.
4. Validar columnas requeridas mediante el parser existente.
5. Convertir cada fila normalizada en:
   - `source_report` para `source_reports`;
   - `raw_rows` para `raw_rows`;
   - `movements` para `movements`.
6. Registrar deduplicación en memoria para el smoke test y para definir el contrato futuro del repositorio SQLite.
7. Reportar duplicados y conflictos explícitamente.

## file_hash

`file_hash` identifica el archivo CSV original. Reimportar el mismo archivo produce el mismo hash y activa `dedupe.file_duplicate = true`. Esta tarea no modifica el CSV porque el raw CSV sigue siendo evidencia original.

## row_hash

`row_hash` identifica la fila raw. Lo produce el parser/normalizador existente a partir de una serialización estable de la fila original. Filas raw iguales se reportan como duplicadas.

## movement_hash

`movement_hash` identifica el movimiento deduplicable. Lo produce el parser/normalizador existente a partir de campos de identidad del movimiento. Movimientos iguales, incluso dentro del mismo reporte, se reportan en `duplicate_movement_hashes`.

## Idempotencia

La importación es idempotente dentro de un estado de importación: si el mismo archivo se importa de nuevo, los conteos `new_raw_rows` y `new_movements` quedan en cero y los registros existentes se reportan como duplicados. En SQLite, este contrato corresponde a `UNIQUE(file_hash)`, `UNIQUE(report_id, row_hash)` y `UNIQUE(movement_hash)`.

## Duplicados dentro del mismo reporte

Si el CSV trae movimientos o filas repetidas en el mismo archivo, la capa de importación los reporta como duplicados. No se ocultan silenciosamente y no se clasifican como movimientos nuevos.

## Conflictos

Si un hash ya conocido aparece con una carga canónica distinta, el resultado agrega una entrada en `dedupe.conflicts`. El comportamiento correcto futuro es revisión explícita; no se debe pisar información procesada silenciosamente.

## Relación con SQLite

SQLite será la fuente procesada de verdad para la aplicación local. Esta tarea solamente produce registros compatibles con las tablas v1 y valida el contrato en una base SQLite temporal creada con `tempfile.TemporaryDirectory()`. No se crea `finance.sqlite`, `.sqlite`, `.db` ni logs persistentes en el repositorio.

## Límites de esta task

No se implementa limpieza final ni clasificación financiera. Las filas técnicas todavía pueden pasar por importación. TASK-0008 debe cubrir limpieza y clasificación. Esta capa tampoco implementa sueldo/ancla, períodos, aclaraciones, exports, API, CLI, installer, cron, systemd ni integración con OpenClaw real.

No bancos. No Open Banking. No scraping. No datos reales. No secretos. No `.env` real. No credenciales.
