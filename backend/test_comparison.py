"""Tests for comparison.py.

Run from the backend folder with:  python -m unittest
"""

import json
import unittest
from datetime import date, timedelta
from pathlib import Path

from comparison import (
    compare,
    crop_exposure,
    drop_missing_days,
    monthly_precipitation,
    uncovered_precipitation,
    window_history,
)

ROTATIONS_FILE = Path(__file__).parent / "rotations.json"


def every_day(year):
    """All days of a year as "YYYYMMDD" strings."""
    day = date(year, 1, 1)
    days = []
    while day.year == year:
        days.append(day.strftime("%Y%m%d"))
        day += timedelta(days=1)
    return days


def steady_weather(years):
    """Made-up daily data: 1 mm of rain, 30 C and wetness 0.5 on every day."""
    days = [day for year in years for day in every_day(year)]
    return {
        "PRECTOTCORR": {day: 1 for day in days},
        "T2M_MAX": {day: 30 for day in days},
        "GWETROOT": {day: 0.5 for day in days},
    }


class MonthlyPrecipitationTest(unittest.TestCase):
    def test_one_mm_every_day_gives_the_days_in_each_month(self):
        precipitation = steady_weather([2001, 2002])["PRECTOTCORR"]
        self.assertEqual(
            monthly_precipitation(precipitation),
            [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        )

    def test_averages_across_years(self):
        precipitation = {day: 1 for day in every_day(2001)}
        precipitation.update({day: 3 for day in every_day(2002)})
        january = monthly_precipitation(precipitation)[0]
        self.assertEqual(january, 62)  # (31 + 93) / 2


class UncoveredPrecipitationTest(unittest.TestCase):
    ten_mm_every_month = [10] * 12

    def test_counts_only_months_with_no_living_crop(self):
        rotation = {"years": [{"covered_months": [6, 7, 8, 9]}]}
        result = uncovered_precipitation(rotation, self.ten_mm_every_month)
        self.assertEqual(result, {"mm_per_year": 80, "share_of_annual": 0.67})

    def test_averages_over_the_years_of_the_rotation(self):
        rotation = {
            "years": [
                {"covered_months": [6, 7, 8, 9]},
                {"covered_months": list(range(1, 13))},
            ]
        }
        result = uncovered_precipitation(rotation, self.ten_mm_every_month)
        self.assertEqual(result, {"mm_per_year": 40, "share_of_annual": 0.33})


class CropExposureTest(unittest.TestCase):
    def test_counts_years_in_which_the_crop_is_grown(self):
        rotation = {
            "years": [
                {"crops": ["corn"]},
                {"crops": ["soybean", "winter_wheat"]},
                {"crops": ["winter_wheat"]},
            ]
        }
        self.assertEqual(
            crop_exposure(rotation, "corn"),
            {"years_with_crop": 1, "years_in_rotation": 3},
        )
        self.assertEqual(
            crop_exposure(rotation, "winter_wheat"),
            {"years_with_crop": 2, "years_in_rotation": 3},
        )


class WindowHistoryTest(unittest.TestCase):
    def test_summarises_the_days_inside_the_period(self):
        daily = steady_weather([2001])
        daily["T2M_MAX"]["20010710"] = 36  # one hot day inside the period
        daily["T2M_MAX"]["20010601"] = 40  # a hot day outside it
        period = {"start": "07-08", "end": "08-05", "hot_day_threshold_c": 35}

        history = window_history(daily, period)

        self.assertEqual(
            history,
            [{"year": 2001, "precipitation_mm": 29, "root_zone_wetness": 0.5, "hot_days": 1}],
        )

    def test_hot_days_is_empty_when_the_crop_has_no_threshold(self):
        period = {"start": "08-01", "end": "08-31"}
        history = window_history(steady_weather([2001]), period)
        self.assertEqual(history[0]["precipitation_mm"], 31)
        self.assertIsNone(history[0]["hot_days"])


class DropMissingDaysTest(unittest.TestCase):
    def test_removes_the_day_from_every_parameter(self):
        daily = steady_weather([2001])
        daily["GWETROOT"]["20010102"] = -999

        cleaned, days_removed = drop_missing_days(daily)

        self.assertEqual(days_removed, 1)
        self.assertNotIn("20010102", cleaned["PRECTOTCORR"])
        self.assertNotIn("20010102", cleaned["GWETROOT"])
        self.assertEqual(len(cleaned["PRECTOTCORR"]), 364)


class RotationsFileTest(unittest.TestCase):
    """Checks that rotations.json stays consistent as it is edited."""

    def setUp(self):
        self.data = json.loads(ROTATIONS_FILE.read_text())

    def test_every_crop_in_a_rotation_is_defined(self):
        for rotation in self.data["rotations"]:
            for year in rotation["years"]:
                for crop_id in year["crops"]:
                    self.assertIn(crop_id, self.data["crops"])

    def test_covered_months_are_real_months(self):
        for rotation in self.data["rotations"]:
            for year in rotation["years"]:
                for month in year["covered_months"]:
                    self.assertIn(month, range(1, 13))

    def test_every_fact_names_a_listed_source(self):
        source_ids = {source["id"] for source in self.data["sources"]}
        for rotation in self.data["rotations"]:
            facts = (
                rotation["for_the_farm"]
                + rotation["for_the_environment"]
                + rotation["risks_needing_local_review"]
            )
            for fact in facts:
                self.assertTrue(fact["sources"], fact["fact"])
                for source_id in fact["sources"]:
                    self.assertIn(source_id, source_ids)

    def test_more_ground_cover_means_less_uncovered_precipitation(self):
        result = compare(self.data, steady_weather([2001, 2002]))
        shares = [
            rotation["indicators"]["uncovered_precipitation"]["share_of_annual"]
            for rotation in result["rotations"]
        ]
        # Rotations are listed from least to most ground cover.
        self.assertEqual(shares, sorted(shares, reverse=True))


if __name__ == "__main__":
    unittest.main()
