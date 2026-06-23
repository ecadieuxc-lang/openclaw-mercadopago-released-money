# Uninstall

This document describes the safe uninstaller planning layer for `openclaw-mercadopago-released-money`.

## Supported commands in this layer

```bash
./installer/uninstall.sh --help
./installer/uninstall.sh --dry-run
./installer/uninstall.sh --dry-run --keep-data
```

Only dry-run uninstall planning is enabled. Real uninstall exits with an error until a later audited task implements it.

## What the dry-run plans

- Disable a future systemd --user timer if it was installed by a future installer.
- Remove a future cron fallback entry if it was installed by a future installer.
- Unregister a future OpenClaw skill only if it was registered by this package.
- Preserve data by default.
- Preserve config and secrets unless a future real-mode flow receives explicit confirmation.
- Display affected paths without reading or printing secret values.

## Future affected paths

- Config: `~/.config/openclaw-mercadopago-released-money/config.json`
- Secrets: `~/.config/openclaw-mercadopago-released-money/secrets/.env`
- Data: `~/.local/share/openclaw-mercadopago-released-money/finance.sqlite`
- Raw reports: `~/.local/share/openclaw-mercadopago-released-money/reports/raw/`
- Clean exports: `~/.local/share/openclaw-mercadopago-released-money/reports/exports/`
- State/logs: `~/.local/state/openclaw-mercadopago-released-money/logs/`

## Safety boundaries

The dry-run does not remove files, does not stop real services, does not touch real OpenClaw, does not remove real cron or systemd entries, and does not expose secrets.
## Controlled real-mode uninstall

The first real-mode uninstaller path removes only the installed app copy and wrapper while preserving data/config/secrets:

```bash
bash installer/uninstall.sh --yes --home <HOME_BASE> --keep-data
```

Safety gates:

- real mode rejects execution without `--yes`;
- this release layer requires `--keep-data`;
- reports, config, secrets, and logs are preserved;
- systemd, cron, OpenClaw registration, VPS, GitHub, real credentials, and real data are not touched.

Successful output ends with:

```text
UNINSTALL_REAL_MODE_OK
```
# TASK-0024 real-mode uninstall note

`bash installer/uninstall.sh --yes --home <HOME> --keep-data` removes the installed app, wrapper, OpenClaw registration marker/action, and systemd --user timer files while preserving config, secrets, reports, and logs. It emits `UNINSTALL_REAL_MODE_OK` and does not print secret values.

# TASK-0025 OpenClaw CLI correction

When OpenClaw deregistration is needed in a future human-approved phase, the uninstaller uses:

```bash
openclaw skills uninstall mercadopago-finance
```

No usar `openclaw skill` singular.

# TASK-0026 OpenClaw install path correction

The v6 install fix does not change deregistration. Uninstall continues to use:

```bash
openclaw skills uninstall mercadopago-finance
```

