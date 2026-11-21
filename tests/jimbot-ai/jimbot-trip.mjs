import { estimateTransfer, toTripView } from '../../src/lib/jimbotTrip.ts'

let failed = 0
function check(name, ok) {
  console.log(`${ok ? 'ok' : 'FAIL'}  ${name}`)
  if (!ok) failed += 1
}

const trip = toTripView({
  itineraryDraft: {
    title: 'QC',
    area: 'Quezon City',
    days: [{
      day: 1,
      stops: [
        { time: '09:00', businessId: 'a', note: 'kapihan', estCost: 100, name: 'Cafe' },
        { time: '12:00', businessId: 'b', note: 'kainan', estCost: null, name: 'Lunch' },
      ],
    }],
  },
  budget: { currency: 'PHP', limit: 2500, total: 9999, perPerson: 50, isEstimate: true, lines: [] },
  places: [{ businessId: 'a', reason: null, name: 'Cafe' }],
})

check('destination', trip?.destination === 'Quezon City')
check('missing cost not zero', trip?.knownTotal === 100)
check('partial', trip?.partial === true)
check('excludes stay and transport by default', (trip?.exclusions.length ?? 0) === 2)

const honestBudget = toTripView({
  itineraryDraft: {
    title: 'Honest costs',
    area: 'Quezon City',
    days: [{
      day: 1,
      stops: [
        { time: '09:00', businessId: 'listed', note: 'museum', estCost: 450, costState: 'listed' },
        { time: '11:00', businessId: 'estimate-a', note: 'coffee', estCost: 300, costState: 'estimated' },
        { time: '13:00', businessId: 'estimate-b', note: 'food', estCost: 300, costState: 'estimated' },
        { time: '15:00', businessId: 'unknown', note: 'park', estCost: 300, costState: 'unknown' },
      ],
    }],
  },
  budget: { currency: 'PHP', limit: 1_000, total: 0, perPerson: null, isEstimate: true, lines: [] },
  places: [{ businessId: 'estimate-a', reason: null, name: 'Coffee', photo: 'https://example.com/coffee.jpg' }],
})

check('only listed costs count as known', honestBudget?.knownListed === 450)
check('identical placeholder estimates stay estimated', honestBudget?.estimatedTotal === 600)
check('unknown costs are not invented', honestBudget?.unknownCount === 1 && honestBudget?.days[0]?.stops[3]?.estCost === null)
check('unknown costs make budget incomplete', honestBudget?.budgetConfidence === 'incomplete' && honestBudget?.over === false)
check('place photo flows into the trip stop', honestBudget?.days[0]?.stops[1]?.photo === 'https://example.com/coffee.jpg')

const stayBudget = toTripView({
  itineraryDraft: {
    title: 'With stay',
    area: 'Quezon City',
    lodgingBusinessId: 'hotel',
    days: [{
      day: 1,
      stops: [{ time: '09:00', businessId: 'museum', note: 'museum', estCost: 200, costState: 'listed', lat: 14.6, lng: 121.0 }],
    }],
  },
  budget: {
    currency: 'PHP',
    limit: 2_000,
    total: 1_000,
    perPerson: null,
    isEstimate: true,
    lines: [{ label: 'Hotel (stay)', amount: 800, businessId: 'hotel' }],
  },
  places: [{ businessId: 'hotel', reason: null, name: 'Hotel' }],
})

check('stay is separate from day spending', stayBudget?.stayTotal === 800 && stayBudget?.daySpendTotal === 200)

const transferBudget = toTripView({
  itineraryDraft: {
    title: 'Transfers',
    area: 'Quezon City',
    days: [{
      day: 1,
      stops: [
        { time: '09:00', businessId: 'a', note: 'museum', estCost: 100, costState: 'listed', lat: 14.6, lng: 121.0 },
        { time: '11:00', businessId: 'b', note: 'park', estCost: 100, costState: 'listed', lat: 14.63, lng: 121.03 },
      ],
    }],
  },
}, { includeTransfers: true })

check('transfers are estimated costs', transferBudget?.estimatedTotal === 15 && transferBudget?.lines.some((line) => line.costState === 'estimated'))

const walk = estimateTransfer(0.4)
const ride = estimateTransfer(3)
check('walk is free', walk.cost === 0)
check('jeepney estimate', ride.cost === 15 && ride.label.includes('estimate'))

if (failed) {
  console.error(`jimbot-trip: ${failed} failure(s)`)
  process.exit(1)
}
console.log('jimbot-trip: ok')
