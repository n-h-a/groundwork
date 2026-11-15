import json
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from datetime import date

import cropland
import modis
from comparison import compare
from nasa_power import END_YEAR, START_YEAR, get_daily_data

app = FastAPI(title="Groundwork API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "project": "Groundwork",
        "message": "Groundwork API is running"
    }


# Pilot location for the first version of Groundwork.
LOCATION = {"name": "Dayton, OH", "latitude": 39.76, "longitude": -84.19}

# NASA POWER monthly API: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
POWER_MONTHLY_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"

ROTATIONS_FILE = Path(__file__).parent / "rotations.json"


@app.get("/api/climate")
def climate():
    """Monthly temperature and precipitation for the pilot location, from NASA POWER."""
    params = {
        "parameters": "T2M,PRECTOTCORR",
        "community": "AG",
        "latitude": LOCATION["latitude"],
        "longitude": LOCATION["longitude"],
        "start": 1991,
        "end": 2025,
        "format": "JSON",
    }

    try:
        response = httpx.get(POWER_MONTHLY_URL, params=params, timeout=30)
        response.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not get data from NASA POWER")

    data = response.json()
    values = data["properties"]["parameter"]

    # Keys are "YYYYMM". NASA POWER also returns month "13", which is the
    # annual average; it is passed through unchanged.
    return {
        "location": LOCATION,
        "source": "NASA POWER monthly API (MERRA-2)",
        "units": {"temperature": "C", "precipitation": "mm/day"},
        "temperature": values["T2M"],
        "precipitation": values["PRECTOTCORR"],
    }


@app.get("/api/compare")
def compare_rotations(lat: float | None = None, lon: float | None = None):
    """Compare the rotations in rotations.json using daily NASA POWER data.

    Without lat and lon, uses the Dayton pilot location.
    """
    if lat is None or lon is None:
        location = LOCATION
    else:
        lat, lon = check_location(lat, lon)
        location = {"name": "Your field", "latitude": lat, "longitude": lon}

    # NASA POWER cells are about 50 km across, so 2 decimals is plenty for the cache.
    try:
        daily = get_daily_data(round(location["latitude"], 2), round(location["longitude"], 2))
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not get data from NASA POWER")

    rotation_data = json.loads(ROTATIONS_FILE.read_text())

    result = compare(rotation_data, daily)
    result["location"] = location
    result["climate_source"] = f"NASA POWER daily API (MERRA-2), {START_YEAR}-{END_YEAR}"
    return result


# Rough bounding box of Ohio. It includes small slivers of neighbouring states.
OHIO_BOUNDS = {"south": 38.40, "north": 41.98, "west": -84.82, "east": -80.52}


def check_location(lat, lon):
    """Reject points outside Ohio; round to 4 decimals (about 10 m)."""
    b = OHIO_BOUNDS
    if not (b["south"] <= lat <= b["north"] and b["west"] <= lon <= b["east"]):
        raise HTTPException(
            status_code=422,
            detail="Groundwork only covers Ohio, because its crop research comes from Ohio trials.",
        )
    return round(lat, 4), round(lon, 4)


@app.get("/api/field")
def field(lat: float, lon: float):
    """Crop history for a field, and a guess at its rotation."""
    lat, lon = check_location(lat, lon)
    try:
        history = cropland.get_crop_history(lat, lon)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not get data from the USDA Cropland Data Layer")

    return {
        "location": {"latitude": lat, "longitude": lon},
        "crop_history": {
            "source": "USDA NASS Cropland Data Layer, via CroplandCROS",
            "resolution": "30 m (10 m from 2024)",
            "years": history,
        },
        "rotation_guess": cropland.guess_rotation(history),
    }


@app.get("/api/field/winters")
def field_winters(lat: float, lon: float):
    """Winter greenness for a field from MODIS, compared with its summer peak.

    Slow the first time for a location (about 30 seconds), so the page asks
    for it separately and shows the rest first.
    """
    lat, lon = check_location(lat, lon)
    today = date.today()
    # A winter is complete once March is over.
    last_winter_year = today.year if today.month >= 4 else today.year - 1
    try:
        result = modis.get_winters(lat, lon, last_winter_year)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not get data from NASA MODIS")

    return {
        "location": {"latitude": lat, "longitude": lon},
        "source": "NASA MODIS MOD13Q1 NDVI, 250 m, 16-day composites, via ORNL DAAC",
        "method": (
            "For each winter (December to March), the median NDVI of cloud-free composites, "
            "compared with the highest NDVI of the summer before (June to September)."
        ),
        **result,
    }
