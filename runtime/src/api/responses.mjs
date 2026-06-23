import { buildPeriodExports } from '../exports/index.mjs';
import { CURRENT_SCHEMA_NAME, CURRENT_SCHEMA_VERSION } from '../db/schema-version.mjs';

export const SYNTHETIC_PERIOD = Object.freeze({
  period_id: '2026-06',
  period_label: 'Junio 2026',
  status: 'synthetic_open',
  anchor_movement_id: 'mov_salary_001',
  anchor_occurred_at: '2026-06-19T12:00:00.000Z',
  opened_at: '2026-06-19T12:00:00.000Z',
  closed_at: null,
  retention_until: null,
});

export const SYNTHETIC_MOVEMENTS = Object.freeze([
  {
    id: 'mov_salary_001',
    occurred_at: '2026-06-19T12:00:00.000Z',
    amount_signed: 1200000,
    currency: 'CLP',
    display_title: 'Ingreso sintético de sueldo',
    display_subtitle: 'Fixture manual seguro de Mercado Pago Released Money',
    movement_class: 'salary',
    income_kind: 'salary',
    display_status: 'confirmed_synthetic',
    needs_clarification: false,
    is_visible: true,
  },
  {
    id: 'mov_food_001',
    occurred_at: '2026-06-20T16:30:00.000Z',
    amount_signed: -18500,
    currency: 'CLP',
    display_title: 'Compra sintética de comida',
    display_subtitle: 'Comercio ficticio seguro',
    movement_class: 'merchant_expense',
    expense_category: 'food',
    display_status: 'confirmed_synthetic',
    needs_clarification: false,
    is_visible: true,
  },
  {
    id: 'mov_transfer_review_001',
    occurred_at: '2026-06-21T09:15:00.000Z',
    amount_signed: -42000,
    currency: 'CLP',
    display_title: 'Transferencia sintética por aclarar',
    display_subtitle: 'Destinatario no inventado; requiere aclaración',
    movement_class: 'outgoing_transfer_unknown_recipient',
    expense_category: 'transfers',
    display_status: 'needs_clarification',
    needs_clarification: true,
    is_visible: true,
  },
  {
    id: 'mov_refund_001',
    occurred_at: '2026-06-22T10:00:00.000Z',
    amount_signed: 9000,
    currency: 'CLP',
    display_title: 'Reembolso sintético',
    display_subtitle: 'Fixture manual seguro',
    movement_class: 'refund',
    income_kind: 'refund',
    display_status: 'confirmed_synthetic',
    needs_clarification: false,
    is_visible: true,
  },
]);

export const SYNTHETIC_PERIOD_MOVEMENTS = Object.freeze(
  SYNTHETIC_MOVEMENTS.map((movement) => ({
    period_id: SYNTHETIC_PERIOD.period_id,
    movement_id: movement.id,
    role: movement.id === SYNTHETIC_PERIOD.anchor_movement_id ? 'anchor' : 'movement',
    included_at: movement.occurred_at,
  })),
);

export function buildExports() {
  return buildPeriodExports({
    period: SYNTHETIC_PERIOD,
    movements: [...SYNTHETIC_MOVEMENTS],
    periodMovements: [...SYNTHETIC_PERIOD_MOVEMENTS],
    generatedAt: '2026-06-22T00:00:00.000Z',
  });
}

export function healthResponse() {
  return {
    status: 'ok',
    service: 'openclaw-mercadopago-released-money-local-api',
    mode: 'local_synthetic',
    host: '127.0.0.1',
    cors_enabled: false,
  };
}

export function doctorResponse() {
  return {
    status: 'ok',
    mode: 'synthetic_manual_fixture',
    checks: [
      { name: 'local_only_host', status: 'ok', detail: '127.0.0.1 default' },
      { name: 'secrets_not_checked', status: 'skipped', detail: 'No real secrets are read in this task.' },
      { name: 'persistent_sqlite', status: 'skipped', detail: 'No persistent SQLite database is created.' },
    ],
  };
}

