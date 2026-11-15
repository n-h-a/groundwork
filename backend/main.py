import json
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from datetime import date

import cropland
import modis
from typing import Literal

from comparison import compare, drop_missing_days
from evidence import add_fit
from nasa_power import END_YEAR, START_YEAR, get_daily_data
from weather import summarise_weather

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

ROTATIONS_FILE = Path(__file__).parent / "rotations.json"
CLIMATE_SOURCE = f"NASA POWER daily API (MERRA-2), {START_YEAR}-{END_YEAR}"


def field_or_pilot(lat, lon):
    """The farmer's field if lat and lon are given, otherwise the Dayton pilot location."""
    if lat is None or lon is None:
        return LOCATION, None
    lat, lon = check_location(lat, lon)
    return {"name": "Your field", "latitude": lat, "longitude": lon}, (lat, lon)


def daily_weather(location):
    """Daily NASA POWER data for a location, from the cache or the API."""
    # NASA POWER cells are about 50 km across, so 2 decimals is plenty for the cache.
    try:
        daily = get_daily_data(round(location["latitude"], 2), round(location["longitude"], 2))
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not get data from NASA POWER")
    return daily


@app.get("/api/weather")
def weather(lat: float | None = None, lon: float | None = None):
    """Monthly averages and year-by-year weather for a field, from NASA POWER."""
    location, _ = field_or_pilot(lat, lon)
    daily, days_removed = drop_missing_days(daily_weather(location))
    return {
        "location": location,
        "source": CLIMATE_SOURCE,
        "days_with_missing_data": days_removed,
        **summarise_weather(daily),
    }


@app.get("/api/compare")
def compare_rotations(
    lat: float | None = None,
    lon: float | None = None,
    tillage: Literal["no-till", "tilled", "unsure"] = "unsure",
    tile: Literal["yes", "no", "unsure"] = "unsure",
):
    """Compare the rotations in rotations.json using daily NASA POWER data.

    Without lat and lon, uses the Dayton pilot location. tillage and tile are
    the farmer's answers; each fact gets a "fit" saying whether the research
    behind it matches their field.
    """
    location, field_point = field_or_pilot(lat, lon)
    daily = daily_weather(location)

    rotation_data = add_fit(json.loads(ROTATIONS_FILE.read_text()), tillage, tile, field_point)

    result = compare(rotation_data, daily)
    result["location"] = location
    result["climate_source"] = CLIMATE_SOURCE
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


# In production this app also serves the built frontend (frontend/dist), so the
# whole site has one address. In development Vite serves the frontend instead,
# and this folder does not exist.
FRONTEND_DIST = (Path(__file__).parent.parent / "frontend" / "dist").resolve()

if FRONTEND_DIST.exists():

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        """A built file if one matches, otherwise the app page.

        The app page handles its own routes such as /compare, so a refresh on
        any page still works. Unknown /api addresses stay a 404.
        """
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file = (FRONTEND_DIST / path).resolve()
        if path and file.is_file() and FRONTEND_DIST in file.parents:
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
