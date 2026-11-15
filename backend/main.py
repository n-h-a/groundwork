import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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