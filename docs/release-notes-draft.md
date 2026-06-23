# Release notes draft — v0.1.0

## Resumen

v0.1.0 prepara `openclaw-mercadopago-released-money` para una subida pública controlada a GitHub con documentación coherente, instalador guiado y timer seguro por defecto.

## Cambios principales

- Documentación pública actualizada al estado v0.1.0.
- Instalador real guiado para usuario no programador.
- `MP_ACCESS_TOKEN` se solicita de forma oculta y no se imprime.
- Se aceptan tokens `APP_USR-...` y `APP_USR_...`.
- Pegado incorrecto `MP_ACCESS_TOKEN=...` se detecta antes de guardar.
- `FINANCE_API_TOKEN` se genera localmente sin imprimirse.
- OpenClaw usa CLI plural `openclaw skills` e instalación por directorio.
- Wrapper absoluto `~/.local/bin/openclaw-mp-finance` documentado.
- `frontend-info` documentado para integraciones futuras.
- Doctor reporta timer disabled como estado seguro.
- Timer automático no se habilita por defecto.

## Límites

- No hay frontend incluido.
- No hay bancos, Open Banking, OFX/QIF ni scraping.
- No se publicó en GitHub desde esta tarea.
- No se hizo deploy ni VPS action.
- No se usaron credenciales reales ni datos reales.
- Sync automático por API Mercado Pago Released Money no está implementado ni validado; no se promete.
