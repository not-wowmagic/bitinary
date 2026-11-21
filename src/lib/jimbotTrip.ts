import type { JimbotBudget, JimbotCostState, JimbotItineraryDraft, JimbotPlaceRef, JimbotWarning } from '@/data/chat'

export type TripStop = {
  id: string
  businessId: string
  name: string
  area: string | null
  time: string | null
  category: string | null
  estCost: number | null
  costState: JimbotCostState
  photo: string | null
  lat?: number
  lng?: number
  transferFromPreviousMinutes: number | null
  transferLabel: string | null
  transferCost: number | null
  transferCostState: 'estimated' | null
}

export type TripDay = { id: string; dayNumber: number; stops: TripStop[] }

export type TripView = {
  destination: string
  durationDays: number
  budgetLimit: number | null
  knownTotal: number
  knownListed: number
  estimatedTotal: number
  unknownCount: number
  stayTotal: number
  daySpendTotal: number
  budgetConfidence: 'solid' | 'rough' | 'incomplete'
  perPerson: number | null
  partial: boolean
  over: boolean
  lines: { label: string; amount: number; estimate: boolean; costState: Exclude<JimbotCostState, 'unknown'> }[]
  exclusions: string[]
  days: TripDay[]
  tips: string[]
  status: 'draft' | 'saved'
}

type BotSlice = {
  text?: string
  itineraryDraft?: JimbotItineraryDraft | null
  budget?: JimbotBudget | null
  places?: JimbotPlaceRef[]
  warnings?: JimbotWarning[]
}

const STAY = /hotel|hostel|resort|stay|tulugan/i

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(s))
}

/** Walk under 1km (₱0). Otherwise a flat city jeepney estimate, not a live Grab quote. */
export function estimateTransfer(km: number): { minutes: number; cost: number; label: string } {
  const minutes = Math.max(5, Math.round((km / 4) * 60))
  if (km < 1) return { minutes: Math.max(5, Math.round(km * 12)), cost: 0, label: 'Walk estimate' }
  const JEEPNEY_PESOS = 15
  return { minutes, cost: JEEPNEY_PESOS, label: 'Jeepney estimate' }
}

export function toTripView(bot: BotSlice, opts?: { includeTransfers?: boolean }): TripView | null {
  const daysIn = bot.itineraryDraft?.days?.filter((d) => d.stops?.length) ?? []
  if (!daysIn.length) return null
  const byId = new Map((bot.places ?? []).map((p) => [p.businessId, p]))
  const includeTransfers = opts?.includeTransfers === true
  let knownListed = 0
  let estimatedTotal = 0
  let unknownCount = 0
  let daySpendTotal = 0
  const lines: TripView['lines'] = []
  const days: TripDay[] = daysIn.map((day) => {
    const stops: TripStop[] = day.stops.map((stop, i) => {
      const place = byId.get(stop.businessId)
      const name = stop.name || place?.name || 'Verified place'
      const cost = typeof stop.estCost === 'number' ? stop.estCost : null
      const costState: JimbotCostState = cost == null ? 'unknown' : stop.costState ?? 'listed'
      if (costState === 'unknown') {
        unknownCount += 1
      } else if (costState === 'listed') {
        knownListed += cost!
        daySpendTotal += cost!
        lines.push({ label: name, amount: cost!, estimate: false, costState })
      } else {
        estimatedTotal += cost!
        daySpendTotal += cost!
        lines.push({ label: name, amount: cost!, estimate: true, costState })
      }
      return {
        id: `${day.day}-${stop.businessId}-${i}`,
        businessId: stop.businessId,
        name,
        area: stop.city ?? place?.city ?? bot.itineraryDraft?.area ?? null,
        time: stop.time,
        category: stop.note || stop.type || place?.type || null,
        estCost: costState === 'unknown' ? null : cost,
        costState,
        photo: stop.photo || place?.photo || null,
        lat: stop.lat ?? place?.lat,
        lng: stop.lng ?? place?.lng,
        transferFromPreviousMinutes: null,
        transferLabel: null,
        transferCost: null,
        transferCostState: null,
      }
    })
    if (includeTransfers) {
      for (let i = 1; i < stops.length; i += 1) {
        const prev = stops[i - 1]
        const cur = stops[i]
        if (prev.lat == null || prev.lng == null || cur.lat == null || cur.lng == null) continue
        const est = estimateTransfer(haversineKm({ lat: prev.lat, lng: prev.lng }, { lat: cur.lat, lng: cur.lng }))
        cur.transferFromPreviousMinutes = est.minutes
        cur.transferLabel = est.label
        cur.transferCost = est.cost
        cur.transferCostState = 'estimated'
        if (est.cost > 0) {
          estimatedTotal += est.cost
          lines.push({ label: est.label, amount: est.cost, estimate: true, costState: 'estimated' })
        }
      }
    }
    return { id: `day-${day.day}`, dayNumber: day.day, stops }
  })

  const lodgingBusinessId = bot.itineraryDraft?.lodgingBusinessId
  const stayLines = lodgingBusinessId
    ? (bot.budget?.lines ?? []).filter((line) => line.businessId === lodgingBusinessId && typeof line.amount === 'number')
    : []
  const stayTotal = stayLines.reduce((sum, line) => sum + line.amount, 0)
  if (lodgingBusinessId) {
    if (stayLines.length) {
      for (const line of stayLines) {
        const costState = line.costState ?? 'listed'
        if (costState === 'listed') knownListed += line.amount
        else if (costState === 'estimated') estimatedTotal += line.amount
        else unknownCount += 1
        if (costState !== 'unknown') lines.push({ label: line.label, amount: line.amount, estimate: costState === 'estimated', costState })
      }
    } else {
      unknownCount += 1
    }
  }
  const stayNamed = !!lodgingBusinessId || days.some((d) => d.stops.some((s) => STAY.test(`${s.name} ${s.category ?? ''}`)))
  const exclusions = [
    includeTransfers ? null : 'Transport is not included yet',
    stayNamed ? null : 'Stay is not included yet',
  ].filter((x): x is string => !!x)

  const limit = bot.budget?.limit ?? null
  const knownTotal = knownListed + estimatedTotal
  const budgetConfidence = unknownCount > 0 ? 'incomplete' : estimatedTotal > 0 ? 'rough' : 'solid'
  return {
    destination: bot.itineraryDraft?.area || 'Biyahe',
    durationDays: days.length,
    budgetLimit: limit,
    knownTotal,
    knownListed,
    estimatedTotal,
    unknownCount,
    stayTotal,
    daySpendTotal,
    budgetConfidence,
    perPerson: bot.budget?.perPerson ?? null,
    partial: unknownCount > 0,
    over: limit != null && unknownCount === 0 && knownTotal > limit,
    lines,
    exclusions,
    days,
    tips: (bot.warnings ?? []).filter(Boolean).slice(0, 3),
    status: 'draft',
  }
}
