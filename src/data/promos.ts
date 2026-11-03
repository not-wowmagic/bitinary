export type Promo = {
  id: string
  title: string
  subtitle: string
  business: string
  placeId: string
  tone: 'orange' | 'brown' | 'amber'
  image: string
  cta: string
  until: string
}

export const promos: Promo[] = [
  {
    id: 'pr1',
    title: 'Libreng kape sa ₱300 pataas',
    subtitle: 'Kapihan sa Kalye Real',
    business: 'Kapihan sa Kalye Real',
    placeId: 'p2',
    tone: 'orange',
    image: 'photo-1564327368633-151ef1d45021',
    cta: 'Kunin ang deal',
    until: 'Hanggang Nob 30',
  },
  {
    id: 'pr2',
    title: 'Buy 1 Take 1 Halo-Halo',
    subtitle: 'Tuwing Biyernes, 2–5 PM',
    business: 'Sorbetes at Halo-Halo ni Lola',
    placeId: 'p9',
    tone: 'brown',
    image: 'photo-1565004602745-718e1b0d44f8',
    cta: 'Tingnan',
    until: 'Tuwing Biyernes',
  },
  {
    id: 'pr3',
    title: '10% off sa kalesa ride',
    subtitle: 'Ngayong long weekend lang',
    business: 'Kalesa Tours Intramuros',
    placeId: 'p6',
    tone: 'amber',
    image: 'photo-1653196941420-f83464498bd6',
    cta: 'I-book',
    until: 'Dis 6–8',
  },
]

export const sponsored = [
  {
    id: 'ad1',
    placeId: 'p11',
    headline: 'Weekend sa Batangas, ₱2,499 kada gabi',
    body: 'Kasama ang almusal para sa 2. Libreng kayak.',
    cta: 'Tingnan ang alok',
  },
  {
    id: 'ad2',
    placeId: 'p10',
    headline: 'Pasalubong bundle, ₱499 lang',
    body: 'Polvoron, piaya, at dried mangoes sa isang bayong.',
    cta: 'Bisitahin',
  },
]
