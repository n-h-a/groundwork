"""Crop history for a field from the USDA Cropland Data Layer (CDL).

The CDL maps which crop was grown on every 30 m square of US farmland each
year (10 m from 2024), based on satellite imagery. We read it at one point
through the USDA CroplandCROS image service:
https://pdi.scinet.usda.gov/image/rest/services/CDL_WM/ImageServer

The service returns at most 5 years per request, so the years are fetched in
groups of 5. The first lookup for a location is saved in backend/data/, so
later lookups are instant and work offline.
"""

import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

SERVICE_URL = "https://pdi.scinet.usda.gov/image/rest/services/CDL_WM/ImageServer"
FIRST_YEAR = 2008  # first year with national coverage at 30 m
LAST_YEAR = 2025
YEARS_PER_REQUEST = 5  # limit set by the service
DATA_FOLDER = Path(__file__).parent / "data"
CLASS_NAMES_FILE = DATA_FOLDER / "cdl_class_names.json"

# CDL class names mapped to the crop ids used in rotations.json.
# A double-cropped year (wheat harvested, then soybeans planted) has both.
CROP_IDS = {
    "Corn": ["corn"],
    "Soybeans": ["soybean"],
    "Winter Wheat": ["winter_wheat"],
    "Dbl Crop WinWht/Soybeans": ["winter_wheat", "soybean"],
}


def guess_rotation(history):
    """Match recent crop history to one of the rotations in rotations.json.

    history is a list of {"year", "category"}, oldest first. Looks at the last
    six years. Returns a rotation id, or None if the field does not fit. The
    farmer always confirms or changes the guess.
    """
    recent = [row for row in history if row["category"] is not None][-6:]
    if len(recent) < 4:
        return None

    crops_by_year = [CROP_IDS.get(row["category"]) for row in recent]
    if any(crops is None for crops in crops_by_year):
        return None  # something other than corn, soybeans or wheat was grown

    grown = {crop for crops in crops_by_year for crop in crops}
    if "winter_wheat" in grown and {"corn", "soybean"} <= grown:
        return "corn-soybean-wheat"
    if grown == {"corn", "soybean"}:
        return "corn-soybean"
    return None


def parse_samples(samples, class_names):
    """Turn getSamples results into {year: class name}.

    samples is the service's "samples" list; each has a pixel "value" (a CDL
    class code) and a "Year" attribute. class_names maps codes to names.
    """
    by_year = {}
    for sample in samples:
        year = sample["attributes"].get("Year")
        code = str(sample.get("value", "")).strip()
        if year is not None and code.isdigit():
            by_year[int(year)] = class_names.get(code)
    return by_year


def _get(path, params):
    for _attempt in range(3):
        try:
            response = httpx.get(f"{SERVICE_URL}/{path}", params={**params, "f": "json"}, timeout=60)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            continue
    raise httpx.HTTPError(f"Cropland Data Layer request failed: {path}")


def _class_names():
    """CDL class codes to names, such as "1" -> "Corn". Saved after the first call."""
    if CLASS_NAMES_FILE.exists():
        return json.loads(CLASS_NAMES_FILE.read_text())
    rows = _get("rasterAttributeTable", {})["features"]
    names = {str(row["attributes"]["Value"]): row["attributes"]["Class_Names"] for row in rows}
    DATA_FOLDER.mkdir(exist_ok=True)
    CLASS_NAMES_FILE.write_text(json.dumps(names))
    return names


def _fetch_years(latitude, longitude, first, last):
    params = {
        "geometry": json.dumps({"x": longitude, "y": latitude, "spatialReference": {"wkid": 4326}}),
        "geometryType": "esriGeometryPoint",
        "returnFirstValueOnly": "false",
        "outFields": "Year",
        "mosaicRule": json.dumps({"mosaicMethod": "esriMosaicNone", "where": f"Year >= {first} AND Year <= {last}"}),
    }
    return _get("getSamples", params).get("samples", [])


def get_crop_history(latitude, longitude):
    """Return [{"year", "category"}] for each year, oldest first."""
    saved_file = DATA_FOLDER / f"cdl_{latitude:.4f}_{longitude:.4f}.json"
    if saved_file.exists():
        return json.loads(saved_file.read_text())

    class_names = _class_names()
    groups = [
        (start, min(start + YEARS_PER_REQUEST - 1, LAST_YEAR))
        for start in range(FIRST_YEAR, LAST_YEAR + 1, YEARS_PER_REQUEST)
    ]
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda g: _fetch_years(latitude, longitude, *g), groups))

    by_year = {}
    for samples in results:
        by_year.update(parse_samples(samples, class_names))
    history = [{"year": year, "category": by_year.get(year)} for year in range(FIRST_YEAR, LAST_YEAR + 1)]

    # Only save complete results, so a missing year is retried next time.
    if all(row["category"] is not None for row in history):
        DATA_FOLDER.mkdir(exist_ok=True)
        saved_file.write_text(json.dumps(history))
    return history
