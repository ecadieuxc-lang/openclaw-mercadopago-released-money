import { classifyMovement } from './classify-movement.mjs';
import { buildDisplayFields } from './display-fields.mjs';
import { inspectTechnicalRow } from './technical-rows.mjs';

export function cleanMovement(movement, options = {}) {
  const technical = inspectTechnicalRow(movement, options);
  const technicalNeedsClarification = Boolean(technical.needs_clarification);

  if (technical.isTechnical) {
    const displayFields = buildDisplayFields(movement, {
      rawRow: options.rawRow,
      isVisible: false,
      needsClarification: technicalNeedsClarification,
    });
    return {
      ...movement,
      ...displayFields,
      movement_class: 'technical_hidden',
      income_kind: null,
      expense_category: null,
      technical_reason: technical.reason,
    };
  }

  const displayFields = buildDisplayFields(movement, {
    rawRow: options.rawRow,
    isVisible: technical.is_visible,
    needsClarification: technicalNeedsClarification,
  });
  const movementForClassification = { ...movement, ...displayFields };
  const classification = technical.movement_class === 'pending_hold'
    ? {
      movement_class: 'pending_hold',
      income_kind: null,
      expense_category: null,
      needs_clarification: true,
    }
    : classifyMovement(movementForClassification, options);

  const amountSigned = Number(movement?.amount_signed ?? 0);
  const cleanClassification = {
    ...classification,
    income_kind: amountSigned > 0 ? classification.income_kind : null,
    expense_category: amountSigned < 0 ? classification.expense_category : null,
  };

  return {
    ...movement,
    ...displayFields,
    ...cleanClassification,
    needs_clarification: Boolean(displayFields.needs_clarification || cleanClassification.needs_clarification),
    technical_reason: technical.reason,
  };
}
