import {
  Accessibility, Baby, BadgeCheck, Bike, Building2, Bus, CalendarClock, Camera, Car, CarTaxiFront, Clock, Coffee, Croissant, Fish, Flame, Globe, Heart, Image, Landmark, Leaf, ListChecks, MapPin, Moon, Motorbike, Mountain, PawPrint, Phone, Plane, ShieldCheck, Ship, ShoppingBag, Soup, Store, Target, UserRound, Users, UtensilsCrossed, Wallet, Waves, Wine, type LucideIcon,
} from 'lucide-react'
import type { BizThemeId, TravelerPrefs, TravelerThemeId } from '@/app/account'

export type Opt = { id: string; tl: string; en: string; icon?: LucideIcon }
const o = (id: string, tl: string, en: string, icon?: LucideIcon): Opt => ({ id, tl, en, icon })
export const label = (opts: Opt[], id: string | undefined, lang: 'tl' | 'en') => {
  const x = opts.find((p) => p.id === id)
  return x ? x[lang] : undefined
}

export type ThemeDef<Id extends string> = { id: Id; icon: LucideIcon; tl: string; en: string; introTl: string; introEn: string; optional?: boolean; minutes: number }

/* ------------------------------ Traveler ------------------------------ */

export const travelerThemes: ThemeDef<TravelerThemeId>[] = [
  { id: 'trip', icon: Plane, tl: 'Huling Biyahe', en: 'Travel history', introTl: 'Kuwentuhan tayo! Kailan ka huling gumala?', introEn: "Let's chat! When did you last travel?", minutes: 1 },
  { id: 'budget', icon: Wallet, tl: 'Budget', en: 'Budget', introTl: 'Magkano ang komportable sa bulsa mo?', introEn: 'How much feels comfortable to spend?', minutes: 1 },
  { id: 'food', icon: UtensilsCrossed, tl: 'Pagkain', en: 'Food', introTl: 'Ano ang paborito mong kainin?', introEn: 'What do you love to eat?', minutes: 1 },
  { id: 'interests', icon: Heart, tl: 'Mga Gusto', en: 'Interests', introTl: 'Saan ka masaya gumala?', introEn: 'Where do you love to explore?', minutes: 1 },
  { id: 'companions', icon: Users, tl: 'Kasama at Biyahe', en: 'Companions and transport', introTl: 'Sino ang kasama mo, at paano kayo bumibiyahe?', introEn: 'Who do you travel with, and how do you get around?', minutes: 2 },
  { id: 'needs', icon: Accessibility, tl: 'Kailangan', en: 'Accessibility needs', introTl: 'May kailangan ba para komportable ang lakad?', introEn: 'Anything that makes trips easier for you?', optional: true, minutes: 1 },
  { id: 'about', icon: UserRound, tl: 'Tungkol Sa Iyo', en: 'About you', introTl: 'Kaunting kuwento tungkol sa iyo, kung gusto mo lang.', introEn: 'A little about you, only if you want.', optional: true, minutes: 1 },
  { id: 'privacy', icon: ShieldCheck, tl: 'Privacy at Pahintulot', en: 'Privacy and permissions', introTl: 'Ikaw ang may kontrol. Pumili kung ano ang papayagan mo.', introEn: "You're in control. Choose what you allow.", minutes: 1 },
]

export const lastTripOpts = [
  o('week', 'Ngayong linggo', 'This week'),
  o('month', 'Ngayong buwan', 'This month'),
  o('1-3m', '1 hanggang 3 buwan na', '1 to 3 months ago'),
  o('3-12m', '3 hanggang 12 buwan na', '3 to 12 months ago'),
  o('year', 'Mahigit isang taon na', 'Over a year'),
  o('never', 'Hindi pa', 'Never'),
]
/** Approximate days between the answer and the actual last trip. */
const lastTripOffset: Record<string, number> = { week: 3, month: 15, '1-3m': 60, '3-12m': 200, year: 400 }
export const frequencyOpts = [o('weekly', 'Linggo-linggo', 'Weekly'), o('monthly', 'Buwan-buwan', 'Monthly'), o('few', 'Ilang beses sa isang taon', 'A few times a year'), o('rare', 'Paminsan-minsan', 'Rarely')]
export const nextTripOpts = [o('week', 'Ngayong linggo', 'This week'), o('month', 'Ngayong buwan', 'This month'), o('3m', 'Sa loob ng 3 buwan', 'Within 3 months'), o('none', 'Wala pang plano', 'No plans yet')]

