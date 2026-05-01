from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


APP_ROOT = Path(__file__).resolve().parents[1]
DATA_LAKE_ROOT = APP_ROOT.parent.parent
REGISTRY_PATH = APP_ROOT / "data" / "catalog" / "fonatprop_source_registry.json"
MANIFEST_PATH = APP_ROOT / "data" / "catalog" / "fonatprop_official_ingestion_manifest.json"
SUMMARY_PATH = APP_ROOT / "data" / "catalog" / "fonatprop_official_ingestion_summary.json"
OUTPUT_ROOT = DATA_LAKE_ROOT / "90_processed" / "fonatprop_official_ingest"
SAMPLES_DIR = OUTPUT_ROOT / "samples"
METADATA_DIR = OUTPUT_ROOT / "metadata"

USER_AGENT = (
    "FonatPropOfficialIngest/2026.05 "
    "(research smoke test; contact=fonatprop.com)"
)

DATA_GOUV_DATASETS = {
    "fr-dvf-official": "demandes-de-valeurs-foncieres",
    "fr-ademe-renovation-isolation-costs": "couts-des-travaux-de-renovation-isolation",
    "fr-sitadel-housing-starts": (
        "logements-autorises-et-commences-nombre-et-surfaces-series-annuelles"
    ),
    "fr-lovac-vacant-housing": (
        "logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region"
    ),
    "fr-fiscalite-locale-particuliers": "fiscalite-locale-des-particuliers-geo",
    "fr-dmtg-assiette-droits-mutation": "assiette-des-droits-de-mutation-immobiliers",
    "fr-encadrement-loyers": "logement-encadrement-des-loyers",
    "fr-zones-tendues": "simulateur-des-zones-tendues",
}

PAGE_SNAPSHOT_SOURCES = {
    "fr-ademe-dpe-api",
    "fr-banque-france-housing-loans",
    "fr-banque-france-taux-usure",
    "fr-insee-ipea",
    "fr-insee-cpi",
    "fr-insee-bt-construction-indices",
    "fr-insee-tourism-occupancy",
    "fr-service-public-notary-fees",
    "fr-notaires-valeur-verte",
    "ae-cbuae-eibor-rates",
    "ae-det-tourism-performance",
    "ae-dld-legislation-fees",
    "ae-mollak-service-charge-index",
    "ae-dld-rental-index",
    "ae-dubai-cpi",
    "ae-dsc-average-construction-material-prices",
}

DUBAI_PULSE_SOURCES = {
    "ae-dld-real-estate-data-current",
    "ae-dld-service-charges-open",
    "ae-dld-units-open",
    "ae-dld-projects-buildings-open",
    "ae-dubai-pulse-dld-transactions-api",
    "ae-dubai-pulse-dld-transactions-csv",
    "ae-dubai-pulse-ejari-rent-contracts-api",
    "ae-dubai-pulse-ejari-rent-contracts-csv",
}

LOCAL_INVENTORY_PATTERNS = {
    "france_dvf_zip_files": DATA_LAKE_ROOT / "02_france" / "valeursfoncieres-*.txt.zip",
    "france_dvf_csv_files": DATA_LAKE_ROOT / "02_france" / "dvf*.csv*",
    "france_quarterly_price_files": DATA_LAKE_ROOT / "02_france" / "fichier-t*.csv",
    "france_rnc_files": DATA_LAKE_ROOT / "02_france" / "*rnc*.csv",
    "dubai_government_csv_files": DATA_LAKE_ROOT / "01_dubai" / "data_dubai_government" / "*.csv",
    "processed_france_dvf_parquet": DATA_LAKE_ROOT
    / "90_processed"
    / "france_dvf_residential_parquet"
    / "**"
    / "*.parquet",
}


