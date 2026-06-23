# VPS human gate — openclaw-mercadopago-released-money

Estado: gate obligatorio para una tarea futura. Este documento no autoriza deploy.

## Regla principal

Ninguna acción sobre VPS real, OpenClaw real, systemd real, cron real, credenciales reales o datos reales está permitida sin una tarea futura separada y confirmación humana explícita.

El paquete candidato actual permanece local, no desplegado y no registrado.

## Checklist obligatorio antes de permitir VPS real

Una tarea futura solo puede avanzar si un humano confirma explícitamente cada punto aplicable:

- [ ] Revisar secret scan y confirmar cero hallazgos críticos.
- [ ] Revisar tarball/listado del paquete candidato.
- [ ] Revisar `.env.example` y confirmar que contiene solo placeholders.
- [ ] Revisar permisos esperados para configuración, datos, logs y secretos.
- [ ] Confirmar token Mercado Pago del usuario sin imprimirlo ni copiarlo al repositorio.
- [ ] Confirmar que el host API por defecto sigue siendo `127.0.0.1`.
- [ ] Confirmar si se usará systemd o cron, con una decisión explícita y reversible.
- [ ] Confirmar que OpenClaw está instalado en el entorno objetivo.
- [ ] Confirmar backup antes de cualquier migración o cambio persistente.
- [ ] Confirmar que no se usará CSV real como fixture.
- [ ] Confirmar que no se hará push automático.
- [ ] Confirmar rollback/uninstall antes de instalar.

## Condiciones mínimas de seguridad

- No bancos.
- No Open Banking.
- No scraping.
- No frontend obligatorio.
- No exposición pública de API sin revisión separada.
- No CORS abierto por defecto.
- No secretos en argumentos de comando, logs o documentación.
- No datos reales dentro del repositorio ni dentro de fixtures públicos.

## Acciones prohibidas hasta pasar este gate

- Deploy real.
- Registro real de skill en OpenClaw.
- Crear o habilitar servicios systemd reales.
- Crear timers o cron reales.
- Leer o imprimir tokens reales.
- Crear `.env` real dentro del repositorio.
- Crear SQLite/DB/log real dentro del repositorio.
- Usar CSV real como fixture.
- Hacer push automático.

## Evidencia requerida para una tarea futura

La tarea futura debe dejar evidencia auditable de:

- comandos ejecutados;
- rutas tocadas;
- checks de permisos sin valores secretos;
- healthcheck local en `127.0.0.1`;
- estado de rollback/uninstall;
- confirmación de no publicar secretos ni datos reales.

Este gate debe seguir marcado como no completado hasta que exista esa tarea futura con aprobación humana explícita.
# TASK-0024 v4 manual gate

Candidate v4 is prepared only for a later human-controlled VPS test. Cortana did no deploy, no VPS action, no GitHub publication, no real OpenClaw registration, no real credentials, and no real Mercado Pago data/API use. The sandbox proof uses mocks in `/workspace/evidence/TASK-0024`.

# TASK-0025 v5 manual gate

Candidate v5 corrects the OpenClaw CLI to the real plural form: `openclaw skills install/list/uninstall`. No usar `openclaw skill` singular. Candidate v5 remains local under `/workspace/evidence/TASK-0025`; Cortana did no deploy, no VPS action, no GitHub publication, no real OpenClaw registration, no real credentials, and no real Mercado Pago data/API use.

# TASK-0026 v6 manual gate

Candidate v6 corrects the OpenClaw install path to use the skill directory: `openclaw skills install <skill-directory> --as mercadopago-finance`. The previous `SKILL.md` file path is a known rejected form in OpenClaw 2026.6.5. Candidate v6 remains local under `/workspace/evidence/TASK-0026`; Cortana did no deploy, no VPS action, no GitHub publication, no real OpenClaw registration, no real credentials, and no real Mercado Pago data/API use.

