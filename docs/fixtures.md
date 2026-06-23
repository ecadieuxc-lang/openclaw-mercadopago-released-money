# Fixtures — Mercado Pago Released Money

## Propósito

Este documento describe los fixtures CSV sintéticos de Mercado Pago Released Money del proyecto `openclaw-mercadopago-released-money`.

Los fixtures existen para que una tarea posterior, TASK-0005, pueda construir y validar un parser CSV Released Money con casos objetivos, versionables y seguros.

## Política de datos ficticios

Todos los CSV de `tests/fixtures/released-money/` y `examples/sample-released-money.csv` son sintéticos. Usan nombres de prueba como Comercio Demo, Transferencia Demo, Persona Demo, Pago Nomina Demo, Bono Demo, Cashback Demo y Rendimiento Demo.

Estos archivos no contienen datos reales, no son CSV reales de Mercado Pago, no contienen credenciales, no contienen rutas personales y no deben utilizarse como evidencia financiera real.

Reglas de alcance:

- Mercado Pago Released Money solamente.
- No bancos.
- No Open Banking.
- No scraping.
- No multi-provider financiero.
- no CSV reales en el repositorio.
- no SQLite real en el repositorio.
- no logs reales con información financiera.

## Columnas base

Los CSV válidos usan exactamente estas columnas:

```text
DATE,SOURCE_ID,EXTERNAL_REFERENCE,RECORD_TYPE,DESCRIPTION,NET_CREDIT_AMOUNT,NET_DEBIT_AMOUNT,GROSS_AMOUNT,MP_FEE_AMOUNT,CURRENCY,BALANCE_AMOUNT,SALE_DETAIL,BUSINESS_UNIT,PAYMENT_METHOD_TYPE,SEGMENT_DETAIL
```

Los fixtures con separador `;` mantienen las mismas columnas, cambiando únicamente el delimitador.

## Listado de fixtures

| Archivo | Separador | Estado | Casos cubiertos |
| --- | --- | --- | --- |
| `tests/fixtures/released-money/daily-core-valid.csv` | `;` | válido | Ingreso normal, gasto comercio, transferencia saliente, cashback, rendimiento, comisión, compra y transferencia entrante. |
| `tests/fixtures/released-money/daily-core-comma-valid.csv` | `,` | válido | Variante válida con coma para probar delimitador. |
| `tests/fixtures/released-money/daily-core-duplicates.csv` | `;` | válido | Duplicado exacto, `SOURCE_ID` repetido con datos equivalentes y movimiento distinto. |
| `tests/fixtures/released-money/daily-core-missing-columns.csv` | `;` | inválido intencional | Rechazo por columnas faltantes, incluyendo ausencia de `BALANCE_AMOUNT` y `SEGMENT_DETAIL`. |
| `tests/fixtures/released-money/daily-core-technical-rows.csv` | `;` | válido | Filas técnicas ficticias: `initial_available_balance`, `available_balance`, `total`, `pre_payout_demo`, `post_payout_demo`, `reserve_for_payout`, `reserve_for_payment` y `release`. |
| `tests/fixtures/released-money/daily-core-salary.csv` | `;` | válido | Pago Nomina Demo, Bono Demo, gasto posterior, transferencia por revisar, compra comercio e ingreso extra no sueldo. |
| `examples/sample-released-money.csv` | `;` | válido | Muestra pública pequeña para documentación y demo básica futura. |

## Relación con TASK-0005

TASK-0005 debe usar estos fixtures como base objetiva para implementar el parser CSV Released Money. Esta tarea no implementa runtime, parser, API, CLI, instalador, SQLite ni migraciones.

El parser futuro deberá validar columnas, detectar o configurar delimitador, calcular importes derivados con reglas explícitas, manejar duplicados, rechazar columnas faltantes cuando corresponda y evitar imprimir datos sensibles.

## Prohibición de datos reales

Nunca subir CSV reales, credenciales, tokens, SQLite real, logs reales ni rutas personales al repositorio. La evidencia financiera real, si existe en una instalación futura del operador, debe permanecer fuera del repositorio público y fuera de estos fixtures.
