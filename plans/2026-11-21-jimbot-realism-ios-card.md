# Jimbot Realism + iOS Trip Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Jimbot itineraries follow real-life PH day logic and present a first-glance iOS-inspired trip card with a real MapLibre map and honest budgets.

**Architecture:** Edge `normalizeItineraryDraft` becomes the source of truth after every model/tool draft (meal caps, multi-day split, lodging anchors, forward times, cost honesty). Client `toTripView` + `TripItineraryCard` consume normalized drafts; Map tab reuses MapLibre (same stack as Moments) with deep-link Directions. System prompt + schema teach the model the day arc but do not trust it alone.

**Tech Stack:** React 19, existing Bitinary tokens, `maplibre-gl`, Supabase Edge (`jimbot`), existing `motion` only if needed for segment/sheet (prefer CSS), Vitest-style node test scripts under `tests/jimbot-ai/`.

**Spec:** `plans/2026-11-21-jimbot-realism-ios-card-design.md` (+ product strategist brief embedded there; design reference `docs/design-references/itinerary-v3/`).

## Global Constraints

- Verified Bitinary businesses only (existing hard rule).
- Taglish chat `message` stays 1–2 short sentences; schedule lives in structured fields + card.
- Keep brand tokens from `VISUAL_SPEC.md` (`#2b1e18`, `#ef7f27`, etc.); no purple/cream redesign.
- No new map SDK besides MapLibre; Directions via deep links.
- ≤2 model tool rounds / existing V3 cost caps unless a task explicitly extends them.
- Do not invent listed prices; default unknown → show `—`, not fake ₱350-as-known.
- Honor `prefers-reduced-motion`; touch targets ≥44px.
- Image generation / MCP only for optional hero mockups in design QA — not for fake venue photos in production.

## Review Focus

- User asks “1 araw food trip QC” → meal cap may rise; default “1 araw QC” must not.
- Multi-day draft with lodging → lodging not counted as a 09:00 timed stop each day.
- Budget ₱1,500 / 3 days with stay → chat warns tightness before card; card separates stay vs day spend.
- Missing lat/lng → map shows “N stops not on map” instead of blank stub.
- `open_map` with TripItineraryCard mounted → focuses Map segment (not missing `JimbotMapPreview`).

## File map

| Area | Files |
|------|--------|
| Prompt / schema | `supabase/functions/jimbot/jimbot.system.md`, `system_prompt.ts`, `response-schema.json` (if roles added) |
| Edge normalize | `supabase/functions/jimbot/index.ts` (`pickDiverseStops`, `synthesizeDraftFromIds`, `buildItineraryDraft`, new `normalizeItineraryDraft`) |
| Client VM | `src/lib/jimbotTrip.ts`, `src/data/chat.ts` |
| Card UI | `src/components/jimbot/trip/TripItineraryCard.tsx` (+ optional split `TripMap.tsx`, `TripDayTimeline.tsx`) |
| Chat wiring | `src/screens/Jimbot.tsx`, `JimbotMapPreview.tsx` (open_map bridge) |
| Tests | `tests/jimbot-ai/parse-plan-hints.mjs`, `jimbot-trip.mjs`, new `normalize-itinerary.mjs`, extend `run.mjs` |
| Config | `supabase/functions/.env` (optional `MAPTILER_KEY` or public style URL), Vite env for style URL if client-side |

---

### Task 1: Day-arc prompt + plan hints (food-trip flag, days)

**Files:**
- Modify: `supabase/functions/jimbot/jimbot.system.md`
- Modify: `supabase/functions/jimbot/index.ts` (`parsePlanHints`)
- Modify: `tests/jimbot-ai/parse-plan-hints.mjs`
- Mirror client copy of hints if duplicated in tests

**Interfaces:**
- Consumes: user message string
- Produces: `PlanHints` extended with `{ days: number; foodTrip: boolean; overnight: boolean; budget?: number; people?: number; area?: string }`

- [ ] **Step 1: Write failing tests** in `tests/jimbot-ai/parse-plan-hints.mjs` for:
  - `"1 araw Quezon City budget 2500"` → `days: 1`, `foodTrip: false`
  - `"3 days QC food trip"` / `"kainan crawl sa QC"` → `foodTrip: true`, `days: 3`
  - `"overnight Baguio"` → `overnight: true`

- [ ] **Step 2: Run** `node tests/jimbot-ai/parse-plan-hints.mjs` — expect FAIL on new asserts.

