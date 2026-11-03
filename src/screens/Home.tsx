import { Bell, ChevronDown, Heart, MapPin, Search as SearchIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useGreetingName } from '@/app/account'
import { useStore } from '@/app/store'
import { ForYou, GuestBanner } from '@/components/home/ForYou'
import { CategoryTile, categories } from '@/components/cards/CategoryTile'
import { ItineraryCard } from '@/components/cards/ItineraryCard'
import { ListingCard, ListingSkeleton } from '@/components/cards/ListingCard'
import { PromoCarousel } from '@/components/cards/PromoCarousel'
import { ReelCard } from '@/components/cards/ReelCard'
import { SponsoredCard } from '@/components/cards/SponsoredCard'
import { InstallBanner, OfflineBanner } from '@/components/layout/Banners'
import { Jimbot } from '@/components/mascot/Jimbot'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { HScroll, SectionHeader } from '@/components/ui/Section'
import { BusinessCard, businessesFirst } from '@/components/cards/BusinessCard'
import { Sheet } from '@/components/ui/Sheet'
import { itineraries } from '@/data/itineraries'
import { places } from '@/data/places'
import { reels } from '@/data/reels'
import { isForced } from '@/lib/forced'
import { useOpen } from '@/lib/useOpen'
import { cardGrid } from '@/components/ui/cardGrid'

export { cardGrid }

