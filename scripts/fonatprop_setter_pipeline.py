from __future__ import annotations

import csv
import json
from html import escape
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode


ROOT = Path(__file__).resolve().parents[1]
OUTBOUND = ROOT / "outbound"
LEADS_CSV = OUTBOUND / "leads.csv"
CONFIG_PATH = OUTBOUND / "setter-config.json"
CONFIG_EXAMPLE_PATH = OUTBOUND / "setter-config.example.json"
GENERATED = OUTBOUND / "generated"


@dataclass
class Lead:
    company: str
    market: str
    country: str
    city: str
    area: str
    website: str
    linkedin: str
    instagram: str
    email: str
    whatsapp: str
    decision_maker: str
    role: str
    source_url: str
    pain_signal: str
    notes: str
    stage: str
    last_contacted: str
    language: str

    @classmethod
    def from_row(cls, row: dict[str, str]) -> "Lead":
        return cls(**{field: (row.get(field) or "").strip() for field in cls.__dataclass_fields__})


def load_config() -> dict[str, str | int]:
    path = CONFIG_PATH if CONFIG_PATH.exists() else CONFIG_EXAMPLE_PATH
    return json.loads(path.read_text(encoding="utf-8"))


def score_lead(lead: Lead) -> tuple[int, list[str]]:
    score = 0
    reasons: list[str] = []

    if lead.market.lower() in {"dubai", "france"}:
        score += 15
        reasons.append("target market")

    if lead.website:
        score += 15
        reasons.append("website")

    if lead.email:
        score += 12
        reasons.append("email")

    if lead.whatsapp:
        score += 10
        reasons.append("business whatsapp")

    if lead.linkedin or lead.instagram:
        score += 8
        reasons.append("social presence")

    role_text = f"{lead.decision_maker} {lead.role}".lower()
    if any(term in role_text for term in ["founder", "owner", "director", "directeur", "manager", "head", "ceo", "md"]):
        score += 20
        reasons.append("decision-maker")

    pain_text = f"{lead.pain_signal} {lead.notes}".lower()
    if any(term in pain_text for term in ["valuation", "estimate", "estimation", "seller", "owner", "lead", "website", "dpe", "dvf", "luxury", "premium"]):
        score += 20
        reasons.append("clear pain")

    if lead.stage in {"do_not_contact", "lost"}:
        score = 0
        reasons.append("excluded stage")

    return min(score, 100), reasons


def first_name_or_role(lead: Lead) -> str:
    generic_names = {
        "management team",
        "sales management",
        "customer care team",
    }
    if lead.decision_maker and lead.decision_maker.lower() not in generic_names:
        return lead.decision_maker.split()[0]
    return "bonjour" if lead.language == "fr" else "there"


def format_message(lead: Lead, config: dict[str, str | int]) -> str:
    name = first_name_or_role(lead)
    agency = lead.company or "your agency"
    area = lead.area or lead.city or "your market"

    if lead.market.lower() == "france":
        return (
            f"Bonjour {name}, j'ai vu que {agency} travaille sur {area}.\n\n"
            "Nous construisons FonatProp France pour aider les agences a faire des estimations plus rapides avec IA, "
            "DVF, DPE, loyers, investissement et renovation.\n\n"
            "Est-ce qu'une demo de 15 minutes cette semaine peut etre utile ?"
        )

    if lead.language == "fr":
        return (
            f"Bonjour {name}, j'ai vu que {agency} est actif a Dubai sur {area}.\n\n"
            "Nous avons construit FonatProp pour les agences immobilieres a Dubai : estimation assistee par IA, preuves de transactions verifiees et widget premium pour capturer les leads vendeurs depuis le site web.\n\n"
            "Est-ce qu'une demo Zoom de 15 minutes cette semaine peut etre utile ?"
        )

    return (
        f"Hi {name}, quick one. I saw {agency} is active in {area}.\n\n"
        "We built FonatProp for Dubai agencies: AI-assisted valuation plus a premium website widget that captures "
        "owner leads before they leave the site.\n\n"
        "The workflow uses verified Dubai transaction evidence, so brokers do not rely only on opinion.\n\n"
        "Would a 15-minute Zoom this week be useful?"
    )


