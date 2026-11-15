"""Winter greenness for a field from NASA's MODIS satellite.

MOD13Q1 gives NDVI, a measure of how green the ground is, every 16 days at
250 m. We read it through the ORNL DAAC web service:
https://modis.ornl.gov/data/modis_webservice.html

For each winter we compare the field's greenness with its own summer peak.
No published NDVI cutoff reliably detects cover crops from MODIS alone, so we
report the comparison and never label a field as having a cover crop.

The first lookup for a location is saved in backend/data/.
"""

import json
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from statistics import median

import httpx

MODIS_URL = "https://modis.ornl.gov/rst/api/v1/MOD13Q1"
NDVI_BAND = "250m_16_days_NDVI"
RELIABILITY_BAND = "250m_16_days_pixel_reliability"
NDVI_SCALE = 0.0001
GOOD_RELIABILITY = {0, 1}  # 0 = good, 1 = marginal; 2 = snow or ice, 3 = cloudy
MAX_DATES_PER_REQUEST = 10  # limit set by the service
WINTERS = 5  # how many recent winters to show
DATA_FOLDER = Path(__file__).parent / "data"

SUMMER_MONTHS = {6, 7, 8, 9}  # June to September
WINTER_MONTHS = {12, 1, 2, 3}  # December to March


def winter_label(date):
    """The winter a "YYYY-MM-DD" date belongs to, such as "2022-23", or None."""
    year, month = int(date[:4]), int(date[5:7])
    if month == 12:
        return f"{year}-{str(year + 1)[2:]}"
    if month in (1, 2, 3):
        return f"{year - 1}-{str(year)[2:]}"
    return None


def summarise_winters(composites):
    """Compare each winter's greenness with the summer before it.

    composites is a list of {"date": "YYYY-MM-DD", "ndvi": float,
    "reliability": int}. Cloudy and snowy composites are left out.
    Returns one entry per winter, oldest first.
    """
    good = [c for c in composites if c["reliability"] in GOOD_RELIABILITY]

    summer_peaks = {}
    for c in good:
        if int(c["date"][5:7]) in SUMMER_MONTHS:
            year = int(c["date"][:4])
            summer_peaks[year] = max(summer_peaks.get(year, 0), c["ndvi"])

    winter_values = {}
    for c in good:
        label = winter_label(c["date"])
        if label:
            winter_values.setdefault(label, []).append(c["ndvi"])

    winters = []
    for label in sorted(winter_values):
        values = winter_values[label]
        summer_year = int(label[:4])
        peak = summer_peaks.get(summer_year)
        winter_ndvi = median(values)
        winters.append({
            "winter": label,
            "winter_ndvi": round(winter_ndvi, 2),
            "summer_peak_ndvi": round(peak, 2) if peak else None,
            "share_of_summer_peak": round(winter_ndvi / peak, 2) if peak else None,
            "composites_used": len(values),
        })
    return winters


def _get(url, params):
    for _attempt in range(3):
        try:
            response = httpx.get(url, params=params, timeout=120)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            continue
    raise httpx.HTTPError(f"MODIS request failed: {url}")


def _fetch_band(latitude, longitude, band, dates):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "band": band,
        "startDate": dates[0],
        "endDate": dates[-1],
        "kmAboveBelow": 0,
        "kmLeftRight": 0,
    }
    subset = _get(f"{MODIS_URL}/subset", params)["subset"]
    return {row["calendar_date"]: row["data"][0] for row in subset}


def get_winters(latitude, longitude, last_winter_year):
    """Winter greenness for the WINTERS winters ending in last_winter_year.

    last_winter_year is the year the latest winter ends; 2026 means the winter
    of 2025-26.
    """
    saved_file = DATA_FOLDER / f"modis_{latitude:.4f}_{longitude:.4f}_{last_winter_year}.json"
    if saved_file.exists():
        return json.loads(saved_file.read_text())

    all_dates = _get(f"{MODIS_URL}/dates", {"latitude": latitude, "longitude": longitude})["dates"]
    first_summer = last_winter_year - WINTERS
    wanted = []
    for row in all_dates:
        date = row["calendar_date"]
        year, month = int(date[:4]), int(date[5:7])
        in_summer = month in SUMMER_MONTHS and first_summer <= year < last_winter_year
        label = winter_label(date)
        in_winter = label is not None and first_summer <= int(label[:4]) < last_winter_year
        if in_summer or in_winter:
            wanted.append((date, row["modis_date"]))

    # Split into requests the service accepts. Each chunk is a run of
    # consecutive dates, so a request never spans a gap between seasons.
    chunks, current = [], []
    for date, modis_date in wanted:
        if current and (len(current) == MAX_DATES_PER_REQUEST or _gap(current[-1][0], date)):
            chunks.append(current)
            current = []
        current.append((date, modis_date))
    if current:
        chunks.append(current)

    jobs = [(band, [d for _, d in chunk]) for chunk in chunks for band in (NDVI_BAND, RELIABILITY_BAND)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda job: (job[0], _fetch_band(latitude, longitude, *job)), jobs))

    ndvi, reliability = {}, {}
    for band, values in results:
        (ndvi if band == NDVI_BAND else reliability).update(values)

    composites = [
        {"date": date, "ndvi": round(ndvi[date] * NDVI_SCALE, 4), "reliability": reliability.get(date, 3)}
        for date in sorted(ndvi)
    ]
    result = {"composites": composites, "winters": summarise_winters(composites)}

    DATA_FOLDER.mkdir(exist_ok=True)
    saved_file.write_text(json.dumps(result))
    return result


def _gap(previous_date, next_date):
    """True if more than 20 days separate two "YYYY-MM-DD" dates."""
    return (date.fromisoformat(next_date) - date.fromisoformat(previous_date)).days > 20
