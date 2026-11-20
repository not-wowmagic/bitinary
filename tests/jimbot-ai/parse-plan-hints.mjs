/** Mirrors supabase/functions/jimbot/index.ts parsePlanHints for regression. */
function parsePlanHints(message) {
  const raw = message ?? "";
  const m = raw.toLowerCase();
  let budgetPhp = null;
  const budgetPatterns = [
    /(?:budget|budgete?)\s*(?:of|na|ay|=|:)?\s*(?:₱|php)?\s*([\d,]+)/i,
    /(?:₱|php)\s*([\d,]+)/i,
    /([\d,]+)\s*(?:php|pesos?)/i,
  ];
  for (const re of budgetPatterns) {
    const hit = raw.match(re);
    if (hit?.[1]) {
      const n = Number(hit[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 100 && n <= 1_000_000) {
        budgetPhp = n;
        break;
      }
    }
  }
  let people = null;
  const peopleHit =
    m.match(/(?:para\s+sa|for)\s+(\d{1,2})\s*(?:tao|people|persons?|pax)?/) ||
    m.match(/(\d{1,2})\s*(?:tao|people|persons?|pax)\b/);
  if (peopleHit?.[1]) {
    const n = Number(peopleHit[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 20) people = n;
  }
  let areaHint = null;
  const areaHit =
    raw.match(/\b(?:sa|in|near|around)\s+([A-Za-zÑñ][A-Za-zÑñ\s.'-]{2,40}?)(?:\s*[,.]|\s+budget|\s+para|\s+for|$)/i) ||
    raw.match(/\b(Quezon City|Baguio|Manila|Makati|Cebu|Iloilo|Davao)\b/i);
  if (areaHit?.[1]) areaHint = areaHit[1].replace(/\s+/g, " ").trim();
  // Omit days when the user did not state one, so the prompt can clarify intent.
  const daysHit = m.match(/\b(\d+)\s*(?:days?|araw)\b/);
  const parsedDays = daysHit?.[1] ? Number(daysHit[1]) : null;
  const days = parsedDays && Number.isFinite(parsedDays) && parsedDays >= 1 ? parsedDays : undefined;
  const foodTrip = /food\s*trip|food\s*crawl|kainan\s*crawl/i.test(raw);
  return {
    budgetPhp,
    people,
    areaHint,
    days,
    foodTrip,
    overnight: /hotel|hostel|overnight|tulog|stay|magpalipas/i.test(raw),
  };
}

function pickDiverseStops(rows, limit = 5) {
  if (rows.length <= limit) return rows.slice();
  const typeBucket = (businessType) => {
    const t = (businessType ?? "").toLowerCase();
    if (/kapihan|cafe|coffee|tea/.test(t)) return "cafe";
    if (/kainan|restaurant|food|resto|eatery|grill/.test(t)) return "food";
    if (/attraction|pasyalan|museum|park|shop|mall|gallery|tour|activity/.test(t)) return "activity";
    return "other";
  };
  const pools = { cafe: [], food: [], activity: [], other: [] };
  for (const row of rows) pools[typeBucket(row.business_type)].push(row);
  const picked = [];
  const used = new Set();
  const take = (bucket) => {
    const next = pools[bucket].find((r) => !used.has(r.id));
    if (!next || picked.length >= limit) return;
    used.add(next.id);
    picked.push(next);
  };
  take("cafe");
  take("food");
  take("activity");
  take("food");
  take("other");
  take("cafe");
  take("activity");
  for (const row of rows) {
    if (picked.length >= limit) break;
    if (used.has(row.id)) continue;
    used.add(row.id);
    picked.push(row);
  }
  return picked;
}

const cases = [
  {
    name: "qc budget people",
    input: "Gumawa ng 1 araw na itinerary sa Quezon City, budget 2500 para sa 2 tao",
    expect: { budgetPhp: 2500, people: 2, areaIncludes: "Quezon", days: 1, foodTrip: false },
  },
  {
    name: "php pesos",
    input: "Plan for Baguio with ₱3,000 php for 4 people",
    expect: { budgetPhp: 3000, people: 4, areaIncludes: "Baguio" },
  },
  {
    name: "food trip days",
    input: "3 days QC food trip",
    expect: { days: 3, foodTrip: true },
  },
  {
    name: "kainan crawl",
    input: "kainan crawl sa QC",
    expect: { foodTrip: true },
  },
  {
    name: "overnight",
    input: "overnight Baguio",
    expect: { overnight: true },
  },
];

let failed = 0;
for (const c of cases) {
  const got = parsePlanHints(c.input);
  const ok = Object.entries(c.expect).every(([key, expected]) => {
    if (key === "areaIncludes") return String(got.areaHint ?? "").includes(expected);
    return got[key] === expected;
  });
  console.log(`${ok ? "ok" : "FAIL"}  parse/${c.name}`, got);
  if (!ok) failed += 1;
}

const rows = [
  { id: "1", business_type: "kapihan" },
  { id: "2", business_type: "kapihan" },
  { id: "3", business_type: "kainan" },
  { id: "4", business_type: "kainan" },
  { id: "5", business_type: "attraction" },
  { id: "6", business_type: "shop" },
  { id: "7", business_type: "kainan" },
  { id: "8", business_type: "other" },
];
const picked = pickDiverseStops(rows, 5);
const pickOk = picked.length === 5 && new Set(picked.map((p) => p.id)).size === 5;
console.log(`${pickOk ? "ok" : "FAIL"}  pickDiverseStops`, picked.map((p) => `${p.id}:${p.business_type}`));
if (!pickOk) failed += 1;

if (failed) {
  console.error(`parse-plan-hints: ${failed} failure(s)`);
  process.exit(1);
}
console.log("parse-plan-hints: ok");
