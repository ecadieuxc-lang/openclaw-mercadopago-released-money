# Dependencies

This project keeps runtime dependencies minimal and local to `runtime/`.

## Runtime dependencies

| Dependency | Scope | Reason | Risk control |
|---|---|---|---|
| `fastify` | local runtime dependency in `runtime/package.json` | Provides the local HTTP API server for `/health` and protected `/v1/*` routes in TASK-0012. | Installed only under `runtime/`; no global install; no Swagger UI, dotenv, SQLite package, CORS plugin, deploy tool, or frontend dependency added. |

## TASK-0012 installation boundary

`fastify` was installed with npm cache, HOME, and TMPDIR redirected under `/workspace/evidence/TASK-0012/` to avoid writing outside `/workspace`.

No dependency in this file authorizes reading real secrets, creating `.env`, creating persistent SQLite databases, touching OpenClaw real, touching a VPS, or opening `0.0.0.0`.
