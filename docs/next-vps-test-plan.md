# Next VPS test plan — after v0.1.0 public review

Este plan es para una tarea futura y privada. No autoriza acciones en esta tarea. GitHub publication debe estar aprobada o descartada por revisión humana antes de usar este plan.

## Precondiciones

- Aprobación humana explícita.
- Revisión de paquete v0.1.0, diff, manifest y secret scan.
- Usuario y HOME destino definidos.
- Plan de rollback definido.
- Token real disponible solo para pegado manual seguro, nunca en el repositorio.

## Fase A — dry-run privado

```bash
bash installer/install.sh --dry-run --no-openclaw --no-timer
bash installer/doctor.sh --dry-run
```

Confirmar que no se crea `.env`, SQLite, DB, CSV real, log real sensible, systemd real ni registro OpenClaw.

## Fase B — instalación controlada

```bash
bash installer/install.sh --yes --home "$HOME"
bash installer/doctor.sh --home "$HOME"
~/.local/bin/openclaw-mp-finance frontend-info
```

Validar que tokens no se imprimen, permisos son seguros y OpenClaw se registra solo si fue autorizado.

## Timer

No habilitar timer automático hasta que exista `openclaw-mp-finance sync` real/API Mercado Pago Released Money implementado y validado de extremo a extremo.

## Fase C — rollback

```bash
bash installer/uninstall.sh --yes --home "$HOME" --keep-data
```

Confirmar que app/wrapper/unidades se eliminan y config/secrets/reportes privados se conservan.
