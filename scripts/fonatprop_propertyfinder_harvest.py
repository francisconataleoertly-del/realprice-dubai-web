from __future__ import annotations

import argparse
import csv
import json
import random
import re
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "outbound" / "generated"

BASE_URL = "https://www.propertyfinder.ae/en/find-agent/search?page={page}"
PUBLIC_BASE = "https://www.propertyfinder.ae"


@dataclass
class AgentRow:
    source: str
    page: int
    agent_id: str
    agent_name: str
    agent_email: str
    agent_phone: str
    agent_whatsapp: str
    agent_profile_url: str
    agency_id: str
    agency_name: str
    agency_slug: str
    agency_address: str
    agency_location: str
    languages: str
    top_locations: str
    total_properties: int
    sale_properties: int
    rent_properties: int
    commercial_properties: int
    superagent: bool
    verified: bool
    experience_since: str
    average_rating: str
    review_count: str
    median_listing_quality: str


def clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def mobile_only(phone: str) -> str:
    phone = clean(phone)
    digits = re.sub(r"\D+", "", phone)
    if digits.startswith("9715") and len(digits) >= 11:
        return f"+{digits}"
    return ""


def profile_url(agent: dict[str, Any]) -> str:
    slug = clean(agent.get("slug"))
    agent_id = clean(agent.get("id"))
    if slug and agent_id:
        return f"{PUBLIC_BASE}/en/agent/{slug}-{agent_id}"
    return ""


def names(items: list[dict[str, Any]] | None) -> str:
    if not items:
        return ""
    output: list[str] = []
    for item in items:
        value = item.get("name") or item.get("title") or item.get("slug") or ""
        value = clean(value)
        if value:
            output.append(value)
    return "; ".join(dict.fromkeys(output))


def top_locations(agent: dict[str, Any]) -> str:
    locations = agent.get("topLocations") or []
    values: list[str] = []
    for location in locations:
        if isinstance(location, dict):
            values.append(clean(location.get("name") or location.get("title") or location.get("path")))
        else:
            values.append(clean(location))
    return "; ".join([value for value in dict.fromkeys(values) if value])


def parse_agents(html: str, page: int) -> list[AgentRow]:
    soup = BeautifulSoup(html, "lxml")
    script = soup.find("script", id="__NEXT_DATA__")
    if not script or not script.string:
        raise ValueError("Missing __NEXT_DATA__ JSON")

    data = json.loads(script.string)
    agents = data["props"]["pageProps"]["agents"]["data"]
    rows: list[AgentRow] = []

    for agent in agents:
        broker = agent.get("broker") or {}
        sale = int(agent.get("propertiesResidentialForSaleCount") or 0)
        rent = int(agent.get("propertiesResidentialForRentCount") or 0)
        commercial = int(agent.get("propertiesCommercialForSaleCount") or 0) + int(
            agent.get("propertiesCommercialForRentCount") or 0
        )
        rows.append(
            AgentRow(
                source="propertyfinder",
                page=page,
                agent_id=clean(agent.get("id")),
                agent_name=clean(agent.get("name")),
                agent_email=clean(agent.get("email")),
                agent_phone=mobile_only(clean(agent.get("phone"))),
                agent_whatsapp=mobile_only(clean(agent.get("whatsappPhone"))),
                agent_profile_url=profile_url(agent),
                agency_id=clean(broker.get("id")),
                agency_name=clean(broker.get("name")),
                agency_slug=clean(broker.get("slug")),
                agency_address=clean(broker.get("address")),
                agency_location=clean(broker.get("location")),
                languages=names(agent.get("languages")),
                top_locations=top_locations(agent),
                total_properties=int(agent.get("totalProperties") or 0),
                sale_properties=sale,
                rent_properties=rent,
                commercial_properties=commercial,
                superagent=bool(agent.get("superagent")),
                verified=bool(agent.get("verified")),
                experience_since=clean(agent.get("experienceSince")),
                average_rating=clean(agent.get("averageRating")),
                review_count=clean(agent.get("reviewCount")),
                median_listing_quality=clean(agent.get("medianListingQuality")),
            )
        )

    return rows


def fetch_page(session: requests.Session, page: int) -> str:
    url = BASE_URL.format(page=page)
    response = session.get(url, timeout=35)
    response.raise_for_status()
    return response.text


