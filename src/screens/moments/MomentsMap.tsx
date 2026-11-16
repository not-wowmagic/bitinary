import { Compass, MapPin, Search, Trash2, WifiOff, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapLibreMapInstance } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useStore } from '@/app/store'
import { Polaroid } from '@/components/cards/Polaroid'
import { FULL_BLEED } from '@/components/layout/nav'
import { PhotoPin, UserDot } from '@/components/map/MapPins'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import type { Moment } from '@/data/moments'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { shortDate } from '@/lib/format'
import { useBreakpoint } from '@/lib/useMedia'
import { useOnline } from '@/lib/useOnline'
import { supabase } from '@/lib/supabase'
import { project, unproject, usePanZoom, viewCentering } from '@/lib/usePanZoom'
import { GalleryDock, GallerySheet, type GalleryFilter, type Snap } from './FloatingGallery'

const DEFAULT_USER = { x: 760, y: 1050 }
type MapFilter = 'all' | 'food' | 'place' | 'mine' | 'today' | 'week' | 'month' | 'older'

type MomentRecord = Moment & { latitude: number; longitude: number; authorId: string | null }

function MapLibreSurface({ moments, onSelect }: { moments: MomentRecord[]; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMapInstance | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    maplibregl.setWorkerUrl(maplibreWorkerUrl)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [120.9842, 14.5995],
      zoom: 12.5,
      style: {
        version: 8,
        sources: {
          fallback: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { kind: 'water' },
                  geometry: { type: 'Polygon', coordinates: [[[120.91, 14.52], [120.96, 14.52], [120.96, 14.72], [120.91, 14.72], [120.91, 14.52]]] },
                },
                {
                  type: 'Feature',
                  properties: { kind: 'water' },
                  geometry: { type: 'LineString', coordinates: [[120.91, 14.61], [120.98, 14.61], [121.04, 14.62], [121.1, 14.61]] },
                },
                {
                  type: 'Feature',
                  properties: { kind: 'road' },
                  geometry: { type: 'LineString', coordinates: [[120.96, 14.54], [120.98, 14.61], [120.99, 14.67], [121.01, 14.72]] },
                },
                {
                  type: 'Feature',
                  properties: { kind: 'road' },
                  geometry: { type: 'LineString', coordinates: [[120.94, 14.58], [121.02, 14.59], [121.08, 14.6]] },
                },
              ],
            },
          },
          osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' },
        },
        layers: [
          { id: 'fallback-background', type: 'background', paint: { 'background-color': '#f4e4d2' } },
          { id: 'fallback-water', type: 'fill', source: 'fallback', filter: ['==', ['get', 'kind'], 'water'], paint: { 'fill-color': '#b9dbe1' } },
          { id: 'fallback-roads', type: 'line', source: 'fallback', filter: ['==', ['get', 'kind'], 'road'], paint: { 'line-color': '#fffaf3', 'line-width': 3 } },
          { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.9 } },
        ],
      },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
    mapRef.current = map
    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const sync = () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      moments.forEach((moment) => {
        const marker = document.createElement('button')
        marker.type = 'button'
        marker.dataset.momentMarker = moment.id
        marker.className = 'flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-500 shadow-lg'
        marker.ariaLabel = moment.caption || moment.place
        const image = document.createElement('img')
        image.src = moment.src
        image.alt = ''
        image.className = 'h-full w-full object-cover'
        marker.append(image)
        marker.addEventListener('click', () => onSelect(moment.id))
        const mapMarker = new maplibregl.Marker({ element: marker }).setLngLat([moment.longitude, moment.latitude]).addTo(map)
        markersRef.current.push(mapMarker)
      })
    }
    if (map.isStyleLoaded()) sync()
    else map.once('load', sync)
    return () => {
      map.off('load', sync)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [moments, onSelect])

  return <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-label="OpenStreetMap ng Moments" />
}