export const foodOpts = [
  o('street', 'Street food', 'Street food', Flame), o('local', 'Lutong-bahay', 'Home-style Filipino', Soup), o('coffee', 'Kape', 'Coffee', Coffee), o('seafood', 'Seafood', 'Seafood', Fish), o('dessert', 'Panghimagas', 'Desserts and bakery', Croissant), o('fine', 'Fine dining', 'Fine dining', Wine),
]
export const dietOpts = [o('halal', 'Halal', 'Halal'), o('vegetarian', 'Vegetarian', 'Vegetarian', Leaf), o('nopork', 'Walang baboy', 'No pork'), o('allergy', 'May allergy', 'Allergy')]

export const interestOpts = [
  o('beach', 'Dagat', 'Beach', Waves), o('mountain', 'Bundok', 'Mountains', Mountain), o('heritage', 'Heritage', 'Heritage', Landmark), o('nightlife', 'Nightlife', 'Nightlife', Moon), o('photo', 'Photo spots', 'Photo spots', Camera), o('shopping', 'Pamimili', 'Shopping', ShoppingBag), o('quiet', 'Tahimik na lugar', 'Quiet places', Leaf),
]
export const companionOpts = [o('solo', 'Mag-isa', 'Solo'), o('partner', 'Partner', 'Partner'), o('family', 'Pamilya', 'Family'), o('friends', 'Barkada', 'Friends'), o('kids', 'May bata', 'With kids')]
export const transportOpts = [o('car', 'Sasakyan', 'Car', Car), o('motor', 'Motor', 'Motorbike', Motorbike), o('commute', 'Jeep o bus', 'Jeep or bus', Bus), o('grab', 'Grab o taxi', 'Grab or taxi', CarTaxiFront), o('walk', 'Lakad o bisikleta', 'Walk or bike', Bike), o('boat', 'Bangka', 'Boat', Ship)]
export const paceOpts = [o('relax', 'Relaks', 'Relaxed'), o('mid', 'Katamtaman', 'Balanced'), o('packed', 'Siksik', 'Packed')]
export const needOpts = [o('wheelchair', 'Wheelchair access', 'Wheelchair access', Accessibility), o('pet', 'Pet-friendly', 'Pet-friendly', PawPrint), o('kid', 'Kid-friendly', 'Kid-friendly', Baby)]
export const ageOpts = [o('18-24', '18–24', '18–24'), o('25-34', '25–34', '25–34'), o('35-44', '35–44', '35–44'), o('45-59', '45–59', '45–59'), o('60+', '60+', '60+'), o('na', 'Ayokong sabihin', 'Prefer not to say')]

export const PH_PLACES = [
  'Maynila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Pasay', 'Caloocan', 'Marikina', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Mandaluyong', 'San Juan', 'Valenzuela', 'Antipolo, Rizal', 'Bacoor, Cavite', 'Tagaytay, Cavite', 'Calamba, Laguna', 'Santa Rosa, Laguna', 'Batangas City', 'Lipa, Batangas', 'Angeles, Pampanga', 'San Fernando, Pampanga', 'Malolos, Bulacan', 'Baguio', 'Vigan, Ilocos Sur', 'Laoag, Ilocos Norte', 'Naga, Camarines Sur', 'Legazpi, Albay', 'Puerto Princesa, Palawan', 'El Nido, Palawan', 'Iloilo City', 'Bacolod', 'Cebu City', 'Lapu-Lapu, Cebu', 'Tagbilaran, Bohol', 'Dumaguete', 'Tacloban', 'Cagayan de Oro', 'Davao City', 'General Santos', 'Zamboanga City', 'Siargao, Surigao del Norte',
]

/** Estimated date of the last trip, from the answer and when it was given. */
export function lastTripDate(p: TravelerPrefs) {
  if (!p.lastTrip || p.lastTrip === 'never' || !p.lastTripAt) return null
  return new Date(new Date(p.lastTripAt).getTime() - lastTripOffset[p.lastTrip] * 864e5).getTime() || null
}

export function relativeTrip(p: TravelerPrefs, lang: 'tl' | 'en', now = Date.now()) {
  if (p.lastTrip === 'never') return lang === 'en' ? 'Not yet' : 'Wala pa'
  const d = lastTripDate(p)
  if (!d) return null
  const days = Math.max(0, Math.round((now - d) / 864e5))
  if (days < 7) return lang === 'en' ? 'This week' : 'Ngayong linggo'
  if (days < 30) return lang === 'en' ? `${days} days ago` : `${days} araw na ang nakaraan`
  const m = Math.round(days / 30)
  if (m < 12) return lang === 'en' ? `${m} month${m > 1 ? 's' : ''} ago` : `${m} buwan na ang nakaraan`
  const y = Math.max(1, Math.round(days / 365))
  return lang === 'en' ? `${y} year${y > 1 ? 's' : ''} ago` : `${y} taon na ang nakaraan`
}

