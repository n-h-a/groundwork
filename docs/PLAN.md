# Groundwork plan

Working plan for the NASA Space Apps Challenge 2026 entry ("Field Shift: Adapting Farms with NASA Data"). Written November 15, 2026. Drafted with AI assistance (Claude) and reviewed by the developer.

## 1. What Groundwork is

**One line:** Groundwork shows an Ohio farmer when their own field's soil is bare while the rain falls, using NASA data, and compares crop rotations that would keep it covered.

**The problem.** In a corn and soybean rotation, Ohio fields have no living crop from the fall harvest until late May. That is when most rain falls on bare soil, and when soil and nitrate wash away. Adding winter wheat or a cover crop keeps the soil covered, but it has real costs for the farm. Farmers need to see both sides for their own field, not for an average one.

**Who it is for.**

- Ohio corn and soybean farmers deciding whether to change their rotation.
- People who advise them: county extension educators and soil and water conservation district staff. They can use it in a conversation with a farmer.

## 2. What makes it useful

A farmer should be able to answer five questions about their own field in a few minutes:

1. **What does my field do now?** Its crop history from the USDA Cropland Data Layer, and which recent winters it was green or bare, seen by NASA's MODIS satellite.
2. **How much rain lands on my bare soil?** The share of the year's precipitation that falls in months with no living crop, from NASA POWER data for their location. We call this **bare-soil rain**.
3. **What would change if I switched?** Their current rotation against an alternative, side by side: bare-soil rain, bare winters, corn yield, soil organic matter, nitrogen, extra work.
4. **Does the research fit my farm?** Each finding is checked against their inputs. For example: "This corn result comes from no-till fields with straw left on. You till, so it may not apply to you."
5. **What should I check locally?** The risks and information gaps for each option, so they know what to ask their extension office.

## 3. What makes it different

- **Bare-soil rain:** a simple, original measure that links NASA climate data to a field decision.
- **Winters seen from space:** satellite evidence of whether the farmer's own field was covered in past winters.
- **Evidence that knows its limits:** every fact shows how strong it is (measured in Ohio, observed but not measured, from another state, not tested) and whether it fits the farmer's field.
- **No black box:** no score, no ranking, no yield or profit prediction. The farmer decides.

## 4. Principles

- Every input must change something we can defend. If we can't act on an answer, we don't ask the question.
- Label every number by kind: measured by satellite, modelled, from field research, or entered by the farmer.
- No yield, profit or soil-improvement predictions for a single farm.
- Ohio only, because the crop research is from Ohio.
- No accounts, and no storing a farmer's location beyond a data cache.
- The tool supports farmer judgment and local advice. It never replaces them.

## 5. Data sources

| Source | Provider | Used for | Status |
|---|---|---|---|
| NASA POWER daily | NASA (MERRA-2 model) | Precipitation, temperature, modelled root-zone soil wetness | Working |
| MODIS MOD13Q1 NDVI | NASA, via ORNL DAAC | Field greenness every 16 days at 250 m | Tested, working |
| Cropland Data Layer | USDA NASS | Crop grown on the field each year, 30 m | Tested, working |
| Rotation research | Ohio State, SARE, Purdue, Nebraska Extension | Crop facts in `backend/rotations.json` | Done |
| SSURGO soil | USDA NRCS | Soil type and drainage at the field | Not tested; optional |
| GPM IMERG, SMAP | NASA | Heavy-rain days; measured soil moisture | Skipped: need a login and add less |

## 6. How it works for the farmer

1. **Start:** choose a field on a map, enter coordinates, or open the **example field** (public farmland west of Dayton, so judges can try it without entering anything).
2. **Confirm:** Groundwork fills in the rotation from the crop history. The farmer confirms it and answers two questions: tillage (no-till or tilled; straw left or removed) and tile drains (yes, no, not sure).
3. **Results:** the My field page, then Compare, Weather and How it works.

## 7. Pages

Navbar: **My field · Compare · Weather · How it works**. On a phone it becomes a bar of icons at the bottom of the screen.

