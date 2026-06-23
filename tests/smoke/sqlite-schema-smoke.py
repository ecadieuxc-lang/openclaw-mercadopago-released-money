#!/usr/bin/env python3
import sqlite3
import tempfile
import pathlib
import json

REQUIRED_TABLES = {
    "schema_migrations": ["version", "name", "applied_at", "checksum"],
    "source_reports": ["id", "provider", "report_type", "file_hash", "column_profile", "source_mode"],
    "raw_rows": ["id", "report_id", "row_index", "row_hash", "raw_json"],
    "movements": ["id", "report_id", "raw_row_id", "movement_hash", "occurred_at", "amount_signed", "currency"],
    "periods": ["id", "period_label", "salary_anchor_at", "start_at", "status"],
    "period_movements": ["period_id", "movement_id", "included_at"],
    "clarifications": ["id", "movement_id", "question_type", "question_text", "status"],
    "aliases": ["id", "alias", "match_type", "created_at", "updated_at"],
    "coach_reports": ["id", "period_id", "scope_type", "from_at", "to_at", "input_json", "input_hash"],
    "exports": ["id", "period_id", "export_type", "file_path", "file_hash", "generated_at"],
}

REQUIRED_INDEXES = {
    "idx_source_reports_file_hash",
    "idx_raw_rows_report_id",
    "idx_raw_rows_row_hash",
    "idx_movements_occurred_at",
    "idx_movements_movement_hash",
    "idx_movements_movement_class",
    "idx_movements_income_kind",
    "idx_movements_expense_category",
    "idx_periods_status",
    "idx_periods_salary_anchor_at",
    "idx_clarifications_status",
    "idx_exports_period_id",
}


def project_root():
    return pathlib.Path(__file__).resolve().parents[2]


def fetch_names(connection, object_type):
    rows = connection.execute(
        "SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%'",
        (object_type,),
    ).fetchall()
    return {row[0] for row in rows}


