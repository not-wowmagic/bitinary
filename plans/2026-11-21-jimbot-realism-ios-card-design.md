# Jimbot Realism + iOS Card — Design Brief

> Product + prompt + maps decisions that the implementation plan executes.
> Product strategist input: card first-glance hierarchy, PH day rules, honest budget, map sheet UX.
> Code findings: `pickDiverseStops` forces cafe+2×food; Overview flattens days; Map tab is non-MapLibre stub; transfers inflate budget vs edge totals.

## Intent (success)

A traveler glancing at the card for ~3 seconds can answer: **where, how many days, roughly how much, what happens first today** — and the day plan is realistic enough to follow IRL (meal cadence, forward times, clustered areas, honest prices).

## Prompt-engineering stance (before UI)

LLMs alone will keep inventing “food crawl days.” Treat the model as a **proposer**; the edge function is the **scheduler/validator**.

1. **System prompt** states the default day arc + hard meal caps + lodging-as-anchor + “food trip only if asked.”
2. **Tool / schema** constrain stop roles (`meal | cafe | activity | stay | other`) and max counts per day.
3. **Server normalize** (`normalizeItineraryDraft`) always runs after the model: forward times, meal caps, multi-day split, lodging out of timed list, budget honesty, cluster by lat/lng when possible.
4. **Chat message** stays 1–2 Taglish sentences; never dump the schedule in text (card owns that).

## Map API recommendation

| Need | Choice | Why |
|------|--------|-----|
| In-app map (pins, fit bounds, dark style, polylines) | **MapLibre GL** (already in `package.json`) + **MapTiler** or **Protomaps/OpenFreeMap** vector/raster style | Matches Moments/BizWidgets; avoid Google Maps JS SDK duplication; OSM raster alone is weak for production ToS/rate |
| “Navigate here” (highest traveler value) | **Deep links** to Google Maps / Apple Maps / Waze (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) | No billing for outbound; works today |
| Travel ETA between stops | **Phase A:** keep haversine + jeep/walk heuristic; **Phase B:** OpenRouteService or OSRM driving matrix (edge) | Jeepney GTFS is incomplete nationwide; don’t fake transit routing |
| Geocoding | Prefer business lat/lng from DB; no new geocoder until needed | Verified businesses already have coords |

**Do not** adopt Google Maps Platform JS as the primary in-card map unless product later pays for Maps + prefers Google UX over the existing MapLibre stack.

## Product decisions locked for the plan

1. Default open tab = **Day 1** (remove merged Overview as primary; optional “All days” later).
2. **≤2 meals + ≤1 café/merienda per day** unless user asked for food trip / kainan crawl.
3. Lodging = **day anchor**, not a timed stop in the meal/activity list.
4. Prices: **listed | estimated | unknown** — never invent identical ₱350 rows as “known.”
5. Map tab → MapLibre + day pins + approx connector lines + Directions deep link on stop sheet.
6. Visual language: keep Bitinary tokens (`#2b1e18`, `#ef7f27`, …); iOS **grouped list / segmented control / sheets** behavior — not a cream/purple redesign. Evolve v3 reference; do not scrap hero + timeline composition wholesale.
7. One primary CTA (**Save**); Refine/Share secondary.

## Out of scope (this wave)

- Full jeepney/LRT GTFS routing
- Live weather API
- Scraping hotel prices
- Replacing chat UI shell