@dataclass(frozen=True)
class DownloadResult:
    status: str
    url: str
    http_status: int | None = None
    content_type: str | None = None
    content_length: int | None = None
    bytes_written: int = 0
    sample_path: str | None = None
    sha256: str | None = None
    error: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Discover and smoke-ingest official FonatProp investment/renovation sources."
        )
    )
    parser.add_argument(
        "--mode",
        choices=("smoke", "full"),
        default="smoke",
        help="smoke stores metadata and small samples; full allows larger downloads.",
    )
    parser.add_argument(
        "--max-bytes",
        type=int,
        default=5 * 1024 * 1024,
        help="Maximum bytes to store per resource in smoke mode.",
    )
    parser.add_argument(
        "--source",
        action="append",
        default=[],
        help="Optional source id filter. Can be supplied multiple times.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="HTTP timeout in seconds.",
    )
    parser.add_argument(
        "--official-only",
        action="store_true",
        default=True,
        help="Keep ingestion limited to official/high-authority sources.",
    )
    return parser.parse_args()


def load_registry() -> dict[str, Any]:
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def collect_sources(registry: dict[str, Any]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    for section in ("investment_sources", "renovation_sources"):
        for source in registry.get(section, []):
            item = dict(source)
            item["section"] = section
            sources.append(item)
    return sources


def is_official_source(source: dict[str, Any]) -> bool:
    source_type = str(source.get("source_type", ""))
    publisher = str(source.get("publisher", "")).lower()
    ingestion_method = str(source.get("ingestion_method", ""))
    official_markers = (
        "official",
        "government",
        "data.gouv",
        "ademe",
        "insee",
        "banque de france",
        "dubai land department",
        "dubai statistics",
        "central bank",
        "dld",
        "dsc",
    )
    return (
        source.get("id") in DATA_GOUV_DATASETS
        or source.get("id") in PAGE_SNAPSHOT_SOURCES
        or source.get("id") in DUBAI_PULSE_SOURCES
        or source_type.startswith("official")
        or "api" in ingestion_method
        or any(marker in publisher for marker in official_markers)
    )


def source_selected(source: dict[str, Any], filters: set[str], official_only: bool) -> bool:
    if filters and source.get("id") not in filters:
        return False
    if official_only and not is_official_source(source):
        return False
    always_try = set(DATA_GOUV_DATASETS) | PAGE_SNAPSHOT_SOURCES | DUBAI_PULSE_SOURCES
    return source.get("priority", 999) <= 2 or source.get("id") in always_try


def request_url(url: str, timeout: int) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        return response.read()


def open_url(url: str, timeout: int):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    return urlopen(request, timeout=timeout)


def data_gouv_api_url(slug: str) -> str:
    return f"https://www.data.gouv.fr/api/1/datasets/{slug}/"


def safe_filename(value: str, limit: int = 90) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    cleaned = cleaned.strip("._")
    return (cleaned[:limit] or "resource").lower()


def extension_from_url(url: str, fallback: str = "bin") -> str:
    path = urlparse(url).path
    suffix = Path(path).suffix.lower().lstrip(".")
    if suffix in {"csv", "json", "geojson", "xlsx", "xls", "zip", "txt", "pdf", "html"}:
        return suffix
    return fallback


def relative(path: Path) -> str:
    try:
        return str(path.relative_to(DATA_LAKE_ROOT))
    except ValueError:
        try:
            return str(path.relative_to(APP_ROOT))
        except ValueError:
            return str(path)


def write_bytes_sample(
    *,
    content: bytes,
    source_id: str,
    resource_name: str,
    resource_url: str,
    max_bytes: int,
    mode: str,
) -> DownloadResult:
    size = len(content)
    if mode == "smoke" and size > max_bytes:
        digest = hashlib.sha256(content[:max_bytes]).hexdigest()
        return DownloadResult(
            status="skipped_large_after_fetch",
            url=resource_url,
            content_length=size,
            bytes_written=0,
            sha256=digest,
            error=f"Fetched payload has {size} bytes, above smoke max {max_bytes}.",
        )

    ext = extension_from_url(resource_url)
    filename = f"{safe_filename(source_id)}__{safe_filename(resource_name)}.{ext}"
    target = SAMPLES_DIR / filename
    target.write_bytes(content)
    digest = hashlib.sha256(content).hexdigest()
    return DownloadResult(
        status="sampled",
        url=resource_url,
        content_length=size,
        bytes_written=size,
        sample_path=relative(target),
        sha256=digest,
    )


def download_small_resource(
    *,
    source_id: str,
    resource_name: str,
    resource_url: str,
    max_bytes: int,
    mode: str,
    timeout: int,
) -> DownloadResult:
    try:
        with open_url(resource_url, timeout=timeout) as response:
            headers = response.headers
            content_type = headers.get("Content-Type")
            content_length = headers.get("Content-Length")
            declared_length = int(content_length) if content_length and content_length.isdigit() else None
            if mode == "smoke" and declared_length and declared_length > max_bytes:
                return DownloadResult(
                    status="skipped_large_declared",
                    url=resource_url,
                    http_status=getattr(response, "status", None),
                    content_type=content_type,
                    content_length=declared_length,
                    error=f"Declared payload {declared_length} bytes exceeds {max_bytes}.",
                )

            limit = max_bytes + 1 if mode == "smoke" else None
            content = response.read(limit)
            if mode == "smoke" and len(content) > max_bytes:
                digest = hashlib.sha256(content[:max_bytes]).hexdigest()
                return DownloadResult(
                    status="skipped_large_stream",
                    url=resource_url,
                    http_status=getattr(response, "status", None),
                    content_type=content_type,
                    content_length=declared_length,
                    sha256=digest,
                    error=f"Stream exceeded smoke max {max_bytes} bytes.",
                )

            result = write_bytes_sample(
                content=content,
                source_id=source_id,
                resource_name=resource_name,
                resource_url=resource_url,
                max_bytes=max_bytes,
                mode=mode,
            )
            return DownloadResult(
                status=result.status,
                url=result.url,
                http_status=getattr(response, "status", None),
                content_type=content_type,
                content_length=result.content_length or declared_length,
                bytes_written=result.bytes_written,
                sample_path=result.sample_path,
                sha256=result.sha256,
                error=result.error,
            )
    except HTTPError as error:
        return DownloadResult(
            status="http_error",
            url=resource_url,
            http_status=error.code,
            error=str(error),
        )
    except (TimeoutError, URLError, OSError) as error:
        return DownloadResult(
            status="network_error",
            url=resource_url,
            error=str(error),
        )


def discover_data_gouv_dataset(
    source: dict[str, Any],
    slug: str,
    *,
    max_bytes: int,
    mode: str,
    timeout: int,
) -> dict[str, Any]:
    source_id = source["id"]
    api_url = data_gouv_api_url(slug)
    result: dict[str, Any] = {
        "source_id": source_id,
        "market": source.get("market"),
        "domain": source.get("domain"),
        "source_name": source.get("name"),
        "publisher": source.get("publisher"),
        "status": "pending",
        "strategy": "data_gouv_dataset_api",
        "dataset_slug": slug,
        "api_url": api_url,
        "source_url": source.get("url"),
        "resources": [],
    }
    try:
        payload = request_url(api_url, timeout=timeout)
        dataset = json.loads(payload.decode("utf-8"))
    except HTTPError as error:
        result.update({"status": "http_error", "error": str(error), "http_status": error.code})
        return result
    except (json.JSONDecodeError, UnicodeDecodeError, TimeoutError, URLError, OSError) as error:
        result.update({"status": "network_or_parse_error", "error": str(error)})
        return result

    metadata_path = METADATA_DIR / f"{safe_filename(source_id)}__data_gouv_metadata.json"
    metadata_path.write_bytes(json.dumps(dataset, ensure_ascii=True, indent=2).encode("utf-8"))

    resources = dataset.get("resources", [])
    sampled = 0
    skipped = 0
    failed = 0
    for index, resource in enumerate(resources):
        resource_url = resource.get("url")
        resource_name = resource.get("title") or resource.get("name") or f"resource_{index + 1}"
        resource_record = {
            "id": resource.get("id"),
            "title": resource_name,
            "format": resource.get("format"),
            "url": resource_url,
            "latest": resource.get("latest"),
            "filesize": resource.get("filesize") or resource.get("filetype"),
            "mime": resource.get("mime"),
            "created_at": resource.get("created_at"),
            "last_modified": resource.get("last_modified"),
            "checksum": resource.get("checksum"),
            "download": None,
        }
        declared_size = resource.get("filesize")
        if isinstance(declared_size, str) and declared_size.isdigit():
            declared_size = int(declared_size)

        if not resource_url:
            resource_record["download"] = {"status": "skipped_no_url"}
            skipped += 1
        elif mode == "smoke" and isinstance(declared_size, int) and declared_size > max_bytes:
            resource_record["download"] = {
                "status": "skipped_large_metadata",
                "declared_bytes": declared_size,
                "max_bytes": max_bytes,
            }
            skipped += 1
        else:
            download = download_small_resource(
                source_id=source_id,
                resource_name=f"{index + 1}_{resource_name}",
                resource_url=resource_url,
                max_bytes=max_bytes,
                mode=mode,
                timeout=timeout,
            )
            resource_record["download"] = download.__dict__
            if download.status == "sampled":
                sampled += 1
            elif download.status.startswith("skipped"):
                skipped += 1
            else:
                failed += 1

        result["resources"].append(resource_record)

    result.update(
        {
            "status": "ok",
            "dataset_title": dataset.get("title"),
            "dataset_id": dataset.get("id"),
            "dataset_page": dataset.get("page"),
            "last_modified": dataset.get("last_modified"),
            "metadata_path": relative(metadata_path),
            "resource_count": len(resources),
            "sampled_resource_count": sampled,
            "skipped_resource_count": skipped,
            "failed_resource_count": failed,
        }
    )
    return result


def snapshot_page(
    source: dict[str, Any],
    *,
    max_bytes: int,
    mode: str,
    timeout: int,
) -> dict[str, Any]:
    source_id = source["id"]
    url = source.get("url")
    result: dict[str, Any] = {
        "source_id": source_id,
        "market": source.get("market"),
        "domain": source.get("domain"),
        "source_name": source.get("name"),
        "publisher": source.get("publisher"),
        "status": "pending",
        "strategy": "page_or_file_snapshot",
        "source_url": url,
    }
    if not url:
        result.update({"status": "skipped_no_url"})
        return result

    download = download_small_resource(
        source_id=source_id,
        resource_name="page_snapshot",
        resource_url=url,
        max_bytes=max_bytes,
        mode=mode,
        timeout=timeout,
    )
    result.update({"status": "ok" if download.status == "sampled" else download.status})
    result["download"] = download.__dict__
    return result


def probe_dubai_pulse(source: dict[str, Any], *, timeout: int) -> dict[str, Any]:
    url = source.get("url")
    source_id = source["id"]
    result: dict[str, Any] = {
        "source_id": source_id,
        "market": source.get("market"),
        "domain": source.get("domain"),
        "source_name": source.get("name"),
        "publisher": source.get("publisher"),
        "status": "pending",
        "strategy": "dubai_pulse_probe_only",
        "source_url": url,
        "notes": (
            "Dubai Pulse often blocks or times out from automated sessions. "
            "This smoke ingest records availability and leaves full extraction "
            "for token/API or manual bulk download mode."
        ),
    }
    if not url:
        result.update({"status": "skipped_no_url"})
        return result

    try:
        with open_url(url, timeout=timeout) as response:
            result.update(
                {
                    "status": "reachable",
                    "http_status": getattr(response, "status", None),
                    "content_type": response.headers.get("Content-Type"),
                    "content_length": response.headers.get("Content-Length"),
                }
            )
    except HTTPError as error:
        result.update({"status": "http_error", "http_status": error.code, "error": str(error)})
    except (TimeoutError, URLError, OSError) as error:
        result.update({"status": "network_unavailable_from_current_session", "error": str(error)})
    return result


def inventory_files() -> dict[str, Any]:
    inventory: dict[str, Any] = {}
    for name, pattern in LOCAL_INVENTORY_PATTERNS.items():
        files = sorted(pattern.parent.glob(pattern.name)) if "**" not in str(pattern) else sorted(pattern.parent.glob("**/*.parquet"))
        file_records = []
        total_bytes = 0
        for path in files:
            try:
                stat = path.stat()
            except OSError:
                continue
            total_bytes += stat.st_size
            file_records.append(
                {
                    "path": relative(path),
                    "bytes": stat.st_size,
                    "modified_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                }
            )
        inventory[name] = {
            "file_count": len(file_records),
            "total_bytes": total_bytes,
            "files": file_records[:250],
            "truncated": len(file_records) > 250,
        }
    return inventory


def copy_existing_local_seeds() -> list[dict[str, Any]]:
    copied: list[dict[str, Any]] = []
    local_csvs = sorted((DATA_LAKE_ROOT / "01_dubai" / "data_dubai_government").glob("*.csv"))
    for path in local_csvs:
        stat = path.stat()
        target = SAMPLES_DIR / f"local_dubai__{safe_filename(path.name)}"
        if stat.st_size <= 2 * 1024 * 1024:
            shutil.copy2(path, target)
            copied.append(
                {
                    "source": "local_inventory",
                    "original_path": relative(path),
                    "sample_path": relative(target),
                    "bytes": stat.st_size,
                    "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                }
            )
        else:
            copied.append(
                {
                    "source": "local_inventory",
                    "original_path": relative(path),
                    "bytes": stat.st_size,
                    "status": "skipped_large_local_seed",
                }
            )
    return copied


def ingest_source(
    source: dict[str, Any],
    *,
    max_bytes: int,
    mode: str,
    timeout: int,
) -> dict[str, Any]:
    source_id = source["id"]
    if source_id in DATA_GOUV_DATASETS:
        return discover_data_gouv_dataset(
            source,
            DATA_GOUV_DATASETS[source_id],
            max_bytes=max_bytes,
            mode=mode,
            timeout=timeout,
        )
    if source_id in DUBAI_PULSE_SOURCES:
        return probe_dubai_pulse(source, timeout=timeout)
    if source_id in PAGE_SNAPSHOT_SOURCES:
        return snapshot_page(source, max_bytes=max_bytes, mode=mode, timeout=timeout)
    return {
        "source_id": source_id,
        "market": source.get("market"),
        "domain": source.get("domain"),
        "source_name": source.get("name"),
        "publisher": source.get("publisher"),
        "status": "not_actionable_in_smoke",
        "strategy": "registry_only",
        "source_url": source.get("url"),
        "notes": "Registered as high-value source, but needs partner feed, dedicated parser, or full-mode connector.",
    }


def summarize_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    results = manifest["source_results"]
    status_counts: dict[str, int] = {}
    strategy_counts: dict[str, int] = {}
    sampled_resources = 0
    skipped_resources = 0
    failed_resources = 0
    discovered_resources = 0
    bytes_written = 0

    for result in results:
        status_counts[result["status"]] = status_counts.get(result["status"], 0) + 1
        strategy = result.get("strategy", "unknown")
        strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
        discovered_resources += int(result.get("resource_count", 0) or 0)
        sampled_resources += int(result.get("sampled_resource_count", 0) or 0)
        skipped_resources += int(result.get("skipped_resource_count", 0) or 0)
        failed_resources += int(result.get("failed_resource_count", 0) or 0)
        download = result.get("download")
        if isinstance(download, dict):
            bytes_written += int(download.get("bytes_written", 0) or 0)
        for resource in result.get("resources", []):
            resource_download = resource.get("download")
            if isinstance(resource_download, dict):
                bytes_written += int(resource_download.get("bytes_written", 0) or 0)

    local_inventory = manifest.get("local_inventory", {})
    local_file_count = sum(item.get("file_count", 0) for item in local_inventory.values())
    local_total_bytes = sum(item.get("total_bytes", 0) for item in local_inventory.values())

    return {
        "generated_at": manifest["generated_at"],
        "mode": manifest["mode"],
        "source_count": len(results),
        "status_counts": dict(sorted(status_counts.items())),
        "strategy_counts": dict(sorted(strategy_counts.items())),
        "discovered_resource_count": discovered_resources,
        "sampled_resource_count": sampled_resources,
        "skipped_resource_count": skipped_resources,
        "failed_resource_count": failed_resources,
        "sample_bytes_written": bytes_written,
        "local_inventory_file_count": local_file_count,
        "local_inventory_total_bytes": local_total_bytes,
        "manifest_path": str(MANIFEST_PATH.relative_to(APP_ROOT)),
        "data_lake_output_root": relative(OUTPUT_ROOT),
        "next_actions": [
            "Turn sampled official metadata into normalized Postgres tables for price history, inflation, yields, taxes, and renovation cost ranges.",
            "Run full mode only for selected large CSV/ZIP sources after choosing storage targets outside the frontend repo.",
            "Use Dubai Pulse token/API or manual bulk export for DLD transactions, Ejari rents, service charges, units, and projects when the public portal blocks automation.",
            "Attach source attribution and confidence level to every investment and renovation result shown in FonatProp.",
        ],
    }


def main() -> int:
    args = parse_args()
    for directory in (SAMPLES_DIR, METADATA_DIR, MANIFEST_PATH.parent):
        directory.mkdir(parents=True, exist_ok=True)

    registry = load_registry()
    sources = collect_sources(registry)
    filters = set(args.source)
    selected_sources = [
        source
        for source in sources
        if source_selected(source, filters=filters, official_only=args.official_only)
    ]
    selected_sources.sort(key=lambda item: (item.get("market", ""), item.get("priority", 999), item["id"]))

    manifest: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": args.mode,
        "max_bytes_per_resource": args.max_bytes,
        "registry_path": str(REGISTRY_PATH.relative_to(APP_ROOT)),
        "app_root": str(APP_ROOT),
        "data_lake_root": str(DATA_LAKE_ROOT),
        "output_root": relative(OUTPUT_ROOT),
        "source_filter": sorted(filters),
        "official_only": args.official_only,
        "local_inventory": inventory_files(),
        "local_seed_samples": copy_existing_local_seeds(),
        "source_results": [],
    }

    for source in selected_sources:
        print(f"Ingesting {source['id']} ({source.get('market')})")
        result = ingest_source(
            source,
            max_bytes=args.max_bytes,
            mode=args.mode,
            timeout=args.timeout,
        )
        manifest["source_results"].append(result)

    summary = summarize_manifest(manifest)
    manifest["summary"] = summary

    with MANIFEST_PATH.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2, ensure_ascii=True)
        handle.write("\n")

    with SUMMARY_PATH.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=True)
        handle.write("\n")

    print(f"Wrote {MANIFEST_PATH.relative_to(APP_ROOT)}")
    print(f"Wrote {SUMMARY_PATH.relative_to(APP_ROOT)}")
    print(f"Sources checked: {summary['source_count']}")
    print(f"Resources discovered: {summary['discovered_resource_count']}")
    print(f"Resources sampled: {summary['sampled_resource_count']}")
    print(f"Local files inventoried: {summary['local_inventory_file_count']}")
    print(f"Sample bytes written: {summary['sample_bytes_written']}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        raise SystemExit(130)
