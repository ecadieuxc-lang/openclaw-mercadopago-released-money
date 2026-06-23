import { addDays, addMilliseconds } from './business-day.mjs';
import { confidenceMeets, detectSalaryCandidate, mergeSalaryDetectionConfig } from './salary-detection.mjs';
import { periodIdFromAnchor, periodLabelFromAnchor } from './period-label.mjs';

const DEFAULT_PERIOD_CONFIG = Object.freeze({
  retain_previous_period_days: 7,
  confidence_required: 'high',
  association_window_minutes: 180,
  locale: 'es-CL',
});

function sortByOccurredAt(movements) {
  return [...(movements ?? [])].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
}

function minutesBetween(a, b) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (60 * 1000);
}

function emptyPeriod({ anchorMovement, config, sequence }) {
  const anchorDate = new Date(anchorMovement.occurred_at);
  const periodId = periodIdFromAnchor(anchorDate);
  return {
    id: `period_${periodId}`,
    period_id: periodId,
    period_label: periodLabelFromAnchor(anchorDate, config.locale),
    status: 'open',
    anchor_movement_id: anchorMovement.id,
    anchor_occurred_at: anchorDate.toISOString(),
    opened_at: anchorDate.toISOString(),
    closed_at: null,
    retention_until: null,
    close_reason: null,
    sequence,
    salary_anchor: {
      movement_id: anchorMovement.id,
      occurred_at: anchorDate.toISOString(),
      amount_signed: anchorMovement.amount_signed,
      confidence: 'high',
    },
    totals: {
      income_amount: 0,
      expense_amount: 0,
      net_amount: 0,
      movement_count: 0,
      bonus_amount: 0,
      salary_amount: 0,
    },
  };
}

function addMovementTotals(period, movement, role) {
  const amount = Number(movement.amount_signed ?? 0);
  period.totals.movement_count += 1;
  period.totals.net_amount += amount;
  if (amount > 0) period.totals.income_amount += amount;
  if (amount < 0) period.totals.expense_amount += Math.abs(amount);
  if (role === 'salary_anchor') period.totals.salary_amount += amount;
  if (role === 'associated_bonus') period.totals.bonus_amount += amount;
}

function closePeriod(period, newAnchorDate, config) {
  const closedAt = addMilliseconds(newAnchorDate, -1).toISOString();
  period.status = 'closed';
  period.closed_at = closedAt;
  period.retention_until = addDays(closedAt, config.retain_previous_period_days).toISOString();
  period.close_reason = 'new_salary_anchor';
}

export function buildSalaryAnchorPeriods(movements, options = {}) {
  const config = {
    ...DEFAULT_PERIOD_CONFIG,
    ...mergeSalaryDetectionConfig(options.salary_detection ?? options),
    ...options.periods,
  };
  const sortedMovements = sortByOccurredAt(movements).filter((movement) => movement?.is_visible !== false);
  const periods = [];
  const periodMovements = [];
  const unassignedMovements = [];
  const salaryCandidates = [];
  const associatedBonuses = [];
  let currentPeriod = null;

  for (const movement of sortedMovements) {
    const detection = detectSalaryCandidate(movement, config);
    salaryCandidates.push({ movement_id: movement.id, occurred_at: movement.occurred_at, amount_signed: movement.amount_signed, ...detection });
    const isConfidentAnchor = detection.is_anchor && confidenceMeets(detection.confidence, config.confidence_required);

    if (isConfidentAnchor) {
      if (currentPeriod) {
        closePeriod(currentPeriod, movement.occurred_at, config);
      }
      currentPeriod = emptyPeriod({ anchorMovement: movement, config, sequence: periods.length + 1 });
      periods.push(currentPeriod);
      addMovementTotals(currentPeriod, movement, 'salary_anchor');
      periodMovements.push({
        period_id: currentPeriod.period_id,
        movement_id: movement.id,
        role: 'salary_anchor',
        included_at: new Date(movement.occurred_at).toISOString(),
      });
      continue;
    }

    if (!currentPeriod) {
      unassignedMovements.push({ movement_id: movement.id, reason: 'unassigned_before_first_anchor' });
      continue;
    }

    const minutesFromAnchor = minutesBetween(movement.occurred_at, currentPeriod.anchor_occurred_at);
    const role = detection.is_near_bonus && minutesFromAnchor <= Number(config.association_window_minutes)
      ? 'associated_bonus'
      : 'period_movement';
    if (role === 'associated_bonus') {
      associatedBonuses.push({ movement_id: movement.id, period_id: currentPeriod.period_id, minutes_from_anchor: minutesFromAnchor });
    }
    addMovementTotals(currentPeriod, movement, role);
    periodMovements.push({
      period_id: currentPeriod.period_id,
      movement_id: movement.id,
      role,
      included_at: new Date(movement.occurred_at).toISOString(),
    });
  }

  return {
    periods,
    period_movements: periodMovements,
    unassigned_movements: unassignedMovements,
    salary_candidates: salaryCandidates,
    associated_bonuses: associatedBonuses,
    contract: {
      periods_table_compatible: true,
      period_movements_table_compatible: true,
      retention_days_default: config.retain_previous_period_days,
      persistence: 'none',
    },
  };
}
