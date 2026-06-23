# GitHub publication review — v0.1.0

Objetivo: revisar si el v0.1.0 puede pasar a una publicación pública controlada. Esta tarea no publica, no usa GitHub CLI y no toca remotos.

## Estado técnico

- README, SECURITY.md, SKILL.md y docs principales describen instalación real guiada.
- El token Mercado Pago se pide oculto y no se imprime.
- `APP_USR-` y `APP_USR_` son aceptados.
- OpenClaw se documenta con `openclaw skills` plural e instalación por directorio.
- API/frontend contract queda listo para integración futura.
- Timer automático queda disabled por defecto porque el timer depende de sync real/API automática, que no está implementado ni validado.

## Gates

| Área | Estado | Motivo |
| --- | --- | --- |
| Paquete público v0.1.0 | GO técnico condicionado | Requiere revisión humana final de diff, manifest, licencia y secret scan. |
| GitHub publication | WAIT HUMAN APPROVAL | No hay autorización para publicar ni usar remotos. |
| VPS/deploy | WAIT HUMAN APPROVAL | No se tocó VPS real. |
| Mercado Pago real token/API | PRIVATE VALIDATION REQUIRED | No se usan credenciales reales ni llamadas reales desde el repo público. |
| Timer automático | DISABLED SAFE DEFAULT | No se habilita hasta implementar y validar sync real. |

## Revisión obligatoria antes de publicar

- No secretos reales.
- No datos reales.
- No `.env`, SQLite, DB, CSV real ni logs reales.
- README y docs sin promesas de sync automático.
- SECURITY.md presente.
- LICENSE presente.
- Manifest v0.1.0 limpio.
- Checksum del paquete generado.
- Publicación autorizada explícitamente por humano.
