import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createImportState, importReportFromCsvFile } from '../../runtime/src/import/index.mjs';
import { cleanImportedMovements } from '../../runtime/src/movements/index.mjs';
import { buildSalaryAnchorPeriods } from '../../runtime/src/periods/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const fixturesDir = join(projectRoot, 'tests', 'fixtures', 'released-money');

async function importAndCleanFixture(fileName) {
  const imported = await importReportFromCsvFile({
    filePath: join(fixturesDir, fileName),
    sourceMode: 'manual_csv',
    parserProfile: 'released_money_daily_core',
    state: createImportState(),
  });
  const rawByHash = new Map(imported.raw_rows.map((row) => [row.row_hash, row.raw_json]));
  return cleanImportedMovements(imported).map((movement) => {
    const raw = rawByHash.get(movement.row_hash) ?? {};
    return {
      ...movement,
      description: raw.DESCRIPTION ?? movement.display_subtitle,
      sale_detail: raw.SALE_DETAIL ?? movement.display_title,
      payment_method_type: raw.PAYMENT_METHOD_TYPE ?? null,
      raw_json: raw,
    };
  });
}

function assertCategoryDirectionRules(movements) {
  for (const movement of movements) {
    if (movement.amount_signed > 0) {
      assert.equal(movement.expense_category, null, `positive movement ${movement.id} must not have expense_category`);
    } else if (movement.amount_signed < 0) {
      assert.equal(movement.income_kind, null, `negative movement ${movement.id} must not have income_kind`);
    }
  }
}

const periodFixture = await importAndCleanFixture('daily-core-period-anchors.csv');
assertCategoryDirectionRules(periodFixture);

const result = buildSalaryAnchorPeriods(periodFixture, {
  min_amount: 100000,
  confidence_required: 'high',
  payment_method_types: ['bank_transfer'],
  association_window_minutes: 180,
  periods: { retain_previous_period_days: 7 },
});

assert.equal(result.periods.length, 2, 'two salary anchors must create two periods');
const [junePeriod, julyPeriod] = result.periods;
assert.equal(junePeriod.period_id, '2026-06');
assert.equal(junePeriod.period_label, 'Junio 2026');
assert.equal(julyPeriod.period_id, '2026-07');
assert.equal(julyPeriod.period_label, 'Julio 2026');
assert.equal(junePeriod.status, 'closed');
assert.equal(julyPeriod.status, 'open');
assert.ok(junePeriod.closed_at, 'first period must close when July salary appears');
assert.ok(junePeriod.retention_until, 'closed period must expose retention_until');
assert.equal(new Date(junePeriod.retention_until).getTime(), new Date(junePeriod.closed_at).getTime() + 7 * 24 * 60 * 60 * 1000);
assert.equal(julyPeriod.retention_until, null);

const bonusLinks = result.period_movements.filter((link) => link.role === 'associated_bonus');
assert.equal(bonusLinks.length, 1, 'near bonus must be associated once');
assert.equal(bonusLinks[0].period_id, '2026-06');
assert.equal(result.associated_bonuses.length, 1);
assert.equal(result.salary_candidates.filter((candidate) => candidate.is_anchor).length, 2, 'bonus must not open a duplicate period');
assert.ok(result.unassigned_movements.some((movement) => movement.reason === 'unassigned_before_first_anchor'));

const validRows = await importAndCleanFixture('daily-core-valid.csv');
assertCategoryDirectionRules(validRows);
const noSalaryResult = buildSalaryAnchorPeriods(validRows, { min_amount: 100000, confidence_required: 'high' });
assert.equal(noSalaryResult.periods.length, 0, 'no confident salary means no invented closed period');
assert.equal(noSalaryResult.period_movements.length, 0);

const salaryRows = await importAndCleanFixture('daily-core-salary.csv');
assertCategoryDirectionRules(salaryRows);
const singleSalaryResult = buildSalaryAnchorPeriods(salaryRows, { min_amount: 100000, confidence_required: 'high' });
assert.ok(singleSalaryResult.periods.length >= 1, 'existing salary fixture must open at least one period');
assert.equal(singleSalaryResult.periods[0].period_id, '2026-06');

const allRows = [...periodFixture, ...validRows, ...salaryRows];
const positiveWithExpense = allRows.filter((movement) => movement.amount_signed > 0 && movement.expense_category !== null).length;
const negativeWithIncome = allRows.filter((movement) => movement.amount_signed < 0 && movement.income_kind !== null).length;
assert.equal(positiveWithExpense, 0);
assert.equal(negativeWithIncome, 0);

console.log(JSON.stringify({
  fixtures: ['daily-core-period-anchors.csv', 'daily-core-valid.csv', 'daily-core-salary.csv'],
  movements_evaluated: allRows.length,
  periods_created: result.periods.length,
  periods_closed: result.periods.filter((period) => period.status === 'closed').length,
  periods_open: result.periods.filter((period) => period.status === 'open').length,
  salary_anchors_detected: result.salary_candidates.filter((candidate) => candidate.is_anchor).length,
  associated_bonuses: result.associated_bonuses.length,
  retention_days_default: result.contract.retention_days_default,
  positive_with_expense_category: positiveWithExpense,
  negative_with_income_kind: negativeWithIncome,
}));
console.log('PERIODS_SALARY_ANCHOR_SMOKE_OK');
