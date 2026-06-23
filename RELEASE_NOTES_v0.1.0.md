# v0.1.0 — Public beta

Primera publicación pública controlada de `openclaw-mercadopago-released-money`.

Este proyecto entrega una skill instalable para OpenClaw enfocada exclusivamente en Mercado Pago Released Money. Incluye una skill liviana (`SKILL.md`), runtime local, CLI, API local, SQLite, instalador, doctor, desinstalador, documentación pública, ejemplos ficticios y tests de seguridad.

## Qué incluye

- Skill `mercadopago-finance` para OpenClaw.
- Instalador guiado para VPS con OpenClaw.
- Solicitud segura de `MP_ACCESS_TOKEN` sin imprimirlo.
- Generación local de `FINANCE_API_TOKEN`.
- Secretos guardados fuera del repositorio en `~/.config/openclaw-mercadopago-released-money/secrets/.env`.
- API local en `127.0.0.1:3766`.
- Contrato OpenAPI incluido.
- CLI `openclaw-mp-finance`.
- Comando `frontend-info` para conectar futuros frontends.
- SQLite como fuente procesada local.
- Parser y fixtures sintéticos para Mercado Pago Released Money.
- Documentación de instalación, configuración, seguridad, frontend, OpenClaw y troubleshooting.
- Desinstalador y doctor/preflight.
- Timer systemd instalado pero deshabilitado por defecto hasta validar sincronización automática real.

## Qué no incluye

- No incluye bancos.
- No incluye Open Banking.
- No incluye scraping.
- No incluye dashboard web.
- No incluye app Android o Windows.
- No incluye datos reales.
- No incluye credenciales del autor.
- No activa sincronización automática por defecto.

## Instalación rápida

```bash
git clone https://github.com/ecadieuxc-lang/openclaw-mercadopago-released-money.git
cd openclaw-mercadopago-released-money
bash installer/install.sh
```

Durante la instalación, la consola pedirá el `MP_ACCESS_TOKEN` de Mercado Pago. El valor no se mostrará en pantalla ni se imprimirá en logs.

## Estado

Public beta / pre-release.

Este release está pensado para instalación controlada, revisión pública y pruebas iniciales. La sincronización automática por API/timer queda deshabilitada por defecto hasta que el flujo automático sea validado completamente.
