import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createImportState, importReportFromCsvFile } from '../../runtime/src/import/index.mjs';
import { cleanImportedMovements } from '../../runtime/src/movements/index.mjs';
import { buildSalaryAnchorPeriods } from '../../runtime/src/periods/index.mjs';
import { buildAssistantContext, buildSpendingSummary } from '../../runtime/src/assistant/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const fixturesDir = join(projectRoot, 'tests', 'fixtures', 'released-money');
const evidenceDir = '/workspace/evidence/TASK-0014';
const fixtures = ['daily-core-period-anchors.csv', 'daily-core-valid.csv', 'daily-core-salary.csv'];
const forbiddenMarkers = [
  'raw' + '_json',
  'APP' + '_USR_',
  ['PRIVATE', ' KEY'].join(''),
  ['/', 'home', '/', 'erick'].join(''),
  ['/', 'mnt', '/', 'c'].join(''),
  ['/', 'srv', '/', 'roy-v2'].join(''),
];

async function importAndCleanFixture(fileName, state) {
  const imported = await importReportFromCsvFile({
    filePath: join(fixturesDir, fileName),
    sourceMode: 'manual_csv',
    parserProfile: 'released_money_daily_core',
    state,
  });
  const rawByHash = new Map(imported.raw_rows.map((row) => [row.row_hash, row.raw_json]));
  return cleanImportedMovements(imported).map((movement) => {
    const raw = rawByHash.get(movement.row_hash) ?? {};
    return {
      ...movement,
      description: raw.DESCRIPTION ?? movement.display_subtitle,
      sale_detail: raw.SALE_DETAIL ?? movement.display_title,
      payment_method_type: raw.PAYMENT_METHOD_TYPE ?? null,
    };
  });
}

function assertNoForbiddenJson(value) {
  const text = JSON.stringify(value);
  for (const marker of forbiddenMarkers) {
    assert.equal(text.includes(marker), false, `assistant JSON must not contain ${marker}`);
  }
}

function assertCategoryDirectionRules(movements) {
  for (const movement of movements) {
    if (movement.amount_signed > 0) {
      assert.equal(movement.expense_category, null, `income ${movement.id} must not have expense_category`);
    } else if (movement.amount_signed < 0) {
      assert.equal(movement.income_kind, null, `expense ${movement.id} must not have income_kind`);
    }
  }
}

function assertTopCategoriesUseOnlyExpenses(spendingSummary, movements, periodMovements, period) {
  const linkedIds = new Set(periodMovements.filter((link) => link.period_id === period.period_id).map((link) => link.movement_id));
  const incomeCategories = new Set(movements
    .filter((movement) => linkedIds.has(movement.id) && movement.amount_signed > 0)
    .map((movement) => movement.income_kind)
    .filter(Boolean));
  for (const category of spendingSummary.top_expense_categories) {
    assert.equal(incomeCategories.has(category.name), false, `income kind ${category.name} must not appear as expense category`);
  }
}

const state = createImportState();
const movements = [];
for (const fixture of fixtures) {
  movements.push(...await importAndCleanFixture(fixture, state));
}
assertCategoryDirectionRules(movements);

const periodResult = buildSalaryAnchorPeriods(movements, {
  min_amount: 100000,
  confidence_required: 'high',
  payment_method_types: ['bank_transfer'],
  association_window_minutes: 180,
  periods: { retain_previous_period_days: 7 },
});
assert.ok(periodResult.periods.length > 0, 'salary-anchor periods must exist');

const selectedPeriod = periodResult.periods[0];
const assistantContext = buildAssistantContext({
  periods: periodResult.periods,
  movements,
  periodMovements: periodResult.period_movements,
  period: selectedPeriod,
});
const spendingSummary = buildSpendingSummary({
  movements,
  periodMovements: periodResult.period_movements,
  period: selectedPeriod,
});

assert.ok(assistantContext.period.period_id, 'period_id must exist');
assert.ok(assistantContext.period.period_label, 'period_label must exist');
assert.equal(typeof assistantContext.summary.income_total, 'number');
assert.equal(typeof assistantContext.summary.expense_total, 'number');
assert.equal(typeof assistantContext.summary.net_total, 'number');
assert.equal(assistantContext.summary.net_total, assistantContext.summary.income_total - assistantContext.summary.expense_total);
assert.ok(Array.isArray(assistantContext.highlights));
assert.ok(assistantContext.highlights.length > 0, 'highlights must exist');
assert.ok(Array.isArray(assistantContext.agent_rules));
assert.ok(assistantContext.agent_rules.length >= 7, 'agent_rules must exist');
assert.ok(Array.isArray(assistantContext.top_expense_categories));
assert.ok(Array.isArray(assistantContext.top_merchants));
assert.equal(spendingSummary.period_id, selectedPeriod.period_id);
assertTopCategoriesUseOnlyExpenses(spendingSummary, movements, periodResult.period_movements, selectedPeriod);
assertNoForbiddenJson(assistantContext);
assertNoForbiddenJson(spendingSummary);

await mkdir(evidenceDir, { recursive: true });
await writeFile(join(evidenceDir, 'assistant-context-summary.md'), [
  '# TASK-0014 assistant context summary',
  '',
  '- Data: synthetic fixtures only.',
  `- Fixtures used: ${fixtures.join(', ')}`,
  `- Selected period: ${assistantContext.period.period_id} (${assistantContext.period.period_label})`,
  `- income_total: ${assistantContext.summary.income_total}`,
  `- expense_total: ${assistantContext.summary.expense_total}`,
  `- net_total: ${assistantContext.summary.net_total}`,
  `- pending_clarification_count: ${assistantContext.pending_clarification_count}`,
  `- top_expense_categories: ${assistantContext.top_expense_categories.map((item) => item.name).join(', ') || 'none'}`,
  `- top_merchants: ${assistantContext.top_merchants.map((item) => item.name).join(', ') || 'none'}`,
  '- Confirmation: assistant/context output is derived from synthetic pipeline objects and contains no raw JSON payload.',
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  fixtures,
  period_id: assistantContext.period.period_id,
  period_label: assistantContext.period.period_label,
  income_total: assistantContext.summary.income_total,
  expense_total: assistantContext.summary.expense_total,
  net_total: assistantContext.summary.net_total,
  pending_clarification_count: assistantContext.pending_clarification_count,
  top_expense_categories: assistantContext.top_expense_categories,
  top_merchants: assistantContext.top_merchants,
}));
console.log('ASSISTANT_CONTEXT_SMOKE_OK');
