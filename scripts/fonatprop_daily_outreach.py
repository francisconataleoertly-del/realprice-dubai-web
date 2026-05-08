from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from fonatprop_send_emails import build_message, send_one


ROOT = Path(__file__).resolve().parents[1]
LEADS_CSV = ROOT / "outbound" / "leads.csv"
GENERATED = ROOT / "outbound" / "generated"
DAY_BATCH = GENERATED / "day1_email_batch.csv"
SEND_LOG = GENERATED / "email_send_log.csv"
RUN_LOG = GENERATED / "daily_outreach_run_log.csv"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows([{field: row.get(field, "") for field in fieldnames} for row in rows])


def append_csv(path: Path, row: dict[str, str], fieldnames: list[str]) -> None:
    exists = path.exists()
    with path.open("a", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        if not exists:
            writer.writeheader()
        writer.writerow({field: row.get(field, "") for field in fieldnames})


def regenerate_batch() -> None:
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "fonatprop_setter_pipeline.py")],
        cwd=str(ROOT),
        check=True,
    )


def sync_contacted_from_log(default_date: str) -> None:
    leads = read_csv(LEADS_CSV)
    sent = {row.get("to", "").lower(): row for row in read_csv(SEND_LOG) if row.get("to")}
    changed = False
    for lead in leads:
        email = lead.get("email", "").lower()
        if email and email in sent:
            if lead.get("stage") != "contacted":
                lead["stage"] = "contacted"
                changed = True
            if not lead.get("last_contacted"):
                lead["last_contacted"] = default_date
                changed = True
    if changed and leads:
        write_csv(LEADS_CSV, leads, list(leads[0].keys()))


def main() -> None:
    parser = argparse.ArgumentParser(description="Daily safe FonatProp outreach sender.")
    parser.add_argument("--limit", type=int, default=15)
    parser.add_argument("--delay", type=int, default=90)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    app_password = os.environ.get("FONATPROP_GMAIL_APP_PASSWORD", "")
    if not app_password and not args.dry_run:
        raise SystemExit("Missing FONATPROP_GMAIL_APP_PASSWORD.")

    today = datetime.now().strftime("%Y-%m-%d")
    GENERATED.mkdir(parents=True, exist_ok=True)

    sync_contacted_from_log(today)
    regenerate_batch()
    rows = read_csv(DAY_BATCH)
    already_sent = {row.get("to", "").lower() for row in read_csv(SEND_LOG) if row.get("to")}
    candidates = [row for row in rows if row.get("to", "").lower() not in already_sent]
    batch = candidates[: max(0, args.limit)]

    if args.dry_run:
        print(f"DRY RUN: {len(batch)} candidates")
        for row in batch:
            print(f"- {row['company']} <{row['to']}>")
        return

    sent_count = 0
    for index, row in enumerate(batch, start=1):
        send_one(row, app_password)
        sent_count += 1
        print(f"Sent {index}/{len(batch)}: {row['company']} <{row['to']}>", flush=True)
        if index < len(batch):
            time.sleep(args.delay)

    sync_contacted_from_log(today)
    regenerate_batch()
    append_csv(
        RUN_LOG,
        {
            "run_at": datetime.now().isoformat(),
            "sent_count": str(sent_count),
            "limit": str(args.limit),
            "delay": str(args.delay),
        },
        ["run_at", "sent_count", "limit", "delay"],
    )


if __name__ == "__main__":
    main()

