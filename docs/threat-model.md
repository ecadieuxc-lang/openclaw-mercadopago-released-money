# Threat Model — Mercado Pago Released Money skill

## Scope

This threat model covers the public `openclaw-mercadopago-released-money` project for Mercado Pago Released Money only.

It does not cover banks, Open Banking, OFX/QIF, scraping, multi-provider finance, hosted SaaS, or real VPS deployment.

## Assets

- Mercado Pago access credentials held by the local operator outside the repository.
- Local API token used for v1 routes.
- Raw Mercado Pago Released Money evidence files kept outside the public repository.
- Local SQLite database containing processed finance records.
- Logs that could accidentally contain financial data.
- OpenClaw answers shown to the user.

## Risks and mitigations

### Mercado Pago token leaked

Risk: A real Mercado Pago credential is committed, logged, copied into documentation, or exposed through process output.

Mitigations:

- Never store real tokens in the repository.
- Use local configuration outside Git.
- Use placeholders that cannot authenticate.
- Add secret scanning tests before release.
- Avoid printing credential values in CLI, API, or logs.

### Local financial API exposed

Risk: The API binds to a public interface or is reachable by another machine.

Mitigations:

- Default bind address is `127.0.0.1`.
- Require a local token for v1 routes.
- Document that public binding is unsupported in this phase.
- Include a doctor check that reports bind address and token configuration without printing token values.

### Real CSV uploaded to GitHub

Risk: A real Mercado Pago Released Money CSV file is added to the public repository.

Mitigations:

- Keep only synthetic fixtures in the repository.
- Document raw real CSV storage as local-only evidence.
- Add test patterns that flag likely real fixture names and unsafe directories.
- Require release checklist review before packaging.

### Real SQLite database uploaded

Risk: A local processed SQLite database with real financial data is committed.

Mitigations:

- Ignore local database paths in repository policy when code is introduced.
- Store only synthetic test databases if needed.
- Add release checks for database files and fixture provenance.

### Logs contain financial data

Risk: Debug logs include amounts, payer names, transfer identifiers, personal notes, or imported row contents.

Mitigations:

- Default logs should be operational and minimal.
- Do not log full records by default.
- Redact sensitive fields in errors.
- Use synthetic fixtures in test logs.

### Compromised npm dependency

Risk: A package dependency introduces malicious behavior or data exfiltration.

Mitigations:

- Prefer standard library and minimal dependencies.
- Require explicit dependency review before adding packages.
- Pin or constrain versions according to the future package policy.
- Run dependency audit where available before release.

### Dangerous installer

Risk: Installer writes outside intended local paths, installs timers unexpectedly, weakens permissions, or prints secrets.

Mitigations:

- Installer is not implemented until a later task.
- Installer task must include uninstaller and doctor behavior.
- No sudo by default.
- Dry-run or explicit path reporting before mutation where practical.
- Never print secret values.

### Timer or cron installed incorrectly

Risk: A background task runs too often, imports wrong files, exposes logs, or persists after uninstall.

Mitigations:

- Timer/cron is out of scope until explicitly designed.
- Require a separate task and evidence before adding scheduling.
- Include uninstall cleanup verification.
- Prefer opt-in local scheduling only.

### OpenClaw uses invented data

Risk: OpenClaw answers finance questions from assumptions instead of backend data.

Mitigations:

- `SKILL.md` must instruct OpenClaw to call API/CLI.
- OpenClaw must state when data is missing.
- API responses should distinguish known, unknown, and unsupported states.
- Tests should cover missing data behavior.

### Transfer without recipient invented

Risk: OpenClaw invents a recipient, purpose, or classification for a transfer when Mercado Pago Released Money data does not contain it.

Mitigations:

- Runtime must preserve unknown recipient fields as unknown.
- Classification must be explicit and auditable.
- OpenClaw must not fill missing financial facts creatively.
- Reports must show uncertainty when the backend cannot identify a counterparty.

## Security posture for this phase

This documentation phase creates no runtime, parser, API, CLI, installer, timers, secrets, real CSV files, real SQLite database, or deployment.
