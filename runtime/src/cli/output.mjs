export function stableJson(value) {
  return `${JSON.stringify(value, Object.keys(value).sort(), 2)}\n`;
}

function sortObjectDeep(value) {
  if (Array.isArray(value)) return value.map(sortObjectDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObjectDeep(value[key])]));
}

export function writeJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(sortObjectDeep(value), null, 2)}\n`);
}

export function writeErrorJson({ code, message, details = {} }, stream = process.stderr) {
  writeJson({ ok: false, error: { code, message, details } }, stream);
}
