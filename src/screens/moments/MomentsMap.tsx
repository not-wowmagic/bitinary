import { Compass, LocateFixed, MapPin, Search, WifiOff, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useStore } from '@/app/store'
import { Polaroid } from '@/components/cards/Polaroid'
import { FULL_BLEED } from '@/components/layout/nav'
import { MapArt } from '@/components/map/MapArt'
import { PhotoPin, UserDot } from '@/components/map/MapPins'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { mapAreas, sampleMoments, type Moment } from '@/data/moments'
import { places } from '@/data/places'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { shortDate } from '@/lib/format'
import { useBreakpoint } from '@/lib/useMedia'
import { useOnline } from '@/lib/useOnline'
import { project, unproject, usePanZoom, viewCentering } from '@/lib/usePanZoom'
import { usePersistentState } from '@/lib/usePersistentState'
import { GalleryDock, GallerySheet, type GalleryFilter, type Snap } from './FloatingGallery'

const USER = { x: 590, y: 560 }
type MapFilter = 'all' | 'food' | 'place' | 'mine'

export function MomentsMap() {
  const [params] = useSearchParams()
  const forced = getForcedState()
  const online = useOnline()
  const bp = useBreakpoint()
  const navigate = useNavigate()
  const { myMoments } = useStore()
  const [size, setSize] = useState({ w: 0, h: 0 })
  const pz = usePanZoom({ x: 0, y: 0, s: 1, r: 0 })
  const inited = useRef(false)

  const initialSnap = (['peek', 'half', 'full'].includes(forced ?? '') ? forced : params.get('gallery')) as Snap | null
  const [snap, setSnap] = useState<Snap>(initialSnap ?? 'closed')
  const [docked, setDocked] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>(params.get('f') === 'mine' ? 'mine' : 'all')
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>(params.get('f') === 'mine' ? 'mine' : 'all')
  const [selected, setSelected] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [locAsked, setLocAsked] = usePersistentState('locationAsked', false)
  const [locSheet, setLocSheet] = useState(forced === 'location')
  const [viewer, setViewer] = useState<Moment | null>(null)

  const mobile = bp === 'mobile'
  const tabBar = mobile ? 88 : 0

  // measure
  useLayoutEffect(() => {
    const el = pz.ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [pz.ref])

  useEffect(() => {
    if (!size.w || inited.current) return
    inited.current = true
    pz.setView(viewCentering(USER, size, mobile ? 1.05 : 1.25, 0, mobile && snap !== 'closed' ? 320 : -60))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w])

  const all = useMemo(() => (forced === 'empty' ? [] : [...myMoments.filter((m) => m.onMap), ...sampleMoments]), [myMoments, forced])
  const shown = all.filter((m) =>
    mapFilter === 'food' ? m.kind === 'Pagkain' : mapFilter === 'place' ? m.kind === 'Pasyalan' : mapFilter === 'mine' ? m.mine : true,
  )

  // project + cluster in screen space
  const projected = shown.map((m) => ({ m, p: project(pz.view, m.map) }))
  const clusters = useMemo(() => {
    const out: { x: number; y: number; items: Moment[] }[] = []
    for (const { m, p } of projected) {
      const c = out.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < 58)
      if (c) {
        c.items.push(m)
        c.x = (c.x * (c.items.length - 1) + p.x) / c.items.length
        c.y = (c.y * (c.items.length - 1) + p.y) / c.items.length
      } else out.push({ x: p.x, y: p.y, items: [m] })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(projected.map((x) => [Math.round(x.p.x), Math.round(x.p.y), x.m.id]))])

  const visible = projected.filter(({ p }) => p.x > -20 && p.x < size.w + 20 && p.y > -20 && p.y < size.h + 20).map((x) => x.m)
  const center = unproject(pz.view, { x: size.w / 2, y: (size.h - (mobile ? 260 : 0)) / 2 })
  const area = mapAreas.reduce((a, b) => (Math.hypot(b.x - center.x, b.y - center.y) < Math.hypot(a.x - center.x, a.y - center.y) ? b : a))
  const selectedCluster = clusters.find((c) => selected && c.items.some((m) => m.id === selected))
  const galleryItems = [...(selectedCluster?.items ?? []), ...visible.filter((m) => !selectedCluster?.items.includes(m))].filter((m) =>
    galleryFilter === 'mine' ? m.mine : galleryFilter === 'trips' ? !!m.trip : true,
  )
  const user = project(pz.view, USER)

  const recenter = () => pz.flyTo(viewCentering(USER, size, 1.4, 0, mobile && snap !== 'closed' ? 300 : 0))
  const onLocate = () => {
    if (!locAsked) return setLocSheet(true)
    recenter()
  }
  const searchTargets = [...mapAreas.map((a) => ({ label: a.name, sub: 'Distrito', x: a.x, y: a.y })), ...places.filter((p) => p.area !== 'Batangas').map((p) => ({ label: p.name, sub: p.area, x: p.map.x, y: p.map.y }))].filter((t) => t.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <main className={cn(FULL_BLEED, 'overflow-hidden bg-[var(--map-land)]')}>
      {/* map surface */}
      <div ref={pz.ref} className="absolute inset-0 touch-none select-none" style={{ cursor: 'grab' }} aria-label="Mapa ng Moments. I-drag para gumalaw, i-pinch para mag-zoom." role="application">
        <div className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ transform: `translate(${pz.view.x}px, ${pz.view.y}px) rotate(${pz.view.r}deg) scale(${pz.view.s})` }}>
          <svg width={2400} height={2400} viewBox="-600 -600 2400 2400" style={{ position: 'absolute', left: -600, top: -600 }} aria-hidden>
            <MapArt />
          </svg>
        </div>
        <UserDot x={user.x} y={user.y} radius={70 * pz.view.s} />
        {clusters.map((c) => {
          const isSel = !!selectedCluster && c === selectedCluster
          return (
            <PhotoPin
              key={c.items[0].id}
              x={c.x}
              y={c.y}
              count={c.items.length}
              src={c.items[0].src.replace('w=600&h=600', 'w=120&h=120')}
              selected={isSel}
              label={`${c.items.length} larawan sa ${c.items[0].place}`}
              onClick={() => {
                setSelected(c.items[0].id)
                if (mobile) setSnap(snap === 'closed' || snap === 'peek' ? 'half' : snap)
                else setDocked(false)
              }}
            />
          )
        })}
      </div>

      {/* top floating controls */}
      <div className={cn('pointer-events-none absolute top-0 z-20 space-y-2.5 px-3 pt-[max(12px,env(safe-area-inset-top))]', mobile ? 'inset-x-0' : 'left-0 right-[392px]')}>
        <div className="flex items-center justify-center gap-2">
          <div className="pointer-events-auto" data-map-ui>
            <Segmented tone="glass" label="Moments mode" value="map" onChange={(v) => v === 'camera' && navigate('/moments')} options={[{ value: 'camera', label: 'Camera' }, { value: 'map', label: 'Mapa' }]} />
          </div>
          <PhaseTag phase="P3" />
        </div>
        <div className="pointer-events-auto relative mx-auto max-w-[520px]" data-map-ui>
          {searching ? (
            <div className="glass overflow-hidden rounded-[22px] shadow-float">
              <div className="flex h-12 items-center gap-2 px-3.5">
                <Search size={19} className="text-link" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hanapin ang lugar sa mapa" className="h-full flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-fg-2" aria-label="Hanapin sa mapa" />
                <button aria-label="Isara" onClick={() => (setSearching(false), setQuery(''))} className="flex h-9 w-9 items-center justify-center rounded-full text-fg-2">
                  <X size={18} />
                </button>
              </div>
              <ul className="max-h-[260px] overflow-y-auto border-t border-line">
                {searchTargets.slice(0, 6).map((t) => (
                  <li key={t.label}>
                    <button
                      onClick={() => {
                        pz.flyTo(viewCentering(t, size, 1.6, pz.view.r, mobile && snap !== 'closed' ? 300 : 0))
                        setSearching(false)
                        setQuery('')
                      }}
                      className="flex h-12 w-full items-center gap-3 px-4 text-left"
                    >
                      <MapPin size={17} className="text-link" />
                      <span className="flex-1 truncate text-[15px] text-fg">{t.label}</span>
                      <span className="text-caption text-fg-2">{t.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <button onClick={() => setSearching(true)} className="glass flex h-12 w-full items-center gap-2 rounded-full px-4 text-left shadow-float">
              <Search size={19} className="text-link" />
              <span className="text-[16px] text-fg-2">Hanapin sa mapa</span>
            </button>
          )}
        </div>
        <div className="no-scrollbar pointer-events-auto mx-auto flex max-w-[520px] gap-2 overflow-x-auto pb-2" data-map-ui>
          {([
            ['all', 'Lahat'],
            ['food', 'Pagkain'],
            ['place', 'Pasyalan'],
            ['mine', 'Mga Moment'],
          ] as const).map(([v, l]) => (
            <Chip key={v} tone="glass" active={mapFilter === v} onClick={() => setMapFilter(v)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>

      {/* right floating buttons */}
      <div
        className={cn('absolute z-20 flex flex-col gap-2 transition-[bottom] duration-300', mobile ? 'right-3' : 'right-[392px] bottom-6')}
        style={mobile ? { bottom: tabBar + (snap === 'closed' ? 12 : snap === 'peek' ? 124 : 384) } : undefined}
        data-map-ui
      >
        {Math.abs(pz.view.r % 360) > 1 && (
          <button aria-label="I-reset ang direksyon" onClick={() => pz.flyTo({ ...pz.view, r: 0 }, 400)} className="glass flex h-12 w-12 items-center justify-center rounded-full shadow-float">
            <Compass size={22} style={{ transform: `rotate(${pz.view.r}deg)` }} />
          </button>
        )}
        {!(mobile && snap === 'full') && (
          <button aria-label="Ang lokasyon ko" onClick={onLocate} className="glass flex h-12 w-12 items-center justify-center rounded-full text-link shadow-float">
            <LocateFixed size={22} />
          </button>
        )}
      </div>

      {/* hint / states */}
      <AnimatePresence>
        {!online && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass absolute left-1/2 top-[184px] z-20 flex w-[min(92%,420px)] -translate-x-1/2 items-center gap-3 rounded-[20px] p-3 shadow-float" data-map-ui>
            <Jimbot expression="sleeping" variant="standalone" size={56} />
            <p className="flex-1 text-[14px] font-semibold text-fg">
              <WifiOff size={15} className="mr-1 inline text-caution" />
              Offline ka. Naka-cache na mapa at mga Moment mo lang ang makikita.
            </p>
          </motion.div>
        )}
        {online && !shown.length && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass absolute left-1/2 top-1/2 z-20 flex w-[min(88%,360px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[28px] p-5 text-center shadow-float" data-map-ui>
            <Jimbot expression="sleeping" variant="standalone" size={110} />
            <p className="mt-2 text-h3 text-fg">Wala pang Moments dito</p>
            <p className="mt-1 text-[15px] text-fg-2">Kunan ang unang larawan mo at lalabas ito sa mapa.</p>
            <Button className="mt-4" onClick={() => navigate('/moments')}>
              Buksan ang camera
            </Button>
          </motion.div>
        )}
        {online && !!shown.length && mobile && snap === 'closed' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass absolute left-3 right-[72px] z-20 flex h-11 w-fit max-w-[calc(100%-84px)] items-center gap-2 truncate rounded-full pl-1.5 pr-4 font-display text-[13px] font-medium text-fg shadow-float" style={{ bottom: tabBar + 14 }} data-map-ui>
            <Jimbot crop="head" size={32} expression="pointing" animate={false} /> I-tap ang pin para sa mga larawan
          </motion.div>
        )}
      </AnimatePresence>

      {/* gallery */}
      {mobile ? (
        <GallerySheet
          snap={snap}
          setSnap={setSnap}
          containerH={size.h}
          bottomOffset={tabBar}
          title={area.name}
          moments={galleryItems}
          filter={galleryFilter}
          setFilter={setGalleryFilter}
          loading={forced === 'loading'}
          onOpen={setViewer}
        />
      ) : (
        <GalleryDock collapsed={docked} setCollapsed={setDocked} title={area.name} moments={galleryItems} filter={galleryFilter} setFilter={setGalleryFilter} loading={forced === 'loading'} onOpen={setViewer} />
      )}

      {/* location permission */}
      <Sheet open={locSheet} onClose={() => setLocSheet(false)} title="Gamitin ang lokasyon mo?">
        <div className="flex flex-col items-center text-center">
          <Jimbot expression="pointing" variant="standalone" size={120} />
          <p className="mt-3 text-body text-fg-2">
            Gagamitin lang namin ang <b className="text-fg">pangkalahatang lugar</b> mo (hal. "Malapit sa Intramuros") para ipakita ang Moments at kainan sa paligid. Hindi namin ise-save o ipapakita ang eksaktong address mo.
          </p>
          <div className="mt-5 grid w-full grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setLocSheet(false)}>
              Hindi muna
            </Button>
            <Button
              onClick={() => {
                setLocAsked(true)
                setLocSheet(false)
                navigator.geolocation?.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: false, maximumAge: 600000 })
                recenter()
              }}
            >
              Payagan
            </Button>
          </div>
        </div>
      </Sheet>

      {/* moment viewer */}
      <Sheet open={!!viewer} onClose={() => setViewer(null)} title={viewer?.place}>
        {viewer && (
          <div className="flex flex-col items-center pb-2 pt-2">
            <Polaroid src={viewer.src} caption={viewer.caption} date={viewer.date} place={viewer.place} frame={viewer.frame} tilt={viewer.tilt} width={260} />
            <p className="mt-5 text-caption text-fg-2">
              {viewer.mine ? 'Pribado · ikaw lang ang nakakakita' : 'Ibinahagi ng biyahero'} · {shortDate(viewer.date)}
            </p>
          </div>
        )}
      </Sheet>
    </main>
  )
}
