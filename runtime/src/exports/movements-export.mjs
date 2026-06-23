import { writeCsvRows, assertNoUnsafeCsvFields } from './csv-writer.mjs';

export const CLEAN_MOVEMENTS_CSV_HEADER = Object.freeze([
  'period_id',
  'period_label',
  'movement_id',
  'occurred_at',
  'amount_signed',
  'currency',
  'display_title',
  'display_subtitle',
  'movement_class',
  'income_kind',
  'expense_category',
  'display_status',
  'needs_clarification',
]);

function cleanCategoryForDirection(movement, fieldName) {
  const amount = Number(movement.amount_signed ?? 0);
  if (fieldName === 'income_kind') return amount > 0 ? movement.income_kind ?? '' : '';
  if (fieldName === 'expense_category') return amount < 0 ? movement.expense_category ?? '' : '';
  return movement[fieldName] ?? '';
}

export function movementToCleanExportRow(movement, period) {
  return {
    period_id: period.period_id,
    period_label: period.period_label,
    movement_id: movement.id ?? movement.movement_id ?? '',
    occurred_at: movement.occurred_at ?? '',
    amount_signed: movement.amount_signed ?? 0,
    currency: movement.currency ?? 'CLP',
    display_title: movement.display_title ?? '',
    display_subtitle: movement.display_subtitle ?? '',
    movement_class: movement.movement_class ?? '',
    income_kind: cleanCategoryForDirection(movement, 'income_kind'),
    expense_category: cleanCategoryForDirection(movement, 'expense_category'),
    display_status: movement.display_status ?? '',
    needs_clarification: movement.needs_clarification === true ? 'true' : 'false',
  };
}

export function selectVisiblePeriodMovements({ period, movements, periodMovements }) {
  const movementById = new Map((movements ?? []).map((movement) => [movement.id, movement]));
  const links = (periodMovements ?? []).filter((link) => link.period_id === period.period_id);
  return links
    .map((link) => movementById.get(link.movement_id))
    .filter((movement) => movement && movement.is_visible !== false)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
}

export function buildCleanMovementsCsv({ period, movements, periodMovements }) {
  const visibleMovements = selectVisiblePeriodMovements({ period, movements, periodMovements });
  const rows = visibleMovements.map((movement) => movementToCleanExportRow(movement, period));
  const content = writeCsvRows(rows, CLEAN_MOVEMENTS_CSV_HEADER);
  assertNoUnsafeCsvFields(content);
  return { content, rows, header: [...CLEAN_MOVEMENTS_CSV_HEADER] };
}

export function movementToJsonlRecord(movement, period) {
  const row = movementToCleanExportRow(movement, period);
  return {
    ...row,
    amount_signed: Number(row.amount_signed),
    needs_clarification: row.needs_clarification === 'true',
    row_hash: movement.row_hash ?? null,
    movement_hash: movement.movement_hash ?? null,
    is_visible: movement.is_visible !== false,
  };
}

export function buildPeriodMovementsJsonl({ period, movements, periodMovements }) {
  const visibleMovements = selectVisiblePeriodMovements({ period, movements, periodMovements });
  const records = visibleMovements.map((movement) => movementToJsonlRecord(movement, period));
  const content = records.map((record) => JSON.stringify(record)).join('\n') + (records.length > 0 ? '\n' : '');
  assertNoUnsafeCsvFields(content);
  return { content, records };
}
