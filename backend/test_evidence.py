"""Tests for evidence.py. Run from the backend folder with:  python -m unittest"""

import json
import unittest
from pathlib import Path

from evidence import add_fit, check_fit, distance_km

NO_TILL_FACT = {"fact": "Corn yielded less.", "sources": ["trial"], "strength": "measured_ohio", "conditions": {"tillage": "no-till"}}
TILE_FACT = {"fact": "Less nitrate.", "sources": ["monitoring"], "strength": "measured_ohio", "conditions": {"tile_drained": True}}
BOTH_FACT = {"fact": "Both.", "sources": ["trial"], "strength": "measured_ohio", "conditions": {"tillage": "no-till", "tile_drained": True}}
PLAIN_FACT = {"fact": "Wheat pays less.", "sources": ["trial"], "strength": "guidance"}

SOURCES = {"trial": {"id": "trial", "sites": [{"name": "Site", "latitude": 39.8605, "longitude": -83.6773}]}}


class CheckFitTest(unittest.TestCase):
    def test_no_till_fact_fits_a_no_till_farm(self):
        self.assertEqual(check_fit(NO_TILL_FACT, "no-till", "unsure")["status"], "fits")

    def test_no_till_fact_may_not_apply_to_a_tilled_farm(self):
        self.assertEqual(check_fit(NO_TILL_FACT, "tilled", "unsure")["status"], "may_not_apply")

    def test_unknown_when_the_farmer_is_not_sure(self):
        self.assertEqual(check_fit(TILE_FACT, "no-till", "unsure")["status"], "unknown")

    def test_the_worst_condition_wins(self):
        self.assertEqual(check_fit(BOTH_FACT, "no-till", "no")["status"], "may_not_apply")
        self.assertEqual(check_fit(BOTH_FACT, "no-till", "unsure")["status"], "unknown")
        self.assertEqual(check_fit(BOTH_FACT, "no-till", "yes")["status"], "fits")

    def test_a_fact_without_conditions_is_general(self):
        self.assertEqual(check_fit(PLAIN_FACT, "tilled", "no"), {"status": "general", "notes": []})

    def test_adds_the_distance_to_the_nearest_trial_site(self):
        fit = check_fit(NO_TILL_FACT, "no-till", "yes", SOURCES, (39.72, -84.59))
        # About 15.6 km north-south and 78.1 km east-west: 79.6 km.
        self.assertIn("Nearest trial site: 80 km (49 mi) from your field.", fit["notes"])

    def test_no_distance_without_a_location(self):
        fit = check_fit(NO_TILL_FACT, "no-till", "yes", SOURCES, None)
        self.assertEqual(len(fit["notes"]), 1)


class DistanceTest(unittest.TestCase):
    def test_one_degree_of_latitude_is_about_111_km(self):
        self.assertAlmostEqual(distance_km(40, -83, 41, -83), 111.2, delta=0.2)


class RotationsFileTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((Path(__file__).parent / "rotations.json").read_text())

    def test_every_fact_has_a_known_strength(self):
        for rotation in self.data["rotations"]:
            for section in ("for_the_farm", "for_the_environment", "risks_needing_local_review"):
                for fact in rotation[section]:
                    self.assertIn(fact["strength"], ["measured_ohio", "measured_other_state", "crop_calendar", "guidance"], fact["fact"])

    def test_add_fit_gives_every_fact_a_fit(self):
        add_fit(self.data, "tilled", "no", (39.72, -84.59))
        for rotation in self.data["rotations"]:
            for fact in rotation["for_the_farm"] + rotation["for_the_environment"]:
                self.assertIn(fact["fit"]["status"], ["general", "fits", "unknown", "may_not_apply"])


if __name__ == "__main__":
    unittest.main()
