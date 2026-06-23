function countDelimiterOutsideQuotes(line, delimiter) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

export function detectCsvDelimiter(csvText) {
  const firstNonEmptyLine = csvText.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const semicolonCount = countDelimiterOutsideQuotes(firstNonEmptyLine, ';');
  const commaCount = countDelimiterOutsideQuotes(firstNonEmptyLine, ',');
  return semicolonCount > commaCount ? ';' : ',';
}

export function parseCsvText(csvText, options = {}) {
  if (typeof csvText !== 'string') {
    const error = new Error('CSV input must be a string');
    error.code = 'INVALID_CSV_INPUT';
    throw error;
  }

  const delimiter = options.delimiter ?? detectCsvDelimiter(csvText);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (inQuotes) {
    const error = new Error('CSV contains an unterminated quoted field');
    error.code = 'INVALID_CSV_QUOTES';
    throw error;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return { delimiter, rows };
}