def followups(lead: Lead) -> tuple[str, str]:
    if lead.market.lower() == "france" or lead.language == "fr":
        return (
            "Bonjour, je me permets une relance rapide. FonatProp aide une agence a gagner du temps sur l'estimation et a convertir les visiteurs du site en leads vendeurs plus qualifies. Utile pour vous ?",
            "Dernier message de ma part. Si l'estimation IA ou la conversion des visiteurs du site n'est pas une priorite maintenant, aucun souci. Sinon, je peux vous montrer le workflow en 15 minutes.",
        )

    return (
        "Just checking if this is relevant. The idea is simple: faster valuation for the broker, and more qualified owner leads from the agency website. Worth a quick look?",
        "Last note from me. If valuation speed or website lead capture is not a priority right now, no problem. If it is, I can show the Dubai workflow in 15 minutes.",
    )


def email_subject(lead: Lead) -> str:
    agency = lead.company or "your agency"
    if lead.market.lower() == "france":
        return f"Estimation IA pour {agency}"
    if lead.language == "fr":
        return f"Idee rapide pour les leads vendeurs de {agency}"
    return f"Quick idea for valuation leads at {agency}"


def is_free_email(email: str) -> bool:
    email = (email or "").lower().strip()
    return email.endswith(
        (
            "@gmail.com",
            "@hotmail.com",
            "@outlook.com",
            "@yahoo.com",
            "@icloud.com",
            "@live.com",
        )
    )


def email_body(lead: Lead, config: dict[str, str | int]) -> str:
    name = first_name_or_role(lead)
    agency = lead.company or "your agency"
    area = lead.area or lead.city or "your market"
    sender = str(config.get("sender_name") or "Francisco")
    sender_email = str(config.get("new_email") or "fonatprop@gmail.com")
    calendar_link = str(config.get("calendar_link") or "").strip()
    website_dubai = str(config.get("website_dubai") or "https://fonatprop.com/fonatprop")
    website_france = str(config.get("website_france") or "https://fonatprop.com/france")
    broker_demo = str(config.get("broker_demo") or "https://fonatprop.com/broker-demo")

    calendar_line = (
        f"\n\nIf easier, here is my calendar: {calendar_link}"
        if calendar_link and "PUT_" not in calendar_link
        else ""
    )

    if lead.market.lower() == "france":
        return (
            f"Bonjour {name},\n\n"
            f"J'ai vu que {agency} travaille sur {area}. Je construis FonatProp France pour les agences qui veulent gagner du temps sur l'estimation et mieux convertir les visiteurs de leur site.\n\n"
            "Le workflow utilise des signaux de marche francais comme DVF, DPE, loyers, investissement et renovation. L'objectif est de donner une estimation IA claire, avec une fourchette et des preuves, sans remplacer le jugement de l'agent.\n\n"
            f"Est-ce qu'une demo de 15 minutes cette semaine peut etre utile ?{calendar_line}\n\n"
            f"{sender}\n"
            "FonatProp\n"
            f"{website_france}"
        )

    if lead.language == "fr":
        return (
            f"Bonjour {name},\n\n"
            f"J'ai vu que {agency} est actif a Dubai sur {area}, donc je voulais partager une idee rapide.\n\n"
            "Je suis Francisco, fondateur de FonatProp. Nous construisons un workflow d'estimation IA et de capture de leads pour les agences immobilieres a Dubai.\n\n"
            "Le probleme est simple : les estimations prennent du temps, dependent beaucoup de l'opinion du broker, et beaucoup de visiteurs quittent le site avant de devenir un lead vendeur qualifie.\n\n"
            "FonatProp donne au broker une fourchette d'estimation assistee par IA, appuyee par des transactions Dubai verifiees, puis ajoute un widget premium qui capture les coordonnees du proprietaire avant d'afficher l'estimation. Le broker garde le controle de la conversation finale, mais commence avec de meilleures donnees et un lead plus chaud.\n\n"
            f"Page Dubai : {website_dubai}\n"
            f"Demo broker : {broker_demo}\n\n"
            f"Une demo Zoom de 15 minutes cette semaine peut etre utile ?{calendar_line}\n\n"
            f"{sender}\n"
            "Founder, FonatProp\n"
            f"{sender_email}"
        )

    return (
        f"Hi {name},\n\n"
        f"I saw {agency} is active in {area}, so I wanted to share a quick idea.\n\n"
        "I am Francisco, founder of FonatProp. We are building an AI valuation and lead-capture workflow for Dubai real estate agencies.\n\n"
        "The problem we are solving is simple: property valuations often take time, depend heavily on broker opinion, and many website visitors leave before becoming a qualified owner/seller lead.\n\n"
        "FonatProp gives the broker an AI-assisted valuation range backed by verified Dubai transaction evidence, then adds a premium website widget that captures the owner's contact details before the estimate is shown. The broker still controls the final conversation, but starts with better data and a warmer lead.\n\n"
        f"You can see the Dubai page here: {website_dubai}\n"
        f"And the broker demo here: {broker_demo}\n\n"
        f"Would a 15-minute Zoom this week be useful?{calendar_line}\n\n"
        f"{sender}\n"
        "Founder, FonatProp\n"
        f"{sender_email}"
    )