export function MomentsMap() {
  const [params] = useSearchParams()
  const forced = getForcedState()
  const online = useOnline()
  const bp = useBreakpoint()
  const navigate = useNavigate()
  const { removeMoment, showToast } = useStore()
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
  const [viewer, setViewer] = useState<Moment | null>(null)
  const [dbMoments, setDbMoments] = useState<MomentRecord[]>([])

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
    let active = true
    const loadMoments = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('moments').select('id, author_id, storage_path, caption, visited_at, place_name, area, latitude, longitude, kind, trip, frame, tilt, on_map').eq('on_map', true).order('created_at', { ascending: false })
      if (error || !active) return
      const rows: MomentRecord[] = []
      for (const row of data ?? []) {
        if (row.latitude == null || row.longitude == null) continue
        const src = row.storage_path.startsWith('http') ? row.storage_path : (await supabase.storage.from('images').createSignedUrl(row.storage_path, 3600)).data?.signedUrl
        if (!src) continue
        rows.push({
          id: String(row.id),
          src,
          caption: row.caption ?? '',
          date: row.visited_at ?? '',
          place: row.place_name ?? '',
          area: row.area ?? '',
          map: DEFAULT_USER,
          kind: row.kind && (row.kind.toLowerCase().includes('pagkain') || row.kind.toLowerCase().includes('food')) ? 'Pagkain' : 'Pasyalan',
          mine: row.author_id === userData.user?.id,
          trip: row.trip ?? undefined,
          frame: (row.frame ?? 'classic') as Moment['frame'],
          tilt: Number(row.tilt ?? 0),
          onMap: Boolean(row.on_map),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          authorId: row.author_id ?? null,
        })
      }
      if (active) setDbMoments(rows)
    }
    void loadMoments()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!size.w || inited.current) return
    inited.current = true
    pz.setView(viewCentering(DEFAULT_USER, size, mobile ? 1.05 : 1.25, 0, mobile && snap !== 'closed' ? 320 : -60))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w])

  const all = useMemo(() => (forced === 'empty' ? [] : dbMoments), [dbMoments, forced])
  const now = new Date()
  const shown = all.filter((m) => {
    const age = now.getTime() - new Date(m.date).getTime()
    if (mapFilter === 'food') return m.kind === 'Pagkain'
    if (mapFilter === 'place') return m.kind === 'Pasyalan'
    if (mapFilter === 'mine') return m.mine
    if (mapFilter === 'today') return age >= 0 && age < 24 * 60 * 60 * 1000
    if (mapFilter === 'week') return age >= 0 && age < 7 * 24 * 60 * 60 * 1000
    if (mapFilter === 'month') return age >= 0 && age < 30 * 24 * 60 * 60 * 1000
    if (mapFilter === 'older') return age >= 30 * 24 * 60 * 60 * 1000
    return true
  })

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

  const visible = shown
  const area = { name: 'Manila', x: DEFAULT_USER.x, y: DEFAULT_USER.y, total: all.length }
  const selectedCluster = selected ? { items: shown.filter((moment) => moment.id === selected) } : undefined
  const galleryItems = [...(selectedCluster?.items ?? []), ...visible.filter((m) => !selectedCluster?.items.includes(m))].filter((m) =>
    galleryFilter === 'mine' ? m.mine : galleryFilter === 'trips' ? !!m.trip : true,
  )
  const searchTargets: { label: string; sub: string; x: number; y: number }[] = []

  const deleteMoment = async (moment: Moment) => {
    if (!window.confirm('I-delete ang Moment na ito? Hindi na ito mababawi.')) return
    const { data: row, error: lookupError } = await supabase.from('moments').select('storage_path').eq('id', moment.id).maybeSingle()
    if (lookupError) {
      showToast({ text: `Hindi ma-delete ang Moment: ${lookupError.message}`, expression: 'unsure' })
      return
    }
    const { error } = await supabase.from('moments').delete().eq('id', moment.id)
    if (error) {
      showToast({ text: `Hindi ma-delete ang Moment: ${error.message}`, expression: 'unsure' })
      return
    }
    if (row?.storage_path && !row.storage_path.startsWith('http')) {
      const { error: storageError } = await supabase.storage.from('images').remove([row.storage_path])
      if (storageError) showToast({ text: `Na-delete ang Moment pero naiwan ang image file: ${storageError.message}`, expression: 'unsure' })
    }
    removeMoment(moment.id)
    setViewer(null)
    setSelected(null)
  }

  return (
    <main className={cn(FULL_BLEED, 'overflow-hidden bg-[var(--map-land)]')}>
      {/* map surface */}
      <div ref={pz.ref} className="absolute inset-0 touch-none select-none" style={{ cursor: 'grab' }} aria-label="Mapa ng Moments. I-drag para gumalaw, i-pinch para mag-zoom." role="application">
        <MapLibreSurface
          moments={shown}
          onSelect={(id) => {
            setSelected(id)
            if (mobile) setSnap(snap === 'closed' || snap === 'peek' ? 'half' : snap)
            else setDocked(false)
          }}
        />
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
            ['mine', 'Akin'],
            ['today', 'Ngayon'],
            ['week', '7 araw'],
            ['month', '30 araw'],
            ['older', 'Mas luma'],
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

      {/* moment viewer */}
      <Sheet open={!!viewer} onClose={() => setViewer(null)} title={viewer?.place}>
        {viewer && (
          <div className="flex flex-col items-center pb-2 pt-2">
            <Polaroid src={viewer.src} caption={viewer.caption} date={viewer.date} place={viewer.place} frame={viewer.frame} tilt={viewer.tilt} width={260} />
            <p className="mt-5 text-caption text-fg-2">
              {viewer.mine ? 'Pribado · ikaw lang ang nakakakita' : 'Ibinahagi ng biyahero'} · {shortDate(viewer.date)}
            </p>
            {viewer.mine && (
              <button onClick={() => void deleteMoment(viewer)} className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold text-danger hover:bg-danger-bg" aria-label="I-delete ang Moment">
                <Trash2 size={16} /> I-delete ang image
              </button>
            )}
          </div>
        )}
      </Sheet>
    </main>
  )
}
