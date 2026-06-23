# openclaw-mercadopago-released-money

Skill instalable para OpenClaw enfocada exclusivamente en **Mercado Pago Released Money**.

El proyecto permite instalar un backend financiero local con CLI, API local, SQLite, documentación pública, ejemplos ficticios y una skill `mercadopago-finance` para que OpenClaw pueda consultar información procesada sin leer secretos, CSV reales ni bases reales desde el repositorio público.

> Estado: **v0.1.0 — public beta / pre-release**.
>
> Es una primera versión pública controlada. Está pensada para instalación guiada, revisión pública y pruebas iniciales. La sincronización automática por API/timer queda deshabilitada por defecto hasta que el flujo automático real sea validado completamente.

---

## Qué hace

- Instala la skill `mercadopago-finance` en OpenClaw.
- Instala un runtime local para procesar Mercado Pago Released Money.
- Crea configuración local fuera del repositorio.
- Solicita `MP_ACCESS_TOKEN` de forma oculta, sin imprimirlo.
- Genera `FINANCE_API_TOKEN` local para proteger la API.
- Expone una API local en `127.0.0.1:3766`.
- Incluye contrato OpenAPI.
- Incluye CLI `openclaw-mp-finance`.
- Incluye `frontend-info` para conectar futuros frontends.
- Usa SQLite como fuente procesada local.
- Incluye parser, fixtures sintéticos, tests smoke y documentación.
- Instala templates systemd, pero deja el timer deshabilitado por defecto mientras la sincronización automática real no esté validada.

---

## Qué no hace

Este proyecto **no** incluye:

- bancos;
- Open Banking;
- scraping;
- dashboard web;
- app Android;
- app Windows;
- datos reales;
- credenciales del autor;
- integración bancaria externa;
- recomendaciones de inversión;
- sincronización automática habilitada por defecto.

---

## Alcance

Alcance único:

```text
Mercado Pago Released Money
```

Fuentes contempladas:

```text
1. Mercado Pago Released Money por API, cuando el usuario configure su token.
2. CSV manual de Mercado Pago Released Money como fallback.
```

No se promete soporte multi-banco ni multi-provider financiero.

---

## Requisitos

- VPS o entorno Linux compatible.
- OpenClaw instalado.
- Node.js y npm disponibles.
- SQLite disponible.
- Usuario con permisos normales para escribir en su `$HOME`.
- Token propio de Mercado Pago (`MP_ACCESS_TOKEN`).

---

## Instalación rápida

```bash
git clone https://github.com/ecadieuxc-lang/openclaw-mercadopago-released-money.git
cd openclaw-mercadopago-released-money
bash installer/install.sh
```

Durante la instalación, la consola pedirá el `MP_ACCESS_TOKEN` de Mercado Pago:

```text
Pega tu MP_ACCESS_TOKEN de Mercado Pago. No se mostrará en pantalla:
```

El token no se imprime en pantalla ni en logs.

Formatos aceptados:

```text
APP_USR-...
APP_USR_...
```

Si el usuario pega por error `MP_ACCESS_TOKEN=APP_USR-...`, el instalador lo detecta y pide pegar solo el valor.

---

## Rutas de instalación

Configuración sin secretos:

```text
~/.config/openclaw-mercadopago-released-money/config.json
```

Secretos privados:

```text
~/.config/openclaw-mercadopago-released-money/secrets/.env
```

Datos locales:

```text
~/.local/share/openclaw-mercadopago-released-money/
```

Logs:

```text
~/.local/state/openclaw-mercadopago-released-money/logs/
```

Wrapper CLI:

```text
~/.local/bin/openclaw-mp-finance
```

---

## Seguridad

El repositorio público no contiene secretos ni datos reales.

Reglas principales:

- `MP_ACCESS_TOKEN` no se guarda en GitHub.
- `MP_ACCESS_TOKEN` no se imprime en pantalla.
- `MP_ACCESS_TOKEN` no se imprime en logs.
- `FINANCE_API_TOKEN` se genera localmente.
- `.env` se guarda con permisos `600`.
- La API escucha en `127.0.0.1` por defecto.
- CORS queda deshabilitado por defecto.
- Los ejemplos son ficticios.
- Los CSV reales no deben subirse al repositorio.

---

## Comandos útiles

Doctor:

```bash
openclaw-mp-finance doctor
```

Información para conectar frontend futuro:

```bash
openclaw-mp-finance frontend-info
```

Usando ruta absoluta si `~/.local/bin` no está en `PATH`:

```bash
~/.local/bin/openclaw-mp-finance frontend-info
```

Importación manual de CSV ficticio o local:

```bash
openclaw-mp-finance import --file examples/sample-released-money.csv
```

Servir API local:

```bash
openclaw-mp-finance serve
```

Desinstalación:

```bash
bash installer/uninstall.sh
```

Por defecto, la desinstalación debe conservar datos salvo confirmación explícita.

---

## Timer y sincronización automática

En `v0.1.0`, el instalador deja el timer systemd en modo seguro:

```text
installed-disabled
```

Eso significa:

- el sistema puede dejar los archivos systemd preparados;
- el timer no queda habilitado automáticamente por defecto;
- `--enable-timer` queda bloqueado hasta que la sincronización automática real/API esté implementada y validada;
- no se sobrepromete una sincronización automática que aún no está cerrada.

El modo inicial recomendado es instalación controlada + validación manual + conexión futura del frontend por API local.

---

## API local

Base URL por defecto:

```text
http://127.0.0.1:3766
```

Endpoints principales documentados:

```text
GET /health
GET /v1/system/doctor
GET /v1/system/schema-version
GET /v1/finance/home
GET /v1/finance/movements
GET /v1/assistant/context
GET /v1/assistant/spending-summary
```

Las rutas v1 requieren:

```http
Authorization: Bearer <FINANCE_API_TOKEN>
```

El token local se guarda en:

```text
~/.config/openclaw-mercadopago-released-money/secrets/.env
```

---

## Integración con frontends futuros

Este repositorio **no incluye frontend**.

Sí deja preparado:

- API local;
- OpenAPI;
- `frontend-info`;
- token local para autorización;
- endpoints de contexto para asistente;
- documentación de integración.

Un frontend Android, Windows, web, WhatsApp u otro canal debe conectarse a la API local o a un gateway seguro configurado por el usuario.

---

## Estructura

```text
openclaw-mercadopago-released-money/
  SKILL.md
  README.md
  SECURITY.md
  LICENSE
  .env.example
  installer/
  runtime/
  docs/
  examples/
  tests/
```

---

## Documentación

Documentos principales:

```text
docs/installation.md
docs/installer.md
docs/configuration.md
docs/frontend-integration.md
docs/openclaw-skill-behavior.md
docs/security.md
docs/threat-model.md
docs/troubleshooting.md
docs/release-checklist.md
```

---

## Estado de release

```text
Versión: v0.1.0
Estado: public beta / pre-release
Publicación: controlada
Frontend: no incluido
Timer automático: deshabilitado por defecto
Datos reales: no incluidos
Credenciales reales: no incluidas
```

---

## Licencia

Este proyecto se publica bajo la licencia incluida en `LICENSE`.