/** True when the last trip is over 3 months ago (and not confirmed in the last 30 days), so we ask if it is still right. */
export function isStale(p: TravelerPrefs, now = Date.now()) {
  const d = lastTripDate(p)
  if (!d || now - d <= 90 * 864e5) return false
  return !p.tripCheckedAt || now - new Date(p.tripCheckedAt).getTime() > 30 * 864e5
}

/* ------------------------------ Business ------------------------------ */

export const bizThemes: (ThemeDef<BizThemeId> & { required?: boolean })[] = [
  { id: 'basics', icon: Store, tl: 'Negosyo', en: 'Business basics', introTl: 'Simulan natin sa pangalan at uri ng negosyo mo.', introEn: "Let's start with your business name and type.", required: true, minutes: 1 },
  { id: 'location', icon: MapPin, tl: 'Lokasyon', en: 'Location', introTl: 'Saan ka mahahanap ng mga biyahero?', introEn: 'Where can travelers find you?', required: true, minutes: 2 },
  { id: 'hours', icon: Clock, tl: 'Oras', en: 'Opening hours', introTl: 'Kailan kayo bukas? Puwedeng kopyahin sa lahat ng araw.', introEn: "When are you open? You can copy to all days.", required: true, minutes: 2 },
  { id: 'contact', icon: Phone, tl: 'Contact', en: 'Contact', introTl: 'Sino ang puwedeng tawagan ng team at ng customers?', introEn: 'Who can the team and customers contact?', required: true, minutes: 1 },
  { id: 'menu', icon: ListChecks, tl: 'Menu at Presyo', en: 'Menu and prices', introTl: 'Ilista ang ilang item at presyo. Puwedeng dagdagan mamaya.', introEn: 'List a few items and prices. You can add more later.', minutes: 2 },
  { id: 'photos', icon: Image, tl: 'Larawan', en: 'Photos', introTl: 'Ang magandang larawan ay umaakit ng bisita!', introEn: 'Great photos bring in visitors!', minutes: 2 },
  { id: 'about', icon: Building2, tl: 'Kuwento', en: 'About', introTl: 'Ikuwento ang negosyo mo sa ilang salita.', introEn: 'Tell your story in a few words.', minutes: 2 },
  { id: 'online', icon: Globe, tl: 'Online', en: 'Online', introTl: 'Saan pa kayo makikita online?', introEn: 'Where else can people find you online?', minutes: 1 },
  { id: 'goals', icon: Target, tl: 'Mga Layunin', en: 'Goals', introTl: 'Ano ang gusto mong makamit sa Bitinary?', introEn: 'What do you want from Bitinary?', minutes: 1 },
  { id: 'verify', icon: BadgeCheck, tl: 'Beripikasyon', en: 'Verification', introTl: 'Mag-verify para makuha ang badge at mas maraming tools.', introEn: 'Verify to unlock the badge and more tools.', minutes: 2 },
]
export const REQUIRED_BIZ: BizThemeId[] = ['basics', 'location', 'hours', 'contact']

export const bizTypeOpts = [o('kainan', 'Kainan', 'Restaurant'), o('kapihan', 'Kapihan', 'Café'), o('resort', 'Resort', 'Resort'), o('tour', 'Tour', 'Tour'), o('pasyalan', 'Pasyalan', 'Attraction'), o('pasalubong', 'Pasalubong', 'Souvenirs'), o('other', 'Iba pa', 'Other')]
export const priceOpts = [o('₱', '₱', '₱'), o('₱₱', '₱₱', '₱₱'), o('₱₱₱', '₱₱₱', '₱₱₱')]
export const priceHint: Record<string, [string, string]> = { '₱': ['Wala pang ₱200', 'Under ₱200'], '₱₱': ['₱200 hanggang ₱600', '₱200 to ₱600'], '₱₱₱': ['Mahigit ₱600', 'Over ₱600'] }
export const goalOpts = [o('customers', 'Mas maraming customer', 'More customers'), o('deals', 'Mag-alok ng deals', 'Offer deals'), o('reels', 'Gumawa ng reels', 'Make reels'), o('reservations', 'Tumanggap ng reservation', 'Take reservations'), o('trends', 'Makita ang trends', 'See trends')]
export const langOpts = ['Tagalog', 'English', 'Bisaya', 'Ilokano', 'Kapampangan', 'Hiligaynon', 'Bikol']
export const menuCategories = ['Ulam', 'Merienda', 'Inumin', 'Panghimagas', 'Iba pa']
export const dayLabel: Record<string, [string, string]> = { mon: ['Lunes', 'Monday'], tue: ['Martes', 'Tuesday'], wed: ['Miyerkules', 'Wednesday'], thu: ['Huwebes', 'Thursday'], fri: ['Biyernes', 'Friday'], sat: ['Sabado', 'Saturday'], sun: ['Linggo', 'Sunday'] }
