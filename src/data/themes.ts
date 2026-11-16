import {
  Accessibility,
  Baby,
  BadgeCheck,
  Bike,
  Building2,
  Bus,
  CalendarClock,
  Camera,
  Car,
  CarTaxiFront,
  Clock,
  Coffee,
  Croissant,
  Fish,
  Flame,
  Globe,
  Heart,
  Image,
  Landmark,
  Leaf,
  ListChecks,
  MapPin,
  Moon,
  Motorbike,
  Mountain,
  PawPrint,
  Phone,
  Plane,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Soup,
  Store,
  Target,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
  Waves,
  Wine,
  type LucideIcon,
} from "lucide-react"
import type { BizThemeId, TravelerPrefs, TravelerThemeId } from "@/app/account"

export type Opt = { id: string; tl: string; en: string; icon?: LucideIcon }
const o = (id: string, tl: string, en: string, icon?: LucideIcon): Opt => ({
  id,
  tl,
  en,
  icon,
})
export const label = (
  opts: Opt[],
  id: string | undefined,
  lang: "tl" | "en",
) => {
  const x = opts.find((p) => p.id === id)
  return x ? x[lang] : undefined
}

export type ThemeDef<Id extends string,> = {
  id: Id
  icon: LucideIcon
  tl: string
  en: string
  introTl: string
  introEn: string
  optional?: boolean
  minutes: number
}

/* ------------------------------ Traveler ------------------------------ */

export const travelerThemes: ThemeDef<TravelerThemeId>[] = [
  {
    id: "trip",
    icon: Plane,
    tl: "Huling Biyahe",
    en: "Travel history",
    introTl: "Kuwentuhan tayo! Kailan ka huling gumala?",
    introEn: "Let's chat! When did you last travel?",
    minutes: 1,
  },
  {
    id: "budget",
    icon: Wallet,
    tl: "Budget",
    en: "Budget",
    introTl: "Magkano ang komportable sa bulsa mo?",
    introEn: "How much feels comfortable to spend?",
    minutes: 1,
  },
  {
    id: "food",
    icon: UtensilsCrossed,
    tl: "Pagkain",
    en: "Food",
    introTl: "Ano ang paborito mong kainin?",
    introEn: "What do you love to eat?",
    minutes: 1,
  },
  {
    id: "interests",
    icon: Heart,
    tl: "Mga Gusto",
    en: "Interests",
    introTl: "Saan ka masaya gumala?",
    introEn: "Where do you love to explore?",
    minutes: 1,
  },
  {
    id: "companions",
    icon: Users,
    tl: "Kasama at Biyahe",
    en: "Companions and transport",
    introTl: "Sino ang kasama mo, at paano kayo bumibiyahe?",
    introEn: "Who do you travel with, and how do you get around?",
    minutes: 2,
  },
  {
    id: "needs",
    icon: Accessibility,
    tl: "Kailangan",
    en: "Accessibility needs",
    introTl: "May kailangan ba para komportable ang lakad?",
    introEn: "Anything that makes trips easier for you?",
    optional: true,
    minutes: 1,
  },
  {
    id: "about",
    icon: UserRound,
    tl: "Tungkol Sa Iyo",
    en: "About you",
    introTl: "Kaunting kuwento tungkol sa iyo, kung gusto mo lang.",
    introEn: "A little about you, only if you want.",
    optional: true,
    minutes: 1,
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    tl: "Privacy at Pahintulot",
    en: "Privacy and permissions",
    introTl: "Ikaw ang may kontrol. Pumili kung ano ang papayagan mo.",
    introEn: "You're in control. Choose what you allow.",
    minutes: 1,
  },
]

