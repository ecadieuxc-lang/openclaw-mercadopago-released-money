import { buildAgentRules } from './agent-rules.mjs';
import { buildAssistantPeriodContext } from './period-context.mjs';
import { buildSpendingSummary } from './spending-summary.mjs';

function latestPeriod(periods) {
  return [...(periods ?? [])]
    .sort((a, b) => new Date(b.opened_at ?? b.anchor_occurred_at ?? 0).getTime() - new Date(a.opened_at ?? a.anchor_occurred_at ?? 0).getTime())[0] ?? null;
}

function buildHighlights(periodContext, spendingSummary) {
  const highlights = [
    {
      kind: 'income_total',
      label: 'Ingresos del período',
      value: periodContext.totals.income_total,
    },
    {
      kind: 'expense_total',
      label: 'Gastos del período',
      value: periodContext.totals.expense_total,
    },
    {
      kind: 'net_total',
      label: 'Neto del período',
      value: periodContext.totals.net_total,
    },
  ];
  const topCategory = spendingSummary.top_expense_categories[0];
  if (topCategory) {
    highlights.push({
      kind: 'top_expense_category',
      label: 'Categoría de gasto principal',
      name: topCategory.name,
      value: topCategory.total,
      count: topCategory.count,
    });
  }
  return highlights;
}

export function buildAssistantContext({ periods = [], movements = [], periodMovements = [], period = null } = {}) {
  const selectedPeriod = period ?? latestPeriod(periods);
  if (!selectedPeriod) {
    return {
      period: null,
      summary: {
        income_total: 0,
        expense_total: 0,
        net_total: 0,
        pending_clarification_count: 0,
      },
      highlights: [],
      warnings: ['no_period_available'],
      pending_clarifications: [],
      pending_clarification_count: 0,
      top_expense_categories: [],
      top_merchants: [],
      agent_rules: buildAgentRules(),
    };
  }

  const periodContext = buildAssistantPeriodContext({ period: selectedPeriod, movements, periodMovements });
  const spendingSummary = buildSpendingSummary({ period: selectedPeriod, movements, periodMovements });

  return {
    period: periodContext.period,
    summary: {
      ...periodContext.totals,
      pending_clarification_count: periodContext.pending_clarification_count,
    },
    highlights: buildHighlights(periodContext, spendingSummary),
    warnings: periodContext.warnings,
    pending_clarifications: periodContext.pending_clarifications,
    pending_clarification_count: periodContext.pending_clarification_count,
    top_expense_categories: spendingSummary.top_expense_categories,
    top_merchants: spendingSummary.top_merchants,
    agent_rules: buildAgentRules(),
  };
}
