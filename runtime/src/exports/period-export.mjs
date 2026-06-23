import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';

import { buildCleanMovementsCsv, buildPeriodMovementsJsonl } from './movements-export.mjs';
import { buildPeriodSummaryJson } from './summary-export.mjs';

export function sha256Content(content) {
  return createHash('sha256').update(content).digest('hex');
}

export function byteLength(content) {
  return Buffer.byteLength(content, 'utf8');
}

function manifestEntry(type, fileName, content) {
  return {
    type,
    file_name: fileName,
    sha256: sha256Content(content),
    bytes: byteLength(content),
  };
}

export function buildExportManifest({ period, generatedAt, files }) {
  return {
    generated_at: generatedAt,
    period_id: period.period_id,
    exports: files.map((file) => manifestEntry(file.type, file.fileName, file.content)),
  };
}

export function buildPeriodExports({ period, movements, periodMovements, generatedAt = new Date().toISOString() }) {
  const cleanCsv = buildCleanMovementsCsv({ period, movements, periodMovements });
  const summaryJson = buildPeriodSummaryJson({ period, movements, periodMovements });
  const movementsJsonl = buildPeriodMovementsJsonl({ period, movements, periodMovements });

  const files = [
    { type: 'clean_movements_csv', fileName: 'clean-movements.csv', content: cleanCsv.content },
    { type: 'period_summary_json', fileName: 'period-summary.json', content: summaryJson },
    { type: 'period_movements_jsonl', fileName: 'period-movements.jsonl', content: movementsJsonl.content },
  ];

  const manifest = buildExportManifest({ period, generatedAt, files });
  files.push({ type: 'manifest_json', fileName: 'manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n` });

  return {
    files,
    manifest,
    clean_movements: cleanCsv,
    summary: JSON.parse(summaryJson),
    movements_jsonl: movementsJsonl,
  };
}

export async function writePeriodExports({ outputDir, period, movements, periodMovements, generatedAt }) {
  if (!outputDir) throw new Error('outputDir is required');
  await mkdir(outputDir, { recursive: true });

  const exports = buildPeriodExports({ period, movements, periodMovements, generatedAt });
  for (const file of exports.files) {
    await writeFile(join(outputDir, basename(file.fileName)), file.content, 'utf8');
  }
  return exports;
}