export function HomeHeader() {
  const navigate = useNavigate()
  const name = useGreetingName()
  const { saved } = useStore()
  const [sheet, setSheet] = useState<'notif' | 'saved' | null>(null)
  const savedPlaces = places.filter((p) => saved.includes(p.id))

  return (
    <header className="relative bg-primary pt-safe">
      {/* subtle woven pattern */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]" aria-hidden>
        <defs>
          <pattern id="weave" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 14h28M14 0v28" stroke="#2B130A" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#weave)" />
      </svg>
      <div className="relative mx-auto max-w-[1040px] px-4 pb-12 pt-3 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <button className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-white/25 pl-2 pr-3 text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50">
              <MapPin size={17} strokeWidth={2} />
            </span>
            <span className="min-w-0 text-left leading-tight">
              <span className="block font-display text-[11px] font-medium opacity-80">Malapit sa iyo</span>
              <span className="block truncate font-display text-[14px] font-semibold">Intramuros, Maynila</span>
            </span>
            <ChevronDown size={16} strokeWidth={2} />
          </button>
          <div className="flex gap-1.5">
            <HeaderButton label="Mga notification" onClick={() => setSheet('notif')} badge>
              <Bell size={21} strokeWidth={1.75} />
            </HeaderButton>
            <HeaderButton label="Naka-save" onClick={() => setSheet('saved')}>
              <Heart size={21} strokeWidth={1.75} />
            </HeaderButton>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-white">
              Kumusta, <br className="md:hidden" />
              {name}!
            </h1>
            <p className="mt-1 font-display text-[15px] font-medium text-ink">Saan tayo kakain at gagala ngayon?</p>
          </div>
          <Jimbot expression="waving" size={96} className="-mb-6 -mr-1 shrink-0 rounded-full ring-4 ring-cream/80" />
        </div>
      </div>
      <div className="absolute inset-x-0 -bottom-7 z-10 mx-auto max-w-[1040px] px-4 md:px-6">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/search')}
          className="flex h-14 w-full items-center gap-3 rounded-[18px] bg-surface px-4 text-left shadow-float dark:bg-elevated"
        >
          <SearchIcon size={22} strokeWidth={1.75} className="shrink-0 text-link" />
          <span className="truncate text-body text-fg-2">Hanapin ang kainan, pasyalan, o lugar...</span>
        </motion.button>
      </div>

      <Sheet open={sheet === 'notif'} onClose={() => setSheet(null)} title="Mga Notification">
        <ul className="space-y-2">
          {[
            { t: 'Libreng kape sa Kapihan sa Kalye Real ngayong linggo', s: '2 oras na ang nakalipas', e: 'idea' as const },
            { t: 'Na-update ang presyo ng Lechon ni Kuya Ben', s: 'Kahapon', e: 'pointing' as const },
            { t: 'Handa na ang itinerary mo: 1 araw sa ₱1,500', s: '2 araw na', e: 'celebrating' as const },
          ].map((n) => (
            <li key={n.t} className="flex items-center gap-3 rounded-2xl bg-sunken p-3 dark:bg-elevated">
              <Jimbot crop="head" size={40} expression={n.e} animate={false} />
              <div>
                <p className="text-[15px] font-semibold leading-snug">{n.t}</p>
                <p className="text-caption text-fg-2">{n.s}</p>
              </div>
            </li>
          ))}
        </ul>
      </Sheet>
      <Sheet open={sheet === 'saved'} onClose={() => setSheet(null)} title={`Naka-save (${savedPlaces.length})`}>
        {savedPlaces.length ? (
          <div className="space-y-2.5">
            {savedPlaces.map((p) => (
              <ListingCard key={p.id} place={p} layout="row" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <Jimbot expression="sleeping" variant="standalone" size={110} />
            <p className="mt-3 text-body text-fg-2">Wala ka pang naka-save. I-tap ang puso sa kahit anong lugar.</p>
          </div>
        )}
      </Sheet>
    </header>
  )
}

function HeaderButton({ children, label, onClick, badge }: { children: ReactNode; label: string; onClick: () => void; badge?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-ink"
    >
      {children}
      {badge && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-primary" />}
    </motion.button>
  )
}

function Categories() {
  const navigate = useNavigate()
  return (
    <section aria-label="Mga kategorya" className="grid grid-cols-4 gap-x-2 gap-y-3 px-4 @2xl:grid-cols-8 md:px-0">
      {categories.map((c) => (
        <CategoryTile key={c} category={c} onClick={() => navigate(`/search?cat=${encodeURIComponent(c)}`)} />
      ))}
    </section>
  )
}


function Nearby() {
  const loading = isForced('loading')
  const nearby = places.filter((p) => p.area !== 'Batangas').slice(0, 6)
  return (
    <section className="space-y-3">
      <SectionHeader title="Pagkain at Pasyalan Malapit Sa Iyo" phase="MVP" action="Lahat" />
      <div className={cardGrid}>
        {loading ? [0, 1, 2].map((i) => <ListingSkeleton key={i} />) : nearby.map((p) => <ListingCard key={p.id} place={p} />)}
      </div>
    </section>
  )
}

/** Business profiles (Facebook-style pages) people can open, review and comment on. */
function Businesses() {
  const navigate = useNavigate()
  return (
    <section className="space-y-3" aria-label="Mga Negosyo sa Bitinary">
      <SectionHeader title="Mga Negosyo sa Bitinary" action="Lahat" onAction={() => navigate('/negosyo')} />
      <HScroll>
        {businessesFirst()
          .slice(0, 8)
          .map((p) => (
            <BusinessCard key={p.id} place={p} className="w-[230px] shrink-0 snap-start" />
          ))}
      </HScroll>
    </section>
  )
}

function SuggestedTrips() {
  const open = useOpen()
  return (
    <section className="space-y-3">
      <SectionHeader title="Iminumungkahing Biyahe" phase="MVP" action="Tanungin si Jimbot" onAction={open.jimbot} />
      <div className={cardGrid.replace('[&>*]:w-[272px]', '[&>*]:w-[300px]')}>
        {itineraries.map((it) => (
          <ItineraryCard key={it.id} it={it} />
        ))}
      </div>
    </section>
  )
}

function ReelsRow() {
  const navigate = useNavigate()
  return (
    <section className="space-y-3">
      <SectionHeader title="Mga Reels" phase="P3" action="Tingnan lahat" onAction={() => navigate(`/reels/${reels[0].id}`)} />
      <HScroll className="items-end">
        {reels.map((r, i) => (
          <ReelCard key={r.id} reel={r} featured={i === 0} />
        ))}
      </HScroll>
    </section>
  )
}

function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="pb-32 md:pb-12">
      <HomeHeader />
      <div className="@container mx-auto mt-11 max-w-[1040px] space-y-7 md:px-6">{children}</div>
    </main>
  )
}

export function HomeV1() {
  return (
    <HomeLayout>
      <OfflineBanner />
      <GuestBanner />
      <Categories />
      <ForYou />
      <Nearby />
      <Businesses />
      <SuggestedTrips />
    </HomeLayout>
  )
}

export function HomeFull() {
  return (
    <HomeLayout>
      <OfflineBanner />
      <GuestBanner />
      <InstallBanner />
      <Categories />
      <ForYou />
      <section className="space-y-2" aria-label="Mga promo">
        <div className="flex items-center gap-2 px-4 md:px-0">
          <PhaseTag phase="P2" />
        </div>
        <PromoCarousel />
      </section>
      <ReelsRow />
      <Nearby />
      <Businesses />
      <div className="space-y-1">
        <div className="px-4 md:px-0">
          <PhaseTag phase="P2" />
        </div>
        <SponsoredCard slot={1} />
      </div>
      <SuggestedTrips />
      <SponsoredCard slot={2} />
    </HomeLayout>
  )
}
