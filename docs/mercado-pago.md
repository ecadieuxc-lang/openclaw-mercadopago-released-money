# Mercado Pago Released Money

## Alcance

Este documento valida, solo con documentación pública oficial, el flujo Mercado Pago Released Money / Reporte de Liberaciones para `openclaw-mercadopago-released-money`.

Alcance v1:

- Solo Mercado Pago Released Money.
- No bancos.
- No Open Banking.
- No scraping del panel web.
- No OFX/QIF.
- No multi-provider financiero.
- No datos financieros reales.
- No credenciales reales ni token real dentro de Cortana.

## Fuente v1

La fuente v1 deseada es el Reporte de Liberaciones generado por API de Mercado Pago.

La documentación oficial chilena de Mercado Pago describe un flujo API para:

1. configurar el Reporte de Liberaciones;
2. crear reportes manuales para un intervalo de fechas;
3. consultar la lista de reportes generados;
4. descargar un reporte usando `file_name`;
5. activar o desactivar generación automática.

La validación de esta tarea es documental. No se ejecutó ninguna llamada autenticada contra Mercado Pago y no se confirmó una sincronización real con cuenta.

## Fallback CSV manual

El fallback v1 obligatorio es importación manual de CSV Mercado Pago Released Money / Reporte de Liberaciones.

Motivo:

- La documentación oficial confirma que el reporte puede descargarse como `.csv`.
- La generación real por API necesita credenciales de Mercado Pago y estado real de cuenta.
- Cortana no debe usar token real ni iniciar sesión.
- El parser debe poder operar con un CSV manual exportado por el operador local fuera del repositorio público.

El fallback manual no autoriza scraping ni descarga automatizada desde panel web. El operador local obtiene el archivo fuera de Cortana y lo entrega al runtime futuro como entrada local.

## Flujo oficial documentado

La documentación oficial consultada describe el Reporte de Liberaciones como un archivo descargable que detalla el saldo disponible de la cuenta de Mercado Pago y movimientos de un período determinado, incluyendo bloqueos/desbloqueos de fondos y dinero disponible o retirado.

También indica que los reportes pueden generarse desde la cuenta de Mercado Pago o mediante integración API. Para esta tarea solo se valida la documentación pública, no el acceso real.

## Generación/programación de reporte

La página oficial "Generación por API - Liberaciones" documenta estos recursos:

- Configuración del reporte: `POST https://api.mercadopago.com/v1/account/release_report/config`.
- Creación manual de reporte: `POST https://api.mercadopago.com/v1/account/release_report`, con `begin_date` y `end_date`.
- Consulta de lista de reportes: `GET https://api.mercadopago.com/v1/account/release_report/list`.
- Activación de generación automática: `POST https://api.mercadopago.com/v1/account/release_report/schedule`.
- Desactivación de generación automática: `DELETE https://api.mercadopago.com/v1/account/release_report/schedule`.

Atributos configurables documentados incluyen, entre otros:

- `columns`: columnas que se incluirán en el reporte.
- `file_name_prefix`: prefijo del archivo generado.
- `frequency`: frecuencia diaria, semanal o mensual.
- `separator`: separador alternativo para CSV, por ejemplo `;`.
- `display_timezone`: zona horaria mostrada en columnas de fecha; la documentación chilena muestra `GMT-04` como valor por defecto si no se configura.
- `report_translation`: idioma de encabezados (`en`, `es`, `pt`).
- `notification_email_list`: destinatarios notificados cuando el reporte está listo.
- opciones como inclusión de retiro al final, ejecución después de retiro y compensación de detalle.

La documentación advierte que configurar `frequency` no implica generación automática hasta activar la programación automática.

## Descarga de reporte

La documentación oficial indica que, usando el atributo `file_name`, se puede descargar un reporte con:

`GET https://api.mercadopago.com/v1/account/release_report/REPORT_NAME`

La misma página muestra que una respuesta exitosa devuelve el archivo del reporte solicitado.

