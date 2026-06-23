#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="openclaw-mercadopago-released-money"
SKILL_SLUG="mercadopago-finance"
DEFAULT_API_HOST="127.0.0.1"

show_help() {
  cat <<'HELP'
Usage: ./installer/doctor.sh [--dry-run] [--home PATH] [--help]

Doctor seguro para openclaw-mercadopago-released-money.
Distingue estado parcial/completo y no imprime valores secretos; solo presencia, permisos y estado.
HELP
}

DRY_RUN=0
HOME_BASE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --home) if [[ $# -lt 2 || -z "${2:-}" ]]; then printf 'ERROR: --home requires a path\n' >&2; exit 2; fi; HOME_BASE="$2"; shift 2 ;;
    --help|-h) show_help; exit 0 ;;
    *) printf 'ERROR: unknown option: %s\n' "$1" >&2; show_help >&2; exit 2 ;;
  esac
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
check_file() { local rel="$1"; if [[ -f "${BASE_DIR}/${rel}" ]]; then printf 'ok: %s\n' "$rel"; else printf 'missing: %s\n' "$rel"; return 1; fi; }

if [[ "$DRY_RUN" -eq 1 ]]; then
  STATUS=0
  echo "DOCTOR_DRY_RUN"
  echo "project: ${PROJECT_NAME}"
  echo "api host: ${DEFAULT_API_HOST}"
  for rel in SKILL.md runtime/package.json runtime/src/cli/index.mjs runtime/src/api/openapi.v1.json docs/installation.md docs/installer.md docs/configuration.md docs/frontend-integration.md docs/security.md docs/doctor.md docs/troubleshooting.md installer/install.sh installer/uninstall.sh installer/doctor.sh installer/systemd/openclaw-mp-finance.service.template installer/systemd/openclaw-mp-finance.timer.template; do
    check_file "$rel" || STATUS=1
  done
  if find "${BASE_DIR}" -path "${BASE_DIR}/runtime/node_modules" -prune -o -type f \( -name ".env" -o -name "finance.sqlite" -o -name "*.sqlite" -o -name "*.sqlite3" -o -name "*.db" -o -name "*.db-shm" -o -name "*.db-wal" -o -name "*.log" -o -name "*.pem" -o -name "*.key" -o -name "*.tar.gz" \) -print | grep -q .; then
    echo "repo hygiene: forbidden file present"; STATUS=1
  else
    echo "repo hygiene: ok"
  fi
  echo "app: not checked in dry-run"
  echo "wrapper: not checked in dry-run"
  echo "MP_ACCESS_TOKEN: not checked in dry-run (value never printed)"
  echo "FINANCE_API_TOKEN: not checked in dry-run (value never printed)"
  echo "OpenClaw: not checked in dry-run"
  echo "systemd service: not checked in dry-run"
  echo "systemd timer: installed-disabled / not enabled by default"
  echo "frontend-ready: contract documented via openclaw-mp-finance frontend-info"
  echo "sync capability: not implemented"
  echo "openapi: runtime/src/api/openapi.v1.json"
  exit "$STATUS"
fi

