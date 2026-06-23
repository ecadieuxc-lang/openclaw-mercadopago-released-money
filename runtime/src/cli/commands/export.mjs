import { join } from 'node:path';

import { createImportState, importReportFromCsvFile } from '../../import/index.mjs';
import { cleanImportedMovements } from '../../movements/index.mjs';
import { buildSalaryAnchorPeriods } from '../../periods/index.mjs';
import { writePeriodExports } from '../../exports/index.mjs';

const FIXTURES = ['daily-core-period-anchors.csv', 'daily-core-valid.csv', 'daily-core-salary.csv'];

async function syntheticMovements(projectRoot) {
  const state = createImportState();
  const movements = [];
  for (const fixture of FIXTURES) {
    const imported = await importReportFromCsvFile({
      filePath: join(projectRoot, 'tests', 'fixtures', 'released-money', fixture),
      sourceMode: 'manual_csv',
      parserProfile: 'released_money_daily_core',
      state,
    });
    movements.push(...cleanImportedMovements(imported));
  }
  return movements;
}

export async function runExport({ period, out, projectRoot }) {
  if (period !== 'current') {
    const error = new Error('Only --period current is supported in this task');
    error.code = 'UNSUPPORTED_PERIOD';
    throw error;
  }

  const movements = await syntheticMovements(projectRoot);
  const periodResult = buildSalaryAnchorPeriods(movements, {
    min_amount: 100000,
    confidence_required: 'high',
    payment_method_types: ['bank_transfer'],
    association_window_minutes: 180,
    periods: { retain_previous_period_days: 7 },
  });
  const selectedPeriod = periodResult.periods[0];
  if (!selectedPeriod) {
    const error = new Error('No synthetic salary-anchor period available');
    error.code = 'NO_SYNTHETIC_PERIOD';
    throw error;
  }

  const written = await writePeriodExports({
    outputDir: out,
    period: selectedPeriod,
    movements,
    periodMovements: periodResult.period_movements,
    generatedAt: '2026-06-22T19:36:02.000Z',
  });

  return {
    ok: true,
    mode: 'synthetic',
    period: 'current',
    period_id: selectedPeriod.period_id,
    output_dir: out,
    generated_files: written.files.map((file) => file.fileName),
  };
}