export const lastTripOpts = [
  o("week", "Ngayong linggo", "This week"),
  o("month", "Ngayong buwan", "This month"),
  o("1-3m", "1 hanggang 3 buwan na", "1 to 3 months ago"),
  o("3-12m", "3 hanggang 12 buwan na", "3 to 12 months ago"),
  o("year", "Mahigit isang taon na", "Over a year"),
  o("never", "Hindi pa", "Never"),
]
/** Approximate days between the answer and the actual last trip. */
const lastTripOffset: Record<string, number> = {
  week: 3,
  month: 15,
  "1-3m": 60,
  "3-12m": 200,
  year: 400,
}
export const frequencyOpts = [
  o("weekly", "Linggo-linggo", "Weekly"),
  o("monthly", "Buwan-buwan", "Monthly"),
  o("few", "Ilang beses sa isang taon", "A few times a year"),
  o("rare", "Paminsan-minsan", "Rarely"),
]
export const nextTripOpts = [
  o("week", "Ngayong linggo", "This week"),
  o("month", "Ngayong buwan", "This month"),
  o("3m", "Sa loob ng 3 buwan", "Within 3 months"),
  o("none", "Wala pang plano", "No plans yet"),
]

export const foodOpts = [
  o("street", "Street food", "Street food", Flame),
  o("local", "Lutong-bahay", "Home-style Filipino", Soup),
  o("coffee", "Kape", "Coffee", Coffee),
  o("seafood", "Seafood", "Seafood", Fish),
  o("dessert", "Panghimagas", "Desserts and bakery", Croissant),
  o("fine", "Fine dining", "Fine dining", Wine),
]
export const dietOpts = [
  o("halal", "Halal", "Halal"),
  o("vegetarian", "Vegetarian", "Vegetarian", Leaf),
  o("nopork", "Walang baboy", "No pork"),
  o("allergy", "May allergy", "Allergy"),
]

export const interestOpts = [
  o("beach", "Dagat", "Beach", Waves),
  o("mountain", "Bundok", "Mountains", Mountain),
  o("heritage", "Heritage", "Heritage", Landmark),
  o("nightlife", "Nightlife", "Nightlife", Moon),
  o("photo", "Photo spots", "Photo spots", Camera),
  o("shopping", "Pamimili", "Shopping", ShoppingBag),
  o("quiet", "Tahimik na lugar", "Quiet places", Leaf),
]
export const companionOpts = [
  o("solo", "Mag-isa", "Solo"),
  o("partner", "Partner", "Partner"),
  o("family", "Pamilya", "Family"),
  o("friends", "Barkada", "Friends"),
  o("kids", "May bata", "With kids"),
]
export const transportOpts = [
  o("car", "Sasakyan", "Car", Car),
  o("motor", "Motor", "Motorbike", Motorbike),
  o("commute", "Jeep o bus", "Jeep or bus", Bus),
  o("grab", "Grab o taxi", "Grab or taxi", CarTaxiFront),
  o("walk", "Lakad o bisikleta", "Walk or bike", Bike),
  o("boat", "Bangka", "Boat", Ship),
]
export const paceOpts = [
  o("relax", "Relaks", "Relaxed"),
  o("mid", "Katamtaman", "Balanced"),
  o("packed", "Siksik", "Packed"),
]
export const needOpts = [
  o("wheelchair", "Wheelchair access", "Wheelchair access", Accessibility),
  o("pet", "Pet-friendly", "Pet-friendly", PawPrint),
  o("kid", "Kid-friendly", "Kid-friendly", Baby),
]
export const ageOpts = [
  o("18-24", "18–24", "18–24"),
  o("25-34", "25–34", "25–34"),
  o("35-44", "35–44", "35–44"),
  o("45-59", "45–59", "45–59"),
  o("60+", "60+", "60+"),
  o("na", "Ayokong sabihin", "Prefer not to say"),
]

/** Estimated date of the last trip, from the answer and when it was given. */
export function lastTripDate(p: TravelerPrefs) {
  if (!p.lastTrip || p.lastTrip === "never" || !p.lastTripAt) return null
  return (
    new Date(
      new Date(p.lastTripAt).getTime() - lastTripOffset[p.lastTrip] * 864e5,
    ).getTime() || null
  )
}

