import { ChevronDown, Clock, Search as SearchIcon, TrendingUp, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CategoryTile, categories } from '@/components/cards/CategoryTile'
import { ListingCard } from '@/components/cards/ListingCard'
import { StateView } from '@/components/states/States'
import { Chip } from '@/components/ui/Chip'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { Sheet } from '@/components/ui/Sheet'
import { places, type Category } from '@/data/places'
import { recentSearches, trendingSearches } from '@/data/searches'
import { usePersistentState } from '@/lib/usePersistentState'

const areas = ['Intramuros', 'Binondo', 'Ermita', 'Batangas']
const prices = ['₱', '₱₱', '₱₱₱'] as const

export function SearchScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const cat = (params.get('cat') as Category | null) ?? null
  const [area, setArea] = useState<string | null>(null)
  const [price, setPrice] = useState<string | null>(null)
  const [openNow, setOpenNow] = useState(false)
  const [sheet, setSheet] = useState<'cat' | 'area' | 'price' | null>(null)
  const [recent, setRecent] = usePersistentState('recentSearches', recentSearches)
  const inputRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string | null) =>
    setParams(
      (p) => {
        if (v) p.set(k, v)
        else p.delete(k)
        return p
      },
      { replace: true },
    )

  const active = !!(q || cat || area || price || openNow)
  const results = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return places.filter((p) => {
      if (cat && p.category !== cat) return false
      if (area && p.area !== area) return false
      if (price && p.priceRange !== price) return false
      if (openNow && p.status === 'closed') return false
      if (!needle) return true
      const hay = [p.name, p.category, p.area, p.description, ...p.tags, ...p.menu.map((m) => m.name)].join(' ').toLowerCase()
      return needle.split(/\s+/).every((w) => hay.includes(w))
    })
  }, [q, cat, area, price, openNow])

  const commit = (term: string) => {
    set('q', term)
    if (term.trim()) setRecent((r) => [term, ...r.filter((x) => x !== term)].slice(0, 6))
  }

  return (
    <main className="@container mx-auto max-w-[1040px] pb-32 md:px-6 md:pb-12">
      <header className="sticky top-0 z-20 bg-bg/90 px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl md:px-0 md:pt-8">
        <h1 className="mb-3 flex items-center gap-2 text-title">
          Search <PhaseTag phase="MVP" />
        </h1>
        <div className="flex items-center gap-2">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              commit(inputRef.current?.value ?? '')
              inputRef.current?.blur()
            }}
            className="flex h-12 flex-1 items-center gap-2 rounded-[16px] bg-surface px-3.5 shadow-card dark:bg-elevated"
          >
            <SearchIcon size={20} className="shrink-0 text-link" />
            <input
              ref={inputRef}
              key={q}
              defaultValue={q}
              onChange={(e) => set('q', e.target.value)}
              placeholder="Kainan, pasyalan, o lugar"
              aria-label="Hanapin"
              enterKeyHint="search"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-fg-2"
            />
            {q && (
              <button type="button" aria-label="Burahin" onClick={() => set('q', null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-sunken text-fg-2 dark:bg-surface">
                <X size={16} />
              </button>
            )}
          </form>
          {active && (
            <button
              onClick={() => {
                setParams({}, { replace: true })
                setArea(null)
                setPrice(null)
                setOpenNow(false)
                navigate('/search', { replace: true })
              }}
              className="h-11 px-1 font-display text-[16px] font-medium text-link"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Chip active={!!cat} onClick={() => setSheet('cat')} trailing={<ChevronDown size={15} />}>
            {cat ?? 'Kategorya'}
          </Chip>
          <Chip active={!!area} onClick={() => setSheet('area')} trailing={<ChevronDown size={15} />}>
            {area ?? 'Lugar'}
          </Chip>
          <Chip active={!!price} onClick={() => setSheet('price')} trailing={<ChevronDown size={15} />}>
            {price ?? 'Presyo'}
          </Chip>
          <Chip active={openNow} onClick={() => setOpenNow((v) => !v)}>
            Bukas ngayon
          </Chip>
        </div>
      </header>

      {!active ? (
        <div className="space-y-7 px-4 pt-4 md:px-0">
          <section>
            <h2 className="mb-1 text-h3">Mga huling hinanap</h2>
            <ul>
              {recent.map((r) => (
                <li key={r} className="flex items-center border-b border-line">
                  <button onClick={() => commit(r)} className="flex h-12 flex-1 items-center gap-3 text-left text-body">
                    <Clock size={18} className="text-muted" /> {r}
                  </button>
                  <button aria-label={`Alisin ang ${r}`} onClick={() => setRecent((x) => x.filter((y) => y !== r))} className="flex h-11 w-11 items-center justify-center text-muted">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-h3">Trending ngayon</h2>
            <div className="grid gap-2 @xl:grid-cols-2">
              {trendingSearches.map((t, i) => (
                <button key={t.q} onClick={() => commit(t.q)} className="card flex h-14 items-center gap-3 px-4 text-left">
                  <span className="font-display text-[18px] font-bold text-link">{i + 1}</span>
                  <span className="flex-1 font-display text-[15px] font-medium">{t.q}</span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ok">
                    <TrendingUp size={14} /> {t.delta}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-h3">Mga kategorya</h2>
            <div className="grid grid-cols-4 gap-2 @2xl:grid-cols-8">
              {categories.map((c) => (
                <CategoryTile key={c} category={c} onClick={() => set('cat', c)} />
              ))}
            </div>
          </section>
        </div>
      ) : results.length ? (
        <section className="px-4 pt-3 md:px-0">
          <p className="mb-3 text-caption text-fg-2" aria-live="polite">
            {results.length} resulta · lahat ay verified
          </p>
          <div className="grid gap-2.5 @xl:hidden">
            {results.map((p) => (
              <ListingCard key={p.id} place={p} layout="row" />
            ))}
          </div>
          <div className="hidden gap-3 @xl:grid @xl:grid-cols-2 @3xl:grid-cols-3">
            {results.map((p) => (
              <ListingCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      ) : (
        <StateView
          expression="unsure"
          title="Wala akong nahanap"
          body={`Walang verified na lugar para sa "${q || cat || area || price}". Hindi ako manghuhula, kaya subukan ang ibang salita o tanggalin ang filter.`}
          action="Tanggalin ang filter"
          onAction={() => {
            setParams({}, { replace: true })
            setArea(null)
            setPrice(null)
            setOpenNow(false)
          }}
        />
      )}

      <Sheet open={sheet === 'cat'} onClose={() => setSheet(null)} title="Kategorya">
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <CategoryTile
              key={c}
              category={c}
              onClick={() => {
                set('cat', cat === c ? null : c)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </Sheet>
      <OptionSheet open={sheet === 'area'} title="Lugar" options={areas} value={area} onPick={(v) => (setArea(v), setSheet(null))} onClose={() => setSheet(null)} />
      <OptionSheet open={sheet === 'price'} title="Presyo" options={[...prices]} value={price} onPick={(v) => (setPrice(v), setSheet(null))} onClose={() => setSheet(null)} />
    </main>
  )
}

function OptionSheet({ open, title, options, value, onPick, onClose }: { open: boolean; title: string; options: string[]; value: string | null; onPick: (v: string | null) => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-wrap gap-2">
        <Chip active={!value} onClick={() => onPick(null)}>
          Lahat
        </Chip>
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onPick(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}
