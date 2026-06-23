function normalizeForMatch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function rawField(rawRow, fieldName) {
  return rawRow?.[fieldName] ?? null;
}

function classificationText(movement, rawRow) {
  return normalizeForMatch([
    movement?.display_title,
    movement?.display_subtitle,
    rawField(rawRow, 'DESCRIPTION'),
    rawField(rawRow, 'SALE_DETAIL'),
    rawField(rawRow, 'BUSINESS_UNIT'),
    rawField(rawRow, 'PAYMENT_METHOD_TYPE'),
    rawField(rawRow, 'SEGMENT_DETAIL'),
  ].filter(Boolean).join(' '));
}

export function classifyMovement(movement, options = {}) {
  const rawRow = options.rawRow ?? movement?.raw_json ?? null;
  const amountSigned = Number(movement?.amount_signed ?? 0);
  const text = classificationText(movement, rawRow);

  if (amountSigned > 0) {
    if (text.includes('pago cca batch') || text.includes('pago nomina') || text.includes('nomina') || text.includes('sueldo')) {
      return { movement_class: 'salary', income_kind: 'salary', expense_category: null, needs_clarification: false };
    }
    if (text.includes('bono') || text.includes('bonus')) {
      return { movement_class: 'bonus', income_kind: 'bonus', expense_category: null, needs_clarification: false };
    }
    if (text.includes('devolucion') || text.includes('reembolso') || text.includes('refund')) {
      return { movement_class: 'refund', income_kind: 'refund', expense_category: null, needs_clarification: false };
    }
    if (text.includes('cashback')) {
      return { movement_class: 'passive_cashback', income_kind: 'passive_cashback', expense_category: null, needs_clarification: false };
    }
    if (text.includes('rendimiento') || text.includes('interes') || text.includes('yield')) {
      return { movement_class: 'passive_yield', income_kind: 'passive_yield', expense_category: null, needs_clarification: false };
    }
    if (text.includes('transferencia') || text.includes('bank_transfer')) {
      return { movement_class: 'incoming_transfer_other', income_kind: 'other_income', expense_category: null, needs_clarification: false };
    }
    if (text.includes('extra')) {
      return { movement_class: 'incoming_transfer_other', income_kind: 'extra_income', expense_category: null, needs_clarification: false };
    }
    return { movement_class: 'incoming_transfer_other', income_kind: 'other_income', expense_category: null, needs_clarification: false };
  }

  if (amountSigned < 0) {
    if (text.includes('transferencia') || text.includes('bank_transfer')) {
      return {
        movement_class: 'outgoing_transfer_unknown_recipient',
        income_kind: null,
        expense_category: 'transfers',
        needs_clarification: true,
      };
    }
    if (text.includes('pago tarjeta') || text.includes('tarjeta') || text.includes('credit_card')) {
      return { movement_class: 'credit_card_topup', income_kind: null, expense_category: 'card_payment', needs_clarification: false };
    }
    if (text.includes('comision') || text.includes('fee') || text.includes('cargo')) {
      return { movement_class: 'merchant_expense', income_kind: null, expense_category: 'fees', needs_clarification: false };
    }
    if (text.includes('comercio') || text.includes('compra')) {
      return { movement_class: 'merchant_expense', income_kind: null, expense_category: 'shopping', needs_clarification: false };
    }
    return { movement_class: 'unknown_review', income_kind: null, expense_category: 'other', needs_clarification: true };
  }

  return { movement_class: 'unknown_review', income_kind: null, expense_category: null, needs_clarification: true };
}