export function relativeTrip(
  p: TravelerPrefs,
  lang: "tl" | "en",
  now = Date.now(),
) {
  if (p.lastTrip === "never") return lang === "en" ? "Not yet" : "Wala pa"
  const d = lastTripDate(p)
  if (!d) return null
  const days = Math.max(0, Math.round((now - d) / 864e5))
  if (days < 7) return lang === "en" ? "This week" : "Ngayong linggo"
  if (days < 30)
    return lang === "en" ? `${days} days ago` : `${days} araw na ang nakaraan`
  const m = Math.round(days / 30)
  if (m < 12)
    return lang === "en"
      ? `${m} month${m > 1 ? "s" : ""} ago`
      : `${m} buwan na ang nakaraan`
  const y = Math.max(1, Math.round(days / 365))
  return lang === "en"
    ? `${y} year${y > 1 ? "s" : ""} ago`
    : `${y} taon na ang nakaraan`
}

/** True when the last trip is over 3 months ago (and not confirmed in the last 30 days), so we ask if it is still right. */
export function isStale(p: TravelerPrefs, now = Date.now()) {
  const d = lastTripDate(p)
  if (!d || now - d <= 90 * 864e5) return false
  return (
    !p.tripCheckedAt || now - new Date(p.tripCheckedAt).getTime() > 30 * 864e5
  )
}

/* ------------------------------ Business ------------------------------ */

export const bizThemes: (ThemeDef<BizThemeId> & { required?: boolean })[] = [
  {
    id: "basics",
    icon: Store,
    tl: "Negosyo",
    en: "Business basics",
    introTl: "Simulan natin sa pangalan at uri ng negosyo mo.",
    introEn: "Let's start with your business name and type.",
    required: true,
    minutes: 1,
  },
  {
    id: "location",
    icon: MapPin,
    tl: "Lokasyon",
    en: "Location",
    introTl: "Saan ka mahahanap ng mga biyahero?",
    introEn: "Where can travelers find you?",
    required: true,
    minutes: 2,
  },
  {
    id: "hours",
    icon: Clock,
    tl: "Oras",
    en: "Opening hours",
    introTl: "Kailan kayo bukas? Puwedeng kopyahin sa lahat ng araw.",
    introEn: "When are you open? You can copy to all days.",
    required: true,
    minutes: 2,
  },
  {
    id: "contact",
    icon: Phone,
    tl: "Contact",
    en: "Contact",
    introTl: "Sino ang puwedeng tawagan ng team at ng customers?",
    introEn: "Who can the team and customers contact?",
    required: true,
    minutes: 1,
  },
  {
    id: "menu",
    icon: ListChecks,
    tl: "Menu at Presyo",
    en: "Menu and prices",
    introTl: "Ilista ang ilang item at presyo. Puwedeng dagdagan mamaya.",
    introEn: "List a few items and prices. You can add more later.",
    minutes: 2,
  },
  {
    id: "photos",
    icon: Image,
    tl: "Larawan",
    en: "Photos",
    introTl: "Ang magandang larawan ay umaakit ng bisita!",
    introEn: "Great photos bring in visitors!",
    minutes: 2,
  },
  {
    id: "about",
    icon: Building2,
    tl: "Kuwento",
    en: "About",
    introTl: "Ikuwento ang negosyo mo sa ilang salita.",
    introEn: "Tell your story in a few words.",
    minutes: 2,
  },
  {
    id: "online",
    icon: Globe,
    tl: "Online",
    en: "Online",
    introTl: "Saan pa kayo makikita online?",
    introEn: "Where else can people find you online?",
    minutes: 1,
  },
  {
    id: "goals",
    icon: Target,
    tl: "Mga Layunin",
    en: "Goals",
    introTl: "Ano ang gusto mong makamit sa Bitinary?",
    introEn: "What do you want from Bitinary?",
    minutes: 1,
  },
  {
    id: "verify",
    icon: BadgeCheck,
    tl: "Beripikasyon",
    en: "Verification",
    introTl: "Mag-verify para makuha ang badge at mas maraming tools.",
    introEn: "Verify to unlock the badge and more tools.",
    minutes: 2,
  },
]
export const REQUIRED_BIZ: BizThemeId[] = [
  "basics",
  "location",
  "hours",
  "contact",
]

