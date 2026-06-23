function positiveNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function displayName(value) {
  return String(value ?? '').trim() || 'Sin título visible';
}

function incrementBucket(map, key, amount) {
  const bucketKey = key || 'unclassified';
  const current = map.get(bucketKey) ?? { name: bucketKey, total: 0, count: 0 };
  current.total += amount;
  current.count += 1;
  map.set(bucketKey, current);
}

function topBuckets(map, limit) {
  return [...map.values()]
    .sort((a, b) => b.total - a.total || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function buildSpendingSummary({ movements = [], period = null, periodMovements = [], limit = 5 } = {}) {
  const linkedIds = period
    ? new Set(periodMovements.filter((link) => link.period_id === period.period_id).map((link) => link.movement_id))
    : null;
  const visibleMovements = movements.filter((movement) => {
    if (!movement || movement.is_visible === false) return false;
    if (linkedIds && !linkedIds.has(movement.id)) return false;
    return true;
  });

  const expenseMovements = visibleMovements.filter((movement) => positiveNumber(movement.amount_signed) < 0);
  const incomeMovements = visibleMovements.filter((movement) => positiveNumber(movement.amount_signed) > 0);
  const categories = new Map();
  const merchants = new Map();

  for (const movement of expenseMovements) {
    const amount = Math.abs(positiveNumber(movement.amount_signed));
    incrementBucket(categories, movement.expense_category, amount);
    incrementBucket(merchants, displayName(movement.display_title ?? movement.sale_detail), amount);
  }

  const expenseTotal = expenseMovements.reduce((total, movement) => total + Math.abs(positiveNumber(movement.amount_signed)), 0);
  const incomeTotal = incomeMovements.reduce((total, movement) => total + positiveNumber(movement.amount_signed), 0);

  return {
    period_id: period?.period_id ?? null,
    period_label: period?.period_label ?? null,
    income_total: incomeTotal,
    expense_total: expenseTotal,
    net_total: incomeTotal - expenseTotal,
    expense_movement_count: expenseMovements.length,
    income_movement_count: incomeMovements.length,
    top_expense_categories: topBuckets(categories, limit),
    top_merchants: topBuckets(merchants, limit),
    rules_applied: {
      expense_category: 'expense_category solo se agrega para egresos con amount_signed < 0',
      income_kind: 'income_kind solo pertenece a ingresos y no alimenta categorías de gasto',
    },
  };
}
