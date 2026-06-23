-- 0001_initial_schema.sql
-- Mercado Pago Released Money processed data schema v1.
-- Scope: provider='mercado_pago', report_type='released_money'.
-- SQLite is the processed source; raw CSV evidence remains external/intact.

PRAGMA foreign_keys = ON;

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  checksum TEXT NOT NULL
);

INSERT INTO schema_migrations (version, name, applied_at, checksum)
VALUES (1, '0001_initial_schema', datetime('now'), 'pending-runtime-checksum');

CREATE TABLE source_reports (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  report_type TEXT NOT NULL,
  file_name TEXT,
  file_hash TEXT NOT NULL UNIQUE,
  range_start TEXT,
  range_end TEXT,
  downloaded_at TEXT,
  imported_at TEXT NOT NULL,
  status TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  column_profile TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (provider = 'mercado_pago'),
  CHECK (report_type = 'released_money'),
  CHECK (row_count >= 0),
  CHECK (column_count >= 0)
);

CREATE TABLE raw_rows (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  row_hash TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  date_raw TEXT,
  record_type TEXT,
  description TEXT,
  source_id TEXT,
  external_reference TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(report_id) REFERENCES source_reports(id),
  UNIQUE(report_id, row_index),
  UNIQUE(report_id, row_hash),
  CHECK (row_index > 0)
);

CREATE TABLE movements (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  raw_row_id TEXT NOT NULL,
  movement_hash TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  amount_signed INTEGER NOT NULL,
  amount_gross INTEGER,
  mp_fee_amount INTEGER,
  currency TEXT NOT NULL,
  balance_after INTEGER,
  balance_before INTEGER,
  display_title TEXT NOT NULL,
  display_subtitle TEXT,
  movement_class TEXT NOT NULL,
  income_kind TEXT,
  expense_category TEXT,
  display_status TEXT NOT NULL,
  needs_clarification INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(report_id) REFERENCES source_reports(id),
  FOREIGN KEY(raw_row_id) REFERENCES raw_rows(id),
  UNIQUE(movement_hash),
  CHECK (needs_clarification IN (0, 1)),
  CHECK (currency <> ''),
  CHECK (
    (movement_class = 'income' AND income_kind IS NOT NULL AND expense_category IS NULL)
    OR (movement_class = 'expense' AND income_kind IS NULL)
    OR (movement_class NOT IN ('income', 'expense'))
  )
);

CREATE TABLE periods (
  id TEXT PRIMARY KEY,
  period_label TEXT NOT NULL,
  salary_anchor_at TEXT NOT NULL,
  salary_amount INTEGER,
  start_at TEXT NOT NULL,
  end_at TEXT,
  status TEXT NOT NULL,
  opening_balance INTEGER,
  closing_balance INTEGER,
  income_total INTEGER NOT NULL DEFAULT 0,
  expense_total INTEGER NOT NULL DEFAULT 0,
  net_total INTEGER NOT NULL DEFAULT 0,
  movement_count INTEGER NOT NULL DEFAULT 0,
  closed_at TEXT,
  retention_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (movement_count >= 0)
);

CREATE TABLE period_movements (
  period_id TEXT NOT NULL,
  movement_id TEXT NOT NULL,
  included_at TEXT NOT NULL,
  PRIMARY KEY(period_id, movement_id),
  FOREIGN KEY(period_id) REFERENCES periods(id),
  FOREIGN KEY(movement_id) REFERENCES movements(id)
);

CREATE TABLE clarifications (
  id TEXT PRIMARY KEY,
  movement_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  resolved_alias TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(movement_id) REFERENCES movements(id)
);

CREATE TABLE aliases (
  id TEXT PRIMARY KEY,
  alias TEXT NOT NULL,
  match_type TEXT NOT NULL,
  match_value_hash TEXT,
  last_four TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE coach_reports (
  id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  from_at TEXT NOT NULL,
  to_at TEXT NOT NULL,
  cutoff_day INTEGER,
  input_json TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  coach_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(period_id) REFERENCES periods(id)
);

CREATE TABLE exports (
  id TEXT PRIMARY KEY,
  period_id TEXT,
  export_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  FOREIGN KEY(period_id) REFERENCES periods(id)
);

CREATE INDEX idx_source_reports_file_hash ON source_reports(file_hash);
CREATE INDEX idx_raw_rows_report_id ON raw_rows(report_id);
CREATE INDEX idx_raw_rows_row_hash ON raw_rows(row_hash);
CREATE INDEX idx_movements_occurred_at ON movements(occurred_at);
CREATE INDEX idx_movements_movement_hash ON movements(movement_hash);
CREATE INDEX idx_movements_movement_class ON movements(movement_class);
CREATE INDEX idx_movements_income_kind ON movements(income_kind);
CREATE INDEX idx_movements_expense_category ON movements(expense_category);
CREATE INDEX idx_periods_status ON periods(status);
CREATE INDEX idx_periods_salary_anchor_at ON periods(salary_anchor_at);
CREATE INDEX idx_clarifications_status ON clarifications(status);
CREATE INDEX idx_exports_period_id ON exports(period_id);