export const bizTypeOpts = [
  o("kainan", "Kainan", "Restaurant"),
  o("kapihan", "Kapihan", "Café"),
  o("resort", "Resort", "Resort"),
  o("tour", "Tour", "Tour"),
  o("pasyalan", "Pasyalan", "Attraction"),
  o("pasalubong", "Pasalubong", "Souvenirs"),
  o("other", "Iba pa", "Other"),
]
export const priceOpts = [
  o("₱", "₱", "₱"),
  o("₱₱", "₱₱", "₱₱"),
  o("₱₱₱", "₱₱₱", "₱₱₱"),
]
export const priceHint: Record<string, [string, string]> = {
  "₱": ["Wala pang ₱200", "Under ₱200"],
  "₱₱": ["₱200 hanggang ₱600", "₱200 to ₱600"],
  "₱₱₱": ["Mahigit ₱600", "Over ₱600"],
}
export const goalOpts = [
  o("customers", "Mas maraming customer", "More customers"),
  o("deals", "Mag-alok ng deals", "Offer deals"),
  o("reels", "Gumawa ng reels", "Make reels"),
  o("reservations", "Tumanggap ng reservation", "Take reservations"),
  o("trends", "Makita ang trends", "See trends"),
]
export const langOpts = [
  "Tagalog",
  "English",
  "Bisaya",
  "Ilokano",
  "Kapampangan",
  "Hiligaynon",
  "Bikol",
]
export const menuCategories = [
  "Ulam",
  "Merienda",
  "Inumin",
  "Panghimagas",
  "Iba pa",
]
export const dayLabel: Record<string, [string, string]> = {
  mon: ["Lunes", "Monday"],
  tue: ["Martes", "Tuesday"],
  wed: ["Miyerkules", "Wednesday"],
  thu: ["Huwebes", "Thursday"],
  fri: ["Biyernes", "Friday"],
  sat: ["Sabado", "Saturday"],
  sun: ["Linggo", "Sunday"],
}

/* ------------------------------ Dynamic Offerings per Business Type ------------------------------ */

export type OfferingThemeConfig = {
  themeTitle: { tl: string; en: string }
  themeIntro: { tl: string; en: string }
  sectionTitle: { tl: string; en: string }
  sectionHint: { tl: string; en: string }
  itemPlaceholder: { tl: string; en: string }
  categories: string[]
  addButtonLabel: { tl: string; en: string }
  priceLabel: { tl: string; en: string }
  quickUpdateTitle: { tl: string; en: string }
  quickUpdateCountLabel: (count: number, lang: "tl" | "en") => string
  icon: LucideIcon
}

