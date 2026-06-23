import {
  PERSONAL_PATH_PATTERNS,
  PUBLIC_RAW_JSON_PATTERN,
  REDACTION_MARKERS,
  TEXT_SECRET_PATTERNS,
  isSecretVariableName,
} from './secret-patterns.mjs';

function redactString(value) {
  let redacted = String(value);

  for (const pattern of TEXT_SECRET_PATTERNS) {
    redacted = redacted.replace(pattern.regex, REDACTION_MARKERS.secret);
  }

  for (const pattern of PERSONAL_PATH_PATTERNS) {
    redacted = redacted.replace(pattern.regex, REDACTION_MARKERS.path);
  }

  redacted = redacted.replace(
    /\b(MP_ACCESS_TOKEN|FINANCE_API_TOKEN)\s*=\s*[^\s`'";,)]+/g,
    `$1=${REDACTION_MARKERS.secret}`,
  );
  redacted = redacted.replace(PUBLIC_RAW_JSON_PATTERN, REDACTION_MARKERS.raw);

  return redacted;
}

export function redactText(value) {
  if (value === null || value === undefined) return value;
  return redactString(value);
}

export function redactJson(value) {
  if (Array.isArray(value)) return value.map((item) => redactJson(item));

  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, childValue] of Object.entries(value)) {
      if (String(key).toLowerCase() === 'raw_json') {
        output[key] = REDACTION_MARKERS.raw;
      } else if (isSecretVariableName(key) || /token|secret|authorization|cookie|session|private_key/i.test(key)) {
        output[key] = REDACTION_MARKERS.secret;
      } else {
        output[key] = redactJson(childValue);
      }
    }
    return output;
  }

  if (typeof value === 'string') return redactString(value);
  return value;
}

export function redactForPublicOutput(value) {
  if (typeof value === 'string') return redactText(value);
  return redactJson(value);
}
