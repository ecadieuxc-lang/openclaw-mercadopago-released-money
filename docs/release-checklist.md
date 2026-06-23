# Release checklist — openclaw-mercadopago-released-money

Estado v0.1.0: checklist pública para una subida controlada a GitHub. Publicar requiere autorización humana explícita; esta tarea no publica ni despliega.

## Alcance

- [x] Mercado Pago Released Money solamente.
- [x] No bancos.
- [x] No Open Banking.
- [x] No scraping.
- [x] No OFX/QIF.
- [x] No frontend en esta fase; no hay frontend incluido.
- [x] No agregación multi-provider financiera.

## Archivos públicos

- [x] README.md coherente.
- [x] SECURITY.md presente.
- [x] LICENSE presente.
- [x] SKILL.md raíz presente.
- [x] `.env.example` contiene solo placeholders.
- [x] runtime/package.json y runtime/package-lock.json presentes.
- [x] runtime/src/api/openapi.v1.json parsea como JSON.
- [x] docs/installation.md, docs/installer.md, docs/configuration.md, docs/frontend-integration.md y docs/troubleshooting.md presentes.

## Instalador v0.1.0

- [x] Instalación guiada documentada.
- [x] Token Mercado Pago solicitado de forma oculta.
- [x] `APP_USR-` aceptado sin advertencia falsa.
- [x] `APP_USR_` aceptado por compatibilidad.
- [x] Pegado incorrecto `MP_ACCESS_TOKEN=...` detectado antes de guardar.
- [x] Token no impreso en consola ni logs.
- [x] `FINANCE_API_TOKEN` generado localmente sin imprimirse.
- [x] OpenClaw plural documentado: `openclaw skills`.
- [x] Instalación OpenClaw por directorio documentada; no por `SKILL.md`.
- [x] Wrapper absoluto documentado: `~/.local/bin/openclaw-mp-finance`.
- [x] `frontend-info` documentado.
- [x] PATH corto tratado como warning amable, no fallo crítico.

## Timer y sync

- [x] Timer seguro por defecto: disabled.
- [x] El instalador no promete sync automático por API.
- [x] `--enable-timer` queda bloqueado hasta que exista sync real validado.
- [x] Doctor acepta timer disabled por diseño.
- [x] Sync capability reportado como `not_implemented` / no validado.

## Seguridad pública

- [x] No secretos reales.
- [x] No datos reales.
- [x] No `.env` real.
- [x] No SQLite real.
- [x] No DB real.
- [x] No CSV real.
- [x] No logs reales.
- [x] No cookies, sesiones, OAuth material ni SSH keys.
- [x] Rutas privadas reales prohibidas.
- [x] CORS off por defecto según documentación.
- [x] API local por defecto: `127.0.0.1`.
- [x] Bearer auth local documentado para rutas `/v1/*`.

## Reglas financieras

- [x] `expense_category` solo para egresos.
- [x] `income_kind` clasifica ingresos.
- [x] No inventar destinatarios.
- [x] No inventar saldos, categorías, comercios, períodos ni estados.
- [x] No mezclar ingresos con gastos.

## Validación antes de publicar

- [ ] Todos los tests pasan en entorno limpio.
- [ ] npm audit/lockfile revisado.
- [ ] Package manifest limpio.
- [ ] Release notes coherentes.
- [ ] Diff final revisado por humano.
- [ ] Secret scan no reporta hallazgos críticos.
- [ ] Tarball v0.1.0 contiene solo artefactos públicos seguros.
- [ ] Instrucciones de publicación controlada aprobadas.

## Criterios para NO publicar

- [ ] Aparece cualquier secreto real o dato financiero real.
- [ ] Aparece `.env`, SQLite, DB, CSV real o log real.
- [ ] La documentación promete deploy, VPS, GitHub publication o API Mercado Pago real sin autorización.
- [ ] El instalador habilita timer automático sin sync validado.
- [ ] OpenAPI o ejemplos JSON no parsean.
- [ ] La API escucha en host público por defecto.
- [ ] Se requiere frontend para operar el release aunque no exista.
