import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createImportState, importReportFromCsvFile } from '../../runtime/src/import/index.mjs';
import { cleanImportedMovements } from '../../runtime/src/movements/index.mjs';

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
  return cleanImportedMovements(imported);
}

function assertCategoryDirectionRules(movements) {
  for (const movement of movements) {
    if (movement.amount_signed > 0) {
      assert.ok(movement.income_kind || ['salary', 'bonus', 'refund', 'passive_cashback', 'passive_yield', 'incoming_transfer_other'].includes(movement.movement_class));
      assert.equal(movement.expense_category, null, `positive movement ${movement.id} must not have expense_category`);
    } else if (movement.amount_signed < 0) {
      assert.equal(movement.income_kind, null, `negative movement ${movement.id} must not have income_kind`);
    } else {
      assert.equal(movement.income_kind, null, `zero movement ${movement.id} must not have income_kind`);
      assert.equal(movement.expense_category, null, `zero movement ${movement.id} must not have expense_category`);
    }
  }
}

const technicalRows = await importAndCleanFixture('daily-core-technical-rows.csv');
assert.ok(technicalRows.some((movement) => movement.movement_class === 'technical_hidden' && movement.is_visible === false));
assert.ok(technicalRows.filter((movement) => movement.is_visible).every((movement) => movement.movement_class !== 'technical_hidden'));
assert.ok(technicalRows.some((movement) => movement.movement_class === 'pending_hold' && movement.is_visible === true && movement.needs_clarification === true));

const validRows = await importAndCleanFixture('daily-core-valid.csv');
assertCategoryDirectionRules(validRows);
assert.ok(validRows.some((movement) => movement.movement_class === 'outgoing_transfer_unknown_recipient' && movement.expense_category === 'transfers' && movement.needs_clarification === true));
assert.ok(validRows.some((movement) => movement.income_kind === 'passive_cashback'));
assert.ok(validRows.some((movement) => movement.income_kind === 'passive_yield'));

const salaryRows = await importAndCleanFixture('daily-core-salary.csv');
assertCategoryDirectionRules(salaryRows);
assert.ok(salaryRows.some((movement) => movement.income_kind === 'salary' || movement.movement_class === 'salary'));
assert.ok(salaryRows.some((movement) => movement.movement_class === 'outgoing_transfer_unknown_recipient' && movement.needs_clarification === true));

const allRows = [...technicalRows, ...validRows, ...salaryRows];
const visibleCount = allRows.filter((movement) => movement.is_visible).length;
const hiddenCount = allRows.filter((movement) => movement.is_visible === false).length;
assert.ok(visibleCount > 0);
assert.ok(hiddenCount > 0);

console.log(JSON.stringify({
  fixtures: ['daily-core-technical-rows.csv', 'daily-core-valid.csv', 'daily-core-salary.csv'],
  visible_count: visibleCount,
  hidden_count: hiddenCount,
  technical_hidden_count: allRows.filter((movement) => movement.movement_class === 'technical_hidden').length,
  pending_hold_count: allRows.filter((movement) => movement.movement_class === 'pending_hold').length,
  positive_with_expense_category: allRows.filter((movement) => movement.amount_signed > 0 && movement.expense_category !== null).length,
  negative_with_income_kind: allRows.filter((movement) => movement.amount_signed < 0 && movement.income_kind !== null).length,
}));
console.log('MOVEMENT_CLEANING_CLASSIFICATION_SMOKE_OK');
