export type Category =
  | 'Kainan'
  | 'Pasyalan'
  | 'Budget Meals'
  | 'Kapihan'
  | 'Street Food'
  | 'Resorts'
  | 'Tours'
  | 'Pasalubong'

export type Place = {
  id: string
  name: string
  category: Category
  priceRange: '₱' | '₱₱' | '₱₱₱'
  priceText: string
  distance: string
  area: string
  verifiedDays: number
  status: 'open' | 'closingSoon' | 'closed'
  closesAt?: string
  hours: string
  image: string
  gallery?: string[]
  logo: { initials: string; color: string }
  rating: number
  reviews: number
  description: string
  menu: { name: string; price: number; note?: string }[]
  tags: string[]
  map: { x: number; y: number }
  queue?: 'maikli' | 'mahaba'
  contact?: string
}

/** The traveler place that mirrors the Bitinary Business demo account. */
export const LINKED_PLACE_ID = 'mangben'

export const places: Place[] = [
  {
    id: 'p1',
    name: 'Kainan ni Aling Nena',
    category: 'Kainan',
    priceRange: '₱₱',
    priceText: '₱150–₱350',
    distance: '350 m',
    area: 'Intramuros',
    verifiedDays: 12,
    status: 'open',
    hours: '7:00 AM – 9:00 PM',
    image: 'photo-1537495988501-f9cd94a78f3e',
    gallery: ['photo-1537495988501-f9cd94a78f3e', 'photo-1536489885071-87983c3e2859', 'photo-1578366687181-5f90a617ca7a'],
    logo: { initials: 'AN', color: '#C84A00' },
    rating: 4.7,
    reviews: 812,
    description:
      'Lutong-bahay na Pinoy sa loob ng Intramuros. Kilala sa kare-kare, sinigang na baboy, at pritong lumpia na sakto sa barkada.',
    menu: [
      { name: 'Kare-kare', price: 280, note: 'Pang-2' },
      { name: 'Sinigang na baboy', price: 240 },
      { name: 'Lumpiang shanghai (10 pcs)', price: 150 },
      { name: 'Tapsilog', price: 180, note: 'Almusal' },
    ],
    tags: ['Lutong-bahay', 'Pang-pamilya', 'May aircon'],
    map: { x: 560, y: 520 },
    queue: 'maikli',
    contact: '0917 555 0142',
  },
  {
    id: 'p2',
    name: 'Kapihan sa Kalye Real',
    category: 'Kapihan',
    priceRange: '₱',
    priceText: '₱90–₱220',
    distance: '500 m',
    area: 'Intramuros',
    verifiedDays: 3,
    status: 'open',
    hours: '8:00 AM – 10:00 PM',
    image: 'photo-1564327367919-cb377ea6a88f',
    gallery: ['photo-1564327367919-cb377ea6a88f', 'photo-1564327368633-151ef1d45021', 'photo-1593443320739-77f74939d0da'],
    logo: { initials: 'KR', color: '#6B3A22' },
    rating: 4.8,
    reviews: 1204,
    description: 'Barako at kapeng Batangas sa lumang bahay na bato. May tablea hot choco at bibingka tuwing umaga.',
    menu: [
      { name: 'Kapeng Barako', price: 110 },
      { name: 'Spanish Latte', price: 160 },
      { name: 'Tablea Hot Choco', price: 140 },
      { name: 'Bibingka', price: 95 },
    ],
    tags: ['May Wi-Fi', 'Pang-trabaho', 'Instagrammable'],
    map: { x: 640, y: 600 },
    queue: 'maikli',
    contact: '0918 555 0199',
  },
  {
    id: 'p3',
    name: 'Fort Santiago',
    category: 'Pasyalan',
    priceRange: '₱',
    priceText: '₱75 entrance',
    distance: '600 m',
    area: 'Intramuros',
    verifiedDays: 5,
    status: 'open',
    hours: '8:00 AM – 6:00 PM',
    image: 'photo-1736122094944-da4deea774ab',
    gallery: ['photo-1736122094944-da4deea774ab', 'photo-1613892214268-9754501a3542'],
    logo: { initials: 'FS', color: '#3A1A0E' },
    rating: 4.6,
    reviews: 5310,
    description: 'Makasaysayang kuta sa tabi ng Ilog Pasig. Maglakad sa mga pader at bisitahin ang Rizal Shrine.',
    menu: [
      { name: 'Regular entrance', price: 75 },
      { name: 'Estudyante / Senior', price: 50 },
    ],
    tags: ['Kasaysayan', 'Pang-picture', 'Outdoor'],
    map: { x: 500, y: 380 },
  },
  {
    id: 'p4',
    name: 'Ihaw-Ihaw ni Mang Tonyo',
    category: 'Street Food',
    priceRange: '₱',
    priceText: '₱20–₱120',
    distance: '800 m',
    area: 'Binondo',
    verifiedDays: 8,
    status: 'closingSoon',
    closesAt: '8:30 PM',
    hours: '3:00 PM – 8:30 PM',
    image: 'photo-1552912470-ee2e96439539',
    logo: { initials: 'MT', color: '#D32F2F' },
    rating: 4.5,
    reviews: 389,
    description: 'Isaw, betamax, at inihaw na liempo na may sukang pinakurat. Pinakamasarap pagkatapos ng 5 PM.',
    menu: [
      { name: 'Isaw (5 sticks)', price: 50 },
      { name: 'Betamax', price: 20 },
      { name: 'Inihaw na liempo', price: 120 },
    ],
    tags: ['Mura', 'Gabi', 'Takeout'],
    map: { x: 760, y: 300 },
    queue: 'mahaba',
  },
  {
    id: 'p5',
    name: 'Lechon ni Kuya Ben',
    category: 'Kainan',
    priceRange: '₱₱',
    priceText: '₱200–₱450',
    distance: '1.1 km',
    area: 'Intramuros',
    verifiedDays: 20,
    status: 'open',
    hours: '10:00 AM – 8:00 PM',
    image: 'photo-1688084403060-3594a4b8ff8d',
    gallery: ['photo-1688084403060-3594a4b8ff8d', 'photo-1688084398814-8926f7d56ebe'],
    logo: { initials: 'KB', color: '#FF6A00' },
    rating: 4.9,
    reviews: 2033,
    description: 'Malutong na lechon na may sarsa ng atay. May halo-halo bilang panghimagas.',
    menu: [
      { name: 'Lechon (¼ kilo)', price: 320 },
      { name: 'Lechon rice bowl', price: 200 },
      { name: 'Halo-halo', price: 90 },
    ],
    tags: ['Best seller', 'Pang-handaan'],
    map: { x: 610, y: 450 },
    queue: 'mahaba',
  },
  {
    id: 'p6',
    name: 'Kalesa Tours Intramuros',
    category: 'Tours',
    priceRange: '₱₱',
    priceText: '₱350 / tao',
    distance: '450 m',
    area: 'Intramuros',
    verifiedDays: 2,
    status: 'open',
    hours: '9:00 AM – 5:00 PM',
    image: 'photo-1653196941420-f83464498bd6',
    logo: { initials: 'KT', color: '#1B8A3A' },
    rating: 4.7,
    reviews: 642,
    description: '45-minutong kalesa ride sa mga pinakamagandang kalye ng Intramuros, may kasamang kuwentista.',
    menu: [
      { name: 'Kalesa ride (45 min)', price: 350 },
      { name: 'Private kalesa (4 pax)', price: 1200 },
    ],
    tags: ['Pang-pamilya', 'May guide'],
    map: { x: 540, y: 600 },
  },
  {
    id: 'p7',
    name: 'Simbahan ng San Agustin',
    category: 'Pasyalan',
    priceRange: '₱',
    priceText: 'Libre (museum ₱200)',
    distance: '700 m',
    area: 'Intramuros',
    verifiedDays: 15,
    status: 'open',
    hours: '8:00 AM – 5:00 PM',
    image: 'photo-1613686224427-29b757c04e0d',
    logo: { initials: 'SA', color: '#6B3A22' },
    rating: 4.8,
    reviews: 3820,
    description: 'Pinakamatandang simbahang bato sa bansa. UNESCO World Heritage Site.',
    menu: [{ name: 'Museum entrance', price: 200 }],
    tags: ['UNESCO', 'Kasaysayan'],
    map: { x: 620, y: 680 },
  },
  {
    id: 'p8',
    name: 'Bahay Kubo Budget Meals',
    category: 'Budget Meals',
    priceRange: '₱',
    priceText: '₱60–₱120',
    distance: '900 m',
    area: 'Ermita',
    verifiedDays: 6,
    status: 'open',
    hours: '6:00 AM – 7:00 PM',
    image: 'photo-1536489885071-87983c3e2859',
    logo: { initials: 'BK', color: '#B26A00' },
    rating: 4.4,
    reviews: 251,
    description: 'Ulam + kanin sa halagang ₱80. Unli-sabaw at gulay araw-araw.',
    menu: [
      { name: 'Ulam + kanin', price: 80 },
      { name: 'Pinakbet combo', price: 95 },
    ],
    tags: ['Sulit', 'Estudyante'],
    map: { x: 700, y: 820 },
  },
  {
    id: 'p9',
    name: 'Sorbetes at Halo-Halo ni Lola',
    category: 'Street Food',
    priceRange: '₱',
    priceText: '₱40–₱160',
    distance: '650 m',
    area: 'Intramuros',
    verifiedDays: 41,
    status: 'open',
    hours: '11:00 AM – 9:00 PM',
    image: 'photo-1565004602745-718e1b0d44f8',
    logo: { initials: 'HL', color: '#FFB400' },
    rating: 4.6,
    reviews: 498,
    description: 'Halo-halong may ube, leche flan, at pinipig. Sorbetes na keso at tsokolate.',
    menu: [
      { name: 'Halo-halo Special', price: 160 },
      { name: 'Sorbetes cup', price: 40 },
    ],
    tags: ['Panghimagas', 'Mainit na araw'],
    map: { x: 470, y: 560 },
  },
  {
    id: 'p10',
    name: 'Pasalubong Plaza Real',
    category: 'Pasalubong',
    priceRange: '₱₱',
    priceText: '₱80–₱600',
    distance: '550 m',
    area: 'Intramuros',
    verifiedDays: 10,
    status: 'open',
    hours: '9:00 AM – 8:00 PM',
    image: 'photo-1513104610352-6a2f4d7525c0',
    logo: { initials: 'PR', color: '#C84A00' },
    rating: 4.5,
    reviews: 177,
    description: 'Polvoron, piaya, dried mangoes, at handwoven na bayong mula sa mga lokal na gumagawa.',
    menu: [
      { name: 'Polvoron (12 pcs)', price: 150 },
      { name: 'Dried mangoes', price: 180 },
      { name: 'Mini bayong', price: 350 },
    ],
    tags: ['Lokal', 'Pang-regalo'],
    map: { x: 680, y: 520 },
  },
  {
    id: 'p11',
    name: 'Isla Verde Beach Resort',
    category: 'Resorts',
    priceRange: '₱₱₱',
    priceText: '₱2,499 / gabi',
    distance: '118 km',
    area: 'Batangas',
    verifiedDays: 9,
    status: 'open',
    hours: 'Check-in 2:00 PM',
    image: 'photo-1605538032404-d7f061325b90',
    logo: { initials: 'IV', color: '#1B8A3A' },
    rating: 4.6,
    reviews: 930,
    description: 'Puting buhangin at malinaw na tubig, 2.5 oras mula Maynila. May island hopping package.',
    menu: [
      { name: 'Standard room', price: 2499 },
      { name: 'Island hopping', price: 900 },
    ],
    tags: ['Beach', 'Weekend'],
    map: { x: 1050, y: 1050 },
  },
  {
    // Linked to the Bitinary Business demo (/biz): reviews and comments here reach the owner.
    id: 'mangben',
    name: 'Kainan ni Mang Ben',
    category: 'Kainan',
    priceRange: '₱₱',
    priceText: '₱120–₱300',
    distance: '600 m',
    area: 'Ermita',
    verifiedDays: 2,
    status: 'open',
    hours: '7:00 AM – 9:00 PM',
    image: 'photo-1565004602745-718e1b0d44f8',
    gallery: ['photo-1565004602745-718e1b0d44f8', 'photo-1537495988501-f9cd94a78f3e', 'photo-1578366687181-5f90a617ca7a', 'photo-1613686224427-29b757c04e0d'],
    logo: { initials: 'MB', color: '#C84A00' },
    rating: 4.5,
    reviews: 236,
    description: 'Lutong-bahay sa Ermita mula pa 2001. Kilala sa kare-kare, halo-halo at Friday Buy 1 Take 1 sa Tapsilog.',
    menu: [
      { name: 'Kare-kare', price: 280, note: 'Pang-2' },
      { name: 'Tapsilog', price: 150, note: 'Almusal' },
      { name: 'Halo-halo', price: 120 },
    ],
    tags: ['Lutong-bahay', 'Pang-pamilya', 'Malapit sa simbahan'],
    map: { x: 54, y: 58 },
    queue: 'maikli',
    contact: '0917 123 4500',
  },
]

export const placeById = (id: string) => places.find((p) => p.id === id)
