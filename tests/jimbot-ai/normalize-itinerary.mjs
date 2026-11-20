import * as normalize from '../../supabase/functions/jimbot/normalize.ts'
import { normalizeItineraryDraft, pickDiverseStops } from '../../supabase/functions/jimbot/normalize.ts'

const parseListedPrice = normalize.parseListedPrice ?? (() => undefined)
let failed = 0
function check(name, ok, detail) {
  console.log(`${ok ? 'ok' : 'FAIL'}  normalize/${name}`, ok ? '' : detail ?? '')
  if (!ok) failed += 1
}

const biz = (id, business_type, extra = {}) => ({
  id,
  name: `Biz ${id}`,
  business_type,
  price_range: '₱200-₱400',
  city: 'Quezon City',
  ...extra,
})
const stop = (businessId) => ({ time: null, businessId, note: null, estCost: null })
const draftOf = (ids, days = 1) => {
  const per = Math.ceil(ids.length / days)
  return {
    title: 'Plan',
    area: 'Quezon City',
    days: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      stops: ids.slice(i * per, (i + 1) * per).map(stop),
    })),
  }
}
const kinds = (result, meta) => {
  const byId = new Map(meta.map((m) => [m.id, m.business_type]))
  return result.draft.days.map((d) => d.stops.map((s) => byId.get(s.businessId)))
}
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const timesOk = (draft) =>
  draft.days.every((d) =>
    d.stops.every((s, i) => /^\d{2}:\d{2}$/.test(s.time ?? '') && (i === 0 || toMin(s.time) > toMin(d.stops[i - 1].time))),
  )

// 5 food stops on a non-food trip → capped to ≤2 meals + ≤1 café per day.
{
  const meta = [biz('f1', 'kainan'), biz('f2', 'restaurant'), biz('f3', 'kainan'), biz('f4', 'eatery'), biz('f5', 'grill'), biz('c1', 'kapihan'), biz('c2', 'cafe'), biz('a1', 'attraction')]
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { foodTrip: false } })
  const day = kinds(r, meta)[0]
  const meals = day.filter((k) => /kainan|restaurant|eatery|grill/.test(k)).length
  const cafes = day.filter((k) => /kapihan|cafe/.test(k)).length
  check('food capped', meals <= 2 && cafes <= 1, day)
  check('activity kept when capping food', day.includes('attraction'), day)
}

// Hotel pulled out of timed stops into lodging metadata.
{
  const meta = [biz('h1', 'hotel'), biz('a1', 'attraction'), biz('f1', 'kainan'), biz('a2', 'museum')]
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { overnight: true } })
  const stopIds = r.draft.days.flatMap((d) => d.stops.map((s) => s.businessId))
  check('lodging demoted', !stopIds.includes('h1') && r.lodgingBusinessId === 'h1' && r.draft.lodgingBusinessId === 'h1', { stopIds, lodging: r.lodgingBusinessId })
}

// Split across hints.days even when the incoming draft is a single day.
{
  const meta = [
    biz('a1', 'attraction'), biz('f1', 'kainan'), biz('a2', 'museum'),
    biz('a3', 'park'), biz('f2', 'kainan'), biz('a4', 'shop'),
    biz('a5', 'gallery'), biz('f3', 'kainan'), biz('a6', 'mall'),
  ]
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { days: 3 } })
  const ids = r.draft.days.flatMap((d) => d.stops.map((s) => s.businessId))
  check('3-day split', r.draft.days.length === 3 && r.draft.days.every((d) => d.stops.length > 0), r.draft.days.map((d) => d.stops.length))
  check('day numbers sequential', r.draft.days.map((d) => d.day).join(',') === '1,2,3')
  check('no dropped or duplicated ids', ids.length === 9 && new Set(ids).size === 9, ids)
  check('times strictly increasing (3-day)', timesOk(r.draft), r.draft.days.map((d) => d.stops.map((s) => s.time)))
}

// Model draft with duplicate/null times → strictly increasing HH:MM.
{
  const meta = [biz('a1', 'attraction'), biz('f1', 'kainan'), biz('a2', 'museum'), biz('f2', 'kainan'), biz('c1', 'kapihan')]
  const draft = draftOf(meta.map((m) => m.id))
  draft.days[0].stops.forEach((s) => { s.time = '09:00' })
  const r = normalizeItineraryDraft({ draft, placesMeta: meta, hints: {} })
  check('times strictly increasing', timesOk(r.draft), r.draft.days[0].stops.map((s) => s.time))
  const day = kinds(r, meta)[0]
  check('day arc starts with activity', day[0] === 'attraction' || day[0] === 'museum', day)
}

// Food trip keeps more food.
{
  const meta = [biz('f1', 'kainan'), biz('f2', 'restaurant'), biz('f3', 'kainan'), biz('f4', 'eatery'), biz('c1', 'kapihan')]
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { foodTrip: true } })
  const meals = kinds(r, meta)[0].filter((k) => /kainan|restaurant|eatery/.test(k)).length
  check('foodTrip keeps more food', meals > 2, kinds(r, meta))
}

