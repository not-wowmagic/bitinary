export type StopKind = 'Pagkain' | 'Transport' | 'Aktibidad' | 'Iba pa'
export type Stop = {
  id: string
  time: string
  name: string
  placeId?: string
  kind: StopKind
  cost: number
  note?: string
}

export type Itinerary = {
  id: string
  title: string
  subtitle: string
  budget: number
  area: string
  image: string
  stops: Stop[]
}

export const itineraries: Itinerary[] = [
  {
    id: 'it1',
    title: '1 araw sa ₱1,500',
    subtitle: 'Intramuros food at kasaysayan',
    budget: 1500,
    area: 'Intramuros',
    image: 'photo-1736122094944-da4deea774ab',
    stops: [
      { id: 's1', time: '8:00 AM', name: 'Kainan ni Aling Nena', placeId: 'p1', kind: 'Pagkain', cost: 180, note: 'Tapsilog + kape' },
      { id: 's2', time: '10:00 AM', name: 'Fort Santiago', placeId: 'p3', kind: 'Aktibidad', cost: 75 },
      { id: 's3', time: '12:30 PM', name: 'Lechon ni Kuya Ben', placeId: 'p5', kind: 'Pagkain', cost: 380, note: 'Lechon bowl + halo-halo' },
      { id: 's4', time: '3:00 PM', name: 'Kalesa Tours Intramuros', placeId: 'p6', kind: 'Aktibidad', cost: 350 },
      { id: 's5', time: 'Buong araw', name: 'Jeep at tricycle', kind: 'Transport', cost: 250 },
    ],
  },
  {
    id: 'it2',
    title: 'Kape at Kultura, ₱800',
    subtitle: 'Kalahating araw na lakad',
    budget: 800,
    area: 'Intramuros',
    image: 'photo-1564327367919-cb377ea6a88f',
    stops: [
      { id: 't1', time: '9:00 AM', name: 'Kapihan sa Kalye Real', placeId: 'p2', kind: 'Pagkain', cost: 205 },
      { id: 't2', time: '10:30 AM', name: 'Simbahan ng San Agustin', placeId: 'p7', kind: 'Aktibidad', cost: 200 },
      { id: 't3', time: '12:00 PM', name: 'Sorbetes at Halo-Halo ni Lola', placeId: 'p9', kind: 'Pagkain', cost: 160 },
      { id: 't4', time: 'Buong lakad', name: 'Lakad + tricycle', kind: 'Transport', cost: 100 },
    ],
  },
  {
    id: 'it3',
    title: 'Street food crawl, ₱500',
    subtitle: 'Binondo hanggang Intramuros',
    budget: 500,
    area: 'Binondo',
    image: 'photo-1552912470-ee2e96439539',
    stops: [
      { id: 'u1', time: '4:00 PM', name: 'Ihaw-Ihaw ni Mang Tonyo', placeId: 'p4', kind: 'Pagkain', cost: 170 },
      { id: 'u2', time: '5:30 PM', name: 'Sorbetes at Halo-Halo ni Lola', placeId: 'p9', kind: 'Pagkain', cost: 120 },
      { id: 'u3', time: '6:30 PM', name: 'Pasalubong Plaza Real', placeId: 'p10', kind: 'Iba pa', cost: 150 },
      { id: 'u4', time: 'Buong lakad', name: 'Jeep', kind: 'Transport', cost: 40 },
    ],
  },
]

export const itineraryById = (id: string) => itineraries.find((i) => i.id === id)
export const stopsTotal = (stops: Stop[]) => stops.reduce((s, x) => s + x.cost, 0)
