# Contrato de config.json — Mercado Pago Released Money

Este documento define el contrato estable de `config.json` para `openclaw-mercadopago-released-money`. Es documentación, no implementación.

Alcance cerrado: Mercado Pago Released Money solamente. No bancos. No Open Banking. No scraping. No multi-provider financiero. La aparición de `bank_transfer` o `include_payout_bank_account_number` corresponde solo a campos eventuales del dominio Mercado Pago; no implica integración bancaria externa.

`config.json` no debe incluir `MP_ACCESS_TOKEN`, `FINANCE_API_TOKEN`, OAuth, cookies, sesiones, claves privadas ni datos reales.

## Ejemplo JSON seguro

```json
{
  "app": {
    "name": "openclaw-mercadopago-released-money",
    "locale": "es-CL"
  },
  "provider": {
    "name": "mercado_pago",
    "report": "released_money",
    "country": "CL",
    "currency": "CLP"
  },
  "timezone": "America/Santiago",
  "daily_import": {
    "enabled": true,
    "hour": "03:00",
    "retry_count": 3,
    "retry_delay_minutes": 20
  },
  "salary_detection": {
    "mode": "rules",
    "expected_day": 19,
    "business_day_policy": "previous_business_day",
    "confidence_required": "high",
    "rules": [
      {
        "description_contains": "sample_salary_marker",
        "sale_detail_contains": "sample_salary_marker",
        "payment_method_type": "bank_transfer",
        "direction": "inflow",
        "min_amount": 100000
      }
    ]
  },
  "periods": {
    "label_policy": "salary_anchor_month",
    "close_on_new_salary": true,
    "retain_previous_period_days": 7
  },
  "reports": {
    "daily_columns_profile": "released_money_daily_core",
    "manual_csv_import_enabled": true,
    "audit_profile_enabled": true,
    "include_payout_bank_account_number": false
  },
  "api": {
    "host": "127.0.0.1",
    "port": 3766,
    "cors_enabled": false,
    "auth_required": true,
    "public_raw_exports_enabled": false
  },
  "logging": {
    "level": "info",
    "redact_secrets": true,
    "redact_financial_sensitive_fields": true
  }
}
```

Reglas del ejemplo:

- `sample_salary_marker` es ficticio y seguro.
- No usar nombres reales de empleador, persona, banco ni comercio.
- `bank_transfer` es un valor eventual de Mercado Pago, no soporte bancario externo.
- `include_payout_bank_account_number=false` es el valor seguro por defecto.
- `api.host=127.0.0.1` por defecto.
- `api.cors_enabled=false` por defecto.
- `api.auth_required=true` por defecto.
- `MP_ACCESS_TOKEN` y `FINANCE_API_TOKEN` no pertenecen a `config.json`.

## Campos

| Campo | Tipo esperado | Obligatorio | Defecto | Validación esperada | Seguro para logs |
|---|---:|---:|---|---|---:|
| `app.name` | string | sí | `openclaw-mercadopago-released-money` | Igual al slug del proyecto | sí |
| `app.locale` | string | sí | `es-CL` | Locale IETF válido | sí |
| `provider.name` | string | sí | `mercado_pago` | Debe ser exactamente `mercado_pago` | sí |
| `provider.report` | string | sí | `released_money` | Debe ser exactamente `released_money` | sí |
| `provider.country` | string | sí | `CL` | Código país Mercado Pago soportado | sí |
| `provider.currency` | string | sí | `CLP` | Moneda compatible con país | sí |
| `timezone` | string | sí | `America/Santiago` | Zona IANA válida | sí |
| `daily_import.enabled` | boolean | sí | `true` | Booleano | sí |
| `daily_import.hour` | string | sí | `03:00` | Formato `HH:MM` 24h | sí |
| `daily_import.retry_count` | integer | sí | `3` | Entero entre 0 y 10 | sí |
| `daily_import.retry_delay_minutes` | integer | sí | `20` | Entero positivo razonable | sí |
| `salary_detection.mode` | string | sí | `rules` | Por ahora solo `rules` | sí |
| `salary_detection.expected_day` | integer | sí | `19` | Día 1-31 | sí |
| `salary_detection.business_day_policy` | string | sí | `previous_business_day` | Enum documentado | sí |
| `salary_detection.confidence_required` | string | sí | `high` | `high` recomendado | sí |
| `salary_detection.rules` | array | sí | una regla sintética | Lista no vacía si `mode=rules` | parcial |
| `salary_detection.rules[].description_contains` | string | opcional | `sample_salary_marker` | No debe contener datos reales en ejemplos | no en producción |
| `salary_detection.rules[].sale_detail_contains` | string | opcional | `sample_salary_marker` | No debe contener datos reales en ejemplos | no en producción |
| `salary_detection.rules[].payment_method_type` | string | opcional | `bank_transfer` | Valor de Mercado Pago si existe | sí |
| `salary_detection.rules[].direction` | string | sí | `inflow` | `inflow` o `outflow` | sí |
| `salary_detection.rules[].min_amount` | number | opcional | `100000` | Número positivo, sintético en ejemplos | no en producción |
| `periods.label_policy` | string | sí | `salary_anchor_month` | Enum documentado | sí |
| `periods.close_on_new_salary` | boolean | sí | `true` | Booleano | sí |
| `periods.retain_previous_period_days` | integer | sí | `7` | Entero >= 0 | sí |
| `reports.daily_columns_profile` | string | sí | `released_money_daily_core` | Perfil conocido | sí |
| `reports.manual_csv_import_enabled` | boolean | sí | `true` | Debe ser `true` para fallback v1 | sí |
| `reports.audit_profile_enabled` | boolean | sí | `true` | Booleano | sí |
| `reports.include_payout_bank_account_number` | boolean | sí | `false` | Debe ser `false` por defecto | sí |
| `api.host` | string | sí | `127.0.0.1` | IP local por defecto; no `0.0.0.0` por defecto | sí |
| `api.port` | integer | sí | `3766` | Puerto TCP 1-65535 | sí |
| `api.cors_enabled` | boolean | sí | `false` | Debe ser `false` por defecto | sí |
| `api.auth_required` | boolean | sí | `true` | Debe ser `true` por defecto | sí |
| `api.public_raw_exports_enabled` | boolean | sí | `false` | Debe ser `false` por defecto | sí |
| `logging.level` | string | sí | `info` | `debug`, `info`, `warn`, `error` | sí |
| `logging.redact_secrets` | boolean | sí | `true` | Debe ser `true` | sí |
| `logging.redact_financial_sensitive_fields` | boolean | sí | `true` | Debe ser `true` | sí |

## Validaciones futuras del doctor

El futuro `doctor` debe:

1. Parsear `config.json` como JSON válido.
2. Rechazar campos de secretos dentro de `config.json`.
3. Verificar campos obligatorios y tipos.
4. Verificar que `provider.name=mercado_pago` y `provider.report=released_money`.
5. Verificar `reports.manual_csv_import_enabled=true`.
6. Advertir si `reports.include_payout_bank_account_number` no es `false`.
7. Verificar `periods.retain_previous_period_days=7` salvo cambio explícito.
8. Verificar `api.host=127.0.0.1`, `api.auth_required=true` y `api.cors_enabled=false` por defecto.
9. No imprimir secretos ni valores financieros sensibles al reportar errores.
