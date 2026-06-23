# Configuración local — Mercado Pago Released Money

## Propósito

Este documento define dónde vive la configuración local de `openclaw-mercadopago-released-money` y qué queda separado de ella. Es un contrato documental previo al runtime: no implementa parser, API, CLI, instalador ni `doctor`.

El alcance es solo Mercado Pago Released Money. No bancos. No Open Banking. No OFX/QIF. No scraping. No multi-provider financiero.

## Separación obligatoria

- Configuración: preferencias no secretas del operador, en `config.json`.
- Secretos: tokens privados, en un archivo `.env` fuera del repositorio.
- Datos: SQLite procesado futuro y reportes locales fuera del repositorio público.
- Raw: archivos fuente recibidos por API o CSV manual, conservados localmente fuera del repo.
- Exports: salidas regeneradas para revisión o consumo local.
- Archive: reportes antiguos retenidos por política local.
- Quarantine: entradas rechazadas o sospechosas para inspección manual.
- Logs: trazas operativas redactadas, sin secretos ni datos financieros sensibles.

`MP_ACCESS_TOKEN` y `FINANCE_API_TOKEN` no van en `config.json`.

## Rutas locales recomendadas

Usar rutas XDG locales por usuario:

```text
~/.config/openclaw-mercadopago-released-money/config.json
~/.config/openclaw-mercadopago-released-money/secrets/.env
~/.local/share/openclaw-mercadopago-released-money/finance.sqlite
~/.local/share/openclaw-mercadopago-released-money/reports/raw/
~/.local/share/openclaw-mercadopago-released-money/reports/exports/
~/.local/share/openclaw-mercadopago-released-money/reports/archive/
~/.local/share/openclaw-mercadopago-released-money/reports/quarantine/
~/.local/state/openclaw-mercadopago-released-money/logs/
```

Estas rutas son contrato de diseño; esta tarea no crea SQLite real, CSV real, logs reales ni `.env` real.

## Instalación genérica local/VPS futura

En una instalación futura, el operador local deberá crear directorios privados por usuario, copiar `examples/sample-config.example.json` como `config.json`, editar solo valores no secretos y crear el archivo de secretos fuera del repositorio.

Permisos recomendados, documentales y no ejecutados en esta tarea:

```bash
chmod 700 ~/.config/openclaw-mercadopago-released-money
chmod 700 ~/.config/openclaw-mercadopago-released-money/secrets
chmod 600 ~/.config/openclaw-mercadopago-released-money/secrets/.env
```

Si se despliega en VPS propia del operador, deben mantenerse las mismas reglas: rutas locales privadas, API en `127.0.0.1` por defecto, secretos fuera del repo y logs redactados. Este proyecto no toca VPS real en esta tarea.

## Variables principales no secretas

- `app.name`: nombre estable del proyecto.
- `app.locale`: locale de presentación, por ejemplo `es-CL`.
- `provider.name`: siempre `mercado_pago`.
- `provider.report`: siempre `released_money`.
- `provider.country`: país Mercado Pago, por ejemplo `CL`.
- `provider.currency`: moneda, por ejemplo `CLP`.
- `timezone`: zona horaria operacional, por ejemplo `America/Santiago`.
- `daily_import`: programación futura de importación diaria.
- `salary_detection`: reglas documentales para detectar ancla de sueldo.
- `periods`: política de períodos basada en ancla de sueldo.
- `reports`: perfiles de columnas, fallback CSV manual y opciones seguras.
- `api`: contrato de API local futura.
- `logging`: contrato de logs redactados.

## Zona horaria, moneda y país

Para Chile, los valores seguros de ejemplo son:

- `timezone`: `America/Santiago`.
- `provider.country`: `CL`.
- `provider.currency`: `CLP`.

La zona horaria debe aplicarse de forma consistente al interpretar fechas de Mercado Pago Released Money. La moneda debe coincidir con el país de la cuenta Mercado Pago configurada por el operador.

## Importación diaria

`daily_import.enabled=true` habilita la intención documental de importar reportes de forma diaria en el runtime futuro. El horario recomendado de ejemplo es `03:00`, con reintentos acotados. Esta tarea no crea cron, systemd, CLI ni llamadas API.

## Fallback CSV manual

El fallback CSV manual de Mercado Pago Released Money es obligatorio en v1. El operador deberá obtener el CSV fuera de Cortana y entregarlo al runtime futuro. El proyecto no autoriza scraping del panel web ni descarga automatizada no documentada.

Los CSV reales nunca deben guardarse en el repositorio. En instalación local futura deberán ir bajo `reports/raw/` o `reports/quarantine/` según validación.

## Reglas de sueldo y ancla

El contrato permite reglas sintéticas para identificar el movimiento de sueldo o ingreso ancla. En ejemplos públicos se usa `sample_salary_marker`, que es ficticio y seguro.

La política de período recomendada es:

- `label_policy`: `salary_anchor_month`.
- `close_on_new_salary`: `true`.
- `retain_previous_period_days`: `7`.

## API local futura

La API futura debe escuchar en `127.0.0.1` por defecto. No debe escuchar en `0.0.0.0` por defecto.

Valores seguros:

- `api.host`: `127.0.0.1`.
- `api.port`: `3766`.
- `api.cors_enabled`: `false`.
- `api.auth_required`: `true`.
- `api.public_raw_exports_enabled`: `false`.

CORS queda apagado por defecto. Si el operador lo habilita en una fase futura, deberá hacerlo explícitamente y con origen limitado.

## Logs redactados

Los logs futuros deben redactar secretos y campos financieros sensibles. No deben imprimir tokens, cabeceras `Authorization`, rutas personales, CSV completos, payloads financieros completos ni respuestas con datos sensibles.

## Qué no debe guardarse en config

No guardar en `config.json`:

- `MP_ACCESS_TOKEN`.
- `FINANCE_API_TOKEN`.
- OAuth, cookies o sesiones.
- claves SSH o privadas.
- CSV reales.
- SQLite real.
- logs reales.
- datos de empleador, persona, comercio o banco reales.

## Futuro doctor

El futuro `doctor` deberá validar sin imprimir secretos:

- existencia y permisos de `config.json`;
- existencia y permisos del archivo `.env` fuera del repo;
- que no existan secretos dentro de `config.json`;
- JSON válido y campos obligatorios;
- `api.host=127.0.0.1` salvo override explícito;
- `api.auth_required=true`;
- `api.cors_enabled=false` por defecto;
- rutas de raw, exports, archive, quarantine y logs fuera del repo público;
- ausencia de `.env` real, CSV real, SQLite real y logs reales dentro del repositorio.


## Configuración guiada v7

Defaults escritos en `config.json`: país `CL`, moneda `CLP`, zona horaria `America/Santiago`, importación diaria `03:00`, día de sueldo estimado `19`, política `previous_business_day`, monto mínimo candidato sueldo `400000`, patrón de sueldo opcional vacío. `config.json` no contiene secretos.

## Token Mercado Pago v9

`MP_ACCESS_TOKEN` debe vivir solo en `~/.config/openclaw-mercadopago-released-money/secrets/.env`, nunca en `config.json` ni en logs.

El valor puede empezar con `APP_USR-` o `APP_USR_`. Al configurarlo con el instalador, pega solo el valor del token. No pegues la asignación completa `MP_ACCESS_TOKEN=...`, comillas ni espacios deliberados. El instalador limpia whitespace inicial/final y guarda el archivo con permisos `600`.
