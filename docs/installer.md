# Installer design

El instalador v0.1.0 es real, guiado, resumible y conservador. Está pensado para preparar una instalación local de `openclaw-mercadopago-released-money` sin imprimir secretos ni prometer sincronización automática que aún no existe.

## Scripts

- `installer/install.sh`: instalación o reparación guiada.
- `installer/install.sh --dry-run`: plan sin escrituras ni token real.
- `installer/doctor.sh`: diagnóstico de instalación sin imprimir secretos.
- `installer/uninstall.sh --yes --home <HOME> --keep-data`: elimina app/wrapper/unidades y conserva datos privados.

## Rutas de instalación

- App: `~/.local/share/openclaw-mercadopago-released-money/app/`.
- Wrapper: `~/.local/bin/openclaw-mp-finance`.
- Config sin secretos: `~/.config/openclaw-mercadopago-released-money/config.json`.
- Secretos: `~/.config/openclaw-mercadopago-released-money/secrets/.env` con permisos `600`.
- Logs: `~/.local/state/openclaw-mercadopago-released-money/logs/`.
- Systemd user: `~/.config/systemd/user/openclaw-mp-finance.{service,timer}` cuando no se usa `--no-timer`.

## Contrato de seguridad

- `MP_ACCESS_TOKEN` se pide con lectura oculta si falta.
- El usuario debe pegar solo el valor del token.
- Se detecta `MP_ACCESS_TOKEN=...` y comillas iniciales antes de guardar.
- Se aceptan `APP_USR-...` y `APP_USR_...` sin advertencia falsa.
- `FINANCE_API_TOKEN` se genera localmente si falta.
- Ningún token se imprime en consola ni en logs.
- Secretos existentes se conservan en modo reparación.

## OpenClaw

Cuando OpenClaw está habilitado, el instalador usa la CLI plural:

```bash
openclaw skills install <skill-directory> --as mercadopago-finance
openclaw skills list
openclaw skills uninstall mercadopago-finance
```

La ruta de instalación es el directorio de la skill instalada. No se pasa `SKILL.md` como ruta principal.

## Timer seguro por defecto

El v0.1.0 no tiene `openclaw-mp-finance sync` real/API automática implementada y validada de extremo a extremo. Por esa razón:

- el instalador puede dejar service/timer como unidades listas;
- el timer queda disabled por defecto;
- no se ejecuta `systemctl --user enable --now openclaw-mp-finance.timer`;
- `--enable-timer` falla de forma segura con explicación clara;
- doctor debe aceptar `systemd timer: disabled` como estado seguro si el resto de la instalación está bien.

Mensaje final esperado:

```text
La instalación quedó lista para uso manual/API/frontend. La sincronización automática queda deshabilitada hasta configurar y validar sync.
```

## Reparación

```bash
bash installer/install.sh --yes --home "$HOME" --repair
```

Reglas:

- conserva `config.json` existente;
- conserva `MP_ACCESS_TOKEN` y `FINANCE_API_TOKEN`;
- no repregunta token si ya existe;
- valida app/wrapper antes de reemplazar;
- acepta skill OpenClaw existente;
- reinstala unidades systemd user si faltan, pero mantiene timer disabled;
- imprime `INSTALL_REPAIR_OK` al terminar.

## No alcance

No bancos, no Open Banking, no scraping, no OFX/QIF, no frontend incluido, no deploy, no GitHub publication y no llamadas reales a Mercado Pago desde el instalador.
