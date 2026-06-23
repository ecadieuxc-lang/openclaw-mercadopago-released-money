export const RELEASED_MONEY_DAILY_CORE_COLUMNS = Object.freeze([
  'DATE',
  'SOURCE_ID',
  'EXTERNAL_REFERENCE',
  'RECORD_TYPE',
  'DESCRIPTION',
  'NET_CREDIT_AMOUNT',
  'NET_DEBIT_AMOUNT',
  'GROSS_AMOUNT',
  'MP_FEE_AMOUNT',
  'CURRENCY',
  'BALANCE_AMOUNT',
  'SALE_DETAIL',
  'BUSINESS_UNIT',
  'PAYMENT_METHOD_TYPE',
  'SEGMENT_DETAIL',
]);

export const COLUMN_PROFILES = Object.freeze({
  released_money_daily_core: Object.freeze({
    name: 'released_money_daily_core',
    requiredColumns: RELEASED_MONEY_DAILY_CORE_COLUMNS,
  }),
});

export function getColumnProfile(profileName = 'released_money_daily_core') {
  const profile = COLUMN_PROFILES[profileName];
  if (!profile) {
    const error = new Error(`Unknown column profile: ${profileName}`);
    error.code = 'UNKNOWN_COLUMN_PROFILE';
    error.profile_name = profileName;
    throw error;
  }
  return profile;
}
