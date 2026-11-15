"""Does a research finding fit the farmer's field?

Each fact in rotations.json can list the conditions it was measured under,
such as no-till fields or tile-drained fields. Here they are checked against
the farmer's answers. A finding that was measured under different conditions
is not wrong, but it may not apply, and the farmer should know.

Everything here is a plain calculation, so it can be tested without a server.
"""

import math

# Messages for each condition and answer. "fits", "may_not_apply" and
# "unknown" are the statuses; the text explains why.
TILLAGE_FIT = {
    "no-till": ("fits", "Measured in no-till fields, like yours."),
    "tilled": ("may_not_apply", "Measured in no-till fields with wheat straw left on. You till, so this may not apply to your field."),
    "unsure": ("unknown", "Measured in no-till fields with wheat straw left on. Results may differ if you till."),
}

TILE_FIT = {
    "yes": ("fits", "Measured in tile-drained fields, like yours."),
    "no": ("may_not_apply", "Measured in tile-drained fields. Yours is not tile-drained, so this may not apply."),
    "unsure": ("unknown", "Measured in tile-drained fields. Check whether your field has tile drains."),
}

STATUS_ORDER = ["fits", "unknown", "may_not_apply"]  # worst last


def distance_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points, in kilometres."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def nearest_site_note(fact, sources_by_id, location):
    """How far the nearest trial site is from the field, or None."""
    if location is None:
        return None
    sites = [site for sid in fact["sources"] for site in sources_by_id.get(sid, {}).get("sites", [])]
    if not sites:
        return None
    lat, lon = location
    km = min(distance_km(lat, lon, s["latitude"], s["longitude"]) for s in sites)
    return f"Nearest trial site: {round(km)} km ({round(km * 0.621)} mi) from your field."


def check_fit(fact, tillage, tile, sources_by_id=None, location=None):
    """Return {"status", "notes"} for one fact.

    status is "general" when the fact names no conditions; otherwise the
    worst of its conditions: "fits", "unknown" or "may_not_apply".
    """
    conditions = fact.get("conditions", {})
    statuses, notes = [], []

    if conditions.get("tillage") == "no-till":
        status, note = TILLAGE_FIT[tillage]
        statuses.append(status)
        notes.append(note)
    if conditions.get("tile_drained"):
        status, note = TILE_FIT[tile]
        statuses.append(status)
        notes.append(note)

    if not statuses:
        return {"status": "general", "notes": []}

    if fact.get("strength") == "measured_ohio":
        site_note = nearest_site_note(fact, sources_by_id or {}, location)
        if site_note:
            notes.append(site_note)

    worst = max(statuses, key=STATUS_ORDER.index)
    return {"status": worst, "notes": notes}


def add_fit(rotation_data, tillage, tile, location=None):
    """Add a "fit" entry to every fact of every rotation, in place."""
    sources_by_id = {source["id"]: source for source in rotation_data["sources"]}
    for rotation in rotation_data["rotations"]:
        for section in ("for_the_farm", "for_the_environment", "risks_needing_local_review"):
            for fact in rotation[section]:
                fact["fit"] = check_fit(fact, tillage, tile, sources_by_id, location)
    return rotation_data
