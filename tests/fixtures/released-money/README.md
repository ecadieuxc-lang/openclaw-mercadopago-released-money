# Mercado Pago Released Money synthetic fixtures

Estos fixtures CSV son sintéticos y ficticios. No contienen datos reales, no contienen credenciales, no contienen CSV reales de Mercado Pago y no deben usarse como evidencia financiera real.

## Alcance

- Dominio: Mercado Pago Released Money solamente.
- No bancos.
- No Open Banking.
- No scraping.
- No multi-provider financiero.
- Moneda usada en los fixtures: CLP.
- Fechas ficticias: año 2026.

## Columnas base

Los CSV válidos usan exactamente estas columnas base:

```text
DATE
SOURCE_ID
EXTERNAL_REFERENCE
RECORD_TYPE
DESCRIPTION
NET_CREDIT_AMOUNT
NET_DEBIT_AMOUNT
GROSS_AMOUNT
MP_FEE_AMOUNT
CURRENCY
BALANCE_AMOUNT
SALE_DETAIL
BUSINESS_UNIT
PAYMENT_METHOD_TYPE
SEGMENT_DETAIL
```

## Separadores

- `daily-core-valid.csv`: separador `;`.
- `daily-core-comma-valid.csv`: separador `,`.
- `daily-core-duplicates.csv`: separador `;`.
- `daily-core-missing-columns.csv`: separador `;`, intencionalmente inválido.
- `daily-core-technical-rows.csv`: separador `;`.
- `daily-core-salary.csv`: separador `;`.
- `examples/sample-released-money.csv`: separador `;`.

## Archivos

| Archivo | Estado | Propósito |
| --- | --- | --- |
| `daily-core-valid.csv` | válido | Caso principal con ingresos, egresos, cashback, rendimiento, comisión, compra y transferencias ficticias. |
| `daily-core-comma-valid.csv` | válido | Caso válido con separador coma para validar detección/configuración de delimitador. |
| `daily-core-duplicates.csv` | válido | Casos para deduplicación futura: duplicado exacto, mismo `SOURCE_ID` con datos equivalentes y otro movimiento distinto. |
| `daily-core-missing-columns.csv` | inválido intencional | Fixture para validar rechazo de columnas faltantes; omite columnas críticas como `BALANCE_AMOUNT` y `SEGMENT_DETAIL`. |
| `daily-core-technical-rows.csv` | válido | Filas técnicas ficticias como saldos, totales, reservas y release para pruebas futuras. |
| `daily-core-salary.csv` | válido | Casos ficticios de sueldo, bono y movimientos cercanos para anclas salariales futuras. |

## Seguridad

Todos los nombres son de prueba: Comercio Demo, Transferencia Demo, Persona Demo, Pago Nomina Demo, Bono Demo, Cashback Demo y Rendimiento Demo. Ningún fixture debe interpretarse como extracto real, respaldo contable real, prueba de pago real ni evidencia financiera real.