export const offeringThemeConfigs: Record<string, OfferingThemeConfig> = {
  kainan: {
    themeTitle: { tl: "Menu at Presyo", en: "Menu & Price List" },
    themeIntro: {
      tl: "Ilista ang ilang putahe, ulam at inumin kasama ang presyo. Puwedeng dagdagan mamaya.",
      en: "List dishes, meals and drinks with their prices. You can add more later.",
    },
    sectionTitle: { tl: "Mga putahe at presyo", en: "Dishes and prices" },
    sectionHint: {
      tl: "I-type ang pangalan ng pagkain, presyo at kategorya. Puwedeng dagdagan mamaya sa Quick Update.",
      en: "Type the dish name, price and category. Add more later from Quick Update.",
    },
    itemPlaceholder: {
      tl: "hal. Sinigang na Baboy, Crispy Pata, Sisig",
      en: "e.g. Pork Sinigang, Crispy Pata, Sisig",
    },
    categories: [
      "Ulam",
      "Merienda",
      "Inumin",
      "Panghimagas",
      "Combo Meals",
      "Specialty",
    ],
    addButtonLabel: { tl: "Magdagdag ng putahe", en: "Add dish to menu" },
    priceLabel: { tl: "Presyo", en: "Price" },
    quickUpdateTitle: { tl: "Magdagdag ng menu item", en: "Add a menu item" },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en" ? `${c} menu items` : `${c} item sa menu`,
    icon: UtensilsCrossed,
  },
  kapihan: {
    themeTitle: { tl: "Menu at Presyo", en: "Menu & Price List" },
    themeIntro: {
      tl: "Ilista ang mga kape, inumin, pastry at meryenda kasama ang presyo.",
      en: "List coffee, drinks, pastries and snacks with their prices.",
    },
    sectionTitle: {
      tl: "Mga kape, inumin at pastry",
      en: "Coffee, drinks and pastries",
    },
    sectionHint: {
      tl: "I-type ang pangalan ng inumin o kape, presyo at kategorya.",
      en: "Type the drink or coffee name, price and category.",
    },
    itemPlaceholder: {
      tl: "hal. Iced Spanish Latte, Barako Drip, Croissant",
      en: "e.g. Iced Spanish Latte, Barako Drip, Croissant",
    },
    categories: [
      "Kape (Hot)",
      "Kape (Iced)",
      "Non-Coffee",
      "Pastry & Bread",
      "Meryenda",
      "Dessert",
    ],
    addButtonLabel: {
      tl: "Magdagdag ng inumin o pastry",
      en: "Add drink or pastry",
    },
    priceLabel: { tl: "Presyo", en: "Price" },
    quickUpdateTitle: {
      tl: "Magdagdag ng item sa menu",
      en: "Add a menu item",
    },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en" ? `${c} menu items` : `${c} item sa menu`,
    icon: Coffee,
  },
  resort: {
    themeTitle: {
      tl: "Mga Kuwarto, Cottage at Deals",
      en: "Rooms, Cottages & Deals",
    },
    themeIntro: {
      tl: "Ilista ang mga kuwarto, villa, cottage, day tour rates at special deals.",
      en: "List rooms, villas, cottages, day tour passes, and special promo deals.",
    },
    sectionTitle: {
      tl: "Mga kuwarto, cottage, pasilidad at deals",
      en: "Rooms, cottages, facilities and deals",
    },
    sectionHint: {
      tl: "Ilagay ang pangalan ng kuwarto o deal, rate (kada gabi o araw), at kategorya.",
      en: "Enter the room or deal name, rate per night or day pass, and category.",
    },
    itemPlaceholder: {
      tl: "hal. Deluxe Ocean Villa, Family Cottage, Day Pass",
      en: "e.g. Deluxe Ocean Villa, Family Cottage, Day Pass",
    },
    categories: [
      "Kuwarto (Standard)",
      "Deluxe / Villa",
      "Cottage / Gazebo",
      "Day Tour Pass",
      "Overnight Promo",
      "Barkada Deal",
      "Pasilidad / Activity",
    ],
    addButtonLabel: {
      tl: "Magdagdag ng kuwarto o deal",
      en: "Add room or deal",
    },
    priceLabel: { tl: "Rate", en: "Rate" },
    quickUpdateTitle: {
      tl: "Magdagdag ng kuwarto o promo deal",
      en: "Add a room or promo deal",
    },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en"
        ? `${c} rooms/deals listed`
        : `${c} kuwarto/deal na nakalista`,
    icon: Waves,
  },
  pasyalan: {
    themeTitle: {
      tl: "Mga Ticket, Passes at Deals",
      en: "Tickets, Passes & Deals",
    },
    themeIntro: {
      tl: "Ilista ang entrance fees, tour passes, activity tickets at group deals.",
      en: "List entrance fees, passes, activity tickets, and special admission deals.",
    },
    sectionTitle: {
      tl: "Mga entrance fee, activity pass at deals",
      en: "Entrance fees, activity passes and deals",
    },
    sectionHint: {
      tl: "Ilagay ang uri ng ticket o pass, presyo kada tao o grupo, at kategorya.",
      en: "Enter ticket or pass type, price per person or group, and category.",
    },
    itemPlaceholder: {
      tl: "hal. General Admission, Kids / Senior Pass, Sunset Deck",
      en: "e.g. General Admission, Kids / Senior Pass, Sunset Deck",
    },
    categories: [
      "General Admission",
      "Kids / Student / Senior",
      "VIP Pass",
      "Activity Ticket",
      "Group Package",
      "Early Bird Deal",
    ],
    addButtonLabel: {
      tl: "Magdagdag ng ticket o deal",
      en: "Add ticket or deal",
    },
    priceLabel: { tl: "Entrance / Rate", en: "Entrance / Rate" },
    quickUpdateTitle: {
      tl: "Magdagdag ng ticket o deal",
      en: "Add a ticket or deal",
    },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en"
        ? `${c} tickets/deals listed`
        : `${c} ticket/deal na nakalista`,
    icon: Landmark,
  },
  tour: {
    themeTitle: {
      tl: "Mga Tour, Package at Deals",
      en: "Tours, Packages & Deals",
    },
    themeIntro: {
      tl: "Ilista ang mga itinerary packages, day tours, bangka rental at promo deals.",
      en: "List tour itineraries, day trips, boat rentals, and package deals.",
    },
    sectionTitle: {
      tl: "Mga tour package at rates",
      en: "Tour packages and rates",
    },
    sectionHint: {
      tl: "Ilagay ang tour name, rate kada tao o bangka, at kategorya.",
      en: "Enter tour package name, rate per person or boat, and category.",
    },
    itemPlaceholder: {
      tl: "hal. Island Hopping Tour A, City Heritage Walk",
      en: "e.g. Island Hopping Tour A, City Heritage Walk",
    },
    categories: [
      "Island Hopping",
      "Day Tour",
      "Heritage / Walking Tour",
      "Private Charter",
      "Joiner Promo",
      "Full Package Deal",
    ],
    addButtonLabel: { tl: "Magdagdag ng tour package", en: "Add tour package" },
    priceLabel: { tl: "Rate", en: "Rate" },
    quickUpdateTitle: {
      tl: "Magdagdag ng tour o package",
      en: "Add tour or package",
    },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en" ? `${c} tour packages` : `${c} tour package na nakalista`,
    icon: Ship,
  },
  pasalubong: {
    themeTitle: { tl: "Mga Produkto at Presyo", en: "Products & Price List" },
    themeIntro: {
      tl: "Ilista ang mga paboritong pasalubong, lokal na delicacies, handicrafts at presyo.",
      en: "List popular souvenirs, local delicacies, handicrafts, and prices.",
    },
    sectionTitle: {
      tl: "Mga produkto, delicacies at souvenir",
      en: "Products, delicacies and souvenirs",
    },
    sectionHint: {
      tl: "Ilagay ang pangalan ng produkto, presyo, at kategorya.",
      en: "Enter the product name, price, and category.",
    },
    itemPlaceholder: {
      tl: "hal. Dried Mangoes (200g), Piña Barong, Handwoven Bag",
      en: "e.g. Dried Mangoes (200g), Piña Barong, Handwoven Bag",
    },
    categories: [
      "Pagkain / Delicacy",
      "Handicrafts",
      "Damit / Fabric",
      "Souvenir Item",
      "Gift Set / Box",
    ],
    addButtonLabel: { tl: "Magdagdag ng produkto", en: "Add product" },
    priceLabel: { tl: "Presyo", en: "Price" },
    quickUpdateTitle: { tl: "Magdagdag ng produkto", en: "Add a product" },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en" ? `${c} products listed` : `${c} produkto na nakalista`,
    icon: ShoppingBag,
  },
  other: {
    themeTitle: {
      tl: "Mga Iniaalok, Serbisyo at Deals",
      en: "Services, Rates & Deals",
    },
    themeIntro: {
      tl: "Ilista ang inyong mga serbisyo, produkto o deals kasama ang presyo.",
      en: "List your services, products, or deals with their prices.",
    },
    sectionTitle: {
      tl: "Mga serbisyo, produkto at deals",
      en: "Services, products and deals",
    },
    sectionHint: {
      tl: "Ilagay ang serbisyo o deal, presyo, at kategorya.",
      en: "Enter service or deal, price, and category.",
    },
    itemPlaceholder: {
      tl: "hal. Standard Service, Package A, Hourly Rate",
      en: "e.g. Standard Service, Package A, Hourly Rate",
    },
    categories: [
      "Serbisyo / Service",
      "Package Deal",
      "Rental",
      "Promo / Discount",
      "Iba pa",
    ],
    addButtonLabel: {
      tl: "Magdagdag ng iniaalok o deal",
      en: "Add offering or deal",
    },
    priceLabel: { tl: "Presyo / Rate", en: "Price / Rate" },
    quickUpdateTitle: { tl: "Magdagdag ng iniaalok", en: "Add an offering" },
    quickUpdateCountLabel: (c, lang) =>
      lang === "en" ? `${c} items listed` : `${c} item na nakalista`,
    icon: ListChecks,
  },
}