export function publicConfigResponse() {
  return {
    app: { name: 'openclaw-mercadopago-released-money', locale: 'es-CL' },
    provider: { name: 'mercado_pago', report: 'released_money', country: 'CL', currency: 'CLP' },
    api: { host: '127.0.0.1', conceptual_port: 3766, cors_enabled: false, auth_required: true, public_raw_exports_enabled: false },
    reports: { manual_csv_import_enabled: true, include_payout_bank_account_number: false },
  };
}

export function schemaVersionResponse() {
  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    schema_name: CURRENT_SCHEMA_NAME,
    source: 'runtime_contract',
  };
}

export function importsStatusResponse() {
  return {
    source: 'synthetic_manual_fixture',
    provider: 'mercado_pago',
    report: 'released_money',
    last_import_status: 'not_connected',
    message: 'API local de esta tarea usa fixtures sintéticos y no sincroniza Mercado Pago real.',
    counts: { imported_files: 0, synthetic_movements: SYNTHETIC_MOVEMENTS.length },
  };
}

export function periodSummaryResponse(periodId = SYNTHETIC_PERIOD.period_id) {
  const exports = buildExports();
  return { ...exports.summary, period_id: periodId, requested_period_id: periodId };
}

export function financeHomeResponse() {
  const summary = periodSummaryResponse();
  return {
    current_period: summary,
    totals: {
      income_total: summary.income_total,
      expense_total: summary.expense_total,
      net_total: summary.net_total,
      currency: 'CLP',
    },
    highlights: [
      'Datos sintéticos seguros para smoke local.',
      'Una transferencia queda como aclaración; no se inventa destinatario.',
    ],
  };
}

export function movementsResponse({ limit = 50, cursor = null } = {}) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 200);
  const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const items = SYNTHETIC_MOVEMENTS.filter((movement) => movement.is_visible !== false).slice(start, start + safeLimit);
  const next = start + items.length;
  return {
    items,
    page: {
      limit: safeLimit,
      next_cursor: next < SYNTHETIC_MOVEMENTS.length ? String(next) : null,
      has_more: next < SYNTHETIC_MOVEMENTS.length,
    },
  };
}

export function financeHistoryResponse() {
  return {
    items: [periodSummaryResponse()],
    source: 'synthetic_manual_fixture',
  };
}

export function clarificationsResponse() {
  return {
    items: [
      {
        id: 'clar_synthetic_transfer_001',
        movement_id: 'mov_transfer_review_001',
        question: 'Clasificar transferencia sintética sin inventar destinatario.',
        status: 'pending',
        allowed_answers: ['personal_transfer', 'business_expense', 'ignore'],
      },
    ],
  };
}

export function clarificationAnswerResponse({ id, answer }) {
  return {
    id,
    status: 'accepted_synthetic_not_persisted',
    answer: typeof answer === 'string' ? answer : 'unclassified',
    persisted: false,
  };
}

export function coachResponse(periodId = SYNTHETIC_PERIOD.period_id) {
  const summary = periodSummaryResponse(periodId);
  return {
    period_id: periodId,
    summary,
    advice: [
      'Revisar aclaraciones pendientes antes de interpretar transferencias.',
      'Estos datos son sintéticos y no representan finanzas reales.',
    ],
  };
}

export function assistantContextResponse() {
  return {
    scope: 'mercado_pago_released_money_only',
    agent_rules: [
      'Usar solo respuestas del backend local.',
      'No inventar destinatarios de transferencias dudosas.',
      'No prometer sincronización real en modo sintético.',
      'No bancos. No Open Banking. No scraping.',
    ],
    highlights: financeHomeResponse().highlights,
    current_period_id: SYNTHETIC_PERIOD.period_id,
  };
}

export function assistantSpendingSummaryResponse() {
  const summary = periodSummaryResponse();
  return {
    period_id: summary.period_id,
    expense_total: summary.expense_total,
    expense_by_category: summary.expense_by_category,
    pending_clarification_count: summary.pending_clarification_count,
    source: 'synthetic_manual_fixture',
  };
}
