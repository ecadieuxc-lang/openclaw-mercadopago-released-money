import { stableStringify } from '../ingest/index.mjs';

export function createImportState(seed = {}) {
  return {
    fileHashes: new Map(seed.fileHashes ?? []),
    rowHashes: new Map(seed.rowHashes ?? []),
    movementHashes: new Map(seed.movementHashes ?? []),
  };
}

export function makeConflict({ kind, hash, existing, incoming }) {
  return { kind, hash, existing, incoming };
}

function registerHash({ store, hash, payload, kind, conflicts }) {
  const encodedPayload = stableStringify(payload);
  const existingPayload = store.get(hash);

  if (existingPayload === undefined) {
    store.set(hash, encodedPayload);
    return { duplicate: false, conflict: false };
  }

  if (existingPayload !== encodedPayload) {
    conflicts.push(makeConflict({
      kind,
      hash,
      existing: existingPayload,
      incoming: encodedPayload,
    }));
    return { duplicate: true, conflict: true };
  }

  return { duplicate: true, conflict: false };
}

export function dedupeImportRecords({ state, sourceReport, rawRows, movements }) {
  const duplicateRowHashes = [];
  const duplicateMovementHashes = [];
  const conflicts = [];

  const fileResult = registerHash({
    store: state.fileHashes,
    hash: sourceReport.file_hash,
    payload: {
      provider: sourceReport.provider,
      report_type: sourceReport.report_type,
      file_name: sourceReport.file_name,
      row_count: sourceReport.row_count,
      column_count: sourceReport.column_count,
      column_profile: sourceReport.column_profile,
    },
    kind: 'file_hash',
    conflicts,
  });

  let newRawRows = 0;
  let newMovements = 0;
  let duplicateRawRows = 0;
  let duplicateMovements = 0;

  for (const row of rawRows) {
    const result = registerHash({
      store: state.rowHashes,
      hash: row.row_hash,
      payload: row.raw_json,
      kind: 'row_hash',
      conflicts,
    });
    if (result.duplicate) {
      duplicateRawRows += 1;
      duplicateRowHashes.push(row.row_hash);
    } else {
      newRawRows += 1;
    }
  }

  for (const movement of movements) {
    const result = registerHash({
      store: state.movementHashes,
      hash: movement.movement_hash,
      payload: {
        occurred_at: movement.occurred_at,
        amount_signed: movement.amount_signed,
        amount_gross: movement.amount_gross,
        mp_fee_amount: movement.mp_fee_amount,
        currency: movement.currency,
        balance_after: movement.balance_after,
        balance_before: movement.balance_before,
        display_title: movement.display_title,
        display_subtitle: movement.display_subtitle,
        row_hash: movement.row_hash,
      },
      kind: 'movement_hash',
      conflicts,
    });
    if (result.duplicate) {
      duplicateMovements += 1;
      duplicateMovementHashes.push(movement.movement_hash);
    } else {
      newMovements += 1;
    }
  }

  return {
    dedupe: {
      file_duplicate: fileResult.duplicate,
      duplicate_row_hashes: duplicateRowHashes,
      duplicate_movement_hashes: duplicateMovementHashes,
      conflicts,
    },
    counts: {
      parsed_rows: rawRows.length,
      new_raw_rows: newRawRows,
      new_movements: newMovements,
      duplicate_raw_rows: duplicateRawRows,
      duplicate_movements: duplicateMovements,
      conflicts: conflicts.length,
    },
  };
}
