# Doctor

`installer/doctor.sh` is a safe diagnostic planner for the installer layer.

## Supported commands in this layer

```bash
./installer/doctor.sh --help
./installer/doctor.sh --dry-run
```

Only `--dry-run` is enabled. The doctor does not read or print secret values.

## Checks performed or simulated

- Repository structure exists.
- `SKILL.md` exists.
- `runtime/package.json` exists.
- CLI entrypoint exists.
- OpenAPI JSON contract exists at `runtime/src/api/openapi.v1.json`.
- OpenAPI documentation exists at `docs/openapi.md`.
- API contract documentation exists at `docs/api-contract.md`.
- Local Fastify API documentation exists at `docs/api-local-fastify.md`.
- Main docs exist.
- No `.env`, SQLite, DB, or log file exists inside the repository, excluding dependency internals.
- Future secret permissions are documented as config dir 700, secrets dir 700, secret file 600.
- API host defaults to `127.0.0.1`.
- Scope remains No bancos / No Open Banking / No scraping.

## Secret policy

The doctor may report missing variable names in a future real mode, but must never print values for Mercado Pago access tokens, local API tokens, cookies, sessions, OAuth material, private keys, or CSV contents.

## OpenAPI contract path

The current package contract does not require `docs/api-openapi.yaml`. The machine-readable contract is JSON at `runtime/src/api/openapi.v1.json`, with documentation in `docs/openapi.md` and `docs/api-contract.md`.
## Controlled real-mode doctor

After a controlled fake-HOME install, run:

```bash
bash installer/doctor.sh --home <HOME_BASE>
```

The real-mode doctor checks the installed app, public API/docs files, config, private `.env` presence, `FINANCE_API_TOKEN` presence without printing its value, basic permissions, wrapper executability, API host `127.0.0.1`, installed-app hygiene, and the scope markers `No bancos / No Open Banking / No scraping`.

Successful output ends with:

```text
DOCTOR_REAL_MODE_OK
```
# TASK-0024 real-mode doctor note

`bash installer/doctor.sh --home <HOME>` verifies the installed app, wrapper, config, `secrets/.env` mode 600, `FINANCE_API_TOKEN` presence without printing the value, OpenAPI path, default API host `127.0.0.1`, scope markers, and whether OpenClaw/timer were installed or skipped.

# TASK-0025 OpenClaw CLI correction

The doctor reports and validates the plural OpenClaw CLI path. If an install-state marker says OpenClaw registration was installed and `openclaw` is available, it checks:

```bash
openclaw skills list
```

No usar `openclaw skill` singular.

# TASK-0026 OpenClaw install path correction

The doctor reports the registration policy as:

```bash
openclaw skills install <skill-directory> --as mercadopago-finance
```

The skill directory must contain `SKILL.md`; `SKILL.md` itself is not the install path.


## Estados v7

Doctor distingue `MP_ACCESS_TOKEN: present/absent`, `FINANCE_API_TOKEN: present/absent`, `frontend readiness: ok/incomplete`, `api host: 127.0.0.1`, `openapi: ok`, `openclaw: installed/disabled` y `systemd timer: installed/disabled`, sin imprimir valores.
