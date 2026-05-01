from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "catalog" / "fonatprop_source_registry.json"
SUMMARY_PATH = ROOT / "data" / "catalog" / "fonatprop_source_registry_summary.json"

SOURCE_SECTIONS = ("investment_sources", "renovation_sources")
REQUIRED_SOURCE_FIELDS = (
    "id",
    "market",
    "domain",
    "source_type",
    "priority",
    "name",
    "publisher",
    "url",
    "coverage",
    "refresh",
    "ingestion_method",
    "use_for",
    "legal_notes",
    "status",
)


def load_registry() -> dict:
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def collect_sources(registry: dict) -> list[dict]:
    sources: list[dict] = []
    for section in SOURCE_SECTIONS:
        for source in registry.get(section, []):
            enriched = dict(source)
            enriched["section"] = section
            sources.append(enriched)
    return sources


def validate_sources(sources: list[dict]) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()

    for source in sources:
        source_id = source.get("id", "<missing-id>")
        if source_id in seen_ids:
            errors.append(f"Duplicate source id: {source_id}")
        seen_ids.add(source_id)

        for field in REQUIRED_SOURCE_FIELDS:
            if field not in source or source[field] in ("", None, []):
                errors.append(f"{source_id}: missing required field '{field}'")

        url = str(source.get("url", ""))
        if url and not validate_url(url):
            errors.append(f"{source_id}: invalid url '{url}'")

        priority = source.get("priority")
        if not isinstance(priority, int) or priority < 1:
            errors.append(f"{source_id}: priority must be a positive integer")

        use_for = source.get("use_for", [])
        if not isinstance(use_for, list):
            errors.append(f"{source_id}: use_for must be a list")

    return errors


def summarize(registry: dict, sources: list[dict]) -> dict:
    by_market = Counter(source["market"] for source in sources)
    by_domain = Counter(source["domain"] for source in sources)
    by_type = Counter(source["source_type"] for source in sources)
    by_status = Counter(source["status"] for source in sources)
    by_ingestion = Counter(source["ingestion_method"] for source in sources)

    high_priority: dict[str, list[str]] = defaultdict(list)
    for source in sources:
        if source["priority"] == 1:
            high_priority[source["market"]].append(source["id"])

    taxonomy = registry.get("material_taxonomy", [])
    taxonomy_counts = {
        item["room"]: len(item.get("components", []))
        for item in taxonomy
        if "room" in item
    }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "registry_version": registry.get("registry_version"),
        "source_count": len(sources),
        "investment_source_count": len(registry.get("investment_sources", [])),
        "renovation_source_count": len(registry.get("renovation_sources", [])),
        "target_table_count": len(registry.get("target_tables", [])),
        "material_taxonomy_room_count": len(taxonomy),
        "material_taxonomy_component_count": sum(taxonomy_counts.values()),
        "counts": {
            "by_market": dict(sorted(by_market.items())),
            "by_domain": dict(sorted(by_domain.items())),
            "by_source_type": dict(sorted(by_type.items())),
            "by_status": dict(sorted(by_status.items())),
            "by_ingestion_method": dict(sorted(by_ingestion.items())),
        },
        "high_priority_sources": {
            market: sorted(ids)
            for market, ids in sorted(high_priority.items())
        },
        "taxonomy_component_counts": dict(sorted(taxonomy_counts.items())),
        "next_ingestion_steps": registry.get("next_ingestion_steps", []),
    }


def main() -> int:
    registry = load_registry()
    sources = collect_sources(registry)
    errors = validate_sources(sources)

    if errors:
        print("Source registry validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    summary = summarize(registry, sources)
    with SUMMARY_PATH.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=True)
        handle.write("\n")

    print(f"Validated {summary['source_count']} sources")
    print(f"Investment sources: {summary['investment_source_count']}")
    print(f"Renovation sources: {summary['renovation_source_count']}")
    print(f"Material taxonomy components: {summary['material_taxonomy_component_count']}")
    print(f"Wrote {SUMMARY_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
