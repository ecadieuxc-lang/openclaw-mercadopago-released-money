const HIDDEN_RECORD_TYPES = new Set([
  'initial_available_balance',
  'available_balance',
  'total',
  'reserve_for_payout',
]);

function normalizedText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function readRawField(rawRow, fieldName) {
  if (!rawRow) {
    return null;
  }
  return rawRow[fieldName] ?? rawRow[fieldName.toLowerCase()] ?? null;
}

function rowText(rawRow, movement) {
  return [
    readRawField(rawRow, 'RECORD_TYPE'),
    readRawField(rawRow, 'DESCRIPTION'),
    readRawField(rawRow, 'SALE_DETAIL'),
    readRawField(rawRow, 'BUSINESS_UNIT'),
    readRawField(rawRow, 'PAYMENT_METHOD_TYPE'),
    readRawField(rawRow, 'SEGMENT_DETAIL'),
    movement?.display_title,
    movement?.display_subtitle,
  ].map(normalizedText).filter(Boolean).join(' ');
}

export function hasEquivalentPaymentForReserve(reserveMovement, candidateMovements = []) {
  const reserveAmount = Number(reserveMovement?.amount_signed ?? 0);
  if (reserveAmount >= 0) {
    return false;
  }

  const reserveDate = String(reserveMovement?.occurred_at ?? '').slice(0, 10);
  const absoluteReserveAmount = Math.abs(reserveAmount);

  return candidateMovements.some((candidate) => {
    if (candidate === reserveMovement) {
      return false;
    }

    const candidateAmount = Number(candidate?.amount_signed ?? 0);
    const candidateDate = String(candidate?.occurred_at ?? '').slice(0, 10);
    const candidateClass = normalizedText(candidate?.movement_class);
    const candidateTitle = normalizedText(candidate?.display_title);
    const candidateSubtitle = normalizedText(candidate?.display_subtitle);
    const hasPaymentText = `${candidateClass} ${candidateTitle} ${candidateSubtitle}`.includes('payment')
      || `${candidateClass} ${candidateTitle} ${candidateSubtitle}`.includes('pago');

    return candidateDate === reserveDate
      && Math.abs(candidateAmount) === absoluteReserveAmount
      && hasPaymentText;
  });
}

export function inspectTechnicalRow(movement, options = {}) {
  const rawRow = options.rawRow ?? movement?.raw_json ?? null;
  const relatedMovements = options.relatedMovements ?? [];
  const recordType = normalizedText(readRawField(rawRow, 'RECORD_TYPE') ?? movement?.record_type);
  const segmentDetail = normalizedText(readRawField(rawRow, 'SEGMENT_DETAIL') ?? movement?.segment_detail);
  const text = rowText(rawRow, movement);
  const amountSigned = Number(movement?.amount_signed ?? 0);

  if (recordType === 'reserve_for_payment' || segmentDetail === 'reserve_for_payment') {
    if (amountSigned < 0 && !hasEquivalentPaymentForReserve(movement, relatedMovements)) {
      return {
        isTechnical: false,
        movement_class: 'pending_hold',
        is_visible: true,
        needs_clarification: true,
        reason: 'reserve_for_payment_negative_without_equivalent_payment',
      };
    }

    return {
      isTechnical: true,
      movement_class: 'technical_hidden',
      is_visible: false,
      needs_clarification: false,
      reason: amountSigned >= 0
        ? 'reserve_for_payment_positive'
        : 'reserve_for_payment_negative_with_equivalent_payment',
    };
  }

  if (recordType !== 'release') {
    return {
      isTechnical: true,
      movement_class: 'technical_hidden',
      is_visible: false,
      needs_clarification: false,
      reason: `record_type_${recordType || 'missing'}_is_not_release`,
    };
  }

  if (HIDDEN_RECORD_TYPES.has(recordType) || HIDDEN_RECORD_TYPES.has(segmentDetail)) {
    return {
      isTechnical: true,
      movement_class: 'technical_hidden',
      is_visible: false,
      needs_clarification: false,
      reason: `technical_${recordType || segmentDetail}`,
    };
  }

  if (text.includes('pre_payout_') || text.includes('post_payout_')) {
    return {
      isTechnical: true,
      movement_class: 'technical_hidden',
      is_visible: false,
      needs_clarification: false,
      reason: 'payout_marker',
    };
  }

  return {
    isTechnical: false,
    movement_class: null,
    is_visible: true,
    needs_clarification: false,
    reason: null,
  };
}
