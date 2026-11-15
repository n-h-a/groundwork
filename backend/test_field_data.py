"""Tests for cropland.py and modis.py. No network access.

Run from the backend folder with:  python -m unittest
"""

import unittest

from cropland import guess_rotation, parse_samples
from modis import summarise_winters, winter_label


class ParseSamplesTest(unittest.TestCase):
    def test_maps_codes_to_class_names_by_year(self):
        samples = [
            {"value": "1", "attributes": {"Year": 2022}},
            {"value": "5", "attributes": {"Year": 2023}},
            {"value": "", "attributes": {"Year": 2024}},  # no data at this point
        ]
        names = {"1": "Corn", "5": "Soybeans"}
        self.assertEqual(parse_samples(samples, names), {2022: "Corn", 2023: "Soybeans"})


def history(*categories):
    return [{"year": 2018 + i, "category": c} for i, c in enumerate(categories)]


class GuessRotationTest(unittest.TestCase):
    def test_corn_and_soybeans(self):
        rows = history("Corn", "Soybeans", "Corn", "Soybeans", "Corn", "Soybeans")
        self.assertEqual(guess_rotation(rows), "corn-soybean")

    def test_wheat_in_the_mix(self):
        rows = history("Corn", "Soybeans", "Winter Wheat", "Corn", "Dbl Crop WinWht/Soybeans", "Corn")
        self.assertEqual(guess_rotation(rows), "corn-soybean-wheat")

    def test_pasture_does_not_match(self):
        rows = history("Corn", "Soybeans", "Grass/Pasture", "Corn", "Soybeans", "Corn")
        self.assertIsNone(guess_rotation(rows))

    def test_only_the_last_six_years_count(self):
        rows = history("Grass/Pasture", "Corn", "Soybeans", "Corn", "Soybeans", "Corn", "Soybeans")
        self.assertEqual(guess_rotation(rows), "corn-soybean")

    def test_too_little_history(self):
        self.assertIsNone(guess_rotation(history("Corn", "Soybeans", None, None, None, None)))


class WinterLabelTest(unittest.TestCase):
    def test_december_starts_a_winter(self):
        self.assertEqual(winter_label("2022-12-03"), "2022-23")

    def test_march_ends_a_winter(self):
        self.assertEqual(winter_label("2023-03-22"), "2022-23")

    def test_summer_is_not_winter(self):
        self.assertIsNone(winter_label("2023-07-12"))


class SummariseWintersTest(unittest.TestCase):
    def test_compares_each_winter_with_the_summer_before(self):
        composites = [
            {"date": "2022-07-12", "ndvi": 0.90, "reliability": 0},
            {"date": "2022-08-13", "ndvi": 0.80, "reliability": 0},
            {"date": "2022-12-19", "ndvi": 0.20, "reliability": 0},
            {"date": "2023-01-17", "ndvi": 0.30, "reliability": 1},
            {"date": "2023-02-02", "ndvi": 0.40, "reliability": 0},
        ]
        self.assertEqual(
            summarise_winters(composites),
            [{
                "winter": "2022-23",
                "winter_ndvi": 0.3,
                "summer_peak_ndvi": 0.9,
                "share_of_summer_peak": 0.33,
                "composites_used": 3,
            }],
        )

    def test_leaves_out_cloudy_and_snowy_composites(self):
        composites = [
            {"date": "2022-07-12", "ndvi": 0.90, "reliability": 0},
            {"date": "2023-01-01", "ndvi": 0.30, "reliability": 0},
            {"date": "2023-01-17", "ndvi": 0.05, "reliability": 3},  # cloudy
            {"date": "2023-02-02", "ndvi": 0.02, "reliability": 2},  # snow
        ]
        winter = summarise_winters(composites)[0]
        self.assertEqual(winter["winter_ndvi"], 0.3)
        self.assertEqual(winter["composites_used"], 1)

    def test_winter_without_a_summer_has_no_comparison(self):
        composites = [{"date": "2023-01-01", "ndvi": 0.30, "reliability": 0}]
        winter = summarise_winters(composites)[0]
        self.assertIsNone(winter["summer_peak_ndvi"])
        self.assertIsNone(winter["share_of_summer_peak"])


if __name__ == "__main__":
    unittest.main()
