import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapLibreMapInstance } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { TripStop } from '@/lib/jimbotTrip'

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#2b1e18' } },
    { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.85 } },
  ],
}

export function TripMap({
  stops,
  onSelect,
}: {
  stops: TripStop[]
  onSelect?: (stop: TripStop) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMapInstance | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const located = stops.filter((s) => s.lat != null && s.lng != null)
  const missing = stops.length - located.length

  useEffect(() => {
    maplibregl.setWorkerUrl(maplibreWorkerUrl)
  }, [])

  const stopKey = located.map((s) => s.id).join('|')

  useEffect(() => {
    if (!containerRef.current || located.length === 0) return
    const first = located[0]
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [first.lng!, first.lat!],
      zoom: 12,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
    mapRef.current = map

    const paint = () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      if (map.getLayer('route-line')) map.removeLayer('route-line')
      if (map.getSource('route')) map.removeSource('route')
      const coords = located.map((s) => [s.lng!, s.lat!] as [number, number])
      if (coords.length >= 2) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#ef7f27', 'line-width': 3, 'line-dasharray': [1.5, 1.5], 'line-opacity': 0.85 },
        })
      }
      located.forEach((s, i) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.className =
          'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#ef7f27] text-xs font-semibold text-white shadow'
        el.textContent = String(i + 1)
        el.title = s.name
        el.addEventListener('click', () => onSelect?.(s))
        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([s.lng!, s.lat!]).addTo(map))
      })
      const bounds = new maplibregl.LngLatBounds(coords[0], coords[0])
      coords.forEach((c) => bounds.extend(c))
      map.fitBounds(bounds, { padding: 40, maxZoom: 14 })
    }
    if (map.loaded()) paint()
    else map.once('load', paint)

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
    // stopKey captures which stops are plotted; onSelect is stable enough for markers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopKey])

  if (located.length === 0) {
    return (
      <div className="rounded-2xl bg-[#35251e] p-3 text-sm text-[#c6b5a9]">
        Walang coordinates ang mga stops para sa mapa.
        <ol className="mt-2 space-y-1 text-[#f5f0eb]">
          {stops.map((s, i) => (
            <li key={s.id}>
              {i + 1}. {s.name}
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {missing > 0 && (
        <p className="text-[12px] text-[#a38d7f]">
          {missing} stop{missing === 1 ? '' : 's'} not on map yet
        </p>
      )}
      <div ref={containerRef} className="h-52 overflow-hidden rounded-2xl" />
      <p className="text-[11px] text-[#a38d7f]">Approx. route · Directions open in Maps</p>
    </div>
  )
}
