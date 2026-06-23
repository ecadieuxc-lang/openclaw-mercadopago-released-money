import { hashMovement, hashRawRow } from './hash-row.mjs';

function parseAmount(value, currency) {
  const text = String(value ?? '').trim();
  if (text === '') {
    return currency === 'CLP' ? 0 : 0;
  }

  const normalized = text.replace(/\s+/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    const error = new Error(`Invalid amount: ${text}`);
    error.code = 'INVALID_AMOUNT';
    throw error;
  }

  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue)) {
    const error = new Error(`Invalid amount: ${text}`);
    error.code = 'INVALID_AMOUNT';
    throw error;
  }

  if (currency === 'CLP' && Number.isInteger(numberValue)) {
    return numberValue;
  }
  return numberValue;
}

function normalizeDate(value) {
  const text = String(value ?? '').trim();
  const isoOffsetMatch = text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2})(\d{2})$/);
  if (isoOffsetMatch) {
    return `${isoOffsetMatch[1]}${isoOffsetMatch[2]}:${isoOffsetMatch[3]}`;
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  if (text.length > 0) {
    return text;
  }

  const error = new Error('DATE is required');
  error.code = 'INVALID_DATE';
  throw error;
}

function valueOrNull(value) {
  const text = String(value ?? '').trim();
  return text === '' ? null : text;
}

export function normalizeReleasedMoneyRow(rawRow, rowIndex) {
  const currency = valueOrNull(rawRow.CURRENCY);
  const amountCredit = parseAmount(rawRow.NET_CREDIT_AMOUNT, currency);
  const amountDebit = parseAmount(rawRow.NET_DEBIT_AMOUNT, currency);
  const saleDetail = valueOrNull(rawRow.SALE_DETAIL);
  const businessUnit = valueOrNull(rawRow.BUSINESS_UNIT);
  const description = valueOrNull(rawRow.DESCRIPTION);

  const normalized = {
    row_index: rowIndex,
    source_id: valueOrNull(rawRow.SOURCE_ID),
    external_reference: valueOrNull(rawRow.EXTERNAL_REFERENCE),
    occurred_at: normalizeDate(rawRow.DATE),
    record_type: valueOrNull(rawRow.RECORD_TYPE),
    description,
    amount_credit: amountCredit,
    amount_debit: amountDebit,
    amount_signed: amountCredit - amountDebit,
    amount_gross: parseAmount(rawRow.GROSS_AMOUNT, currency),
    mp_fee_amount: parseAmount(rawRow.MP_FEE_AMOUNT, currency),
    currency,
    balance_after: parseAmount(rawRow.BALANCE_AMOUNT, currency),
    display_title: saleDetail ?? businessUnit ?? description,
    sale_detail: saleDetail,
    business_unit: businessUnit,
    payment_method_type: valueOrNull(rawRow.PAYMENT_METHOD_TYPE),
    segment_detail: valueOrNull(rawRow.SEGMENT_DETAIL),
    raw_json: { ...rawRow },
    row_hash: hashRawRow(rawRow),
    movement_hash: null,
  };

  normalized.movement_hash = hashMovement(normalized);
  return normalized;
}
