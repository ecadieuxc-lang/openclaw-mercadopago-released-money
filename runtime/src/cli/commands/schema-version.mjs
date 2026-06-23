import { CURRENT_SCHEMA_NAME, CURRENT_SCHEMA_VERSION, SCHEMA_VERSION_ROUTE } from '../../db/schema-version.mjs';

export async function runSchemaVersion() {
  return {
    ok: true,
    schema_name: CURRENT_SCHEMA_NAME,
    schema_version: CURRENT_SCHEMA_VERSION,
    route: SCHEMA_VERSION_ROUTE,
  };
}
