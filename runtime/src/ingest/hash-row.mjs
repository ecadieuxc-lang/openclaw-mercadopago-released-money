import { createHash } from 'node:crypto';

export function sha256Hex(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(',')}}`;
}

export function hashRawRow(rawRow) {
  return sha256Hex(stableStringify(rawRow));
}

export function hashMovement(normalizedRow) {
  const movementIdentity = {
    source_id: normalizedRow.source_id,
    external_reference: normalizedRow.external_reference,
    occurred_at: normalizedRow.occurred_at,
    record_type: normalizedRow.record_type,
    description: normalizedRow.description,
    amount_credit: normalizedRow.amount_credit,
    amount_debit: normalizedRow.amount_debit,
    amount_signed: normalizedRow.amount_signed,
    amount_gross: normalizedRow.amount_gross,
    mp_fee_amount: normalizedRow.mp_fee_amount,
    currency: normalizedRow.currency,
    sale_detail: normalizedRow.sale_detail,
    business_unit: normalizedRow.business_unit,
    payment_method_type: normalizedRow.payment_method_type,
  };
  return sha256Hex(stableStringify(movementIdentity));
}
