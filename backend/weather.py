"""Weather summaries for a field, from NASA POWER daily data.

Like comparison.py, every function is a plain calculation with no network or
file access. "daily" is {parameter: {"YYYYMMDD": value}} with missing days
already removed (see comparison.drop_missing_days).
"""

import calendar
from statistics import mean

# Thresholds are round US-unit values a farmer would recognise.
HEAVY_RAIN_MM = 25.4  # 1 inch of rain or melted snow in a day
HOT_DAY_C = 32.2  # 90 °F

# The 35 years of data split into two halves of 17 and 18 years.
EARLY = (1991, 2007)
LATE = (2008, 2025)


def monthly_climate(daily):
    """Average precipitation total and average daily high for each calendar month.

    Returns 12 rows, January first.
    """
    totals = {}  # (year, month) -> mm in that month
    highs = {}  # month -> every daily high in that month
    for day, mm in daily["PRECTOTCORR"].items():
        year, month = day[:4], int(day[4:6])
        totals[(year, month)] = totals.get((year, month), 0) + mm
        highs.setdefault(month, []).append(daily["T2M_MAX"][day])

    rows = []
    for month in range(1, 13):
        month_totals = [mm for (_, m), mm in totals.items() if m == month]
        rows.append({
            "month": month,
            "precipitation_mm": round(mean(month_totals)),
            "high_c": round(mean(highs[month]), 1),
        })
    return rows


def yearly_climate(daily):
    """One row per complete year: total precipitation, heavy-rain days and hot days.

    A year with any day missing is left out, so years can be compared fairly.
    """
    days_by_year = {}
    for day in daily["PRECTOTCORR"]:
        days_by_year.setdefault(int(day[:4]), []).append(day)

    rows = []
    for year in sorted(days_by_year):
        days = days_by_year[year]
        if len(days) < (366 if calendar.isleap(year) else 365):
            continue
        rows.append({
            "year": year,
            "precipitation_mm": round(sum(daily["PRECTOTCORR"][d] for d in days)),
            "heavy_rain_days": sum(1 for d in days if daily["PRECTOTCORR"][d] >= HEAVY_RAIN_MM),
            "hot_days": sum(1 for d in days if daily["T2M_MAX"][d] >= HOT_DAY_C),
        })
    return rows


def compare_periods(yearly, measure, early=EARLY, late=LATE):
    """Average of one measure in the early and late periods.

    Also counts how many late years were above the early average, which shows
    whether a difference comes from most years or from a few unusual ones.
    """
    early_values = [row[measure] for row in yearly if early[0] <= row["year"] <= early[1]]
    late_values = [row[measure] for row in yearly if late[0] <= row["year"] <= late[1]]
    if not early_values or not late_values:
        return None

    early_average = mean(early_values)
    late_average = mean(late_values)
    return {
        "early_average": round(early_average, 1),
        "late_average": round(late_average, 1),
        "late_years_above_early_average": sum(1 for v in late_values if v > early_average),
        "late_years": len(late_values),
    }


def summarise_weather(daily):
    """Everything the Weather page needs, from cleaned daily data."""
    yearly = yearly_climate(daily)
    measures = ["precipitation_mm", "heavy_rain_days", "hot_days"]
    return {
        "monthly": monthly_climate(daily),
        "yearly": yearly,
        "periods": {"early": list(EARLY), "late": list(LATE)},
        "change": {measure: compare_periods(yearly, measure) for measure in measures},
        "thresholds": {"heavy_rain_mm": HEAVY_RAIN_MM, "hot_day_c": HOT_DAY_C},
    }
