/** Fictional sample users so the console user list looks like a real app. Read-only except suspend. */
export type SampleUser = { id: string; name: string; email?: string; mobile?: string; role: 'traveler' | 'business'; method: 'google' | 'mobile' | 'email'; city: string; joinedDaysAgo: number; activeDaysAgo: number; reviews: number; comments: number }

export const sampleUsers: SampleUser[] = [
  { id: 's-maria', name: 'Maria Santos', email: 'maria.santos@example.ph', role: 'traveler', method: 'google', city: 'Quezon City', joinedDaysAgo: 210, activeDaysAgo: 0, reviews: 14, comments: 32 },
  { id: 's-jose', name: 'Jose Ramirez', mobile: '9175550101', role: 'traveler', method: 'mobile', city: 'Cebu City', joinedDaysAgo: 180, activeDaysAgo: 1, reviews: 6, comments: 11 },
  { id: 's-ana', name: 'Ana Villanueva', email: 'ana.v@example.ph', role: 'traveler', method: 'email', city: 'Davao City', joinedDaysAgo: 160, activeDaysAgo: 3, reviews: 9, comments: 20 },
  { id: 's-paolo', name: 'Paolo Mendoza', email: 'paolo.m@example.ph', role: 'traveler', method: 'google', city: 'Iloilo City', joinedDaysAgo: 150, activeDaysAgo: 0, reviews: 21, comments: 47 },
  { id: 's-liza', name: 'Liza Fernandez', mobile: '9185550133', role: 'business', method: 'mobile', city: 'Maynila', joinedDaysAgo: 140, activeDaysAgo: 2, reviews: 0, comments: 5 },
  { id: 's-ramon', name: 'Ramon Cruz', email: 'ramon@lechonniramon.ph', role: 'business', method: 'email', city: 'Cebu City', joinedDaysAgo: 120, activeDaysAgo: 1, reviews: 0, comments: 2 },
  { id: 's-kim', name: 'Kim Soriano', email: 'kim.soriano@example.ph', role: 'traveler', method: 'google', city: 'Makati', joinedDaysAgo: 110, activeDaysAgo: 12, reviews: 3, comments: 4 },
  { id: 's-bea', name: 'Bea Reyes', mobile: '9205550188', role: 'traveler', method: 'mobile', city: 'Pasig', joinedDaysAgo: 98, activeDaysAgo: 0, reviews: 7, comments: 15 },
  { id: 's-carlo', name: 'Carlo Mercado', email: 'carlo.m@example.ph', role: 'traveler', method: 'email', city: 'Taguig', joinedDaysAgo: 90, activeDaysAgo: 5, reviews: 11, comments: 9 },
  { id: 's-nena', name: 'Nena Bautista', mobile: '9175550199', role: 'business', method: 'mobile', city: 'Intramuros', joinedDaysAgo: 85, activeDaysAgo: 0, reviews: 0, comments: 8 },
  { id: 's-mark', name: 'Mark Lim', email: 'mark.lim@example.ph', role: 'traveler', method: 'google', city: 'Baguio', joinedDaysAgo: 70, activeDaysAgo: 30, reviews: 2, comments: 1 },
  { id: 's-joy', name: 'Joy Tan', email: 'joy.tan@example.ph', role: 'traveler', method: 'email', city: 'Bacolod', joinedDaysAgo: 64, activeDaysAgo: 2, reviews: 8, comments: 13 },
  { id: 's-tonyo', name: 'Antonio Garcia', mobile: '9195550144', role: 'business', method: 'mobile', city: 'Binondo', joinedDaysAgo: 55, activeDaysAgo: 4, reviews: 0, comments: 3 },
  { id: 's-rica', name: 'Rica Navarro', email: 'rica.n@example.ph', role: 'traveler', method: 'google', city: 'Cagayan de Oro', joinedDaysAgo: 40, activeDaysAgo: 0, reviews: 5, comments: 22 },
  { id: 's-gab', name: 'Gab Aquino', mobile: '9175550177', role: 'traveler', method: 'mobile', city: 'Batangas', joinedDaysAgo: 28, activeDaysAgo: 1, reviews: 1, comments: 6 },
  { id: 's-ella', name: 'Ella Dizon', email: 'ella@kapihanreal.ph', role: 'business', method: 'email', city: 'Intramuros', joinedDaysAgo: 21, activeDaysAgo: 0, reviews: 0, comments: 4 },
  { id: 's-migs', name: 'Miguel Torres', email: 'migs.t@example.ph', role: 'traveler', method: 'google', city: 'Dumaguete', joinedDaysAgo: 9, activeDaysAgo: 0, reviews: 2, comments: 3 },
  { id: 's-jessa', name: 'Jessa Ocampo', mobile: '9265550122', role: 'traveler', method: 'mobile', city: 'Laguna', joinedDaysAgo: 3, activeDaysAgo: 0, reviews: 0, comments: 2 },
]
