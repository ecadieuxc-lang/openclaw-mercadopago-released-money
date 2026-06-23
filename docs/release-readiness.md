# Release readiness — openclaw-mercadopago-released-money

Estado v0.1.0: candidato técnico preparado para revisión pública controlada. No se publicó en GitHub, no se ejecutó deploy, no se tocó VPS real y no se usaron credenciales ni datos reales.

## Qué está listo

- Alcance cerrado: Mercado Pago Released Money solamente.
- Instalador real guiado para usuario final con token oculto, log persistente y reparación idempotente.
- `MP_ACCESS_TOKEN` se guarda fuera del repositorio, no se imprime, y acepta prefijos `APP_USR-` y `APP_USR_`.
- `FINANCE_API_TOKEN` se genera localmente y no se imprime.
- Registro OpenClaw usa forma plural: `openclaw skills install <skill-directory> --as mercadopago-finance`.
- Instalación OpenClaw usa el directorio instalado de la skill, no `SKILL.md` como ruta principal.
- Wrapper absoluto `~/.local/bin/openclaw-mp-finance` y contrato `frontend-info` están documentados.
- API local y contrato frontend-ready quedan disponibles para integración futura en `http://127.0.0.1:3766`.
- `SECURITY.md`, `SKILL.md`, checklist, docs de instalación y smokes están presentes.

## Qué no se debe prometer

- La sincronización automática por API Mercado Pago Released Money no está implementada ni validada de extremo a extremo.
- El timer systemd --user se instala como unidad opcional pero queda deshabilitado por defecto.
- `--enable-timer` está bloqueado de forma segura hasta que exista sync real validado.
- No hay frontend incluido.
- No hay bancos, Open Banking, OFX/QIF, scraping ni agregación multi-provider.

## Estado de instalación

El instalador puede ejecutarse como:

```bash
bash installer/install.sh
```

El usuario puede revisar primero:

```bash
bash installer/install.sh --dry-run --no-openclaw --no-timer
```

El modo normal escribe solo bajo el HOME indicado o actual: configuración, secretos privados con permisos seguros, app local, wrapper, unidades systemd user disabled y logs redacted.

## Gate antes de publicación o uso real

Antes de publicar en GitHub o usar datos reales, revisar:

- diff final;
- manifest del paquete v0.1.0;
- scan de secretos y datos reales;
- licencia;
- README/SECURITY/SKILL coherentes;
- que no haya `.env`, SQLite, DB, CSV real ni logs reales;
- que la publicación sea autorizada explícitamente por un humano.

## Resultado esperado de v0.1.0

Apto para subida controlada a GitHub público si la revisión humana acepta el paquete y confirma que no hay secretos ni datos reales. No implica deploy, VPS, GitHub CLI, remoto, llamada Mercado Pago real ni habilitación automática de timer.