def main() -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    config = load_config()

    with LEADS_CSV.open("r", encoding="utf-8-sig", newline="") as file:
        leads = [Lead.from_row(row) for row in csv.DictReader(file)]

    scored_rows: list[dict[str, str | int]] = []
    message_blocks: list[str] = ["# Generated FonatProp Outreach Messages\n"]

    for lead in leads:
        score, reasons = score_lead(lead)
        priority = "high" if score >= 70 else "medium" if score >= 45 else "low"
        scored_rows.append(
            {
                **lead.__dict__,
                "score": score,
                "priority": priority,
                "score_reasons": "; ".join(reasons),
            }
        )

        if lead.stage not in {"do_not_contact", "lost"}:
            f1, f2 = followups(lead)
            message_blocks.append(
                "\n".join(
                    [
                        f"## {lead.company or 'Unnamed lead'}",
                        "",
                        f"- Market: {lead.market}",
                        f"- Priority: {priority} ({score}/100)",
                        f"- Channel: {'WhatsApp' if lead.whatsapp else 'Email' if lead.email else 'Research more'}",
                        f"- Contact: {lead.whatsapp or lead.email or lead.website or lead.source_url}",
                        "",
                        "### First Message",
                        "",
                        "```text",
                        format_message(lead, config),
                        "```",
                        "",
                        "### Follow-Up 1",
                        "",
                        "```text",
                        f1,
                        "```",
                        "",
                        "### Follow-Up 2",
                        "",
                        "```text",
                        f2,
                        "```",
                        "",
                    ]
                )
            )

    scored_path = GENERATED / "scored_leads.csv"
    with scored_path.open("w", encoding="utf-8", newline="") as file:
        fieldnames = list(scored_rows[0].keys()) if scored_rows else []
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scored_rows)

    messages_path = GENERATED / "outreach_messages.md"
    messages_path.write_text("\n".join(message_blocks), encoding="utf-8")

    first_batch = sorted(
        [
            row
            for row in scored_rows
            if row.get("email") and row.get("stage") in {"new", "researched"}
            and not is_free_email(str(row.get("email", "")))
        ],
        key=lambda row: int(row["score"]),
        reverse=True,
    )[:15]
    first_batch_path = GENERATED / "first_send_batch.csv"
    with first_batch_path.open("w", encoding="utf-8", newline="") as file:
        fieldnames = [
            "company",
            "market",
            "area",
            "email",
            "score",
            "priority",
            "source_url",
            "pain_signal",
            "notes",
        ]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in first_batch:
            writer.writerow({field: row.get(field, "") for field in fieldnames})

    leads_by_company = {lead.company: lead for lead in leads}
    day1_rows: list[dict[str, str | int]] = []
    day1_blocks: list[str] = ["# Day 1 FonatProp Email Batch\n"]
    for row in first_batch:
        lead = leads_by_company.get(str(row.get("company", "")))
        if not lead:
            continue
        body = email_body(lead, config)
        subject = email_subject(lead)
        f1, f2 = followups(lead)
        day1_rows.append(
            {
                "company": lead.company,
                "to": lead.email,
                "subject": subject,
                "body": body,
                "follow_up_1": f1,
                "follow_up_2": f2,
                "score": row.get("score", ""),
                "priority": row.get("priority", ""),
                "source_url": lead.source_url,
            }
        )
        day1_blocks.extend(
            [
                f"## {lead.company}",
                "",
                f"To: `{lead.email}`",
                f"Subject: `{subject}`",
                "",
                "```text",
                body,
                "```",
                "",
                "Follow-up 1:",
                "",
                "```text",
                f1,
                "```",
                "",
                "Follow-up 2:",
                "",
                "```text",
                f2,
                "```",
                "",
            ]
        )

    day1_csv_path = GENERATED / "day1_email_batch.csv"
    with day1_csv_path.open("w", encoding="utf-8", newline="") as file:
        fieldnames = [
            "company",
            "to",
            "subject",
            "body",
            "follow_up_1",
            "follow_up_2",
            "score",
            "priority",
            "source_url",
        ]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(day1_rows)

    day1_md_path = GENERATED / "day1_email_batch.md"
    day1_md_path.write_text("\n".join(day1_blocks), encoding="utf-8")

    gmail_links = [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8" />',
        "<title>FonatProp Day 1 Gmail Compose Links</title>",
        "<style>",
        "body{font-family:Arial,sans-serif;background:#080a0f;color:#f6f2ea;margin:40px;line-height:1.5}",
        "a{color:#9ddcff}",
        ".lead{border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:18px;margin:14px 0;background:rgba(255,255,255,.04)}",
        ".meta{color:#aeb7c8;font-size:13px}",
        "</style>",
        "</head>",
        "<body>",
        "<h1>FonatProp Day 1 Gmail Compose Links</h1>",
        "<p>Open each link, review the email, then press Send manually from fonatprop@gmail.com.</p>",
    ]
    for row in day1_rows:
        params = urlencode(
            {
                "view": "cm",
                "fs": "1",
                "to": str(row["to"]),
                "su": str(row["subject"]),
                "body": str(row["body"]),
            }
        )
        gmail_links.extend(
            [
                '<div class="lead">',
                f"<h2>{escape(str(row['company']))}</h2>",
                f"<p class=\"meta\">To: {escape(str(row['to']))}</p>",
                f"<p class=\"meta\">Subject: {escape(str(row['subject']))}</p>",
                f'<p><a href="https://mail.google.com/mail/?{params}" target="_blank" rel="noreferrer">Open Gmail draft</a></p>',
                "</div>",
            ]
        )
    gmail_links.extend(["</body>", "</html>"])
    gmail_links_path = GENERATED / "day1_gmail_compose_links.html"
    gmail_links_path.write_text("\n".join(gmail_links), encoding="utf-8")

    print(f"Scored {len(scored_rows)} leads")
    print(f"Wrote {scored_path.relative_to(ROOT)}")
    print(f"Wrote {messages_path.relative_to(ROOT)}")
    print(f"Wrote {first_batch_path.relative_to(ROOT)}")
    print(f"Wrote {day1_csv_path.relative_to(ROOT)}")
    print(f"Wrote {day1_md_path.relative_to(ROOT)}")
    print(f"Wrote {gmail_links_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