- [ ] **Step 3: Implement hint parsing** (`days` from `\d+\s*(day|araw)`, `foodTrip` from food trip / kainan crawl / foodcrawl). Default `days: 1` when planning verbs present but days missing only if you already clarify elsewhere — prefer leave `days` undefined so clarify intent still works; document choice in code comment.

- [ ] **Step 4: Update `jimbot.system.md`** with a **Day structure** section:
  - Default: ≤2 meals + ≤1 café; 3–5 timed stops; lodging anchor; cluster by area; times forward; food-crawl only if user asked.
  - Budget honesty: listed vs estimate; warn if tight.
  - Do not narrate every stop in `message`.

- [ ] **Step 5: Re-run tests** — PASS. Commit if user asked for commits; otherwise leave staged mentally for end of wave.

---

### Task 2: `normalizeItineraryDraft` (server scheduler)

**Files:**
- Create logic in: `supabase/functions/jimbot/index.ts` (or extract `normalize.ts` colocated if file too large)
- Create: `tests/jimbot-ai/normalize-itinerary.mjs`
- Modify: `tests/jimbot-ai/run.mjs` / `package.json` `test:jimbot-ai` to include it
- Modify: `pickDiverseStops`, `synthesizeDraftFromIds`, `buildItineraryDraft`, `sanitizeAndRevalidateBusinessIds` to call normalize

**Interfaces:**
- Consumes: `{ draft, placesMeta[], hints: PlanHints }`
- Produces: `{ draft, budgetPatch, warnings: string[], lodgingBusinessId?: string }`

**Rules to encode (from design brief §C):**
- Cap food-type stops unless `foodTrip`.
- Pull stay/hotel/hostel out of timed stops into `lodging` metadata on draft or first/last anchor fields (extend draft type minimally: optional `lodgingBusinessId` on draft root or per day).
- Assign times with visit durations + travel buffer; no duplicate start times; strictly increasing per day.
- Split IDs across `hints.days` (synthesize must stop forcing single day).
- Prefer geographic clustering when lat/lng present (greedy nearest-neighbor per day).
- Rebuild budget totals from stop cost states; mark over-budget; do not invent listed prices (unknown stays null/`—`).

- [ ] **Step 1: Write failing fixture tests** covering: 5-food list → capped; lodging demoted; 3-day split; times strictly increasing; foodTrip keeps more food.

- [ ] **Step 2: Run tests** — FAIL.

- [ ] **Step 3: Implement `normalizeItineraryDraft` and wire it as the last step of sanitize (after model draft and after synthesize).

- [ ] **Step 4: Rewrite `pickDiverseStops` arc to default `stay? → activity → meal → activity → meal? → cafe?` (not cafe+2×food first). Cap `MAX_SYNTH_STOPS` by days × per-day max.

- [ ] **Step 5: Run** `npm run test:jimbot-ai` — PASS.

---

### Task 3: Honest budget + cost states in client VM

**Files:**
- Modify: `src/data/chat.ts` (optional `costState?: 'listed' | 'estimated' | 'unknown'`)
- Modify: `src/lib/jimbotTrip.ts`
- Modify: `tests/jimbot-ai/jimbot-trip.mjs`
- Modify: edge `estimateCostFromPriceRange` return shape if needed

**Interfaces:**
- Consumes: bot places + draft stops
- Produces: `TripView` with `knownListed`, `estimatedTotal`, `unknownCount`, `stayTotal`, `daySpendTotal`, `budgetConfidence: 'solid' | 'rough' | 'incomplete'`, `over: boolean` only when listed+estimated exceed limit outside uncertainty

- [ ] **Step 1: Failing tests** for placeholder identical estimates → `unknown`/`estimated` not counted as listed; transfers labeled estimated; stay separated.

- [ ] **Step 2: Implement VM fields**; stop treating default ₱300 as listed.

- [ ] **Step 3: Tests PASS.

---

### Task 4: TripItineraryCard first-glance UX (iOS grouped)

**Files:**
- Modify: `src/components/jimbot/trip/TripItineraryCard.tsx`
- Optional split: `TripDayTimeline.tsx`, `TripBudgetStrip.tsx`
- Reference: `docs/design-references/itinerary-v3/VISUAL_SPEC.md`, `MOTION_SPEC.md`
- Optional QA mock: generate one hero comparison image via Cursor GenerateImage **only for design review**, not shipped assets

**Interfaces:**
- Consumes: `TripView` from Task 3
- Produces: UI — default segment Day 1; no merged Overview list; remove duplicate numbered ribbon OR reduce to day-scoped mini rail; honest budget strip; lodging line; Save primary

