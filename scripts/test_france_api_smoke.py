from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request


BASE_URL = "http://127.0.0.1:3000"

VALUATION_CASES = [
    {
        "label": "Paris 04 by postal code",
        "payload": {
            "address": "12 Rue de Rivoli, 75004 Paris, France",
            "property_type": "Appartement",
            "area_m2": 58,
            "rooms": 2,
        },
        "expected_commune": "Paris 04",
    },
    {
        "label": "Paris 08 by postal code",
        "payload": {
            "address": "44 Avenue George V, 75008 Paris, France",
            "property_type": "Appartement",
            "area_m2": 92,
            "rooms": 3,
        },
        "expected_commune": "Paris 08",
    },
    {
        "label": "Lyon 7Eme by postal code",
        "payload": {
            "address": "8 Avenue Berthelot, 69007 Lyon, France",
            "property_type": "Appartement",
            "area_m2": 71,
            "rooms": 3,
        },
        "expected_commune": "Lyon 7Eme",
    },
    {
        "label": "Marseille 1Er by postal code",
        "payload": {
            "address": "2 Rue de la Republique, 13001 Marseille, France",
            "property_type": "Appartement",
            "area_m2": 64,
            "rooms": 2,
        },
        "expected_commune": "Marseille 1Er",
    },
    {
        "label": "Nice fallback city match",
        "payload": {
            "address": "12 Boulevard de Cimiez, 06000 Nice, France",
            "property_type": "Appartement",
            "area_m2": 77,
            "rooms": 3,
        },
        "expected_commune": "Nice",
    },
]


def get_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def run_market_checks(base_url: str) -> list[str]:
    failures: list[str] = []

    market = get_json(f"{base_url}/api/france/market")
    coverage = market.get("coverage", {})
    if market.get("market") != "france":
        failures.append("market endpoint did not return market=france")
    if not coverage.get("clean_rows"):
        failures.append("market coverage.clean_rows is missing or zero")
    if coverage.get("max_year", 0) < 2025:
        failures.append(f"market coverage.max_year looks stale: {coverage.get('max_year')}")

    communes = get_json(
        f"{base_url}/api/france/communes?{urllib.parse.urlencode({'q': 'paris 08', 'property_type': 'Appartement', 'limit': 5})}"
    )
    commune_names = [row.get("commune") for row in communes.get("communes", [])]
    if "Paris 08" not in commune_names:
        failures.append(f"communes lookup did not surface Paris 08, got: {commune_names}")

    renovation = post_json(
        f"{base_url}/api/france/renovation",
        {"area_m2": 62, "tier": "mid", "categories": ["kitchen", "bathroom", "windows"]},
    )
    if renovation.get("grand_total_min_eur", 0) <= 0:
        failures.append("renovation endpoint returned a non-positive budget")

    return failures


def run_valuation_checks(base_url: str) -> list[str]:
    failures: list[str] = []

    for case in VALUATION_CASES:
        result = post_json(f"{base_url}/api/france/valuation", case["payload"])
        record = result.get("record") or {}
        matched_commune = record.get("commune") or result.get("input", {}).get("commune")
        estimate = result.get("estimated_value_eur", 0)
        low = result.get("estimated_low_eur", 0)
        high = result.get("estimated_high_eur", 0)
        strategy = result.get("match_context", {}).get("strategy")

        print(
            f"[valuation] {case['label']}: commune={matched_commune} strategy={strategy} estimate={estimate} range={low}-{high}"
        )

        if matched_commune != case["expected_commune"]:
            failures.append(
                f"{case['label']} expected {case['expected_commune']} but got {matched_commune}"
            )
        if not (low <= estimate <= high):
            failures.append(f"{case['label']} returned an invalid valuation range")
        if estimate <= 0:
            failures.append(f"{case['label']} returned a non-positive estimate")

    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke-test the local France API.")
    parser.add_argument("--base-url", default=BASE_URL, help="Server base URL, default http://127.0.0.1:3000")
    args = parser.parse_args()

    try:
        failures = []
        failures.extend(run_market_checks(args.base_url.rstrip("/")))
        failures.extend(run_valuation_checks(args.base_url.rstrip("/")))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        print(f"HTTP error {error.code}: {detail}")
        return 1
    except urllib.error.URLError as error:
        print(f"Network error: {error}")
        return 1

    if failures:
        print("\nSmoke test failures:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nFrance API smoke tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
