from __future__ import annotations

import csv
import re
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SOURCE_XLSX = Path(r"C:\Users\franc\Downloads\FonatProp Dubai 50 Leads.xlsx")
OUTBOUND = ROOT / "outbound"
LEADS_CSV = OUTBOUND / "leads.csv"
GENERATED = OUTBOUND / "generated"


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


def clean(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def normalize_company(value: str) -> str:
    value = value.lower()
    value = value.replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "", value)
    for suffix in ["realestate", "properties", "property", "llc", "ltd", "dubai", "uae"]:
        value = value.replace(suffix, "")
    return value


def valid_email(value: str) -> str:
    value = clean(value)
    if not value or "verificar" in value.lower() or "verify" in value.lower():
        return ""
    match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", value, flags=re.I)
    return match.group(0) if match else ""


def normalize_phone(value: str) -> str:
    value = clean(value)
    if not value or "verificar" in value.lower() or "verify" in value.lower():
        return ""
    if value.startswith("800-"):
        return value
    digits = re.sub(r"\D+", "", value)
    if not digits:
        return ""
    if digits.startswith("971"):
        return f"+{digits}"
    if digits.startswith("0") and len(digits) >= 9:
        return f"+971{digits[1:]}"
    if len(digits) >= 8:
        return f"+{digits}"
    return value


def normalize_url(value: str) -> str:
    value = clean(value)
    if not value or "verificar" in value.lower():
        return ""
    if value.startswith("@"):
        return value
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"https://{value}"


def infer_language(value: str, first_message: str) -> str:
    text = f"{value} {first_message}".lower()
    if "bonjour" in text or "fr" in text:
        return "fr"
    return "en"


def read_existing() -> list[dict[str, str]]:
    if not LEADS_CSV.exists():
        return []
    with LEADS_CSV.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_existing(rows: list[dict[str, str]]) -> None:
    with LEADS_CSV.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows([{field: row.get(field, "") for field in FIELDS} for row in rows])


def main() -> None:
    if not SOURCE_XLSX.exists():
        raise SystemExit(f"Missing file: {SOURCE_XLSX}")

    GENERATED.mkdir(parents=True, exist_ok=True)
    df = pd.read_excel(SOURCE_XLSX, sheet_name="Leads")
    existing = read_existing()
    existing_company_keys = {normalize_company(row.get("company", "")) for row in existing}
    existing_emails = {row.get("email", "").lower() for row in existing if row.get("email")}

    imported: list[dict[str, str]] = []
    email_ready: list[dict[str, str]] = []
    whatsapp_queue: list[dict[str, str]] = []
    instagram_queue: list[dict[str, str]] = []
    skipped: list[dict[str, str]] = []

    for _, source in df.iterrows():
        company = clean(source.get("Empresa"))
        if not company:
            continue

        email = valid_email(source.get("Email"))
        key = normalize_company(company)
        duplicate_reason = ""
        if key in existing_company_keys:
            duplicate_reason = "duplicate_company"
        if email and email.lower() in existing_emails:
            duplicate_reason = "duplicate_email"

        language = infer_language(clean(source.get("Idiomas")), clean(source.get("Primer mensaje (personalizado)")))
        phone = normalize_phone(source.get("Tel / WhatsApp público"))
        instagram = clean(source.get("Instagram"))
        website = normalize_url(source.get("Web"))
        linkedin = normalize_url(source.get("LinkedIn"))
        score = clean(source.get("Score"))
        priority = clean(source.get("Prioridad"))
        first_message = clean(source.get("Primer mensaje (personalizado)"))
        follow_up_1 = clean(source.get("Follow-up 1"))
        follow_up_2 = clean(source.get("Follow-up 2"))

        row = {
            "company": company,
            "market": "dubai",
            "country": "UAE",
            "city": "Dubai",
            "area": clean(source.get("País / Zona")),
            "website": website,
            "linkedin": linkedin,
            "instagram": instagram,
            "email": email,
            "whatsapp": phone,
            "decision_maker": clean(source.get("Persona / Contacto")),
            "role": clean(source.get("Tipo de cliente")),
            "source_url": website or linkedin,
            "pain_signal": clean(source.get("Dolor probable")),
            "notes": f"Claude score {score}; {priority}. {clean(source.get('Por qué encaja'))} {clean(source.get('Riesgos / Notas'))}",
            "stage": "researched",
            "last_contacted": "",
            "language": language,
        }

        audit_row = {
            **row,
            "claude_score": score,
            "claude_priority": priority,
            "first_message": first_message,
            "follow_up_1": follow_up_1,
            "follow_up_2": follow_up_2,
            "duplicate_reason": duplicate_reason,
        }

        if duplicate_reason:
            skipped.append(audit_row)
            continue

        imported.append(row)
        existing_company_keys.add(key)
        if email:
            existing_emails.add(email.lower())
            email_ready.append(audit_row)
        if phone:
            whatsapp_queue.append(audit_row)
        if instagram:
            instagram_queue.append(audit_row)

    all_rows = existing + imported
    write_existing(all_rows)

    def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
        if not rows:
            path.write_text("", encoding="utf-8")
            return
        fieldnames = list(rows[0].keys())
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    write_csv(GENERATED / "claude_imported_email_ready.csv", email_ready)
    write_csv(GENERATED / "claude_imported_whatsapp_queue.csv", whatsapp_queue)
    write_csv(GENERATED / "claude_imported_instagram_queue.csv", instagram_queue)
    write_csv(GENERATED / "claude_import_skipped_duplicates.csv", skipped)

    print(f"Source rows: {len(df)}")
    print(f"Imported new leads: {len(imported)}")
    print(f"Email-ready new leads: {len(email_ready)}")
    print(f"WhatsApp/manual queue: {len(whatsapp_queue)}")
    print(f"Instagram/manual queue: {len(instagram_queue)}")
    print(f"Skipped duplicates: {len(skipped)}")


if __name__ == "__main__":
    main()

