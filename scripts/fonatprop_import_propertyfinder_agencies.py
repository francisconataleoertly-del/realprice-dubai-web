from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "outbound" / "generated"
LEADS_CSV = ROOT / "outbound" / "leads.csv"
PF_QUALIFIED = GENERATED / "propertyfinder_agencies_qualified.csv"
OUTPUT_QUEUE = GENERATED / "propertyfinder_next_email_queue.csv"

FIELDS = [
    "company",
    "market",
    "country",
    "city",
    "area",
    "website",
    "linkedin",
    "instagram",
    "email",
    "whatsapp",
    "decision_maker",
    "role",
    "source_url",
    "pain_signal",
    "notes",
    "stage",
    "last_contacted",
    "language",
]


def normalize_company(value: str) -> str:
    value = (value or "").lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "", value)
    for suffix in ["realestatebrokersllc", "realestatellc", "realestate", "properties", "property", "brokers", "broker", "llc", "ltd", "dubai", "uae"]:
        value = value.replace(suffix, "")
    return value


def first_email(value: str) -> str:
    value = value or ""
    for part in value.split(";"):
        part = part.strip()
        if re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", part):
            return part
    return ""


def first_phone(value: str) -> str:
    value = value or ""
    for part in value.split(";"):
        part = part.strip()
        if part.startswith("+9715"):
            return part
    return ""


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


def main() -> None:
    existing = read_csv(LEADS_CSV)
    pf_rows = read_csv(PF_QUALIFIED)

    existing_keys = {normalize_company(row.get("company", "")) for row in existing}
    existing_emails = {row.get("email", "").lower() for row in existing if row.get("email")}

    imported: list[dict[str, str]] = []
    email_queue: list[dict[str, str]] = []
    skipped = 0

    for row in pf_rows:
        company = row.get("agency_name", "").strip()
        if not company:
            continue
        key = normalize_company(company)
        email = first_email(row.get("agent_email_samples", ""))
        phone = first_phone(row.get("mobile_whatsapp_samples", ""))
        if key in existing_keys or (email and email.lower() in existing_emails):
            skipped += 1
            continue

        lead = {
            "company": company,
            "market": "dubai",
            "country": "UAE",
            "city": "Dubai",
            "area": row.get("areas", "") or row.get("agency_location", "Dubai"),
            "website": "",
            "linkedin": "",
            "instagram": "",
            "email": email,
            "whatsapp": phone,
            "decision_maker": "Broker team",
            "role": "Property Finder active brokerage",
            "source_url": row.get("public_profile_hint", ""),
            "pain_signal": row.get("pain_signal", "active listings, valuation consistency, seller lead capture"),
            "notes": (
                f"Property Finder harvest. Agents seen: {row.get('agents_seen')}. "
                f"Active properties proxy: {row.get('active_properties_proxy')}. "
                f"Languages: {row.get('languages')}. Recommended channel: {row.get('recommended_channel')}."
            ),
            "stage": "researched",
            "last_contacted": "",
            "language": "en",
        }
        imported.append(lead)
        existing_keys.add(key)
        if email:
            existing_emails.add(email.lower())
            email_queue.append(
                {
                    **lead,
                    "lead_score": row.get("lead_score", ""),
                    "priority": row.get("priority", ""),
                    "active_properties_proxy": row.get("active_properties_proxy", ""),
                    "agents_seen": row.get("agents_seen", ""),
                    "agent_email_samples": row.get("agent_email_samples", ""),
                    "mobile_whatsapp_samples": row.get("mobile_whatsapp_samples", ""),
                }
            )

    write_csv(LEADS_CSV, existing + imported, FIELDS)
    write_csv(
        OUTPUT_QUEUE,
        sorted(email_queue, key=lambda r: int(r.get("lead_score") or 0), reverse=True),
        FIELDS
        + [
            "lead_score",
            "priority",
            "active_properties_proxy",
            "agents_seen",
            "agent_email_samples",
            "mobile_whatsapp_samples",
        ],
    )

    print(f"Property Finder qualified rows: {len(pf_rows)}")
    print(f"Imported new agencies: {len(imported)}")
    print(f"Email-ready queue: {len(email_queue)}")
    print(f"Skipped duplicates: {skipped}")
    print(f"Wrote {OUTPUT_QUEUE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

