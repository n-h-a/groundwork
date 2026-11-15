"""Compare crop rotations using NASA POWER daily data and rotations.json.

Every function here is a plain calculation with no network or file access,
so each one can be tested with small made-up inputs (see test_comparison.py).

"daily" is always {parameter: {"YYYYMMDD": value}}, as returned by
nasa_power.get_daily_data().
"""

from statistics import mean

MISSING = -999  # NASA POWER's marker for a missing value


def drop_missing_days(daily):
    """Remove every day on which any value is missing.

    Returns the cleaned data and the number of days removed.
    """
    missing_days = set()
    for values in daily.values():
        for day, value in values.items():
            if value == MISSING:
                missing_days.add(day)

    cleaned = {}
    for parameter, values in daily.items():
        cleaned[parameter] = {day: value for day, value in values.items() if day not in missing_days}
    return cleaned, len(missing_days)


def monthly_precipitation(precipitation):
    """Average precipitation total for each calendar month, in mm.

    precipitation is {"YYYYMMDD": mm}. Returns 12 numbers, January first.
    """
    totals = {}  # (year, month) -> total mm in that month
    for day, mm in precipitation.items():
        key = (day[:4], int(day[4:6]))
        totals[key] = totals.get(key, 0) + mm

    averages = []
    for month in range(1, 13):
        month_totals = [total for (year, m), total in totals.items() if m == month]
        averages.append(mean(month_totals))
    return averages


def uncovered_precipitation(rotation, monthly_mm):
    """Precipitation that falls in months with no living crop on the field.

    Averaged over the years of the rotation, so that rotations of different
    lengths can be compared.
    """
    total = 0
    for year in rotation["years"]:
        for month in range(1, 13):
            if month not in year["covered_months"]:
                total += monthly_mm[month - 1]

    per_year = total / len(rotation["years"])
    return {
        "mm_per_year": round(per_year),
        "share_of_annual": round(per_year / sum(monthly_mm), 2),
    }


def crop_exposure(rotation, crop_id):
    """In how many years of the rotation is this crop grown?"""
    years_with_crop = sum(1 for year in rotation["years"] if crop_id in year["crops"])
    return {
        "years_with_crop": years_with_crop,
        "years_in_rotation": len(rotation["years"]),
    }


def window_history(daily, period):
    """Weather during a crop's sensitive period, for each year of data.

    period has "start" and "end" as "MM-DD" (both included), and optionally
    "hot_day_threshold_c".
    """
    days_by_year = {}
    for day in daily["PRECTOTCORR"]:
        month_day = day[4:6] + "-" + day[6:8]
        if period["start"] <= month_day <= period["end"]:
            days_by_year.setdefault(int(day[:4]), []).append(day)

    threshold = period.get("hot_day_threshold_c")

    history = []
    for year in sorted(days_by_year):
        days = days_by_year[year]
        row = {
            "year": year,
            "precipitation_mm": round(sum(daily["PRECTOTCORR"][day] for day in days)),
            "root_zone_wetness": round(mean(daily["GWETROOT"][day] for day in days), 2),
            "hot_days": None,
        }
        if threshold is not None:
            row["hot_days"] = sum(1 for day in days if daily["T2M_MAX"][day] >= threshold)
        history.append(row)
    return history


def compare(rotation_data, daily):
    """Build the full comparison.

    rotation_data is the content of rotations.json. Returns one entry per
    rotation with its indicators, plus the weather history of each crop's
    sensitive period.
    """
    daily, days_removed = drop_missing_days(daily)
    monthly_mm = monthly_precipitation(daily["PRECTOTCORR"])

    sensitive_periods = {}
    for crop_id, crop in rotation_data["crops"].items():
        period = crop["sensitive_period"]
        if period is not None:
            sensitive_periods[crop_id] = {
                "period": period,
                "history": window_history(daily, period),
            }

    rotations = []
    for rotation in rotation_data["rotations"]:
        indicators = {
            "uncovered_precipitation": uncovered_precipitation(rotation, monthly_mm),
            "sensitive_exposure": {
                crop_id: crop_exposure(rotation, crop_id) for crop_id in sensitive_periods
            },
        }
        rotations.append({**rotation, "indicators": indicators})

    return {
        "monthly_precipitation_mm": [round(mm) for mm in monthly_mm],
        "annual_precipitation_mm": round(sum(monthly_mm)),
        "days_with_missing_data": days_removed,
        "rotations": rotations,
        "sensitive_periods": sensitive_periods,
        "crops": rotation_data["crops"],
        "sources": rotation_data["sources"],
    }
