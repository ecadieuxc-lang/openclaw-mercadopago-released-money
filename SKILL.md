---
name: mercadopago-finance
description: Skill documental para consultar Mercado Pago Released Money mediante el backend local instalado de openclaw-mercadopago-released-money.
version: 0.1.0
openclaw:
  expected_binary: openclaw-mp-finance
  expected_config: ~/.config/openclaw-mercadopago-released-money/config.json
  primary_env: FINANCE_API_TOKEN
  expected_local_api: http://127.0.0.1:3766
---

# mercadopago-finance

## Propósito

Usa esta skill para responder preguntas sobre datos procesados de Mercado Pago Released Money disponibles en un backend local instalado. La skill no calcula contabilidad por sí misma, no lee archivos fuente directamente y no inventa datos financieros.

El agente debe consultar la API local esperada en `http://127.0.0.1:3766` o, para diagnóstico operativo, la CLI `openclaw-mp-finance`. Las rutas `/v1/*` requieren autenticación local configurada por el operador con la variable `FINANCE_API_TOKEN`; nunca muestres ni solicites el valor del token.

## Cuándo activar esta skill

Actívala cuando el usuario pregunte por:

- resumen, movimientos, ingresos, gastos o saldos derivados de Mercado Pago Released Money;
- aclaraciones pendientes sobre movimientos ambiguos;
- estado local del backend de Mercado Pago Released Money;
- exports limpios generados por el backend para auditoría.

No la actives para bancos, Open Banking, scraping, inversiones, multi-provider financiero, datos externos a Mercado Pago Released Money ni consultas que requieran credenciales reales.

## Flujo recomendado

1. Para preguntas generales, consulta primero `GET /v1/assistant/context`.
2. Para detalle de movimientos, usa `GET /v1/finance/movements` con paginación si corresponde.
3. Si el contexto o los movimientos indican dudas, consulta `GET /v1/finance/clarifications` antes de responder como si los datos fueran completos.
4. Para diagnóstico, usa `GET /v1/system/doctor` o la CLI `openclaw-mp-finance doctor`.
5. Usa exports como evidencia de auditoría o revisión, no como fuente normal para responder. La fuente normal es el backend local procesado.
6. Si el backend local no responde, declara que los datos no están disponibles y sugiere ejecutar `openclaw-mp-finance doctor`.

## Reglas obligatorias para responder

- No inventar saldos.
- No inventar destinatarios.
- No inventar categorías, comercios, períodos ni estados de importación.
- No mezclar ingresos con gastos.
- No usar `expense_category` para ingresos.
- No recalcular saldos manualmente desde archivos fuente.
- No leer CSV raw por defecto.
- No pedir al usuario que pegue datos sensibles, tokens, CSV reales completos ni bases de datos reales.
- No dar recomendaciones de inversión.
- Advertir claramente si los datos están incompletos, pendientes de importación o con aclaraciones abiertas.
- Separar ingresos (`income_kind`) de egresos (`expense_category`) cuando el backend entregue esos campos.
- Citar de forma breve qué endpoint o comando local respaldó la respuesta cuando sea útil.

## Límites explícitos

- Solo Mercado Pago Released Money.
- No bancos.
- No Open Banking.
- No scraping.
- No OFX/QIF.
- No multi-provider financiero.
- No frontend.
- No deploy, VPS, cron, systemd ni registro real de OpenClaw desde esta skill.
- No datos reales en ejemplos.
- No tokens ni secretos en este archivo.

## Fallbacks seguros

Si la API devuelve error de autenticación, indica que la autenticación local no está configurada o no fue aceptada; no solicites el valor de `FINANCE_API_TOKEN`.

Si la API indica importación pendiente o datos incompletos, responde con esa limitación. No completes huecos con supuestos.

Si el usuario pide una explicación detallada que requiere movimientos, consulta `/v1/finance/movements`. Si requiere dudas o transferencias ambiguas, consulta `/v1/finance/clarifications`.

Si el usuario pide auditoría o descarga, puedes sugerir usar exports limpios del backend. No trates exports como fuente maestra normal y no pidas CSV raw.

## Ejemplos sintéticos de comportamiento

Usuario: "¿Cómo va mi período actual?"

Respuesta esperada del agente: consultar `/v1/assistant/context`, resumir únicamente los totales y advertencias entregados por el backend, e indicar si hay aclaraciones pendientes.

Usuario: "¿Quién recibió esta transferencia?"

Respuesta esperada del agente: consultar `/v1/finance/movements` y, si el backend marca el dato como dudoso o incompleto, decir que no hay destinatario confirmado y revisar `/v1/finance/clarifications`.

Usuario: "El backend no responde."

Respuesta esperada del agente: declarar que los datos no están disponibles localmente y sugerir `openclaw-mp-finance doctor` o `GET /v1/system/doctor` si el backend está levantado.
