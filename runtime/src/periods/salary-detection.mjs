const DEFAULT_SALARY_CONFIG = Object.freeze({
  min_amount: 100000,
  confidence_required: 'high',
  payment_method_types: [],
  main_salary_text: ['pago nomina', 'nomina', 'sueldo', 'pago cca batch'],
  bonus_text: ['bono', 'bonus'],
  association_window_minutes: 180,
});

const CONFIDENCE_RANK = Object.freeze({ low: 1, medium: 2, high: 3 });

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function textFields(movement) {
  return [
    movement?.description,
    movement?.sale_detail,
    movement?.display_title,
    movement?.display_subtitle,
    movement?.raw_json?.DESCRIPTION,
    movement?.raw_json?.SALE_DETAIL,
  ].filter(Boolean).join(' ');
}

function fieldMatches(text, patterns) {
  return (patterns ?? []).some((pattern) => text.includes(normalizeText(pattern)));
}

function paymentMethodMatches(movement, config) {
  const allowed = config.payment_method_types ?? config.payment_method_type ?? [];
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  if (allowedList.length === 0) return true;
  const actual = movement?.payment_method_type ?? movement?.raw_json?.PAYMENT_METHOD_TYPE ?? null;
  if (!actual) return true;
  return allowedList.map(normalizeText).includes(normalizeText(actual));
}

export function mergeSalaryDetectionConfig(config = {}) {
  return {
    ...DEFAULT_SALARY_CONFIG,
    ...config,
    main_salary_text: config.main_salary_text ?? config.salary_text ?? DEFAULT_SALARY_CONFIG.main_salary_text,
    bonus_text: config.bonus_text ?? DEFAULT_SALARY_CONFIG.bonus_text,
    payment_method_types: config.payment_method_types ?? (config.payment_method_type ? [config.payment_method_type] : DEFAULT_SALARY_CONFIG.payment_method_types),
  };
}

export function detectSalaryCandidate(movement, options = {}) {
  const config = mergeSalaryDetectionConfig(options);
  const amount = Number(movement?.amount_signed ?? 0);
  const text = normalizeText(textFields(movement));
  const hasMainText = fieldMatches(text, config.main_salary_text);
  const hasBonusText = fieldMatches(text, config.bonus_text);
  const paymentMethodOk = paymentMethodMatches(movement, config);
  const amountOk = amount >= Number(config.min_amount ?? 0);

  if (amount <= 0) {
    return { is_candidate: false, is_anchor: false, is_near_bonus: false, confidence: 'low', reason: 'not_positive_income' };
  }

  if (hasMainText && amountOk && paymentMethodOk) {
    return { is_candidate: true, is_anchor: true, is_near_bonus: false, confidence: 'high', reason: 'salary_text_amount_payment_method' };
  }

  if ((movement?.income_kind === 'salary' || movement?.movement_class === 'salary') && amountOk && paymentMethodOk) {
    return { is_candidate: true, is_anchor: true, is_near_bonus: false, confidence: 'high', reason: 'existing_salary_classification' };
  }

  if (hasMainText && paymentMethodOk) {
    return { is_candidate: true, is_anchor: false, is_near_bonus: false, confidence: 'medium', reason: 'salary_text_below_min_amount' };
  }

  if (hasBonusText || movement?.income_kind === 'bonus' || movement?.movement_class === 'bonus') {
    return { is_candidate: true, is_anchor: false, is_near_bonus: true, confidence: amountOk ? 'medium' : 'low', reason: 'bonus_text_or_classification' };
  }

  return { is_candidate: false, is_anchor: false, is_near_bonus: false, confidence: 'low', reason: 'no_salary_rule_match' };
}

export function detectSalaryCandidates(movements, options = {}) {
  return (movements ?? []).map((movement) => ({
    movement_id: movement.id,
    occurred_at: movement.occurred_at,
    amount_signed: movement.amount_signed,
    ...detectSalaryCandidate(movement, options),
  }));
}

export function confidenceMeets(actual, required = 'high') {
  return (CONFIDENCE_RANK[actual] ?? 0) >= (CONFIDENCE_RANK[required] ?? CONFIDENCE_RANK.high);
}

export { DEFAULT_SALARY_CONFIG };
