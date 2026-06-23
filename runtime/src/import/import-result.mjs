import { basename } from 'node:path';

import { shortHash } from './file-hash.mjs';

export function makeSourceReport({ filePath, fileHash, parsed, sourceMode }) {
  const columnProfile = parsed.column_validation?.profile_name ?? 'released_money_daily_core';
  return {
    id: `source_report_${shortHash(fileHash)}`,
    provider: 'mercado_pago',
    report_type: 'released_money',
    source_mode: sourceMode,
    file_name: parsed.file_name ?? basename(filePath),
    file_hash: fileHash,
    row_count: parsed.row_count,
    column_count: parsed.columns.length,
    column_profile: columnProfile,
    status: 'parsed',
  };
}

export function makeRawRows(parsed, sourceReport) {
  return parsed.rows.map((row) => ({
    id: `raw_row_${shortHash(row.row_hash)}`,
    report_id: sourceReport.id,
    row_index: row.row_index,
    row_hash: row.row_hash,
    raw_json: row.raw_json,
    date_raw: row.raw_json.DATE ?? null,
    record_type: row.record_type,
    description: row.description,
    source_id: row.source_id,
    external_reference: row.external_reference,
  }));
}

export function makeMovements(parsed, sourceReport) {
  return parsed.rows.map((row) => ({
    id: `movement_${shortHash(row.movement_hash)}`,
    report_id: sourceReport.id,
    raw_row_id: `raw_row_${shortHash(row.row_hash)}`,
    movement_hash: row.movement_hash,
    row_hash: row.row_hash,
    occurred_at: row.occurred_at,
    amount_signed: row.amount_signed,
    amount_gross: row.amount_gross,
    mp_fee_amount: row.mp_fee_amount,
    currency: row.currency,
    balance_after: row.balance_after,
    balance_before: row.balance_after - row.amount_signed,
    display_title: row.display_title ?? row.description ?? row.record_type ?? 'Mercado Pago movement',
    display_subtitle: row.description ?? row.record_type ?? null,
    movement_class: row.amount_signed > 0 ? 'income' : row.amount_signed < 0 ? 'expense' : 'technical',
    income_kind: row.amount_signed > 0 ? 'unclassified' : null,
    expense_category: null,
    display_status: 'pending_classification',
    needs_clarification: 0,
  }));
}

export function makeImportResult({ sourceReport, rawRows, movements, dedupe, counts }) {
  return {
    source_report: sourceReport,
    raw_rows: rawRows,
    movements,
    dedupe,
    counts,
  };
}
