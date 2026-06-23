# OpenClaw skill behavior — mercadopago-finance

## Estado

Contrato documental para una skill OpenClaw genérica. Este documento complementa `SKILL.md` y describe cómo debe comportarse un agente cuando la skill `mercadopago-finance` está disponible junto al backend local instalado de `openclaw-mercadopago-released-money`.

No registra la skill en OpenClaw real, no abre servicios persistentes, no toca VPS, no instala dependencias y no usa datos reales.

## Activación

Activar la skill ante preguntas sobre Mercado Pago Released Money procesado por el backend local:

- estado financiero del período;
- ingresos y egresos derivados de movimientos procesados;
- movimientos visibles;
- transferencias o movimientos ambiguos;
- aclaraciones pendientes;
- diagnóstico del backend local;
- exports limpios para auditoría.

No activar para bancos, tarjetas bancarias, Open Banking, scraping, inversiones, proveedores financieros múltiples, contabilidad externa ni datos que no pertenezcan a Mercado Pago Released Money.

## Backend local esperado

- API local esperada: `http://127.0.0.1:3766`.
- Binario esperado: `openclaw-mp-finance`.
- Config esperada: `~/.config/openclaw-mercadopago-released-money/config.json`.
- Variable primaria de autenticación local: `FINANCE_API_TOKEN`.

El agente puede mencionar el nombre de la variable, pero nunca debe solicitar, imprimir, copiar ni registrar su valor.

## Endpoints principales

### `GET /v1/assistant/context`

Primera consulta para preguntas generales. Debe usarse antes de intentar explicar el estado del período, advertencias, totales o aclaraciones globales.

Comportamiento esperado:

- resumir solo datos presentes en la respuesta;
- indicar advertencias o pendientes;
- advertir si la importación está incompleta;
- no inventar saldos, categorías ni destinatarios.

### `GET /v1/finance/movements`

Consulta para detalle de movimientos. Debe usarse cuando el usuario pide movimientos, comercios, ingresos, egresos o una operación específica.

Comportamiento esperado:

- respetar paginación;
- diferenciar ingresos y egresos;
- no usar `expense_category` para ingresos;
- no mezclar ingresos con gastos;
- no inferir destinatarios no confirmados.

### `GET /v1/finance/clarifications`

Consulta para dudas, transferencias ambiguas o datos pendientes.

Comportamiento esperado:

- avisar que hay aclaraciones abiertas;
- no cerrar dudas con suposiciones;
- pedir al usuario solo la aclaración necesaria, sin pedir secretos ni datos fuente completos.

### `GET /v1/system/doctor`

Diagnóstico seguro del backend cuando hay errores, falta de datos o problemas de configuración.

Fallback CLI equivalente:

```bash
openclaw-mp-finance doctor
```

El diagnóstico no debe imprimir secretos. Si el backend no responde, el agente debe declarar datos no disponibles y sugerir el comando `doctor`.

## Exports

Los exports limpios pueden usarse para auditoría, revisión humana o descarga. No son la fuente normal para el agente.

El agente no debe leer CSV raw por defecto, no debe pedir CSV raw y no debe recalcular saldos manualmente desde archivos fuente. La respuesta normal debe venir de la API local o de la CLI.

## Reglas de respuesta

- No inventar saldos.
- No inventar destinatarios.
- No inventar categorías.
- No mezclar ingresos con gastos.
- No usar `expense_category` para ingresos.
- No dar recomendaciones de inversión.
- No bancos.
- No Open Banking.
- No scraping.
- Advertir cuando los datos estén incompletos, no importados o pendientes de aclaración.
- Declarar la fuente consultada si ayuda a auditar la respuesta.

## Seguridad

La skill y sus docs no deben contener secretos ni ejemplos reales. Los ejemplos deben ser sintéticos y sin personas reales, rutas privadas ni saldos reales.

El agente no debe:

- solicitar valores de tokens;
- imprimir encabezados de autorización;
- copiar contenido privado de configuración;
- leer archivos privados de secretos;
- crear `.env` real;
- crear SQLite, DB o logs reales;
- tocar OpenClaw real, VPS real, rutas personales o datos reales.

## Fallbacks

- API no responde: declarar datos no disponibles y sugerir `openclaw-mp-finance doctor`.
- Autenticación falla: indicar que la autenticación local no fue aceptada, sin pedir el valor del token.
- Datos incompletos: responder solo con lo disponible y advertir la limitación.
- Aclaraciones abiertas: consultar `/v1/finance/clarifications` y no inventar destinatarios.
- Usuario pide CSV fuente: explicar que la skill usa backend procesado; exports limpios son para auditoría y no reemplazan la fuente procesada.

## No-scope

Esta skill no implementa runtime nuevo, frontend, installer, uninstaller, deploy, cron, systemd, scraping, bancos, Open Banking, multi-provider financiero ni integración directa con Mercado Pago real desde el agente.
