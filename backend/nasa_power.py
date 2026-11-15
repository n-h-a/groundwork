"""Daily climate data from NASA POWER.

The first call downloads the data and saves it in backend/data/. Later calls
read that file, so the app keeps working if NASA POWER is slow or offline.
"""

import json
from pathlib import Path

import httpx

# NASA POWER daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
POWER_DAILY_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

START_YEAR = 1991
END_YEAR = 2025

# PRECTOTCORR: precipitation, in mm per day
# T2M_MAX:     daily maximum temperature at 2 meters, in degrees C
# GWETROOT:    root zone soil wetness, from 0 (completely dry) to 1 (saturated)
PARAMETERS = "PRECTOTCORR,T2M_MAX,GWETROOT"

DATA_FOLDER = Path(__file__).parent / "data"


def get_daily_data(latitude, longitude):
    """Return daily values as {parameter: {"YYYYMMDD": value}}."""
    saved_file = DATA_FOLDER / f"power_daily_{latitude}_{longitude}.json"

    if saved_file.exists():
        return json.loads(saved_file.read_text())["properties"]["parameter"]

    params = {
        "parameters": PARAMETERS,
        "community": "AG",
        "latitude": latitude,
        "longitude": longitude,
        "start": f"{START_YEAR}0101",
        "end": f"{END_YEAR}1231",
        "format": "JSON",
    }
    response = httpx.get(POWER_DAILY_URL, params=params, timeout=60)
    response.raise_for_status()

    DATA_FOLDER.mkdir(exist_ok=True)
    saved_file.write_text(response.text)
    return response.json()["properties"]["parameter"]