Límite: esta tarea no verificó con un token real que el archivo descargado corresponda a una cuenta específica, que el nombre de archivo sea estable entre países, ni la latencia real de generación.

## Formatos disponibles

La documentación oficial "Generar reporte" indica:

- Formatos de descarga: `.csv`, `.xlsx`.
- Recomendación oficial: descargar `.csv` para importar datos y usarlos en otras aplicaciones; descargar `.xlsx` para leer información en hojas de cálculo.
- Formato de nombre para reporte programado o manual: prefijo configurable más fecha de creación y extensión `.csv` según el ejemplo oficial.

Para v1 del proyecto, el formato operativo primario debe ser CSV porque es el formato recomendado por Mercado Pago para importación en otras aplicaciones. XLSX puede documentarse como formato visible para humanos, pero no debe ser dependencia v1 del parser salvo una task posterior.

## Columnas documentadas

La página oficial "Campos del reporte - Liberaciones" documenta columnas del Reporte de Liberaciones. La lista siguiente resume campos observados en la documentación oficial; el parser futuro debe tratarla como base documental, no como garantía exhaustiva para todas las cuentas/países:

| Columna técnica | Significado resumido oficial |
| --- | --- |
| `DATE` | Fecha de liberación/liquidación de la transacción; afecta el saldo disponible. |
| `SOURCE_ID` | Identificador de la transacción dentro de Mercado Pago; puede ser alfanumérico. |
| `EXTERNAL_REFERENCE` | Referencia externa u origen; puede estar vacío en algunos casos. |
| `RECORD_TYPE` | Tipo de registro: saldo inicial disponible, liberación, total, saldo disponible previo/posterior a retiro, etc. |
| `DESCRIPTION` | Descripción del movimiento; puede incluir pago, retiro, impuestos, contracargo, rendimiento, retenciones y otros valores documentados. |
| `NET_CREDIT_AMOUNT` | Monto neto acreditado al disponible. |
| `NET_DEBIT_AMOUNT` | Monto neto debitado del disponible. |
| `SELLER_AMOUNT` | Monto recibido por compras por split. |
| `GROSS_AMOUNT` | Monto bruto de la operación antes de deducciones. |
| `METADATA` | Datos extra en formato JSON, por ejemplo devoluciones parciales o datos provistos por integración externa. |
| `MP_FEE_AMOUNT` | Comisión de Mercado Pago y/o Mercado Libre, incluyendo IVA según documentación. |
| `FINANCING_FEE_AMOUNT` | Costo por ofrecer cuotas sin interés. |
| `SHIPPING_FEE_AMOUNT` | Costo de envío. |
| `TAXES_AMOUNT` | Impuestos cobrados por retenciones. |
| `COUPON_AMOUNT` | Valor total del cupón de descuento. |
| `INSTALLMENTS` | Cantidad de cuotas. |
| `PAYMENT_METHOD` | Medio de pago disponible según país. |
| `PAYMENT_METHOD_TYPE` | Tipo de medio de pago disponible según país. |
| `TAX_DETAIL` | Detalle de impuesto retenido por operación. |
| `TAX_AMOUNT_TELCO` | Impuesto de telecomunicaciones descontado del valor bruto. |
| `TRANSACTION_APPROVAL_DATE` | Fecha de aprobación de la operación. |
| `POS_ID`, `POS_NAME`, `EXTERNAL_POS_ID`, `STORE_ID` | Identificadores relacionados con punto físico/caja/sucursal cuando aplica. |
| `ORDER_ID`, `ORDER_TYPE`, `OPERATION_TAGS` | Campos de orden o etiquetas operativas cuando aplica. |
| `ITEM_ID` | Identificador del producto vendido. |
| `BALANCE_AMOUNT` | Saldo resultante tras una operación que afecta el valor total. |
| `PAYOUT_BANK_ACCOUNT_NUMBER` | Número completo de cuenta de destino del retiro. Campo sensible. |
| `PRODUCT_SKU` | SKU de producto. |
| `SALE_DETAIL` | Detalle de venta/artículos vendidos. |
| `CURRENCY` | Moneda de la transacción. |
| `FRANCHISE` | Bandera de tarjeta. |
| `LAST_FOUR_DIGITS` | Últimos cuatro dígitos de tarjeta. Campo sensible parcial. |
| `ORDER_MP`, `TRANSACTION_INTENT_ID`, `PURCHASE_ID` | Identificadores de solicitud/intento/compra. |
| `IS_RELEASED` | Booleano que indica si un producto fue liberado para envío. |
| `SHIPPING_ORDER_ID` | Identificador interno de orden de envío; no es tracking del transportista. |
| `ISSUER_NAME`, `APPLICATION_ID` | Campos de emisor/aplicación cuando aplican. |