def aggregate_agencies(rows: list[AgentRow]) -> list[dict[str, Any]]:
    grouped: dict[str, list[AgentRow]] = defaultdict(list)
    for row in rows:
        key = row.agency_id or row.agency_name.lower()
        grouped[key].append(row)

    agencies: list[dict[str, Any]] = []
    for agency_rows in grouped.values():
        first = agency_rows[0]
        phones = [row.agent_whatsapp or row.agent_phone for row in agency_rows if row.agent_whatsapp or row.agent_phone]
        emails = [row.agent_email for row in agency_rows if row.agent_email]
        languages = sorted(
            {
                language.strip()
                for row in agency_rows
                for language in row.languages.split(";")
                if language.strip()
            }
        )
        locations = sorted(
            {
                location.strip()
                for row in agency_rows
                for location in row.top_locations.split(";")
                if location.strip()
            }
        )
        total_properties = sum(row.total_properties for row in agency_rows)
        sale_properties = sum(row.sale_properties for row in agency_rows)
        rent_properties = sum(row.rent_properties for row in agency_rows)
        commercial_properties = sum(row.commercial_properties for row in agency_rows)
        verified_agents = sum(1 for row in agency_rows if row.verified)
        superagents = sum(1 for row in agency_rows if row.superagent)
        lead_score = min(
            100,
            25
            + min(total_properties, 250)
            // 5
            + min(len(agency_rows), 25)
            + (10 if phones else 0)
            + (8 if emails else 0)
            + (7 if superagents else 0),
        )

        agencies.append(
            {
                "source": "propertyfinder",
                "agency_id": first.agency_id,
                "agency_name": first.agency_name,
                "agency_slug": first.agency_slug,
                "agency_address": first.agency_address,
                "agency_location": first.agency_location,
                "public_profile_hint": f"{PUBLIC_BASE}/en/broker/{first.agency_slug}" if first.agency_slug else "",
                "agents_seen": len(agency_rows),
                "verified_agents": verified_agents,
                "superagents_seen": superagents,
                "active_properties_proxy": total_properties,
                "sale_properties_proxy": sale_properties,
                "rent_properties_proxy": rent_properties,
                "commercial_properties_proxy": commercial_properties,
                "languages": "; ".join(languages[:12]),
                "areas": "; ".join(locations[:14]),
                "mobile_whatsapp_samples": "; ".join(dict.fromkeys(phones[:8])),
                "agent_email_samples": "; ".join(dict.fromkeys(emails[:8])),
                "lead_score": lead_score,
                "priority": "high" if lead_score >= 75 else "medium" if lead_score >= 55 else "low",
                "pain_signal": "active listings, broker valuation consistency, seller lead capture",
                "recommended_channel": "email + manual WhatsApp" if emails and phones else "manual WhatsApp" if phones else "research website",
            }
        )

    return sorted(agencies, key=lambda row: int(row["lead_score"]), reverse=True)


def write_csv(path: Path, rows: list[dict[str, Any] | AgentRow]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    first = rows[0]
    if isinstance(first, AgentRow):
        fieldnames = list(first.__dataclass_fields__.keys())
        dict_rows = [row.__dict__ for row in rows]  # type: ignore[union-attr]
    else:
        fieldnames = list(first.keys())  # type: ignore[union-attr]
        dict_rows = rows  # type: ignore[assignment]

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dict_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Respectful Property Finder public agent directory harvester.")
    parser.add_argument("--max-pages", type=int, default=5)
    parser.add_argument("--start-page", type=int, default=1)
    parser.add_argument("--delay-min", type=float, default=2.0)
    parser.add_argument("--delay-max", type=float, default=5.0)
    parser.add_argument("--min-agency-listings", type=int, default=20)
    args = parser.parse_args()

    GENERATED.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "FonatPropResearchBot/1.0 (+https://fonatprop.com; respectful public directory research)",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )

    rows: list[AgentRow] = []
    for page in range(args.start_page, args.start_page + args.max_pages):
        html = fetch_page(session, page)
        page_rows = parse_agents(html, page)
        rows.extend(page_rows)
        print(f"page {page}: {len(page_rows)} agents, total {len(rows)}", flush=True)
        if page < args.start_page + args.max_pages - 1:
            time.sleep(random.uniform(args.delay_min, args.delay_max))

    agencies = aggregate_agencies(rows)
    qualified = [
        row
        for row in agencies
        if int(row["active_properties_proxy"]) >= args.min_agency_listings
    ]

    raw_path = GENERATED / "propertyfinder_agents_raw.csv"
    agencies_path = GENERATED / "propertyfinder_agencies.csv"
    qualified_path = GENERATED / "propertyfinder_agencies_qualified.csv"
    write_csv(raw_path, rows)
    write_csv(agencies_path, agencies)
    write_csv(qualified_path, qualified)

    print(f"Wrote {raw_path.relative_to(ROOT)}")
    print(f"Wrote {agencies_path.relative_to(ROOT)}")
    print(f"Wrote {qualified_path.relative_to(ROOT)}")
    print(f"Agencies: {len(agencies)}")
    print(f"Qualified agencies >= {args.min_agency_listings} listings: {len(qualified)}")


if __name__ == "__main__":
    main()

