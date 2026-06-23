#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="openclaw-mercadopago-released-money"
SKILL_SLUG="mercadopago-finance"
DEFAULT_API_HOST="127.0.0.1"
DEFAULT_API_PORT="3766"
DEFAULT_COUNTRY="CL"
DEFAULT_CURRENCY="CLP"
DEFAULT_TIMEZONE="America/Santiago"
DEFAULT_DAILY_IMPORT_TIME="03:00"
DEFAULT_SALARY_DAY="19"
DEFAULT_SALARY_POLICY="previous_business_day"
DEFAULT_SALARY_MIN_AMOUNT="400000"

show_help() {
  cat <<'HELP'
Usage: ./installer/install.sh [--dry-run] [--yes] [--home PATH] [--repair] [--no-openclaw] [--no-timer] [--enable-timer] [--skip-npm-install] [--offline] [--skip-mp-token] [--non-interactive] [--help]

Instalador guiado y resumible de openclaw-mercadopago-released-money.

Modo normal:
  bash installer/install.sh
  Abre un asistente en español, pide el MP_ACCESS_TOKEN sin mostrarlo si falta y confirma antes de escribir cambios.

Modo reparación/resume:
  bash installer/install.sh --yes --home "$HOME" --repair
  Reusa config/secrets existentes, no imprime ni sobrescribe tokens existentes, completa app/wrapper/OpenClaw/systemd si falta.
  El modo normal también es resumible: reejecutarlo completa partes faltantes sin borrar datos privados.

Automatización:
  --yes               Acepta confirmaciones del instalador.
  --home PATH         Instala bajo un HOME explícito. Por defecto usa $HOME.
  --repair            Reparación idempotente de instalación parcial; no borra datos ni regenera secretos existentes.
  --non-interactive   No pregunta por consola; requiere MP_ACCESS_TOKEN en entorno o secrets/.env existente, salvo --skip-mp-token.

Controles de seguridad:
  --dry-run           Muestra el plan; no escribe ni pide token real.
  --no-openclaw       Omite registro de skill OpenClaw.
  --no-timer          Omite instalación de unidades systemd --user.
  --enable-timer      Reservado para una versión futura con sync real validado; actualmente falla de forma segura.
  --offline           No llama APIs ni chequeos online opcionales.
  --skip-npm-install  Omite npm ci --omit=dev.
  --skip-mp-token     No pide MP_ACCESS_TOKEN; deja doctor incompleto. El timer queda deshabilitado por defecto.
  --help              Muestra esta ayuda.

Log persistente:
  Cada ejecución escribe ~/.local/state/openclaw-mercadopago-released-money/logs/install-YYYYMMDDTHHMMSSZ.log
  El log no contiene valores de MP_ACCESS_TOKEN ni FINANCE_API_TOKEN.
HELP
}

DRY_RUN=0
YES=0
REPAIR=0
PLAN_OPENCLAW=1
PLAN_TIMER=1
ENABLE_TIMER=0
OFFLINE=0
SKIP_NPM_INSTALL=0
SKIP_MP_TOKEN=0
NON_INTERACTIVE=0
HOME_BASE="${HOME:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --yes) YES=1; shift ;;
    --repair) REPAIR=1; shift ;;
    --no-openclaw) PLAN_OPENCLAW=0; shift ;;
    --no-timer) PLAN_TIMER=0; shift ;;
    --enable-timer) ENABLE_TIMER=1; shift ;;
    --offline) OFFLINE=1; shift ;;
    --skip-npm-install) SKIP_NPM_INSTALL=1; shift ;;
    --skip-mp-token) SKIP_MP_TOKEN=1; shift ;;
    --non-interactive) NON_INTERACTIVE=1; shift ;;
    --home)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then printf 'ERROR: --home requiere una ruta\n' >&2; exit 2; fi
      HOME_BASE="$2"; shift 2 ;;
    --help|-h) show_help; exit 0 ;;
    *) printf 'ERROR: opción desconocida: %s\n' "$1" >&2; show_help >&2; exit 2 ;;
  esac