def table_columns(connection, table):
    return {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def insert_synthetic_data(connection):
    now = "2026-06-22T18:25:33Z"
    connection.execute(
        """
        INSERT INTO source_reports (
          id, provider, report_type, file_name, file_hash, range_start, range_end,
          downloaded_at, imported_at, status, row_count, column_count,
          column_profile, source_mode, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "report_synthetic_1",
            "mercado_pago",
            "released_money",
            "synthetic-released-money.csv",
            "sha256:synthetic-report",
            "2026-06-01",
            "2026-06-22",
            None,
            now,
            "imported",
            1,
            15,
            "released_money_daily_core",
            "fixture",
            now,
        ),
    )
    connection.execute(
        """
        INSERT INTO raw_rows (
          id, report_id, row_index, row_hash, raw_json, date_raw, record_type,
          description, source_id, external_reference, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "raw_synthetic_1",
            "report_synthetic_1",
            1,
            "sha256:synthetic-row",
            json.dumps({"DATE": "2026-06-22", "NET_CREDIT_AMOUNT": "1000"}, sort_keys=True),
            "2026-06-22",
            "release",
            "Synthetic income",
            "source-1",
            "external-1",
            now,
        ),
    )
    connection.execute(
        """
        INSERT INTO movements (
          id, report_id, raw_row_id, movement_hash, occurred_at, amount_signed,
          amount_gross, mp_fee_amount, currency, balance_after, balance_before,
          display_title, display_subtitle, movement_class, income_kind,
          expense_category, display_status, needs_clarification, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "movement_synthetic_1",
            "report_synthetic_1",
            "raw_synthetic_1",
            "sha256:synthetic-movement",
            "2026-06-22T12:00:00Z",
            1000,
            1000,
            0,
            "CLP",
            5000,
            4000,
            "Synthetic income",
            "Fixture row",
            "income",
            "other_income",
            None,
            "posted",
            0,
            now,
            now,
        ),
    )
    connection.execute(
        """
        INSERT INTO periods (
          id, period_label, salary_anchor_at, salary_amount, start_at, end_at,
          status, opening_balance, closing_balance, income_total, expense_total,
          net_total, movement_count, closed_at, retention_until, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "period_synthetic_1",
            "2026-06 salary period",
            "2026-06-19T09:00:00Z",
            1000,
            "2026-06-19T09:00:00Z",
            None,
            "open",
            4000,
            5000,
            1000,
            0,
            1000,
            1,
            None,
            None,
            now,
            now,
        ),
    )
    connection.execute(
        "INSERT INTO period_movements (period_id, movement_id, included_at) VALUES (?, ?, ?)",
        ("period_synthetic_1", "movement_synthetic_1", now),
    )
    connection.execute(
        """
        INSERT INTO clarifications (
          id, movement_id, question_type, question_text, answer_text,
          resolved_alias, status, created_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "clarification_synthetic_1",
            "movement_synthetic_1",
            "transfer_identity",
            "Synthetic question for a doubtful transfer?",
            None,
            None,
            "open",
            now,
            None,
        ),
    )
    connection.execute(
        """
        INSERT INTO aliases (
          id, alias, match_type, match_value_hash, last_four, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("alias_synthetic_1", "Synthetic alias", "hash", "sha256:alias", "0000", "fixture only", now, now),
    )
    connection.execute(
        """
        INSERT INTO coach_reports (
          id, period_id, scope_type, from_at, to_at, cutoff_day,
          input_json, input_hash, coach_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "coach_synthetic_1",
            "period_synthetic_1",
            "period",
            "2026-06-19T09:00:00Z",
            "2026-06-22T23:59:59Z",
            22,
            json.dumps({"period_id": "period_synthetic_1"}, sort_keys=True),
            "sha256:coach-input",
            "Synthetic coach text.",
            now,
        ),
    )
    connection.execute(
        """
        INSERT INTO exports (id, period_id, export_type, file_path, file_hash, generated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            "export_synthetic_1",
            "period_synthetic_1",
            "clean_csv",
            "synthetic/export.csv",
            "sha256:export",
            now,
        ),
    )


def verify_foreign_keys(connection):
    try:
        connection.execute(
            "INSERT INTO raw_rows (id, report_id, row_index, row_hash, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("bad_raw", "missing_report", 2, "sha256:bad", "{}", "2026-06-22T18:25:33Z"),
        )
    except sqlite3.IntegrityError:
        return
    raise AssertionError("foreign key enforcement did not reject missing source_reports row")


def main():
    root = project_root()
    manifest_path = root / "runtime" / "src" / "db" / "migrations" / "manifest.json"
    migration_path = root / "runtime" / "src" / "db" / "migrations" / "0001_initial_schema.sql"

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert_true(manifest["current_schema_version"] == 1, "manifest current_schema_version must be 1")
    assert_true(manifest["migrations"][0]["destructive"] is False, "initial migration must be non-destructive")
    assert_true(manifest["migrations"][0]["file"] == "0001_initial_schema.sql", "manifest must reference SQL file")
    sql = migration_path.read_text(encoding="utf-8")

    with tempfile.TemporaryDirectory() as temp_dir:
        db_path = pathlib.Path(temp_dir) / "schema-smoke.sqlite"
        connection = sqlite3.connect(db_path)
        try:
            connection.execute("PRAGMA foreign_keys = ON")
            connection.executescript(sql)

            tables = fetch_names(connection, "table")
            assert_true(set(REQUIRED_TABLES).issubset(tables), f"missing tables: {set(REQUIRED_TABLES) - tables}")

            for table, columns in REQUIRED_TABLES.items():
                actual_columns = table_columns(connection, table)
                missing_columns = set(columns) - actual_columns
                assert_true(not missing_columns, f"{table} missing columns: {missing_columns}")

            row = connection.execute(
                "SELECT version, name FROM schema_migrations WHERE version = 1"
            ).fetchone()
            assert_true(row == (1, "0001_initial_schema"), "schema_migrations must contain version 1")

            indexes = fetch_names(connection, "index")
            missing_indexes = REQUIRED_INDEXES - indexes
            assert_true(not missing_indexes, f"missing indexes: {missing_indexes}")

            insert_synthetic_data(connection)
            verify_foreign_keys(connection)
            connection.rollback()
        finally:
            connection.close()

    print("SQLITE_SCHEMA_SMOKE_OK")


if __name__ == "__main__":
    main()
