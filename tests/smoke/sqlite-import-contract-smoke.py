import json
import sqlite3
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MIGRATION = PROJECT_ROOT / "runtime" / "src" / "db" / "migrations" / "0001_initial_schema.sql"
MANIFEST = PROJECT_ROOT / "runtime" / "src" / "db" / "migrations" / "manifest.json"


def connect_temp_db(tmpdir):
    db_path = Path(tmpdir) / "contract-temp.sqlite"
    connection = sqlite3.connect(db_path)
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(MIGRATION.read_text(encoding="utf-8"))
    return connection


def insert_contract_rows(connection):
    connection.execute(
        """
        INSERT INTO source_reports (
          id, provider, report_type, file_name, file_hash, imported_at, status,
          row_count, column_count, column_profile, source_mode, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, datetime('now'))
        """,
        (
            "source_report_contract_1",
            "mercado_pago",
            "released_money",
            "synthetic-contract.csv",
            "file_hash_contract_1",
            "parsed",
            1,
            18,
            "released_money_daily_core",
            "manual_csv",
        ),
    )
    connection.execute(
        """
        INSERT INTO raw_rows (
          id, report_id, row_index, row_hash, raw_json, date_raw, record_type,
          description, source_id, external_reference, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """,
        (
            "raw_row_contract_1",
            "source_report_contract_1",
            1,
            "row_hash_contract_1",
            json.dumps({"DATE": "2026-01-01T10:00:00-0300", "NET_CREDIT_AMOUNT": "1000"}),
            "2026-01-01T10:00:00-0300",
            "release",
            "Synthetic released money row",
            "synthetic-source-id",
            "synthetic-reference",
        ),
    )
    connection.execute(
        """
        INSERT INTO movements (
          id, report_id, raw_row_id, movement_hash, occurred_at, amount_signed,
          amount_gross, mp_fee_amount, currency, balance_after, balance_before,
          display_title, display_subtitle, movement_class, income_kind,
          expense_category, display_status, needs_clarification, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        (
            "movement_contract_1",
            "source_report_contract_1",
            "raw_row_contract_1",
            "movement_hash_contract_1",
            "2026-01-01T13:00:00.000Z",
            1000,
            1000,
            0,
            "CLP",
            5000,
            4000,
            "Synthetic movement",
            "SQLite import contract smoke",
            "income",
            "unclassified",
            None,
            "pending_classification",
            0,
        ),
    )
    connection.commit()


def assert_duplicate_movement_rejected(connection):
    try:
        connection.execute(
            """
            INSERT INTO movements (
              id, report_id, raw_row_id, movement_hash, occurred_at, amount_signed,
              currency, display_title, movement_class, income_kind, display_status,
              needs_clarification, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """,
            (
                "movement_contract_duplicate",
                "source_report_contract_1",
                "raw_row_contract_1",
                "movement_hash_contract_1",
                "2026-01-01T13:00:00.000Z",
                1000,
                "CLP",
                "Duplicate movement",
                "income",
                "unclassified",
                "pending_classification",
                0,
            ),
        )
        connection.commit()
    except sqlite3.IntegrityError:
        connection.rollback()
        return
    raise AssertionError("duplicate movement_hash was accepted silently")


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert manifest["current_schema_version"] == 1

    with tempfile.TemporaryDirectory() as tmpdir:
        connection = connect_temp_db(tmpdir)
        try:
            version = connection.execute("SELECT version FROM schema_migrations").fetchone()[0]
            assert version == 1
            insert_contract_rows(connection)
            assert_duplicate_movement_rejected(connection)
            movement_count = connection.execute("SELECT COUNT(*) FROM movements").fetchone()[0]
            assert movement_count == 1
            foreign_keys_enabled = connection.execute("PRAGMA foreign_keys").fetchone()[0]
            assert foreign_keys_enabled == 1
        finally:
            connection.close()

    print(json.dumps({
        "schema_migrations_version": 1,
        "source_reports": 1,
        "raw_rows": 1,
        "movements": 1,
        "duplicate_movement_hash_rejected": True,
        "temporary_sqlite_removed_on_exit": True,
    }))
    print("SQLITE_IMPORT_CONTRACT_OK")


if __name__ == "__main__":
    main()
