"""Tests for weather.py.

Run from the backend folder with:  python -m unittest
"""

import unittest

from test_comparison import every_day, steady_weather
from weather import compare_periods, monthly_climate, summarise_weather, yearly_climate


class MonthlyClimateTest(unittest.TestCase):
    def test_steady_weather(self):
        rows = monthly_climate(steady_weather([2020, 2021]))
        self.assertEqual(len(rows), 12)
        self.assertEqual(rows[0], {"month": 1, "precipitation_mm": 31, "high_c": 30})
        # February: 29 days in 2020 and 28 in 2021.
        self.assertEqual(rows[1]["precipitation_mm"], 28)


class YearlyClimateTest(unittest.TestCase):
    def test_counts_heavy_rain_and_hot_days(self):
        daily = steady_weather([2021])
        daily["PRECTOTCORR"]["20210601"] = 30  # heavy
        daily["PRECTOTCORR"]["20210602"] = 25.4  # exactly 1 inch counts
        daily["T2M_MAX"]["20210701"] = 33
        daily["T2M_MAX"]["20210702"] = 32.2
        row = yearly_climate(daily)[0]
        self.assertEqual(row["year"], 2021)
        self.assertEqual(row["heavy_rain_days"], 2)
        self.assertEqual(row["hot_days"], 2)
        self.assertEqual(row["precipitation_mm"], 363 + 30 + 25)

    def test_skips_incomplete_years(self):
        daily = steady_weather([2020, 2021])
        for parameter in daily.values():
            del parameter["20210315"]
        self.assertEqual([row["year"] for row in yearly_climate(daily)], [2020])

    def test_leap_year_is_complete(self):
        self.assertEqual(len(every_day(2020)), 366)
        self.assertEqual(len(yearly_climate(steady_weather([2020]))), 1)


class ComparePeriodsTest(unittest.TestCase):
    def test_averages_and_count(self):
        yearly = [
            {"year": 1991, "hot_days": 2},
            {"year": 1992, "hot_days": 4},
            {"year": 2010, "hot_days": 1},
            {"year": 2011, "hot_days": 5},
            {"year": 2012, "hot_days": 9},
        ]
        result = compare_periods(yearly, "hot_days")
        self.assertEqual(result["early_average"], 3)
        self.assertEqual(result["late_average"], 5)
        self.assertEqual(result["late_years_above_early_average"], 2)
        self.assertEqual(result["late_years"], 3)

    def test_missing_period(self):
        self.assertIsNone(compare_periods([{"year": 2010, "hot_days": 1}], "hot_days"))


class SummariseWeatherTest(unittest.TestCase):
    def test_shape(self):
        result = summarise_weather(steady_weather([2000, 2020]))
        self.assertEqual(len(result["monthly"]), 12)
        self.assertEqual(len(result["yearly"]), 2)
        self.assertEqual(set(result["change"]), {"precipitation_mm", "heavy_rain_days", "hot_days"})
        self.assertEqual(result["change"]["hot_days"]["late_average"], 0)


if __name__ == "__main__":
    unittest.main()