if [[ -z "$HOME_BASE" ]]; then printf 'ERROR: real doctor mode requires --home PATH\n' >&2; exit 1; fi
case "$HOME_BASE" in /*) ;; *) printf 'ERROR: --home must be an absolute path\n' >&2; exit 1 ;; esac

CONFIG_DIR="${HOME_BASE}/.config/${PROJECT_NAME}"
SECRETS_DIR="${CONFIG_DIR}/secrets"
CONFIG_FILE="${CONFIG_DIR}/config.json"
ENV_FILE="${SECRETS_DIR}/.env"
APP_DIR="${HOME_BASE}/.local/share/${PROJECT_NAME}/app"
WRAPPER="${HOME_BASE}/.local/bin/openclaw-mp-finance"
STATE_FILE="${HOME_BASE}/.local/state/${PROJECT_NAME}/install-state.env"
SYSTEMD_USER_DIR="${HOME_BASE}/.config/systemd/user"
SERVICE_FILE="${SYSTEMD_USER_DIR}/openclaw-mp-finance.service"
TIMER_FILE="${SYSTEMD_USER_DIR}/openclaw-mp-finance.timer"
STATUS=0
fail_check() { printf 'missing-or-invalid: %s\n' "$1"; STATUS=1; }
require_file() { [[ -f "$1" ]] || fail_check "$2"; }
mode_of() { if stat -c '%a' "$1" >/dev/null 2>&1; then stat -c '%a' "$1"; else stat -f '%Lp' "$1"; fi; }
has_key() { [[ -f "$ENV_FILE" ]] && grep -Eq "^$1=." "$ENV_FILE"; }

printf 'DOCTOR_REAL_MODE\nproject: %s\nhome: %s\n' "$PROJECT_NAME" "$HOME_BASE"

APP_STATUS="missing"
if [[ -d "$APP_DIR" && -f "${APP_DIR}/SKILL.md" && -f "${APP_DIR}/runtime/package.json" && -f "${APP_DIR}/runtime/src/api/openapi.v1.json" ]]; then APP_STATUS="ok"; else STATUS=1; fi
WRAPPER_STATUS="missing"
if [[ -x "$WRAPPER" ]]; then WRAPPER_STATUS="ok"; else STATUS=1; fi
WRAPPER_PATH_STATUS="warn"
if command -v openclaw-mp-finance >/dev/null 2>&1; then WRAPPER_PATH_STATUS="ok"; fi
CONFIG_STATUS="missing"
if [[ -f "$CONFIG_FILE" ]]; then CONFIG_STATUS="ok"; else STATUS=1; fi
SECRETS_STATUS="missing"
if [[ -f "$ENV_FILE" ]]; then SECRETS_STATUS="ok"; else STATUS=1; fi
printf 'app: %s\n' "$APP_STATUS"
printf 'wrapper file: %s\n' "$WRAPPER_STATUS"
printf 'wrapper in PATH: %s\n' "$WRAPPER_PATH_STATUS"
printf 'wrapper: %s\n' "$WRAPPER_STATUS"
printf 'config.json: %s\n' "$CONFIG_STATUS"
printf 'secrets/.env: %s\n' "$SECRETS_STATUS"

if has_key MP_ACCESS_TOKEN; then printf 'MP_ACCESS_TOKEN: present (value not printed)\n'; else printf 'MP_ACCESS_TOKEN: absent\n'; STATUS=1; fi
if has_key FINANCE_API_TOKEN; then printf 'FINANCE_API_TOKEN: present (value not printed)\n'; else printf 'FINANCE_API_TOKEN: absent\n'; STATUS=1; fi
[[ ! -e "$CONFIG_DIR" || "$(mode_of "$CONFIG_DIR")" == "700" ]] || fail_check "config dir mode 700"
[[ ! -e "$SECRETS_DIR" || "$(mode_of "$SECRETS_DIR")" == "700" ]] || fail_check "secrets dir mode 700"
[[ ! -e "$ENV_FILE" || "$(mode_of "$ENV_FILE")" == "600" ]] || fail_check "secrets/.env mode 600"

if [[ -f "$CONFIG_FILE" ]]; then
  if ! python3 - "$CONFIG_FILE" <<'PY'
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as fh: data = json.load(fh)
assert data.get('api', {}).get('host') == '127.0.0.1'
assert data.get('provider', {}).get('country') == 'CL'
assert data.get('provider', {}).get('currency') == 'CLP'
PY
  then fail_check "config API/provider"; fi
fi

OPENCLAW_STATE="missing"
TIMER_RECORDED="0"
TIMER_ENABLED_RECORDED="0"
SYNC_CAPABILITY="not_implemented"
if [[ -f "$STATE_FILE" ]]; then
  # shellcheck disable=SC1090
  . "$STATE_FILE"
  if [[ "${OPENCLAW_REGISTERED:-0}" == "1" ]]; then OPENCLAW_STATE="installed"; fi
  TIMER_RECORDED="${TIMER_INSTALLED:-0}"
  TIMER_ENABLED_RECORDED="${TIMER_ENABLED:-0}"
  SYNC_CAPABILITY="${SYNC_CAPABILITY:-not_implemented}"
fi
if [[ "$OPENCLAW_STATE" == "missing" ]] && command -v openclaw >/dev/null 2>&1; then
  if openclaw skills list 2>/dev/null | grep -Fq "$SKILL_SLUG"; then OPENCLAW_STATE="installed"; fi
fi
[[ "$OPENCLAW_STATE" == "installed" ]] || STATUS=1

SERVICE_STATE="missing"
[[ -f "$SERVICE_FILE" ]] && SERVICE_STATE="installed" || STATUS=1
TIMER_STATE="missing"
if [[ -f "$TIMER_FILE" ]]; then
  TIMER_STATE="disabled"
  if [[ "$TIMER_RECORDED" == "1" && "$TIMER_ENABLED_RECORDED" == "1" ]]; then TIMER_STATE="enabled"; fi
else
  if [[ "$TIMER_RECORDED" == "1" ]]; then STATUS=1; fi
fi

FRONTEND_READY="incomplete"
if [[ "$APP_STATUS" == "ok" && "$WRAPPER_STATUS" == "ok" ]]; then FRONTEND_READY="ok"; fi
[[ "$FRONTEND_READY" == "ok" ]] || STATUS=1

printf 'OpenClaw: %s\n' "$OPENCLAW_STATE"
printf 'systemd service: %s\n' "$SERVICE_STATE"
printf 'systemd timer: %s\n' "$TIMER_STATE"
printf 'frontend-ready: %s\n' "$FRONTEND_READY"
printf 'sync capability: %s\n' "$SYNC_CAPABILITY"
printf 'frontend readiness: %s\n' "$FRONTEND_READY"
printf 'api host: 127.0.0.1\n'
printf 'openapi: %s\n' "$([[ -f "${APP_DIR}/runtime/src/api/openapi.v1.json" ]] && printf 'ok' || printf 'missing')"
if [[ "$STATUS" -eq 0 ]]; then printf 'DOCTOR_REAL_MODE_OK\n'; else printf 'doctor status: incomplete\n'; fi
exit "$STATUS"