- [ ] **Step 1: Restructure segments** to `Day 1…N | Map` (drop Overview flatMap). Default `segment = { type: 'day', index: 0 }`.

- [ ] **Step 2: Timeline as iOS inset grouped list** — time (secondary color, not orange), name, category icon tile if no photo, slim transfer connector (not a full row). Collapse “+N more” after 3 stops on first glance if height is an issue in chat.

- [ ] **Step 3: Budget strip** — text form `≈ ₱X of ₱Y · N unconfirmed`; “Make it fit” button when over → triggers existing refine cheaper action.

- [ ] **Step 4: Lodging row** pinned above/below day list when present.

- [ ] **Step 5: Footer** — full-width Save; Refine + Share as icon buttons.

- [ ] **Step 6: Motion** — segment cross-fade 140–200ms; sheet 220–300ms; respect reduced motion (MOTION_SPEC).

- [ ] **Step 7: Manual visual check at http://localhost:8443 against screenshot goals (first-glance test).

---

### Task 5: MapLibre trip map + Directions + `open_map` fix

**Files:**
- Create: `src/components/jimbot/trip/TripMap.tsx` (or inline carefully)
- Modify: `TripItineraryCard.tsx` Map segment
- Modify: `src/screens/Jimbot.tsx` (`open_map` → focus card map segment via callback/ref)
- Reuse patterns from: `src/screens/moments/MomentsMap.tsx`, `src/components/onboarding/BizWidgets.tsx`
- Env: public style URL (MapTiler key in Vite `VITE_MAP_STYLE_URL` or fall back to existing OSM raster with attribution — document ToS risk)

**Interfaces:**
- Consumes: stops with lat/lng + day index + lodging pin
- Produces: MapLibre map, numbered pins, dashed approx polylines, fitBounds; stop sheet **Directions** opens Google Maps dir URL

- [ ] **Step 1: Replace `RouteMap` stub** with MapLibre surface (worker URL pattern from MomentsMap).

- [ ] **Step 2: Day-colored pins + approx line between ordered stops; missing coords banner.

- [ ] **Step 3: Stop sheet primary CTA `Directions`** deep link; secondary Open shop / Swap.

- [ ] **Step 4: Wire `open_map`** so when `TripItineraryCard` is shown, action switches to Map segment and scrolls card into view.

- [ ] **Step 5: Smoke** — plan with coords shows map; pin tap syncs sheet.

---

### Task 6: Chat tightness + Make-it-fit refine path

**Files:**
- Modify: `jimbot.system.md` + edge warnings injection
- Modify: `TripItineraryCard` / `Jimbot.tsx` refine presets to include “Pasukin sa budget” / Make it fit
- Modify: edge `plan_revise` behavior notes in prompt

- [ ] **Step 1: When normalize detects stay+days+budget clearly insufficient**, prepend/append warning and set chat-facing flag so `message` can warn (model instructed; also inject `warnings`).

- [ ] **Step 2: “Make it fit” sends revise turn with intent cheaper (existing `revise_cheaper` / refine sheet).

- [ ] **Step 3: Manual: ₱1500 / 3 days QC → warning + actionable refine.

---

### Task 7: Verification gate

**Files:** none new required

- [ ] **Step 1: Run** `npm run test:jimbot-ai` and `npm run test:auth` if still in prebuild.

- [ ] **Step 2: Playwright smoke** (existing jimbot smoke) + new assertions if cheap: Day 1 default, no five identical meal labels for default prompt.

- [ ] **Step 3: Manual script:**
  1. “1 araw Quezon City budget 2500” → ≤2 meals, forward times, MapLibre map, Directions works.
  2. “e kung 3 days” follow-up → multi-day tabs, no Overview mash.
  3. “food trip 1 araw QC” → more food allowed.
  4. Over-budget → honest strip + Make it fit.

- [ ] **Step 4: Remove any temporary debug ingest logs** left from earlier TDZ session if still present in `jimbot/index.ts` / `jimbotClient`.

---

## Execution notes

- Prefer **ponytail**: smallest change that enforces rules server-side; UI second.
- Image gen: optional side-by-side mock for Task 4 review only.
- Subagents: product strategist already informed Tasks 4–5; use UI-focused implementer for Task 4 and edge-focused for Task 2.

## Self-review checklist

- [x] Spec coverage: prompt, normalize, budget honesty, card UX, map, open_map, make-it-fit
- [x] Meal cap + foodTrip exception tested in Task 1–2
- [x] MapLibre not Google JS as primary
- [x] Overview removal addresses duplicate 09:00 symptom
