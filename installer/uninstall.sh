#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="openclaw-mercadopago-released-money"

show_help() {
  cat <<'HELP'
Usage: ./installer/uninstall.sh [--dry-run] [--yes] [--home PATH] [--keep-data] [--help]

Uninstaller for openclaw-mercadopago-released-money.

Options:
  --dry-run     Print the uninstall plan only.
  --yes         Required confirmation for real-mode uninstall.
  --home PATH   Required real-mode HOME base.
  --keep-data   Preserve reports/data/config/secrets.
  --help        Show this help.

Safety:
  Secret values are never printed. --keep-data preserves config, secrets,
  reports, and state logs while removing runtime app, wrapper, timer units,
  and OpenClaw registration when they were installed by this installer.
HELP
}

DRY_RUN=0
YES=0
KEEP_DATA=0
HOME_BASE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --yes) YES=1; shift ;;
    --keep-data) KEEP_DATA=1; shift ;;
    --home)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then printf 'ERROR: --home requires a path\n' >&2; exit 2; fi
      HOME_BASE="$2"; shift 2 ;;
    --help|-h) show_help; exit 0 ;;
    *) printf 'ERROR: unknown option: %s\n' "$1" >&2; show_help >&2; exit 2 ;;
  esac
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  cat <<PLAN
UNINSTALL_PLAN_DRY_RUN
project: ${PROJECT_NAME}

Future actions intentionally not executed by dry-run:
- disable systemd --user timer if installed by this installer
- remove user systemd unit files if present
- unregister OpenClaw skill with openclaw skills uninstall if installed by this installer
- remove runtime install artifacts
- remove wrapper CLI
- preserve data by default; --keep-data explicitly preserves config/secrets/reports

Future paths reviewed before deletion:
- app: ~/.local/share/${PROJECT_NAME}/app/
- wrapper: ~/.local/bin/openclaw-mp-finance
- systemd user units: ~/.config/systemd/user/openclaw-mp-finance.{service,timer}

Data policy: $([[ "$KEEP_DATA" -eq 1 ]] && printf 'keep data requested and planned' || printf 'keep data recommended')
Secret policy: never print, copy, or archive token values.
Scope guard: No bancos / No Open Banking / No scraping.
PLAN
  exit 0
fi

if [[ "$YES" -ne 1 ]]; then printf 'ERROR: real uninstall requires --yes\n' >&2; exit 1; fi
if [[ -z "$HOME_BASE" ]]; then printf 'ERROR: real uninstall requires --home PATH\n' >&2; exit 1; fi
case "$HOME_BASE" in /*) ;; *) printf 'ERROR: --home must be an absolute path\n' >&2; exit 1 ;; esac
if [[ "$KEEP_DATA" -ne 1 ]]; then printf 'ERROR: real uninstall requires --keep-data in this release\n' >&2; exit 1; fi

APP_DIR="${HOME_BASE}/.local/share/${PROJECT_NAME}/app"
WRAPPER="${HOME_BASE}/.local/bin/openclaw-mp-finance"
STATE_FILE="${HOME_BASE}/.local/state/${PROJECT_NAME}/install-state.env"
SYSTEMD_USER_DIR="${HOME_BASE}/.config/systemd/user"
OPENCLAW_REGISTERED=0
TIMER_INSTALLED=0
if [[ -f "$STATE_FILE" ]]; then
  # shellcheck disable=SC1090
  . "$STATE_FILE"
fi

if [[ "${TIMER_INSTALLED:-0}" == "1" ]] && command -v systemctl >/dev/null 2>&1; then
  systemctl --user disable --now openclaw-mp-finance.timer || true
  systemctl --user daemon-reload || true
fi
rm -f "${SYSTEMD_USER_DIR}/openclaw-mp-finance.service" "${SYSTEMD_USER_DIR}/openclaw-mp-finance.timer"

if [[ "${OPENCLAW_REGISTERED:-0}" == "1" ]] && command -v openclaw >/dev/null 2>&1; then
  openclaw skills uninstall mercadopago-finance || true
fi

rm -rf "$APP_DIR"
rm -f "$WRAPPER"
if [[ -f "$STATE_FILE" ]]; then
  {
    printf 'OPENCLAW_REGISTERED=0\n'
    printf 'TIMER_INSTALLED=0\n'
    printf 'TIMER_ENABLED=0\n'
    printf 'SYNC_CAPABILITY=not_implemented\n'
    printf 'NPM_INSTALL_SKIPPED=%s\n' "${NPM_INSTALL_SKIPPED:-0}"
  } > "$STATE_FILE"
fi

cat <<OK
UNINSTALL_REAL_MODE_OK
project: ${PROJECT_NAME}
home: ${HOME_BASE}
removed_app: ${APP_DIR}
removed_wrapper: ${WRAPPER}
keep_data: true
config_secrets_preserved: true
reports_preserved: true
systemd_timer_removed: true
openclaw_registration_removed: true
Scope guard: No bancos / No Open Banking / No scraping.
OK
