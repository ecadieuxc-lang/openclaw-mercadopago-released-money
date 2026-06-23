# VPS human review — v0.1.0

Esta revisión separa el candidato público v0.1.0 de cualquier acción en VPS real. No se ejecutó SSH, SCP, rsync, deploy, systemctl real ni OpenClaw real.

## Estado

- Instalador real guiado disponible para HOME local/controlado.
- Token seguro: oculto, no impreso, `.env` privado con chmod 600.
- OpenClaw listo mediante `openclaw skills install <skill-directory> --as mercadopago-finance`.
- Backend/API local y contrato frontend-ready disponibles.
- Timer systemd user queda disabled por defecto.
- Sync automático por API Mercado Pago Released Money no está implementado ni validado de extremo a extremo.

## Decisiones para VPS posterior

| Área | Estado | Acción humana requerida |
| --- | --- | --- |
| Instalar en VPS | WAIT HUMAN APPROVAL | Revisar rutas, permisos, rollback y usuario destino. |
| Registrar OpenClaw real | WAIT HUMAN APPROVAL | Ejecutar solo en entorno privado autorizado. |
| Configurar token real | WAIT HUMAN APPROVAL | Pegar manualmente sin imprimir ni registrar valores. |
| Habilitar timer | BLOCKED UNTIL SYNC VALIDATED | Implementar/validar sync real antes de habilitar. |
| Exponer API fuera de 127.0.0.1 | SEPARATE SECURITY REVIEW | Revisar red, auth, CORS y firewall. |

## Veredicto

V10 puede revisarse para publicación pública controlada. GitHub publication queda separada de este plan y requiere autorización humana. No implica autorización para VPS real, datos reales, token real ni timer automático.