| Page | Contents |
|---|---|
| **Start** | Field picker, example field button, the two questions |
| **My field** | Crop history strip with crop icons; winters seen from space; bare-soil rain for their rotation; a one-line summary |
| **Compare** | Three stacked rotation rows (Field Tool design). Each row has "Compare with mine", which opens the head-to-head view, and "See the season", which opens the timeline and the full evidence. |
| **Weather** | Corn and soybean sensitive weeks year by year; monthly climate; "Is it changing?", comparing 1991–2007 with 2008–2025 and saying plainly when the data can't tell |
| **How it works** | Method, data sources and their resolution, evidence strength for each fact, limitations, AI use |

Design: the Field Tool direction (white, high contrast, Atkinson Hyperlegible, large numbers, 44 px or larger tap targets) and the crop icon set from the design canvas.

## 8. Technical plan

### Backend (FastAPI)

New and changed modules, each with unit tests:

- `nasa_power.py`: take any location, not only Dayton.
- `cropland.py`: crop history from the Cropland Data Layer through the USDA CroplandCROS image service (four requests of 5 years each, under a second in total). The older CropScape service was tried first and timed out for minutes.
- `modis.py`: winter NDVI for the last few winters. NDVI band only, requests of at most 10 dates, a few in parallel.
- `evidence.py`: check each fact's conditions (tillage, tile drains, location) against the farmer's answers and return "fits", "may not apply" or "unknown".
- `comparison.py`: existing; take the farmer's rotation as the baseline.

Endpoints:

- `GET /api/field?lat=&lon=`: crop history, winter greenness and a climate summary.
- `GET /api/compare?lat=&lon=&current=&tillage=&tile=`: indicators and evidence fit for that field.
- `GET /api/weather?lat=&lon=`: sensitive-week history and trend.

Every external response is cached on disk by rounded location, so a repeat visit is instant and the example field works offline.

### Frontend (React)

- `react-router` for pages; the field and answers kept in shared state and in the page address, so a result can be linked.
- Location check: reject points outside Ohio with a clear message.
- Loading states: the MODIS lookup takes 10 to 30 seconds, so the rest of the page loads first.

### Open questions

- **How to call a winter "green".** Decided: compare each winter's median NDVI (December to March, cloud-free composites) with the same field's summer peak, and show the curve. No published MODIS-only NDVI cutoff for cover crops was found, and an Indiana study (Remote Sensing, 2021, doi:10.3390/rs13101998) found NDVI alone is not sufficient to detect them, so the app never labels a field as having a cover crop.
- **Hosting.** Live lookups need the backend online (for example Render or Fly.io). Fallback: a static site with only the example field.
- **Map.** Leaflet with OpenStreetMap tiles needs attribution and adds a library. Fallback: coordinates plus the example field.

## 9. Build phases

Each phase ends in a working app that can be committed.

| # | Phase | Done when |
|---|---|---|
| 0 | Commit current work; decide hosting | Clean working tree |
| 1 | Backend: any location; `cropscape.py` and `modis.py` with tests; `/api/field` | Example field returns history and greenness |
| 2 | Navbar, routing, shared field state; Field Tool styling and icons in the app | Four pages reachable with current content |
| 3 | Start and My field pages | A farmer can pick a field and see its history and winters |
| 4 | Compare redesign: stacked rows, head-to-head, season timeline | Matches the design canvas |
| 5 | Evidence fit and strength badges | Every fact shows strength and fit |
| 6 | Weather page with trend | Trend shown with honest wording |
| 7 | How it works page | Method, sources, limitations and AI use complete |
| 8 | Deploy | Judges can open it from a public link |
| 9 | Submission: README, demo, project form | Submitted before 11:59 PM local time |

**If time runs short, cut in this order:** the trend, the season timeline, the map (keep coordinates and the example field), SSURGO soil.

## 10. Risks

| Risk | Mitigation |
|---|---|
| A data service is slow or down during judging | Disk cache; example field precomputed |
| A MODIS square mixes field edges, roads or trees | Say so on the page; show the curve, not a verdict |
| The crop map misclassifies a year | The farmer confirms or edits the rotation |
| Over-claiming | Principles above; evidence strength on every fact |
| Running out of time | Phases are independent; the cut list above |
