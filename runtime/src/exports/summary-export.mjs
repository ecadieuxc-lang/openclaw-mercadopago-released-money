import { selectVisiblePeriodMovements } from './movements-export.mjs';

function sumBy(movements, predicate, keySelector) {
  const result = {};
  for (const movement of movements) {
    if (!predicate(movement)) continue;
    const key = keySelector(movement) || 'unclassified';
    const amount = Number(movement.amount_signed ?? 0);
    result[key] = (result[key] ?? 0) + Math.abs(amount);
  }
  return result;
}

function countPendingClarification(movements) {
  return movements.filter((movement) => movement.needs_clarification === true).length;
}

export function buildPeriodSummary({ period, movements, periodMovements }) {
  const linkedMovementIds = new Set((periodMovements ?? [])
    .filter((link) => link.period_id === period.period_id)
    .map((link) => link.movement_id));
  const linkedMovements = (movements ?? []).filter((movement) => linkedMovementIds.has(movement.id));
  const visibleMovements = selectVisiblePeriodMovements({ period, movements, periodMovements });
  const hiddenCount = linkedMovements.filter((movement) => movement.is_visible === false).length;

  const incomeTotal = visibleMovements
    .filter((movement) => Number(movement.amount_signed ?? 0) > 0)
    .reduce((total, movement) => total + Number(movement.amount_signed), 0);

  const expenseTotal = visibleMovements
    .filter((movement) => Number(movement.amount_signed ?? 0) < 0)
    .reduce((total, movement) => total + Math.abs(Number(movement.amount_signed)), 0);

  const warnings = [];
  const pendingClarificationCount = countPendingClarification(visibleMovements);
  if (pendingClarificationCount > 0) warnings.push('visible_movements_need_clarification');

  return {
    period_id: period.period_id,
    period_label: period.period_label,
    status: period.status,
    salary_anchor_at: period.anchor_occurred_at ?? period.opened_at ?? null,
    start_at: period.opened_at ?? null,
    end_at: period.closed_at ?? null,
    retention_until: period.retention_until ?? null,
    income_total: incomeTotal,
    expense_total: expenseTotal,
    net_total: incomeTotal - expenseTotal,
    movement_count: linkedMovements.length,
    visible_movement_count: visibleMovements.length,
    hidden_movement_count: hiddenCount,
    pending_clarification_count: pendingClarificationCount,
    expense_by_category: sumBy(
      visibleMovements,
      (movement) => Number(movement.amount_signed ?? 0) < 0,
      (movement) => movement.expense_category,
    ),
    income_by_kind: sumBy(
      visibleMovements,
      (movement) => Number(movement.amount_signed ?? 0) > 0,
      (movement) => movement.income_kind,
    ),
    data_quality: {
      status: warnings.length > 0 ? 'warning' : 'ok',
      warnings,
    },
  };
}

export function buildPeriodSummaryJson(input) {
  return `${JSON.stringify(buildPeriodSummary(input), null, 2)}\n`;
}