// Honest costs: unknown price stays null and is excluded from totals; over-budget is flagged.
{
  const meta = [biz('a1', 'attraction', { price_range: null }), biz('f1', 'kainan', { price_range: '₱400-₱600' }), biz('a2', 'museum', { price_range: '₱1000-₱2000' })]
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { budgetPhp: 1000, people: 2 } })
  const a1 = r.draft.days[0].stops.find((s) => s.businessId === 'a1')
  check('unknown cost stays null', a1?.estCost === null, a1)
  check('budget total from known costs', r.budgetPatch.total === 2000 && r.budgetPatch.lines.length === 2, r.budgetPatch)
  check('budget limit + perPerson', r.budgetPatch.limit === 1000 && r.budgetPatch.perPerson === 1000 && r.budgetPatch.isEstimate === true, r.budgetPatch)
  check('over budget warned', r.warnings.some((w) => /over budget/i.test(w)), r.warnings)
}

// Only parseable peso amounts count as listed prices.
{
  const cases = [
    ['mid', null], ['cheap', null], ['contact for price', null], ['₱₱', null], ['', null], [null, null],
    ['₱350', 350], ['PHP 500', 500], ['200-400', 300], ['₱1,200 - ₱2,000', 1600], ['₱300/pax', 300],
  ]
  const bad = cases.filter(([raw, want]) => parseListedPrice(raw) !== want)
  check('parseListedPrice', bad.length === 0, bad.map(([raw]) => [raw, parseListedPrice(raw)]))

  const meta = [
    biz('a1', 'attraction', { price_range: 'mid' }),
    biz('f1', 'kainan', { price_range: 'contact for price' }),
    biz('a2', 'museum', { price_range: '₱250' }),
  ]
  const draft = draftOf(['a1', 'f1', 'a2', 'ghost'])
  draft.days[0].stops.find((s) => s.businessId === 'ghost').estCost = 999
  const r = normalizeItineraryDraft({ draft, placesMeta: meta, hints: {} })
  const cost = (id) => r.draft.days[0].stops.find((s) => s.businessId === id)?.estCost
  check('category/contact prices are null', cost('a1') === null && cost('f1') === null, r.draft.days[0].stops)
  check('model estCost without meta not kept', cost('ghost') === null, r.draft.days[0].stops)
  check('budget only from parseable prices', r.budgetPatch.total === 250 && r.budgetPatch.lines.length === 1, r.budgetPatch)
}

// Long travel overflows the day: times stay strictly increasing and never pile up at day end.
{
  const far = (i) => ({ latitude: 5 + i * 3, longitude: 121.0 })
  const meta = Array.from({ length: 5 }, (_, i) => biz(`x${i}`, 'attraction', far(i)))
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: {} })
  const times = r.draft.days[0].stops.map((s) => s.time)
  check('overflow times strictly increasing', timesOk(r.draft), times)
  check('overflow within day', times.every((t) => toMin(t) <= 21 * 60 + 30) && new Set(times).size === times.length, times)
  check('overflow warned', times.length < 5 && r.warnings.some((w) => /kasya/.test(w)), { times, warnings: r.warnings })
}

// Geographic clustering across days.
{
  const near = (lat) => ({ latitude: lat, longitude: 121.0 })
  const meta = [
    biz('n1', 'attraction', near(14.60)), biz('s1', 'attraction', near(10.30)),
    biz('n2', 'kainan', near(14.61)), biz('s2', 'kainan', near(10.31)),
  ]
  const r = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { days: 2 } })
  const groups = r.draft.days.map((d) => d.stops.map((s) => s.businessId[0]).sort().join(''))
  check('geo clustered days', groups.every((g) => g === 'nn' || g === 'ss'), groups)
}

// Idempotent: normalizing a normalized draft changes nothing.
{
  const meta = [biz('h1', 'hotel'), biz('a1', 'attraction'), biz('f1', 'kainan'), biz('a2', 'museum'), biz('f2', 'kainan'), biz('c1', 'kapihan')]
  const once = normalizeItineraryDraft({ draft: draftOf(meta.map((m) => m.id)), placesMeta: meta, hints: { days: 1 } })
  const twice = normalizeItineraryDraft({ draft: once.draft, placesMeta: meta, hints: { days: 1 } })
  check('idempotent', JSON.stringify(once.draft) === JSON.stringify(twice.draft), { once: once.draft, twice: twice.draft })
}

// pickDiverseStops: activity-first arc, stay first when overnight, limit scales with days.
{
  const rows = [
    biz('c1', 'kapihan'), biz('c2', 'kapihan'), biz('f1', 'kainan'), biz('f2', 'kainan'), biz('f3', 'kainan'),
    biz('a1', 'attraction'), biz('a2', 'shop'), biz('a3', 'park'), biz('a4', 'museum'), biz('h1', 'hotel'),
  ]
  const one = pickDiverseStops(rows, { days: 1 }).map((r) => r.business_type)
  check('pick arc not cafe-first', one[0] === 'attraction' && one[1] === 'kainan', one)
  check('pick ≤2 meals/day', one.filter((t) => t === 'kainan').length <= 2, one)
  const stay = pickDiverseStops(rows, { days: 1, overnight: true }).map((r) => r.business_type)
  check('pick stay first when overnight', stay[0] === 'hotel', stay)
  const two = pickDiverseStops(rows, { days: 2 })
  check('pick limit scales with days', two.length > one.length && new Set(two.map((r) => r.id)).size === two.length, two.map((r) => r.id))
}

if (failed) {
  console.error(`normalize-itinerary: ${failed} failure(s)`)
  process.exit(1)
}
console.log('normalize-itinerary: ok')
