function valueOrNull(value) {
  const text = String(value ?? '').trim();
  return text === '' ? null : text;
}

function rawField(rawRow, name) {
  return valueOrNull(rawRow?.[name]);
}

export function buildDisplayFields(movement, options = {}) {
  const rawRow = options.rawRow ?? movement?.raw_json ?? null;
  const saleDetail = rawField(rawRow, 'SALE_DETAIL');
  const businessUnit = rawField(rawRow, 'BUSINESS_UNIT');
  const description = rawField(rawRow, 'DESCRIPTION') ?? valueOrNull(movement?.display_subtitle);
  const recordType = rawField(rawRow, 'RECORD_TYPE');
  const paymentMethodType = rawField(rawRow, 'PAYMENT_METHOD_TYPE');
  const segmentDetail = rawField(rawRow, 'SEGMENT_DETAIL');

  const displayTitle = saleDetail
    ?? businessUnit
    ?? description
    ?? valueOrNull(movement?.display_title)
    ?? 'Mercado Pago Released Money movement';

  const subtitleParts = [description, paymentMethodType, segmentDetail]
    .filter((value, index, values) => value && values.indexOf(value) === index);

  return {
    display_title: displayTitle,
    display_subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : recordType,
    display_status: options.isVisible === false ? 'hidden_technical' : 'visible',
    is_visible: options.isVisible !== false,
    needs_clarification: Boolean(options.needsClarification),
  };
}