La página de API además muestra un ejemplo CSV con encabezados:

`DATE,SOURCE_ID,EXTERNAL_REFERENCE,RECORD_TYPE,DESCRIPTION,NET_CREDIT_AMOUNT,NET_DEBIT_AMOUNT,GROSS_AMOUNT,MP_FEE_AMOUNT,FINANCING_FEE_AMOUNT,SHIPPING_FEE_AMOUNT,TAXES_AMOUNT,COUPON_AMOUNT,INSTALLMENTS,PAYMENT_METHOD`

## Columnas críticas v1

Para un parser CSV v1, las columnas críticas mínimas recomendadas son:

- `DATE`: orden temporal y período.
- `SOURCE_ID`: deduplicación cuando esté presente.
- `EXTERNAL_REFERENCE`: correlación con sistemas externos cuando esté presente.
- `RECORD_TYPE`: clasificación base del tipo de fila.
- `DESCRIPTION`: clasificación operacional del movimiento.
- `NET_CREDIT_AMOUNT`: entrada neta al disponible.
- `NET_DEBIT_AMOUNT`: salida neta del disponible.
- `GROSS_AMOUNT`: monto bruto cuando exista.
- `MP_FEE_AMOUNT`: comisiones.
- `TAXES_AMOUNT`: retenciones/impuestos.
- `BALANCE_AMOUNT`: saldo resultante cuando esté incluido.
- `CURRENCY`: moneda, si aparece.

El parser no debe exigir que todas existan en todos los archivos. Debe separar columnas requeridas por modo operativo de columnas opcionales detectadas.

## Columnas opcionales/sensibles

Columnas opcionales o sensibles que requieren tratamiento cuidadoso:

- `PAYOUT_BANK_ACCOUNT_NUMBER`: número completo de cuenta de destino del retiro. Debe redactarse/omitirse en logs y evidencias.
- `LAST_FOUR_DIGITS`: últimos cuatro dígitos de tarjeta; no es token, pero es dato financiero sensible parcial.
- `SALE_DETAIL`: puede contener detalle de productos vendidos.
- `METADATA`: JSON libre; puede contener referencias externas o datos del vendedor.
- `EXTERNAL_REFERENCE`: puede mapear a sistemas externos del operador.
- `SOURCE_ID`, `ORDER_ID`, `ORDER_MP`, `PURCHASE_ID`, `TRANSACTION_INTENT_ID`: identificadores financieros/operativos.
- `ISSUER_NAME`, `FRANCHISE`, `PAYMENT_METHOD`: pueden revelar medio de pago.

Regla v1: no imprimir valores reales de estas columnas en reportes de error, tests públicos, fixtures ni evidencia. Usar datos sintéticos o conteos/resúmenes.

## Riesgos de variación por país/cuenta

Riesgos confirmados por documentación o inferidos de límites documentales:

