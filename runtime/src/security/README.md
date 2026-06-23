# Security helpers

This directory contains the first deterministic security layer for the public package.

Implemented modules:

- `redact.mjs`: pure redaction helpers for text and JSON before public output.
- `secret-patterns.mjs`: scanner and redaction patterns shared by tests and runtime helpers.
- `project-scan.mjs`: local deterministic project scanner with no external dependencies.
- `index.mjs`: public exports for the security helpers.

Redaction markers are intentionally explicit:

- `[REDACTED_SECRET]` for token-like values, authorization headers, private keys, and secret-bearing fields.
- `[REDACTED_PATH]` for prohibited personal paths.
- `[REDACTED_RAW]` for `raw_json` fields or public raw JSON references.

The scanner is conservative. It reports critical findings without printing matched secret values. Controlled references in security policy, scanner implementation, or smoke tests are allowed only as documented policy/scanner examples.