export type BizTypeId = keyof typeof offeringThemeConfigs

const bizTypeAliases: Record<string, BizTypeId> = {
  kainan: "kainan",
  restaurant: "kainan",
  food: "kainan",
  dining: "kainan",
  kapihan: "kapihan",
  cafe: "kapihan",
  coffee: "kapihan",
  resort: "resort",
  tour: "tour",
  tours: "tour",
  pasyalan: "pasyalan",
  attraction: "pasyalan",
  attractions: "pasyalan",
  "tourist attraction": "pasyalan",
  pasalubong: "pasalubong",
  souvenir: "pasalubong",
  souvenirs: "pasalubong",
  "souvenir shop": "pasalubong",
  shop: "pasalubong",
  other: "other",
  "iba pa": "other",
}

export function normalizeBizType(
  bizType?: string | null,
): BizTypeId | undefined {
  const normalized = bizType
    ?.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  return normalized ? bizTypeAliases[normalized] : undefined
}

export function getOfferingConfig(bizType?: string): OfferingThemeConfig {
  const type = normalizeBizType(bizType)
  return offeringThemeConfigs[type ?? "other"]
}

export function normalizeMenuCategories<T extends { category: string }>(
  items: T[],
  bizType?: string,
): T[] {
  const type = normalizeBizType(bizType)
  if (!type) return items
  const categories = offeringThemeConfigs[type].categories
  return items.map((item) => ({
    ...item,
    category: categories.includes(item.category)
      ? item.category
      : categories[0],
  }))
}

export function getBizThemesForType(
  bizType?: string,
): (ThemeDef<BizThemeId> & { required?: boolean })[] {
  const type = normalizeBizType(bizType)
  if (!type) return bizThemes
  const conf = offeringThemeConfigs[type]
  return bizThemes.map((t) => {
    if (t.id === "menu") {
      return {
        ...t,
        icon: conf.icon,
        tl: conf.themeTitle.tl,
        en: conf.themeTitle.en,
        introTl: conf.themeIntro.tl,
        introEn: conf.themeIntro.en,
      }
    }
    return t
  })
}
