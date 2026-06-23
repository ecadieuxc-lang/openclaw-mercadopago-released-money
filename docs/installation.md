# Installation

Esta guía describe el instalador v0.1.0 de `openclaw-mercadopago-released-money` para un usuario no programador.

## Antes de empezar

Necesitas:

- Node.js y npm disponibles.
- OpenClaw instalado si quieres registrar la skill automáticamente.
- Tu token de Mercado Pago Released Money (`MP_ACCESS_TOKEN`). Pega solo el valor, nunca `MP_ACCESS_TOKEN=...`.

No necesitas editar `.env` a mano durante el flujo normal.

## Revisión segura previa

```bash
bash installer/install.sh --dry-run --no-openclaw --no-timer
```

El dry-run no escribe secretos ni pide token real.

## Instalación guiada

```bash
bash installer/install.sh
```

El asistente:

1. explica qué instalará y dónde;
2. pide confirmación antes de escribir;
3. pide `MP_ACCESS_TOKEN` con lectura oculta;
4. acepta tokens `APP_USR-...` y `APP_USR_...`;
5. detecta pegado incorrecto tipo `MP_ACCESS_TOKEN=...` o comillas iniciales;
6. guarda secretos en `~/.config/openclaw-mercadopago-released-money/secrets/.env` con permisos `600`;
7. genera `FINANCE_API_TOKEN` sin imprimirlo;
8. copia la app a `~/.local/share/openclaw-mercadopago-released-money/app/`;
9. crea `~/.local/bin/openclaw-mp-finance`;
10. registra OpenClaw con `openclaw skills install <skill-directory> --as mercadopago-finance`, salvo `--no-openclaw`;
11. instala las unidades systemd user como opcionales, pero deja el timer deshabilitado por defecto.

Mensaje clave: la instalación queda lista para uso manual/API/frontend. La sincronización automática queda deshabilitada hasta configurar y validar sync real.

## Timer seguro por defecto

La sincronización automática por API Mercado Pago Released Money no está implementada ni validada de extremo a extremo en este candidato. Por eso:

- el timer no se habilita por defecto;
- `--enable-timer` falla de forma segura en esta versión;
- doctor reporta `systemd timer: disabled` o `missing` sin tratarlo como error si corresponde al diseño seguro;
- cuando exista sync real validado, una versión posterior deberá documentar el comando para habilitarlo.

## Comandos útiles

```bash
bash installer/doctor.sh --home "$HOME"
~/.local/bin/openclaw-mp-finance frontend-info
bash installer/uninstall.sh --yes --home "$HOME" --keep-data
```

Si tu shell no encuentra `openclaw-mp-finance`, usa la ruta absoluta `~/.local/bin/openclaw-mp-finance` o reinicia sesión para actualizar PATH.

## Opciones comunes

- `--home <PATH>` instala bajo un HOME explícito.
- `--repair` repara una instalación parcial sin borrar secretos existentes.
- `--no-openclaw` omite registro OpenClaw.
- `--no-timer` omite instalación de unidades systemd user.
- `--skip-npm-install` evita `npm ci --omit=dev`.
- `--skip-mp-token` no pide token; la instalación queda incompleta para doctor.
- `--non-interactive` exige token por entorno o archivo existente.

## Límites

- Solo Mercado Pago Released Money.
- No bancos.
- No Open Banking.
- No scraping.
- No OFX/QIF.
- No frontend incluido.
- No deploy, VPS ni GitHub publication desde el instalador.
