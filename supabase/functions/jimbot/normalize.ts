// Pure itinerary scheduling helpers. No Deno/npm imports so Node tests can load this file directly.

export type PlanHints = {
  budgetPhp?: number | null;
  people?: number | null;
  areaHint?: string | null;
  // Omit days when the user did not state one, so the prompt can clarify intent.
  days?: number;
  foodTrip?: boolean;
  overnight?: boolean;
};

export type PlaceMeta = {
  id: string;
  name?: string | null;
  business_type: string | null;
  price_range: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type DraftStop = {
  time: string | null;
  businessId: string;
  note: string | null;
  estCost: number | null;
};

export type ItineraryDraft = {
  title: string;
  area: string | null;
  days: Array<{ day: number; stops: DraftStop[] }>;
  lodgingBusinessId?: string | null;
};

export type BudgetPatch = {
  currency: "PHP";
  limit: number | null;
  total: number;
  perPerson: number | null;
  isEstimate: boolean;
  lines: Array<{ label: string; amount: number; businessId: string | null }>;
};

export type NormalizeResult = {
  draft: ItineraryDraft;
  budgetPatch: BudgetPatch;
  warnings: string[];
  lodgingBusinessId: string | null;
};

type Bucket = "cafe" | "food" | "activity" | "stay" | "other";

export const MAX_DAYS = 14;
const DAY_START_MIN = 9 * 60;
const VISIT_MIN: Record<Bucket, number> = { activity: 120, food: 75, cafe: 45, other: 90, stay: 60 };
const DEFAULT_TRAVEL_MIN = 30;

export function typeBucket(businessType: string | null | undefined): Bucket {
  const t = (businessType ?? "").toLowerCase();
  if (/hotel|hostel|resort|inn\b|lodg|stay/.test(t)) return "stay";
  if (/kapihan|cafe|coffee|tea/.test(t)) return "cafe";
  if (/kainan|restaurant|food|resto|eatery|grill/.test(t)) return "food";
  if (/attraction|pasyalan|museum|park|shop|mall|gallery|tour|activity/.test(t)) return "activity";
  return "other";
}

export function dayCaps(foodTrip: boolean) {
  return foodTrip ? { meals: 4, cafes: 2, stops: 6 } : { meals: 2, cafes: 1, stops: 5 };
}

/** Max timed stops for synthesis: days × per-day max (+1 lodging when overnight). */
export function maxSynthStops(days = 1, foodTrip = false, overnight = false): number {
  return clampDays(days) * dayCaps(foodTrip).stops + (overnight ? 1 : 0);
}

export function estimateCostFromPriceRange(priceRange: string | null): number {
  if (!priceRange) return 300;
  const normalized = priceRange.toLowerCase();
  if (normalized.includes("₱") && normalized.includes("-")) {
    const numbers = [...normalized.matchAll(/(\d{2,6})/g)].map((m) => Number(m[1]));
    if (numbers.length >= 2) {
      return Math.round((numbers[0] + numbers[1]) / 2);
    }
  }
  if (normalized.includes("cheap") || normalized.includes("budget")) return 200;
  if (normalized.includes("mid")) return 500;
  if (normalized.includes("lux") || normalized.includes("high")) return 1200;
  return 350;
}

/** Cost only when the business lists a price range; unknown stays null. */
function listedCost(meta: PlaceMeta | undefined, fallback: number | null): number | null {
  if (!meta) return typeof fallback === "number" && fallback >= 0 ? fallback : null;
  return meta.price_range ? estimateCostFromPriceRange(meta.price_range) : null;
}

function clampDays(days: number | undefined): number {
  if (typeof days !== "number" || !Number.isFinite(days)) return 1;
  return Math.min(Math.max(Math.round(days), 1), MAX_DAYS);
}

/**
 * Day arc per day: stay? → activity → meal → activity → meal → café, then extra activities.
 * Food trips swap in more meals/cafés.
 */
export function pickDiverseStops<T extends { id: string; business_type: string | null }>(
  rows: T[],
  opts: { days?: number; overnight?: boolean; foodTrip?: boolean } = {},
): T[] {
  const days = clampDays(opts.days);
  const foodTrip = opts.foodTrip === true;
  const limit = maxSynthStops(days, foodTrip, opts.overnight === true);
  const pools: Record<Bucket, T[]> = { cafe: [], food: [], activity: [], stay: [], other: [] };
  for (const row of rows) pools[typeBucket(row.business_type)].push(row);

  const picked: T[] = [];
  const used = new Set<string>();
  const take = (...buckets: Bucket[]): boolean => {
    if (picked.length >= limit) return false;
    for (const bucket of buckets) {
      const next = pools[bucket].find((r) => !used.has(r.id));
      if (next) {
        used.add(next.id);
        picked.push(next);
        return true;
      }
    }
    return false;
  };

  if (opts.overnight) take("stay");
  const arc: Bucket[][] = foodTrip
    ? [["food"], ["cafe"], ["activity", "other"], ["food"], ["food"], ["cafe"]]
    : [["activity", "other"], ["food"], ["activity", "other"], ["food"], ["cafe"]];
  for (let d = 0; d < days; d += 1) {
    for (const slot of arc) take(...slot);
  }
  // Leftovers: non-food only unless food trip (normalize caps meals anyway).
  for (const row of rows) {
    if (picked.length >= limit) break;
    if (used.has(row.id)) continue;
    const b = typeBucket(row.business_type);
    if (b === "stay") continue;
    if (!foodTrip && (b === "food" || b === "cafe")) continue;
    used.add(row.id);
    picked.push(row);
  }
  return picked;
}

function hasCoords(m: PlaceMeta | undefined): m is PlaceMeta & { latitude: number; longitude: number } {
  return typeof m?.latitude === "number" && typeof m?.longitude === "number";
}

function distanceKm(a: PlaceMeta, b: PlaceMeta): number | null {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Greedy nearest-neighbor from the first stop; untouched when any stop lacks coordinates. */
function orderByProximity(ids: string[], metaById: Map<string, PlaceMeta>): string[] {
  if (ids.length < 3 || !ids.every((id) => hasCoords(metaById.get(id)))) return ids;
  const remaining = ids.slice(1);
  const out = [ids[0]];
  while (remaining.length > 0) {
    const last = metaById.get(out[out.length - 1])!;
    let best = 0;
    let bestKm = Infinity;
    remaining.forEach((id, i) => {
      const km = distanceKm(last, metaById.get(id)!) ?? Infinity;
      if (km < bestKm) {
        bestKm = km;
        best = i;
      }
    });
    out.push(remaining.splice(best, 1)[0]);
  }
  return out;
}

/** Within a day: activity → meal → activity → meal → café, extras after. */
function arrangeDay(ids: string[], bucketOf: (id: string) => Bucket, foodTrip: boolean): string[] {
  const queues: Record<"act" | "meal" | "cafe", string[]> = { act: [], meal: [], cafe: [] };
  for (const id of ids) {
    const b = bucketOf(id);
    queues[b === "food" ? "meal" : b === "cafe" ? "cafe" : "act"].push(id);
  }
  const template: Array<"act" | "meal" | "cafe"> = foodTrip
    ? ["meal", "cafe", "act", "meal", "meal", "cafe", "meal"]
    : ["act", "meal", "act", "meal", "cafe"];
  const out: string[] = [];
  for (const slot of template) {
    const next = queues[slot].shift();
    if (next) out.push(next);
  }
  return [...out, ...queues.act, ...queues.meal, ...queues.cafe];
}

function fmtTime(min: number): string {
  const clamped = Math.min(min, 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function roundUp15(min: number): number {
  return Math.ceil(min / 15) * 15;
}

function travelMinutes(a: PlaceMeta | undefined, b: PlaceMeta | undefined): number {
  const km = a && b ? distanceKm(a, b) : null;
  if (km == null) return DEFAULT_TRAVEL_MIN;
  // ~20 km/h city traffic plus a boarding/parking buffer.
  return Math.max(15, Math.round((km / 20) * 60) + 10);
}

export function normalizeItineraryDraft(input: {
  draft: ItineraryDraft | null | undefined;
  placesMeta: PlaceMeta[];
  hints: PlanHints;
  previousBudget?: { limit?: number | null; lines?: Array<{ label?: string; businessId?: string | null }> } | null;
}): NormalizeResult {
  const hints = input.hints ?? {};
  const foodTrip = hints.foodTrip === true;
  const caps = dayCaps(foodTrip);
  const metaById = new Map(input.placesMeta.map((m) => [String(m.id), m]));
  const draft = input.draft ?? { title: "Plan", area: null, days: [] };
  const warnings: string[] = [];

  const incoming = new Map<string, DraftStop>();
  for (const day of draft.days ?? []) {
    for (const stop of day?.stops ?? []) {
      if (typeof stop?.businessId === "string" && !incoming.has(stop.businessId)) {
        incoming.set(stop.businessId, stop);
      }
    }
  }
  const bucketOf = (id: string) => typeBucket(metaById.get(id)?.business_type ?? incoming.get(id)?.note ?? null);

  let lodgingBusinessId: string | null =
    typeof draft.lodgingBusinessId === "string" ? draft.lodgingBusinessId : null;
  let timed: string[] = [];
  for (const id of incoming.keys()) {
    if (bucketOf(id) === "stay") {
      if (!lodgingBusinessId) lodgingBusinessId = id;
    } else {
      timed.push(id);
    }
  }
  timed = timed.filter((id) => id !== lodgingBusinessId);

  const requestedDays = clampDays(hints.days ?? (draft.days?.length || 1));
  // Global caps first so we drop the latest-ranked extras, not whole days.
  const totalMealCap = requestedDays * caps.meals;
  const totalCafeCap = requestedDays * caps.cafes;
  let meals = 0;
  let cafes = 0;
  let droppedFood = 0;
  timed = timed.filter((id) => {
    const b = bucketOf(id);
    if (b === "food") {
      if (meals >= totalMealCap) return (droppedFood += 1, false);
      meals += 1;
    } else if (b === "cafe") {
      if (cafes >= totalCafeCap) return (droppedFood += 1, false);
      cafes += 1;
    }
    return true;
  });
  if (droppedFood > 0) warnings.push("Binawasan ang kainan/kapihan stops para hindi puro kain ang araw.");

  const days = Math.max(1, Math.min(requestedDays, timed.length || 1));
  if (hints.days && timed.length > 0 && days < requestedDays) {
    warnings.push(`Kulang ang verified places para sa ${requestedDays} araw, ${days} araw muna.`);
  }

  const ordered = orderByProximity(timed, metaById);
  const perDayTarget = Math.min(caps.stops, Math.ceil(ordered.length / days));
  const dayBuckets: string[][] = Array.from({ length: days }, () => []);
  const pending = ordered.slice();
  for (let d = 0; d < days; d += 1) {
    const counts = { meals: 0, cafes: 0 };
    // Leave at least one stop for each remaining day.
    const reserve = days - d - 1;
    for (let i = 0; i < pending.length && dayBuckets[d].length < perDayTarget; ) {
      if (pending.length - 1 < reserve) break;
      const id = pending[i];
      const b = bucketOf(id);
      if ((b === "food" && counts.meals >= caps.meals) || (b === "cafe" && counts.cafes >= caps.cafes)) {
        i += 1;
        continue;
      }
      if (b === "food") counts.meals += 1;
      if (b === "cafe") counts.cafes += 1;
      dayBuckets[d].push(id);
      pending.splice(i, 1);
    }
  }
  if (pending.length > 0) warnings.push("May ilang places na hindi na isinama para hindi siksik ang araw.");

  const outDays = dayBuckets.map((ids, idx) => {
    const arranged = arrangeDay(ids, bucketOf, foodTrip);
    let cursor = DAY_START_MIN;
    let mealIdx = 0;
    const stops: DraftStop[] = arranged.map((id, i) => {
      const b = bucketOf(id);
      if (i > 0) {
        const prev = arranged[i - 1];
        cursor = roundUp15(cursor + VISIT_MIN[bucketOf(prev)] + travelMinutes(metaById.get(prev), metaById.get(id)));
      }
      if (b === "food" && !foodTrip) {
        const floor = mealIdx === 0 ? 11 * 60 + 30 : 18 * 60;
        if (cursor < floor) cursor = floor;
        mealIdx += 1;
      }
      const prior = incoming.get(id);
      const meta = metaById.get(id);
      const note = (prior?.note ?? meta?.business_type ?? null)?.slice(0, 80) ?? null;
      return { time: fmtTime(cursor), businessId: id, note, estCost: listedCost(meta, prior?.estCost ?? null) };
    });
    return { day: idx + 1, stops };
  });

  const outDraft: ItineraryDraft = {
    title: draft.title,
    area: draft.area ?? null,
    days: outDays,
    lodgingBusinessId,
  };

  const prevLabel = new Map(
    (input.previousBudget?.lines ?? [])
      .filter((l) => typeof l?.businessId === "string" && typeof l?.label === "string")
      .map((l) => [l.businessId as string, l.label as string]),
  );
  const labelFor = (id: string) => metaById.get(id)?.name ?? prevLabel.get(id) ?? "Stop";
  const lines: BudgetPatch["lines"] = [];
  for (const day of outDays) {
    for (const s of day.stops) {
      if (s.estCost != null) lines.push({ label: labelFor(s.businessId), amount: s.estCost, businessId: s.businessId });
    }
  }
  if (lodgingBusinessId) {
    const cost = listedCost(metaById.get(lodgingBusinessId), null);
    if (cost != null) lines.push({ label: `${labelFor(lodgingBusinessId)} (stay)`, amount: cost, businessId: lodgingBusinessId });
  }
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const limit = hints.budgetPhp ?? input.previousBudget?.limit ?? null;
  const people = hints.people ?? null;
  const budgetPatch: BudgetPatch = {
    currency: "PHP",
    limit,
    total,
    perPerson: people && people >= 2 ? Math.round(total / people) : null,
    isEstimate: true,
    lines,
  };
  if (limit != null && total > limit) warnings.push("Plan is currently over budget.");

  return { draft: outDraft, budgetPatch, warnings, lodgingBusinessId };
}
