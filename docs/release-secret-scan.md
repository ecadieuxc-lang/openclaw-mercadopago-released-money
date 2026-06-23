# Release secret scan notes

Before a public GitHub release, run the deterministic smoke scan from the project root:

```bash
node tests/smoke/security-secret-scan-smoke.mjs
```

Release is blocked if the smoke test does not end with:

```text
SECURITY_SECRET_SCAN_SMOKE_OK
```

## Release expectations

The public package must not contain:

- real `.env` files;
- SQLite/DB/log files with real data;
- real Mercado Pago tokens;
- local API token values;
- private keys;
- OAuth, cookie, session, or authorization header values;
- personal paths or production VPS paths;
- raw Mercado Pago response payloads or `raw_json` in public API examples;
- API defaults binding to `0.0.0.0`.

Allowed references must be policy or scanner examples only. The names `MP_ACCESS_TOKEN` and `FINANCE_API_TOKEN` may appear as variable names in documentation, placeholders, and validation logic, but not with real values. Scanner outputs must use `[REDACTED_SECRET]`, `[REDACTED_PATH]`, or `[REDACTED_RAW]` when representing sensitive material.

## Evidence to preserve

For TASK-0017 the smoke test writes:

- `/workspace/evidence/TASK-0017/security-secret-scan-smoke-output.txt`
- `/workspace/evidence/TASK-0017/security-scan-summary.md`
- `/workspace/evidence/TASK-0017/scan-findings.json`
- `/workspace/evidence/TASK-0017/validation-output.txt` when the full validation command is run

These files are task evidence and are not package fixtures.
