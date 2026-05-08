from __future__ import annotations

import argparse
import csv
import os
import smtplib
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DAY1_BATCH = ROOT / "outbound" / "generated" / "day1_email_batch.csv"
SEND_LOG = ROOT / "outbound" / "generated" / "email_send_log.csv"
FROM_EMAIL = "fonatprop@gmail.com"


def load_rows(limit: int | None, offset: int = 0) -> list[dict[str, str]]:
    with DAY1_BATCH.open("r", encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))
    rows = rows[offset:]
    return rows[:limit] if limit else rows


def build_message(row: dict[str, str]) -> EmailMessage:
    message = EmailMessage()
    message["From"] = FROM_EMAIL
    message["To"] = row["to"]
    message["Subject"] = row["subject"]
    message.set_content(row["body"])
    return message


def append_send_log(row: dict[str, str]) -> None:
    exists = SEND_LOG.exists()
    with SEND_LOG.open("a", encoding="utf-8", newline="") as file:
        fieldnames = ["sent_at", "company", "to", "subject"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        if not exists:
            writer.writeheader()
        writer.writerow(
            {
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "company": row["company"],
                "to": row["to"],
                "subject": row["subject"],
            }
        )


def send_one(row: dict[str, str], app_password: str) -> None:
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=45) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(FROM_EMAIL, app_password)
        smtp.send_message(build_message(row))


def main() -> None:
    parser = argparse.ArgumentParser(description="Send FonatProp day 1 outreach emails.")
    parser.add_argument("--send", action="store_true", help="Actually send emails. Without this, dry-run only.")
    parser.add_argument("--limit", type=int, default=1, help="How many emails to process.")
    parser.add_argument("--offset", type=int, default=0, help="How many rows to skip from the batch.")
    parser.add_argument("--delay", type=int, default=90, help="Delay in seconds between real sends.")
    args = parser.parse_args()

    rows = load_rows(args.limit, args.offset)
    if not rows:
        raise SystemExit("No rows found. Run scripts/fonatprop_setter_pipeline.py first.")

    if not args.send:
        print("DRY RUN. Nothing will be sent.")
        for row in rows:
            print(f"- {row['company']} <{row['to']}> | {row['subject']}")
        print("\nTo send for real, set FONATPROP_GMAIL_APP_PASSWORD and rerun with --send.")
        return

    app_password = os.environ.get("FONATPROP_GMAIL_APP_PASSWORD")
    if not app_password:
        raise SystemExit("Missing FONATPROP_GMAIL_APP_PASSWORD environment variable.")

    for index, row in enumerate(rows, start=1):
        send_one(row, app_password)
        append_send_log(row)
        print(f"Sent {index}/{len(rows)}: {row['company']} <{row['to']}>", flush=True)
        if index < len(rows):
            time.sleep(args.delay)


if __name__ == "__main__":
    main()
