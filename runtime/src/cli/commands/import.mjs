import { importReportFromCsvFile, createImportState } from '../../import/index.mjs';

export async function runImport({ file }) {
  const result = await importReportFromCsvFile({
    filePath: file,
    sourceMode: 'manual_csv',
    parserProfile: 'released_money_daily_core',
    state: createImportState(),
  });

  return {
    ok: true,
    source_mode: result.source_report.source_mode,
    file_hash: result.source_report.file_hash,
    parsed_rows: result.source_report.row_count,
    new_movements: result.counts.new_movements,
    duplicate_movements: result.counts.duplicate_movements,
  };
}
