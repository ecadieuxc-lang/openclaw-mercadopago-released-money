export function parseCliArgs(argv) {
  const [command, ...tokens] = argv;
  const options = {};
  const positionals = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.startsWith('--')) {
      const name = token.slice(2);
      if (!name) throw cliArgError('ARGUMENT_INVALID', 'Empty option name');
      const next = tokens[index + 1];
      if (next === undefined || next.startsWith('--')) {
        options[name] = true;
      } else {
        options[name] = next;
        index += 1;
      }
      continue;
    }
    positionals.push(token);
  }

  return { command: command ?? 'help', options, positionals };
}

export function requireOption(options, name) {
  const value = options[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw cliArgError('MISSING_OPTION', `Missing required option --${name}`, { option: name });
  }
  return value;
}

export function cliArgError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

export function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw cliArgError('INVALID_PORT', 'Port must be an integer between 0 and 65535');
  }
  return port;
}
