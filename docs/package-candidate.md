# Package candidate — v0.1.0

El v0.1.0 se genera desde el árbol público del proyecto excluyendo dependencias, secretos, datos reales, bases locales, logs y artefactos de evidencia.

## Artefactos esperados

```text
/workspace/evidence/release v0.1.0/openclaw-mercadopago-released-money-v0.1.0.tar.gz
/workspace/evidence/release v0.1.0/package-manifest-v0.1.0.json
/workspace/evidence/release v0.1.0/package-file-list-v0.1.0.txt
/workspace/evidence/release v0.1.0/tarball-file-list-v0.1.0.txt
/workspace/evidence/release v0.1.0/package-checksums-v0.1.0.sha256
```

## Estado público declarado

- Instalador real guiado y resumible.
- Token Mercado Pago solicitado de forma oculta.
- `APP_USR-` y `APP_USR_` aceptados.
- Pegado incorrecto `MP_ACCESS_TOKEN=...` detectado.
- Tokens no impresos.
- OpenClaw plural documentado y validado con stubs.
- Instalación OpenClaw por directorio.
- Wrapper absoluto y `frontend-info` listos para contrato frontend.
- Timer systemd user instalado como unidad opcional y disabled por defecto.
- Sync automático por API no implementado ni validado; no se promete.

## Exclusiones de paquete

- `runtime/node_modules/`.
- `.git/`.
- `.env` real.
- SQLite/DB reales.
- CSV reales.
- Logs reales.
- `evidence/` y `_out/` internos.
- llaves privadas, tokens, cookies, sesiones u OAuth material.

## Validación

El smoke `tests/smoke/package-candidate-smoke.mjs` genera v0.1.0 y escribe manifest/checksums. El manifest debe indicar `candidate: v0.1.0`, `timer_safe_default_ok: true`, `sync_not_overpromised_ok: true`, `doctor_timer_disabled_safe_ok: true`, `forbidden_files_found: 0`, y que no se realizó deploy, VPS action ni publicación GitHub.
