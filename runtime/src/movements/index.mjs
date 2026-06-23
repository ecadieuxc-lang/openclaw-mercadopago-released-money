import { cleanMovement } from './clean-movement.mjs';

export { classifyMovement } from './classify-movement.mjs';
export { cleanMovement } from './clean-movement.mjs';
export { buildDisplayFields } from './display-fields.mjs';
export { hasEquivalentPaymentForReserve, inspectTechnicalRow } from './technical-rows.mjs';

export function cleanImportedMovements(importResult) {
  const rawRowsByHash = new Map((importResult?.raw_rows ?? []).map((rawRow) => [rawRow.row_hash, rawRow]));
  const movements = importResult?.movements ?? [];

  return movements.map((movement) => {
    const rawRowRecord = rawRowsByHash.get(movement.row_hash);
    const rawRow = rawRowRecord?.raw_json ?? null;
    return cleanMovement(movement, {
      rawRow,
      relatedMovements: movements,
    });
  });
}
