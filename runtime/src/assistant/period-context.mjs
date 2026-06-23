import { buildPeriodSummary } from '../exports/index.mjs';
import { selectVisiblePeriodMovements } from '../exports/index.mjs';

function warningList(summary, visibleMovements) {
  const warnings = [...(summary.data_quality?.warnings ?? [])];
  const ambiguous = visibleMovements.filter((movement) => movement.needs_clarification === true);
  if (ambiguous.length > 0 && !warnings.includes('pending_clarifications_present')) {
    warnings.push('pending_clarifications_present');
  }
  if (summary.status !== 'closed') warnings.push('period_not_closed');
  return [...new Set(warnings)];
}

function pendingClarifications(visibleMovements) {
  return visibleMovements
    .filter((movement) => movement.needs_clarification === true)
    .map((movement) => ({
      movement_id: movement.id,
      occurred_at: movement.occurred_at ?? null,
      display_title: movement.display_title ?? 'Movimiento pendiente de aclaración',
      reason: movement.movement_class ?? 'needs_clarification',
    }));
}

export function buildAssistantPeriodContext({ period, movements = [], periodMovements = [] } = {}) {
  if (!period?.period_id) {
    const error = new Error('period with period_id is required');
    error.code = 'ASSISTANT_PERIOD_REQUIRED';
    throw error;
  }

  const summary = buildPeriodSummary({ period, movements, periodMovements });
  const visibleMovements = selectVisiblePeriodMovements({ period, movements, periodMovements });
  const warnings = warningList(summary, visibleMovements);

  return {
    period: {
      period_id: period.period_id,
      period_label: period.period_label,
      status: period.status,
      salary_anchor_at: summary.salary_anchor_at,
      start_at: summary.start_at,
      end_at: summary.end_at,
      retention_until: summary.retention_until,
    },
    totals: {
      income_total: summary.income_total,
      expense_total: summary.expense_total,
      net_total: summary.net_total,
      movement_count: summary.movement_count,
      visible_movement_count: summary.visible_movement_count,
      hidden_movement_count: summary.hidden_movement_count,
    },
    warnings,
    pending_clarifications: pendingClarifications(visibleMovements),
    pending_clarification_count: summary.pending_clarification_count,
    expense_by_category: summary.expense_by_category,
    income_by_kind: summary.income_by_kind,
  };
}
