# Movement cleaning and classification — Mercado Pago Released Money

This document describes the first deterministic cleaning and classification layer for Mercado Pago Released Money movements.

Scope:

- Mercado Pago Released Money only.
- No bancos.
- No Open Banking.
- No scraping.
- No API, CLI, installer, exports, coach, salary-period anchoring, real OpenClaw integration, persistent SQLite, real CSV files, or credentials in this task.

## Official amount

Classification uses `amount_signed`, produced by the existing parser/importer as:

```text
amount_signed = NET_CREDIT_AMOUNT - NET_DEBIT_AMOUNT
```

`GROSS_AMOUNT` is preserved as source data but is not used as the sole official amount.

## Technical rows

Rows are hidden with `movement_class: technical_hidden` when they are audit/report rows rather than user-visible movements. The deterministic rules hide:

- `RECORD_TYPE != release`, except unresolved negative `reserve_for_payment` holds.
- `initial_available_balance`.
- `available_balance`.
- `total`.
- `pre_payout_*`.
- `post_payout_*`.
- `reserve_for_payout`.
- positive `reserve_for_payment`.
- negative `reserve_for_payment` only when an equivalent payment movement can be detected.

A negative `reserve_for_payment` without a detectable equivalent payment remains visible as `movement_class: pending_hold` and `needs_clarification: true`.

Current limitation: synthetic fixtures do not include a paired payment row for reserve equivalence. The code exposes `hasEquivalentPaymentForReserve()` so the rule is explicit and testable when such a fixture exists.

## Display fields

The layer builds:

- `display_title`.
- `display_subtitle`.
- `display_status`.
- `is_visible`.
- `needs_clarification`.

`display_title` priority is:

1. `SALE_DETAIL`.
2. `BUSINESS_UNIT`.
3. `DESCRIPTION`.

## Income classification

Positive movements (`amount_signed > 0`) use `income_kind`, never `expense_category`.

Initial values include:

- `salary`.
- `bonus`.
- `refund`.
- `passive_yield`.
- `passive_cashback`.
- `extra_income`.
- `other_income`.

Rules include salary/payroll patterns such as `Pago CCA Batch`, `Pago Nomina`, `nomina`, or `sueldo`; refund/reembolso; cashback; rendimiento/interés; and fallback `other_income`.

## Expense classification

Negative movements (`amount_signed < 0`) may use `expense_category`, never `income_kind`.

Initial values include:

- `food`.
- `transport`.
- `subscriptions`.
- `health`.
- `home`.
- `transfers`.
- `card_payment`.
- `fees`.
- `shopping`.
- `entertainment`.
- `other`.

Rules include:

- unclear outgoing transfers: `movement_class: outgoing_transfer_unknown_recipient`, `expense_category: transfers`, `needs_clarification: true`;
- card/payment-card text: `card_payment`;
- fee/commission text: `fees`;
- commerce/purchase text: `shopping`;
- fallback: `other`.

## Non-negotiable category rule

`expense_category` is only present for egresos (`amount_signed < 0`).

`income_kind` is only present for ingresos (`amount_signed > 0`).

When `amount_signed === 0`, both are `null`.

## Internal classes

`movement_class` is internal and is not a user-facing label. Current values include:

- `salary`.
- `bonus`.
- `pending_hold`.
- `outgoing_transfer_unknown_recipient`.
- `refund`.
- `passive_cashback`.
- `passive_yield`.
- `credit_card_topup`.
- `internal_mp_transfer_review`.
- `merchant_expense`.
- `incoming_transfer_other`.
- `technical_hidden`.
- `unknown_review`.