- `PAYMENT_METHOD` y `PAYMENT_METHOD_TYPE` dependen del país.
- Moneda local depende del país de la cuenta.
- La zona horaria puede variar; la documentación chilena usa `GMT-04` por defecto en configuración API y menciona referencia al lugar desde el que se descarga/reporte.
- Encabezados pueden cambiar de idioma con `report_translation` (`en`, `es`, `pt`).
- El separador CSV puede configurarse con `separator`; por defecto la documentación menciona coma y ejemplo de separador alternativo `;`.
- Algunas columnas pueden estar vacías en casos específicos, por ejemplo `EXTERNAL_REFERENCE`.
- Cuentas de prueba pueden generar reportes sin información aunque los flujos de generación, consulta y lista funcionen.
- El reporte puede tardar minutos en generarse y mostrar estado de preparación antes de estar listo.

## Límites de validación sin token real

No se pudo ni se debe validar desde Cortana:

- acceso real a una cuenta Mercado Pago;
- emisión real de token;
- permisos requeridos del token;
- códigos de error reales por cuenta/país;
- tiempos reales de generación;
- contenido real descargado de una cuenta;
- lista real de columnas de una cuenta chilena específica;
- estabilidad del `file_name` real;
- comportamiento de cuentas productivas versus cuentas de prueba;
- encoding exacto del CSV descargado en una cuenta real.

La API queda validada solo documentalmente. No se debe prometer sincronización automática real hasta una task posterior con validación manual autorizada fuera de Cortana.

## Implicancias para parser

El parser futuro debe:

- aceptar CSV manual Released Money como entrada obligatoria v1;
- detectar delimitador por configuración explícita o heurística segura entre coma y punto y coma;
- tolerar columnas ausentes, extra y reordenadas;
- mapear encabezados técnicos preferentemente, no depender de encabezados traducidos si se puede evitar;
- registrar columnas desconocidas sin fallar por defecto;
- validar tipos de fecha `yyyy-MM-dd'T'HH:mm:ssZ` cuando aparezcan;
- parsear montos decimales con signo y dos decimales, sin usar coma decimal salvo evidencia posterior;
- no depender de XLSX en v1;
- no imprimir valores reales de columnas sensibles;
- conservar raw input local como evidencia fuera del repositorio público cuando el operador lo autorice;
- usar fixtures sintéticos para pruebas públicas.

## Implicancias para doctor/preflight

El futuro `doctor` debe validar:

- que la fuente seleccionada sea Mercado Pago Released Money, no bancos, no Open Banking y no scraping;
- que no existan tokens o credenciales reales dentro del repositorio;
- que el archivo CSV exista localmente y no sea una ruta prohibida;
- que el archivo tenga encabezados reconocibles;
- que detecte delimitador esperado o pida configuración explícita;
- que existan columnas mínimas para el modo elegido;
- que fechas y montos puedan parsearse;
- que columnas sensibles no se impriman en logs;
- que se reporte claramente si el archivo parece XLSX u otro formato no soportado por v1;
- que el operador confirme que el CSV proviene del Reporte de Liberaciones y no de otro reporte.

## Decisión operativa v1

Decisión: avanzar con API Released Money como objetivo documentado, pero tratar la disponibilidad de sincronización automática como no confirmada en ejecución real.

Para v1:

- API Released Money: objetivo primario, validado por documentación oficial únicamente.
- CSV manual Released Money: fallback obligatorio y camino operativo seguro inicial.
- Parser: tolerante a variaciones de columnas, país, idioma, separador y cuenta.
- No prometer sincronización automática real hasta validación posterior con cuenta/token fuera de Cortana y con autorización explícita.

## Fuentes oficiales consultadas

Consulta realizada: 2026-06-22T17:29:11Z.

- Mercado Pago Developers Chile — "Reporte de Liberaciones": https://www.mercadopago.cl/developers/es/docs/reports/released-money/introduction
- Mercado Pago Developers Chile — "Generar reporte": https://www.mercadopago.cl/developers/es/docs/reports/released-money/generate
- Mercado Pago Developers Chile — "Generación por API": https://www.mercadopago.cl/developers/es/docs/reports/released-money/api
- Mercado Pago Developers Chile — "Campos del reporte": https://www.mercadopago.cl/developers/es/docs/reports/released-money/report-fields

No se usaron blogs, foros ni fuentes de terceros para definir endpoints o columnas.