done

if [[ -z "$HOME_BASE" ]]; then printf 'ERROR: HOME no está definido; usa --home PATH\n' >&2; exit 1; fi
case "$HOME_BASE" in /*) ;; *) printf 'ERROR: --home debe ser una ruta absoluta\n' >&2; exit 1 ;; esac

CONFIG_DIR="${HOME_BASE}/.config/${PROJECT_NAME}"
SECRETS_DIR="${CONFIG_DIR}/secrets"
ENV_FILE="${SECRETS_DIR}/.env"
STATE_DIR="${HOME_BASE}/.local/state/${PROJECT_NAME}"
STATE_LOG_DIR="${STATE_DIR}/logs"
LOG_FILE="${STATE_LOG_DIR}/install-$(date -u +%Y%m%dT%H%M%SZ).log"

command_status() { if command -v "$1" >/dev/null 2>&1; then printf 'present'; else printf 'missing'; fi; }
require_command() { if ! command -v "$1" >/dev/null 2>&1; then printf 'ERROR: comando requerido no encontrado: %s\n' "$1" >&2; exit 1; fi; }
has_env_key() { [[ -f "$ENV_FILE" ]] && grep -Eq "^$1=." "$ENV_FILE" 2>/dev/null; }
trim_token_input() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}
token_has_known_prefix() {
  local value="$1"
  [[ "$value" == APP_USR-* || "$value" == APP_USR_* ]]
}

intro() {
  cat <<INTRO
Instalador de openclaw-mercadopago-released-money

Qué se instalará o reparará:
- Skill local de OpenClaw para Mercado Pago Released Money.
- Backend/API local en http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}.
- Wrapper CLI: openclaw-mp-finance.
- Unidades systemd --user opcionales para importación diaria; el timer queda deshabilitado por defecto hasta validar sync real.

Dónde se guardará:
- Configuración sin secretos: ${CONFIG_DIR}/config.json
- Secretos privados: ${SECRETS_DIR}/.env
- App instalada: ${HOME_BASE}/.local/share/${PROJECT_NAME}/app/
- Log persistente: ${LOG_FILE}

Seguridad:
- El token Mercado Pago no se imprimirá.
- FINANCE_API_TOKEN se genera localmente si falta y no se imprimirá.
- Los secretos existentes se conservan.
- La API queda escuchando en 127.0.0.1 por defecto.
INTRO
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  intro
  cat <<PLAN
INSTALL_PLAN_DRY_RUN
project: ${PROJECT_NAME}
mode: $([[ "$REPAIR" -eq 1 ]] && printf 'repair' || printf 'install/resume')
api_default: http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}
config: ${CONFIG_DIR}/config.json
secrets: ${SECRETS_DIR}/.env
persistent_log: ${LOG_FILE}
mp_access_token_prompt: skipped in dry-run
finance_api_token_generation: planned only if absent
frontend_ready: openclaw-mp-finance frontend-info
OpenClaw registration: $([[ "$PLAN_OPENCLAW" -eq 1 ]] && printf 'planned/resumable' || printf 'skipped by --no-openclaw')
systemd --user timer: $([[ "$PLAN_TIMER" -eq 1 ]] && printf 'installed-disabled by default; enable blocked until sync validation' || printf 'skipped by --no-timer')
sync capability: not implemented/validated for automatic API sync
checks: node=$(command_status node) npm=$(command_status npm)
Scope guard: No bancos / No Open Banking / No scraping.
PLAN
  exit 0
fi

mkdir -p "$STATE_LOG_DIR"
touch "$LOG_FILE"
chmod 600 "$LOG_FILE" 2>/dev/null || true
exec > >(tee -a "$LOG_FILE") 2>&1
on_error() {
  local code=$?
  printf 'INSTALL_FAILED\nlog: %s\n' "$LOG_FILE"
  exit "$code"
}
trap on_error ERR

if [[ "$NON_INTERACTIVE" -eq 0 ]]; then
  intro
  if [[ "$YES" -ne 1 ]]; then
    printf '¿Continuar y escribir/reparar cambios locales? Escribe SI para continuar: '
    IFS= read -r answer
    if [[ "$answer" != "SI" ]]; then printf 'Instalación cancelada sin cambios.\n'; exit 1; fi
  fi
fi

if [[ "$ENABLE_TIMER" -eq 1 ]]; then
  printf 'ERROR: --enable-timer está bloqueado en esta versión: openclaw-mp-finance sync/API automática no está implementado y validado de extremo a extremo.\n' >&2
  printf 'La instalación segura deja service/timer instalados pero disabled por defecto.\n' >&2
  exit 1
fi

require_command node
if [[ "$SKIP_NPM_INSTALL" -ne 1 ]]; then require_command npm; fi
if [[ "$PLAN_OPENCLAW" -eq 1 ]]; then require_command openclaw; fi
if [[ "$PLAN_TIMER" -eq 1 ]]; then require_command systemctl; fi
require_command tar

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
SHARE_DIR="${HOME_BASE}/.local/share/${PROJECT_NAME}"
APP_DIR="${SHARE_DIR}/app"
REPORTS_DIR="${SHARE_DIR}/reports"
BIN_DIR="${HOME_BASE}/.local/bin"
WRAPPER="${BIN_DIR}/openclaw-mp-finance"
SYSTEMD_USER_DIR="${HOME_BASE}/.config/systemd/user"
INSTALL_STATE="${STATE_DIR}/install-state.env"
LOCAL_BIN_WAS_IN_PATH=0
case ":${PATH}:" in *":${BIN_DIR}:"*) LOCAL_BIN_WAS_IN_PATH=1 ;; esac
export PATH="${BIN_DIR}:${PATH}"

make_token() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex 32
  elif command -v python3 >/dev/null 2>&1; then python3 -c 'import secrets; print(secrets.token_hex(32))'
  elif command -v node >/dev/null 2>&1; then node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex") + "\n")'
  else printf 'ERROR: no hay generador de tokens disponible (openssl, python3 o node)\n' >&2; exit 1
  fi
}
append_or_replace_secret() {
  local key="$1" value="$2" tmp
  tmp="${ENV_FILE}.new.$$"
  umask 077
  if [[ -f "$ENV_FILE" ]]; then grep -Ev "^${key}=" "$ENV_FILE" > "$tmp" || true; else : > "$tmp"; fi
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
}
validate_existing_app() {
  if [[ -e "$APP_DIR" ]]; then
    [[ -d "$APP_DIR" && -f "${APP_DIR}/SKILL.md" && -f "${APP_DIR}/runtime/src/cli/index.mjs" ]] || {
      printf 'ERROR: app existente no parece pertenecer a este paquete: %s\n' "$APP_DIR" >&2
      printf 'Sugerencia: haz backup o desinstala antes de reparar. No se sobrescribió.\n' >&2
      exit 1
    }
    grep -Eq 'mercadopago-finance|Mercado Pago|openclaw-mercadopago' "${APP_DIR}/SKILL.md" || {
      printf 'ERROR: app existente no pudo validarse como %s: %s\n' "$PROJECT_NAME" "$APP_DIR" >&2
      printf 'Sugerencia: haz backup o desinstala antes de reparar. No se sobrescribió.\n' >&2
      exit 1
    }
  fi
}
validate_existing_wrapper() {
  if [[ -e "$WRAPPER" ]]; then
    [[ -f "$WRAPPER" && -x "$WRAPPER" ]] || { printf 'ERROR: wrapper existente no es ejecutable válido: %s\n' "$WRAPPER" >&2; exit 1; }
    grep -Fq "$PROJECT_NAME" "$WRAPPER" || {
      printf 'ERROR: wrapper existente no parece pertenecer a este paquete: %s\n' "$WRAPPER" >&2
      printf 'Sugerencia: haz backup o desinstala antes de reparar. No se sobrescribió.\n' >&2
      exit 1
    }
  fi
}
write_state_kv() {
  local key="$1" value="$2"
  mkdir -p "$STATE_DIR"
  if [[ -f "$INSTALL_STATE" ]]; then grep -Ev "^${key}=" "$INSTALL_STATE" > "${INSTALL_STATE}.new.$$" || true; else : > "${INSTALL_STATE}.new.$$"; fi
  printf '%s=%s\n' "$key" "$value" >> "${INSTALL_STATE}.new.$$"
  mv "${INSTALL_STATE}.new.$$" "$INSTALL_STATE"
}

mkdir -p "$CONFIG_DIR" "$SECRETS_DIR" "$REPORTS_DIR/raw" "$REPORTS_DIR/exports" "$REPORTS_DIR/archive" "$REPORTS_DIR/quarantine" "$BIN_DIR" "$STATE_DIR"
chmod g-s "$CONFIG_DIR" "$SECRETS_DIR" 2>/dev/null || true
chmod 700 "$CONFIG_DIR" "$SECRETS_DIR"

MP_TOKEN_PROVIDED=0
if [[ "$SKIP_MP_TOKEN" -eq 1 ]]; then
  printf 'ADVERTENCIA: se omitió MP_ACCESS_TOKEN. Doctor reportará token ausente. El timer queda deshabilitado por defecto.\n' >&2
elif has_env_key MP_ACCESS_TOKEN; then
  MP_TOKEN_PROVIDED=1
elif [[ -n "${MP_ACCESS_TOKEN:-}" ]]; then
  MP_ACCESS_TOKEN_CLEAN="$(trim_token_input "$MP_ACCESS_TOKEN")"
  if [[ "$MP_ACCESS_TOKEN_CLEAN" == MP_ACCESS_TOKEN=* || "$MP_ACCESS_TOKEN_CLEAN" == \"* || "$MP_ACCESS_TOKEN_CLEAN" == \'* ]]; then
    printf 'ERROR: MP_ACCESS_TOKEN parece incluir el nombre de variable o comillas. Define solo el valor del token, sin imprimirlo aquí.\n' >&2
    exit 1
  fi
  append_or_replace_secret "MP_ACCESS_TOKEN" "$MP_ACCESS_TOKEN_CLEAN"
  unset MP_ACCESS_TOKEN_CLEAN
  MP_TOKEN_PROVIDED=1
elif [[ "$NON_INTERACTIVE" -eq 1 ]]; then
  printf 'ERROR: modo --non-interactive requiere MP_ACCESS_TOKEN en variable de entorno o secrets/.env existente, salvo --skip-mp-token\n' >&2
  exit 1
else
  while true; do
    printf 'Pega tu MP_ACCESS_TOKEN de Mercado Pago. No se mostrará en pantalla: '
    IFS= read -rs MP_ACCESS_TOKEN_INPUT
    printf '\n'
    MP_ACCESS_TOKEN_INPUT="$(trim_token_input "$MP_ACCESS_TOKEN_INPUT")"
    if [[ -z "$MP_ACCESS_TOKEN_INPUT" ]]; then printf 'ERROR: MP_ACCESS_TOKEN vacío; abortando.\n' >&2; exit 1; fi
    if [[ "$MP_ACCESS_TOKEN_INPUT" == MP_ACCESS_TOKEN=* ]]; then
      printf 'Detecté que pegaste la línea completa MP_ACCESS_TOKEN=... Pega solo el valor del token, sin mostrarlo aquí.\n' >&2
      continue
    fi
    if [[ "$MP_ACCESS_TOKEN_INPUT" == \"* || "$MP_ACCESS_TOKEN_INPUT" == \'* ]]; then
      printf 'Detecté comillas iniciales. Pega solo el valor del token, sin comillas.\n' >&2
      continue
    fi
    if ! token_has_known_prefix "$MP_ACCESS_TOKEN_INPUT"; then
      printf 'No reconozco el prefijo típico APP_USR-/APP_USR_. El valor no se imprimirá.\n' >&2
      printf 'Si copiaste el token desde Mercado Pago y estás seguro, puedes continuar; si pegaste la línea completa o comillas, cancela y vuelve a intentarlo.\n' >&2
      if [[ "$YES" -ne 1 ]]; then
        printf 'Escribe CONTINUAR para guardar este token igualmente: '
        IFS= read -r token_answer
        if [[ "$token_answer" != "CONTINUAR" ]]; then printf 'Instalación cancelada antes de guardar el token.\n' >&2; exit 1; fi
      fi
    fi
    break
  done
  append_or_replace_secret "MP_ACCESS_TOKEN" "$MP_ACCESS_TOKEN_INPUT"
  unset MP_ACCESS_TOKEN_INPUT
  MP_TOKEN_PROVIDED=1
fi
unset MP_ACCESS_TOKEN || true

if ! has_env_key FINANCE_API_TOKEN; then
  FINANCE_TOKEN="$(make_token)"
  append_or_replace_secret "FINANCE_API_TOKEN" "$FINANCE_TOKEN"
  unset FINANCE_TOKEN
fi
chmod 600 "$ENV_FILE"

if [[ ! -f "${CONFIG_DIR}/config.json" ]]; then
  cat > "${CONFIG_DIR}/config.json" <<CONFIG
{
  "provider": { "name": "mercado_pago", "report": "released_money", "country": "${DEFAULT_COUNTRY}", "currency": "${DEFAULT_CURRENCY}" },
  "api": { "host": "${DEFAULT_API_HOST}", "port": ${DEFAULT_API_PORT}, "auth_required": true },
  "scheduler": { "timezone": "${DEFAULT_TIMEZONE}", "daily_import_time": "${DEFAULT_DAILY_IMPORT_TIME}" },
  "salary": { "estimated_day": ${DEFAULT_SALARY_DAY}, "policy": "${DEFAULT_SALARY_POLICY}", "minimum_candidate_amount": ${DEFAULT_SALARY_MIN_AMOUNT}, "description_pattern": "" },
  "reports": {
    "manual_csv_import_enabled": true,
    "raw_dir": "${REPORTS_DIR}/raw",
    "exports_dir": "${REPORTS_DIR}/exports",
    "archive_dir": "${REPORTS_DIR}/archive",
    "quarantine_dir": "${REPORTS_DIR}/quarantine"
  },
  "scope": "No bancos / No Open Banking / No scraping"
}
CONFIG
else
  printf 'config.json existente detectado; se conserva.\n'
fi

validate_existing_app
validate_existing_wrapper
rm -rf "${APP_DIR}.new" "${APP_DIR}.old"
mkdir -p "${APP_DIR}.new"
(
  cd "$BASE_DIR"
  tar --exclude='./runtime/node_modules' --exclude='./runtime/node_modules/*' --exclude='./.git' --exclude='./.git/*' --exclude='./.env' --exclude='./finance.sqlite' --exclude='./*.sqlite' --exclude='./*.sqlite3' --exclude='./*.db' --exclude='./*.db-shm' --exclude='./*.db-wal' --exclude='./*.log' --exclude='./*.pem' --exclude='./*.key' --exclude='./evidence' --exclude='./evidence/*' --exclude='./_out' --exclude='./_out/*' -cf - . | (cd "${APP_DIR}.new" && tar -xf -)
)
if [[ -d "$APP_DIR" ]]; then mv "$APP_DIR" "${APP_DIR}.old"; fi
mv "${APP_DIR}.new" "$APP_DIR"
rm -rf "${APP_DIR}.old"

if [[ "$SKIP_NPM_INSTALL" -ne 1 ]]; then (cd "${APP_DIR}/runtime" && npm ci --omit=dev); fi

cat > "$WRAPPER" <<WRAPPER
#!/usr/bin/env bash
set -euo pipefail
exec node "${APP_DIR}/runtime/src/cli/index.mjs" "\$@"
WRAPPER
chmod 755 "$WRAPPER"

write_state_kv OPENCLAW_REGISTERED 0
write_state_kv TIMER_INSTALLED 0
write_state_kv TIMER_ENABLED 0
write_state_kv SYNC_CAPABILITY not_implemented
write_state_kv NPM_INSTALL_SKIPPED "$SKIP_NPM_INSTALL"
write_state_kv MP_ACCESS_TOKEN_PRESENT "$MP_TOKEN_PROVIDED"

if [[ "$PLAN_OPENCLAW" -eq 1 ]]; then
  [[ -d "$APP_DIR" && -f "${APP_DIR}/SKILL.md" ]] || { printf 'ERROR: directorio de skill inválido: %s\n' "$APP_DIR" >&2; exit 1; }
  if openclaw skills list 2>/dev/null | grep -Fq "$SKILL_SLUG"; then
    printf 'OpenClaw: skill %s ya instalada; se acepta estado existente.\n' "$SKILL_SLUG"
  else
    openclaw skills install "$APP_DIR" --as "$SKILL_SLUG"
  fi
  write_state_kv OPENCLAW_REGISTERED 1
fi

if [[ "$PLAN_TIMER" -eq 1 ]]; then
  mkdir -p "$SYSTEMD_USER_DIR"
  cp "${APP_DIR}/installer/systemd/openclaw-mp-finance.service.template" "${SYSTEMD_USER_DIR}/openclaw-mp-finance.service"
  cp "${APP_DIR}/installer/systemd/openclaw-mp-finance.timer.template" "${SYSTEMD_USER_DIR}/openclaw-mp-finance.timer"
  systemctl --user daemon-reload
  write_state_kv TIMER_INSTALLED 1
  write_state_kv TIMER_ENABLED 0
fi

if [[ -x "$WRAPPER" ]]; then FRONTEND_READY="ok"; else FRONTEND_READY="incomplete"; fi
MARKER="INSTALL_USER_FLOW_OK"
if [[ "$REPAIR" -eq 1 ]]; then MARKER="INSTALL_REPAIR_OK"; fi
cat <<OK
${MARKER}
project: ${PROJECT_NAME}
mode: $([[ "$REPAIR" -eq 1 ]] && printf 'repair' || printf 'install/resume')
home: ${HOME_BASE}
log: ${LOG_FILE}
config: ${CONFIG_DIR}/config.json
secrets: ${SECRETS_DIR}/.env (value not printed)
app: ${APP_DIR}
wrapper: ${WRAPPER}
api: http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}
frontend_info: ${WRAPPER} frontend-info
frontend_info_short: openclaw-mp-finance frontend-info
openclaw_registration: $([[ "$PLAN_OPENCLAW" -eq 1 ]] && printf 'installed-or-existing' || printf 'skipped')
systemd_timer: $([[ "$PLAN_TIMER" -eq 1 ]] && printf 'installed-disabled (safe default)' || printf 'skipped')
sync_capability: not implemented/validated for automatic API sync
timer_note: La instalación quedó lista para uso manual/API/frontend. La sincronización automática queda deshabilitada hasta configurar y validar sync.
npm_install: $([[ "$SKIP_NPM_INSTALL" -eq 1 ]] && printf 'skipped' || printf 'npm ci --omit=dev completed')
mp_access_token: $([[ "$MP_TOKEN_PROVIDED" -eq 1 ]] && printf 'present (value not printed)' || printf 'absent')
frontend_ready: ${FRONTEND_READY}
doctor_command: bash ${APP_DIR}/installer/doctor.sh --home ${HOME_BASE}
path_note: $([[ "$LOCAL_BIN_WAS_IN_PATH" -eq 1 ]] && printf '~/.local/bin already in PATH' || printf 'Nota: si tu shell no reconoce openclaw-mp-finance, usa la ruta completa %s frontend-info o vuelve a iniciar sesión.' "$WRAPPER")
Scope guard: No bancos / No Open Banking / No scraping.
OK
trap - ERR
