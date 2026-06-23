# Troubleshooting

This guide covers basic local troubleshooting for `openclaw-mercadopago-released-money` without using real secrets or real finance data.

## First checks

Run safe checks from the repository root:

```bash
./installer/doctor.sh --dry-run
node runtime/src/cli/index.mjs doctor
node runtime/src/cli/index.mjs schema-version
```

These commands must not create `.env`, SQLite, DB or log files in the repository.

## Installer says real install is blocked

Expected in the current release layer. Only `--dry-run` is enabled.

Use:

```bash
./installer/install.sh --dry-run
```

Do not force systemd, cron, OpenClaw registration or VPS deployment from this repository.

## API does not respond

Check whether you are running only a smoke or a real future local service.

Safe smoke:

```bash
node runtime/src/cli/index.mjs serve --host 127.0.0.1 --port 0 --smoke
```

The smoke starts a temporary local server, calls it, then closes it. It should not leave a persistent process.

For a future real service, use `openclaw-mp-finance doctor` and verify config outside the repository. Do not paste token values into issues or logs.

## Authentication is rejected

Protected `/v1/*` routes require a local API token in a future real installation. Do not print or share the token value.

Check only:

- whether the variable/config name is present;
- whether the service was restarted after configuration;
- whether the client sends a Bearer header;
- whether the request is going to `127.0.0.1` unless explicitly configured otherwise.

## CSV import fails

Use only synthetic fixtures in repository tests. Real Mercado Pago Released Money CSV files must stay outside the repo.

Common causes:

- wrong report type;
- missing required columns;
- encoding mismatch;
- empty file;
- duplicate source already imported;
- date or amount format not matching the parser contract.

The importer should report errors without leaking full private rows.

## Duplicate movements appear

Re-import should be idempotent when stable source fields are identical. If duplicates appear, preserve evidence using synthetic data and inspect the dedupe key fields. Do not upload real CSV rows.

## Missing categories or recipients

This is expected for ambiguous movements. The project should mark items for clarification instead of inventing categories, counterparties or recipients.

## Exports are missing

Verify that processed input exists in the current synthetic test or future local store. Clean exports are derived outputs and should be regenerated from processed data.

Safe CLI example:

```bash
node runtime/src/cli/index.mjs export --period current --out /workspace/evidence/TASK-0018/example-generated-exports
```

Use repository evidence paths for task validation, not `/tmp`.

## OpenClaw skill cannot answer

The skill `mercadopago-finance` should not fabricate answers. If the backend is unavailable, it should say that data is unavailable and suggest:

```bash
openclaw-mp-finance doctor
```

For OpenClaw CLI troubleshooting, use the real plural command group:

```bash
openclaw skills list
openclaw skills install <skill-directory> --as mercadopago-finance
openclaw skills uninstall mercadopago-finance
```

No usar `openclaw skill` singular.

If OpenClaw reports `Skill path is not a directory`, verify that registration passed the installed skill directory, not the `SKILL.md` file itself. The expected form is `openclaw skills install "$APP_DIR" --as mercadopago-finance` where `$APP_DIR/SKILL.md` exists.

It must not ask the user for raw token values.

## Frontend questions

No frontend is implemented in this phase. Future frontends should call the local API documented in `docs/api-contract.md` and `docs/frontend-integration.md`.

## Security incident

If a real token, CSV, database, log or private path is found in the repository, stop release work, remove the exposed material from the working tree, rotate affected credentials when applicable, and record the incident without copying the secret value.

## Token Mercado Pago no aceptado o advertencia inesperada

El token puede empezar con `APP_USR-...` o `APP_USR_...`; ambos formatos son esperados. Pega solo el valor, no la línea completa `MP_ACCESS_TOKEN=...` ni comillas. El instalador no imprime el valor.

Si pegaste la línea completa o comillas, cancela o vuelve a pegar solo el valor cuando el instalador lo pida.

## `openclaw-mp-finance: command not found`

El wrapper se instala en:

```bash
~/.local/bin/openclaw-mp-finance
```

Algunas sesiones SSH no tienen `~/.local/bin` en `PATH`. No es necesariamente una instalación fallida. Usa:

```bash
~/.local/bin/openclaw-mp-finance frontend-info
```

o vuelve a iniciar sesión. El doctor separa `wrapper file: ok` de `wrapper in PATH: ok/warn`.

## Instalación incompleta por token omitido

Si usas `--skip-mp-token`, el instalador no habilita el timer por defecto y doctor reportará estado incompleto hasta que agregues `MP_ACCESS_TOKEN` en el archivo privado de secretos con permisos 600.
