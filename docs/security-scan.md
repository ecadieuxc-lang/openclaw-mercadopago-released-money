# Security scan

`openclaw-mercadopago-released-money` includes a deterministic local security scan implemented with Node.js standard library only. It is intended as a first public-release safety layer, not as a replacement for specialist tools such as gitleaks or trufflehog.

## What the scan checks

The scanner reports critical findings for:

- prohibited files in the public package: `.env`, SQLite/DB files, and log files;
- assigned secret variables such as `MP_ACCESS_TOKEN` or `FINANCE_API_TOKEN` when the value is not a safe placeholder;
- token-like strings including Mercado Pago token style examples and Bearer authorization values;
- private key blocks;
- prohibited personal or production paths;
- public-facing `raw_json` references;
- API default host set to `0.0.0.0`.

The redaction helpers use these public markers:

- `[REDACTED_SECRET]`
- `[REDACTED_PATH]`
- `[REDACTED_RAW]`

## Controlled references and allowlist

Some strings are allowed only as scanner or policy references, never as real secrets:

- `.env.example` for placeholder-only environment documentation;
- `docs/` for policy and design references, including ADRs that name prohibited patterns;
- `runtime/src/` for internal implementation fields that are not public API examples;
- `tests/smoke/` for deterministic scanner/redaction tests.

Public response surfaces are stricter: `examples/sample-api-responses/`, `SKILL.md`, and `docs/openclaw-skill-behavior.md` must not expose `raw_json`.

Allowed findings are documented in `/workspace/evidence/TASK-0017/security-scan-summary.md` when the smoke test runs. The JSON findings intentionally include finding type, file, line, severity, and safe message only; they do not include matched secret values.

## Ignored paths

The project scan ignores paths that are not part of the public source scan target or are too noisy for this deterministic layer:

- `.git/`
- `runtime/node_modules/`
- `node_modules/`
- build/test output directories such as `coverage/`, `dist/`, and `build/`
- `runtime/package-lock.json` for irrelevant token-like substrings
- task runner input/output and evidence directories when present inside a scanned tree

## Running locally

```bash
node tests/smoke/security-secret-scan-smoke.mjs
```

Expected final line:

```text
SECURITY_SECRET_SCAN_SMOKE_OK
```

If a critical finding is detected, the smoke test fails with a safe summary that names the finding type and file location without printing the matched value.
