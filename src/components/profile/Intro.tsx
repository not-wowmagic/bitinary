import { Clock, Info, MapPin, Phone, Tag, Utensils, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Place } from '@/data/places'
import { img, peso } from '@/lib/format'

/** Facebook-style left column for the desktop business profile. */
function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-h3">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Line({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px]">
      <span className="mt-0.5 shrink-0 text-fg-2">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  )
}

export function IntroCard({ place, badge }: { place: Place; badge?: ReactNode }) {
  return (
    <Card title="Intro">
      <p className="text-body">{place.description}</p>
      <ul className="mt-4 space-y-2.5">
        <Line icon={<Info size={18} />}>
          <b className="font-semibold">{place.category}</b> · {place.priceRange}
        </Line>
        <Line icon={<MapPin size={18} />}>{place.area}, Maynila · {place.distance} mula sa iyo</Line>
        <Line icon={<Clock size={18} />}>
          <span className={place.status === 'closed' ? 'font-semibold text-danger' : 'font-semibold text-ok'}>{place.status === 'closed' ? 'Sarado' : place.status === 'closingSoon' ? 'Magsasara na' : 'Bukas ngayon'}</span> · {place.hours}
        </Line>
        <Line icon={<Wallet size={18} />}>{place.priceText}</Line>
        <Line icon={<Phone size={18} />}>{place.contact ?? <span className="italic text-fg-2">Wala pang contact</span>}</Line>
      </ul>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {place.tags.map((t) => (
          <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-sunken px-2.5 font-display text-[12px] font-medium text-fg-2 dark:bg-elevated">
            <Tag size={12} /> {t}
          </span>
        ))}
      </div>
      {badge && <div className="mt-4">{badge}</div>}
    </Card>
  )
}

export function PhotosCard({ photos, onOpen, onAll }: { photos: string[]; onOpen: (i: number) => void; onAll: () => void }) {
  return (
    <Card
      title="Mga Larawan"
      action={
        <button onClick={onAll} className="min-h-9 font-display text-[14px] font-medium text-link hover:underline">
          Tingnan lahat
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-[16px]">
        {photos.slice(0, 9).map((p, i) => (
          <button key={p} onClick={() => onOpen(i)} className="aspect-square overflow-hidden bg-sunken" aria-label={`Larawan ${i + 1}`}>
            <img src={p.startsWith('data:') || p.startsWith('http') ? p : img(p, 300, 300)} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
          </button>
        ))}
      </div>
    </Card>
  )
}

export function MenuCard({ menu, onAll }: { menu: { name: string; price: number; note?: string }[]; onAll: () => void }) {
  return (
    <Card
      title="Menu highlights"
      action={
        <button onClick={onAll} className="min-h-9 font-display text-[14px] font-medium text-link hover:underline">
          Buong menu
        </button>
      }
    >
      <ul className="space-y-2">
        {menu.slice(0, 3).map((m) => (
          <li key={m.name} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-elevated">
              <Utensils size={17} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{m.name}</span>
            <span className="font-display text-[15px] font-semibold">{peso(m.price)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
