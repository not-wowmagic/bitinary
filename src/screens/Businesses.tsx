import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BusinessCard, businessesFirst } from '@/components/cards/BusinessCard'
import { categories } from '@/components/cards/CategoryTile'
import { BackButton } from '@/components/layout/TopBar'
import { StateView } from '@/components/states/States'
import { Chip } from '@/components/ui/Chip'
import type { Category } from '@/data/places'

/** "Mga Negosyo": every business profile in one place. */
export function BusinessesScreen() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | null>(null)
  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return businessesFirst().filter((p) => (!cat || p.category === cat) && (!n || `${p.name} ${p.area} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(n)))
  }, [q, cat])
  return (
    <main className="mx-auto max-w-[1040px] pb-32 md:px-6 md:pb-12">
      <header className="sticky top-0 z-20 bg-bg/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl md:px-0 md:pt-8">
        <div className="flex items-center gap-3">
          <BackButton tone="plain" />
          <div>
            <h1 className="text-title">Mga Negosyo</h1>
            <p className="text-body text-fg-2">Tingnan ang profile, mga post at review ng bawat negosyo.</p>
          </div>
        </div>
        <label className="mt-4 flex h-12 items-center gap-2 rounded-[16px] bg-surface px-4 shadow-card">
          <Search size={19} className="shrink-0 text-link" />
          <span className="sr-only">Hanapin ang negosyo</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hanapin ang negosyo o lugar" className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-fg-2" />
        </label>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Chip active={!cat} onClick={() => setCat(null)}>
            Lahat
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)}>
              {c}
            </Chip>
          ))}
        </div>
      </header>
      {list.length ? (
        <div className="grid gap-3 px-4 pt-2 sm:grid-cols-2 md:px-0 xl:grid-cols-3">
          {list.map((p) => (
            <BusinessCard key={p.id} place={p} />
          ))}
        </div>
      ) : (
        <StateView expression="unsure" title="Walang tugma" body="Subukan ang ibang salita o kategorya." className="py-10" />
      )}
    </main>
  )
}
