# Migraciones SQLite

Este proyecto usa migraciones versionadas para Mercado Pago Released Money.

Alcance cerrado:

- Mercado Pago Released Money solamente.
- No bancos.
- No Open Banking.
- No scraping.
- SQLite como fuente procesada.
- CSV raw como evidencia externa/intacta.

## Estrategia

La versión actual del esquema se declara en dos lugares mínimos:

- `runtime/src/db/migrations/manifest.json` con `current_schema_version`.
- `runtime/src/db/schema-version.mjs` con `CURRENT_SCHEMA_VERSION` y `CURRENT_SCHEMA_NAME`.

La migración inicial es `0001_initial_schema.sql` y crea `schema_migrations` junto al modelo procesado v1. No crea una base SQLite real dentro del repositorio.

## schema_migrations

`schema_migrations` registra:

- `version`: número entero de migración.
- `name`: nombre estable de la migración.
- `applied_at`: fecha/hora de aplicación.
- `checksum`: checksum esperado por el runtime futuro.

En esta tarea el SQL deja la versión inicial `1` registrada como `0001_initial_schema`. El runtime futuro deberá calcular/verificar checksums reales antes o durante la aplicación de migraciones.

## Checksums

Los checksums existen en el contrato para detectar cambios accidentales o no autorizados en migraciones ya publicadas. La implementación completa del cálculo queda para la tarea de runtime/importación.

## Migraciones destructivas

La v1 no contiene migraciones destructivas. Por defecto, futuras migraciones destructivas deben estar prohibidas o requerir confirmación explícita, backup previo y evidencia de rollback.

## Doctor y API futuros

El doctor futuro debe mostrar la versión de esquema instalada y detectar desalineación con `current_schema_version`.

La API futura debe exponer la ruta documentada:

```text
/v1/system/schema-version
```

## Validación temporal

Las migraciones se validan con `tests/smoke/sqlite-schema-smoke.py`, que usa solo librerías estándar de Python, aplica el SQL a una SQLite temporal, inserta datos sintéticos mínimos y confirma `SQLITE_SCHEMA_SMOKE_OK`.
