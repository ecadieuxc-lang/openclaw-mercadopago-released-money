import { getColumnProfile } from './column-profiles.mjs';

export class MissingRequiredColumnsError extends Error {
  constructor(missingColumns, profileName = 'released_money_daily_core') {
    super(`Missing required columns for ${profileName}: ${missingColumns.join(', ')}`);
    this.name = 'MissingRequiredColumnsError';
    this.code = 'MISSING_REQUIRED_COLUMNS';
    this.missing_columns = missingColumns;
    this.profile_name = profileName;
  }
}

export function validateColumns(columns, options = {}) {
  const profileName = options.profileName ?? 'released_money_daily_core';
  const strictColumns = options.strictColumns ?? true;
  const profile = getColumnProfile(profileName);
  const present = new Set(columns.map((column) => column.trim()));
  const missingColumns = profile.requiredColumns.filter((column) => !present.has(column));

  if (strictColumns && missingColumns.length > 0) {
    throw new MissingRequiredColumnsError(missingColumns, profileName);
  }

  return {
    profile_name: profileName,
    strict_columns: strictColumns,
    columns,
    missing_columns: missingColumns,
    unknown_columns: columns.filter((column) => !profile.requiredColumns.includes(column)),
    valid: missingColumns.length === 0,
  };
}
