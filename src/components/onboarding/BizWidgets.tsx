import {
  Check,
  Clock,
  Copy,
  ImageOff,
  LocateFixed,
  MapPin,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react"
import { motion } from "motion/react"
import * as maplibregl from "maplibre-gl"
import type { Map as MapLibreMapInstance } from "maplibre-gl"
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useRef, useState } from "react"
import {
  DAYS,
  type BusinessProfile,
  type Day,
  type DayHours,
  type MenuItem,
} from "@/app/account"
import { useLang } from "@/app/i18n"
import {
  PH_LOCALITIES,
  PH_PROVINCES,
  findPHLocality,
  formatPHLocality,
} from "@/data/philippinesLocations"
import { bizTypeOpts, dayLabel, label } from "@/data/themes"
import { cn } from "@/lib/cn"
import { isGeoPoint } from "@/lib/geo"
import { inputBase } from "../flow/Fields"
import { Jimbot } from "../mascot/Jimbot"
import { Button } from "../ui/Button"

export type BusinessLocationAutofill = {
  pin: { lng: number; lat: number }
  address?: string
  city?: string
}

async function getBusinessLocation(lang: "en" | "tl"): Promise<BusinessLocationAutofill> {
  if (!navigator.geolocation) throw new Error("Geolocation is not supported.")
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    }),
  )
  const { latitude, longitude } = position.coords
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
    { headers: { "Accept-Language": lang === "en" ? "en" : "tl,en" } },
  )
  if (!response.ok) throw new Error(`Address lookup failed (${response.status}).`)
  const result = (await response.json()) as { address?: Record<string, string> }
  const address = result.address ?? {}
  const street = [address.house_number, address.road ?? address.pedestrian ?? address.residential]
    .filter(Boolean)
    .join(" ")
  const localityNames = [
    address.city,
    address.town,
    address.municipality,
    address.village,
    address.county,
    address.state_district,
  ].filter((value): value is string => !!value)
  const normalized = (value: string) =>
    value.toLocaleLowerCase().replace(/^city of\s+/i, "").replace(/\s+city$/i, "").trim()
  const locality = localityNames
    .map((name) =>
      findPHLocality(name) ??
      PH_LOCALITIES.find((item) => normalized(item.name) === normalized(name)),
    )
    .find((item) => item !== undefined)
  return {
    pin: { lat: latitude, lng: longitude },
    ...(street ? { address: street } : {}),
    ...(locality ? { city: formatPHLocality(locality) } : {}),
  }
}

export function UseMyLocationButton({
  onChange,
}: {
  onChange: (location: BusinessLocationAutofill) => void
}) {
  const { t, lang } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fill = async () => {
    setLoading(true)
    setError("")
    try {
      const location = await getBusinessLocation(lang)
      onChange(location)
      if (!location.address || !location.city) {
        setError(
          t(
            "Nakuha ang pin, pero kulang ang address details. Paki-review o ilagay ang hindi na-autofill.",
            "Location was pinned, but some address details were unavailable. Please review and fill them in.",
          ),
        )
      }
    } catch (reason) {
      console.error("Unable to autofill business location.", reason)
      setError(
        t(
          "Hindi ma-autofill ang lokasyon. Payagan ang location access at subukan muli, o ilagay ito nang mano-mano.",
          "Could not autofill your location. Allow location access and try again, or enter it manually.",
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        icon={<LocateFixed size={18} />}
        disabled={loading}
        onClick={fill}
      >
        {loading
          ? t("Kinukuha ang lokasyon…", "Getting your location…")
          : t("Gamitin ang lokasyon ko", "Use my location")}
      </Button>
      {error && (
        <p role="status" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/* ------------------------------ Map pin dropper ------------------------------ */

export function MapPinDropper({
  value,
  onChange,
  error,
  location,
}: {
  value?: { lng: number; lat: number }
  onChange: (p: { lng: number; lat: number }) => void
  error?: boolean
  location?: string
}) {
  const { t } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMapInstance | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const translateRef = useRef(t)
  const lastLocationRef = useRef(location)
  const [mapReady, setMapReady] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locationError, setLocationError] = useState("")

  onChangeRef.current = onChange
  valueRef.current = value
  translateRef.current = t

  const syncPinRef = useRef<(point: { lng: number; lat: number }) => void>(
    () => {},
  )
  syncPinRef.current = (point) => {
    const map = mapRef.current
    if (!map) return
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        color: "#e76f32",
        draggable: true,
      })
        .setLngLat([point.lng, point.lat])
        .addTo(map)
      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current?.getLngLat()
        if (lngLat) onChangeRef.current({ lng: lngLat.lng, lat: lngLat.lat })
      })
    } else {
      markerRef.current.setLngLat([point.lng, point.lat])
    }
  }
  const placePinRef = useRef<(point: { lng: number; lat: number }) => void>(
    () => {},
  )
  placePinRef.current = (point) => {
    syncPinRef.current(point)
    onChangeRef.current(point)
  }

  useEffect(() => {
    maplibregl.setWorkerUrl(maplibreWorkerUrl)
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [120.9842, 14.5995],
      zoom: 5.4,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f4e4d2" },
          },
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: { "raster-opacity": 0.94 },
          },
        ],
      },
    })
    mapRef.current = map
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    )
    map.on("load", () => setMapReady(true))
    map.on("click", (event) =>
      placePinRef.current({ lng: event.lngLat.lng, lat: event.lngLat.lat }),
    )
    if (isGeoPoint(valueRef.current)) syncPinRef.current(valueRef.current)
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady) return
    if (isGeoPoint(value)) syncPinRef.current(value)
    else {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [value, mapReady])

  useEffect(() => {
    if (!mapReady || location === lastLocationRef.current) return
    lastLocationRef.current = location
    const selectedLocation = location?.trim() ? findPHLocality(location) : undefined
    if (!selectedLocation) {
      setSearching(false)
      setLocationError('')
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearching(true)
      setLocationError("")
      try {
        const query = encodeURIComponent(
          `${formatPHLocality(selectedLocation)}, Philippines`,
        )
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
          {
            signal: controller.signal,
            headers: { "Accept-Language": "en,tl" },
          },
        )
        if (!response.ok)
          throw new Error(
            `Location search failed with status ${response.status}`,
          )
        const results = (await response.json()) as { lon: string; lat: string }[]
        const result = results[0]
        if (!result) {
          setLocationError(
            translateRef.current(
              "Hindi makita sa mapa ang napiling lokasyon. Maaari mong ilagay ang pin nang mano-mano.",
              "This location could not be found on the map. You can place the pin manually.",
            ),
          )
          return
        }
        const point = { lng: Number(result.lon), lat: Number(result.lat) }
        if (!Number.isFinite(point.lng) || !Number.isFinite(point.lat))
          throw new Error("Location search returned invalid coordinates")
        mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 13 })
        placePinRef.current(point)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error(
          "Unable to find the selected Philippine location on the map.",
          error,
        )
        setLocationError(
          translateRef.current(
            "Hindi makakonekta sa paghahanap ng lokasyon. Maaari mong ilagay ang pin nang mano-mano.",
            "Could not connect to location search. You can place the pin manually.",
          ),
        )
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 500)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [location, mapReady])

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        aria-label={t(
          "Mapa ng Pilipinas: i-tap o i-drag ang pin sa eksaktong puwesto",
          "Map of the Philippines: click or drag the pin to the exact spot",
        )}
        className={cn(
          "relative h-[270px] overflow-hidden rounded-[20px] border-2",
          error ? "border-danger" : "border-line",
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-fg-2">
        <span>
          {searching
            ? t("Hinahanap ang lokasyon…", "Finding this location…")
            : value
              ? t(
                  "I-tap ang mapa o i-drag ang pin para itama.",
                  "Tap the map or drag the pin to adjust it.",
                )
              : t(
                  "I-tap ang mapa para maglagay ng pin.",
                  "Tap the map to place a pin.",
                )}
        </span>
      </div>
      {locationError && (
        <p role="status" className="mt-2 text-[13px] text-danger">
          {locationError}
        </p>
      )}
    </div>
  )
}

/* ------------------------------ Philippine province and city selection ------------------------------ */

export function PHLocationPicker({
  value,
  onChange,
  error,
  id,
}: {
  value: string
  onChange: (v: string) => void
  error?: boolean
  id?: string
}) {
  const { t } = useLang()
  const isProvince = PH_PROVINCES.includes(value)
  const selectedLocality =
    value && !isProvince ? findPHLocality(value) : undefined
  const selectedProvince = isProvince
    ? value
    : (selectedLocality?.province ?? "")
  const selectClass = cn(inputBase, "border-line")
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-fg-2">
          {t("Probinsya o lugar", "Province or area")}
        </span>
        <select
          id={id}
          value={selectedProvince}
          aria-invalid={error}
          onChange={(event) => onChange(event.target.value)}
          className={cn(selectClass, error && "border-danger")}
        >
          <option value="">
            {t("Pumili ng probinsya", "Select a province")}
          </option>
          {PH_PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-fg-2">
          {t("Lungsod o munisipalidad", "City or municipality")}
        </span>
        <select
          value={selectedLocality?.code ?? ""}
          disabled={!selectedProvince}
          onChange={(event) => {
            const locality = PH_LOCALITIES.find(
              (item) => item.code === event.target.value,
            )
            if (locality) onChange(formatPHLocality(locality))
          }}
          className={selectClass}
        >
          <option value="">
            {selectedProvince
              ? t(
                  "Pumili ng lungsod o munisipalidad",
                  "Select a city or municipality",
                )
              : t("Pumili muna ng probinsya", "Select a province first")}
          </option>
          {PH_LOCALITIES.filter(
            (locality) => locality.province === selectedProvince,
          )
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((locality) => (
              <option key={locality.code} value={locality.code}>
                {locality.name}
              </option>
            ))}
        </select>
      </label>
      {error && (
        <p className="text-[13px] text-danger sm:col-span-2">
          {t(
            "Pumili ng lokasyon sa Pilipinas.",
            "Select a location in the Philippines.",
          )}
        </p>
      )}
    </div>
  )
}

/* ------------------------------ Hours picker ------------------------------ */

function TogglePill({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-3 font-display text-[13px] font-medium transition-colors",
        on
          ? "border-brown bg-brown text-cream dark:border-cream dark:bg-cream dark:text-brown"
          : "border-line bg-surface text-fg-2 dark:bg-elevated",
      )}
    >
      {children}
    </button>
  )
}

const timeInput =
  "h-10 min-w-0 flex-1 max-w-[150px] rounded-[12px] border border-line bg-surface px-2 text-[15px] text-fg outline-none focus:border-primary dark:bg-elevated"

export function HoursPicker({
  value,
  onChange,
}: {
  value: Record<Day, DayHours>
  onChange: (v: Record<Day, DayHours>) => void
}) {
  const { lang, t } = useLang()
  const set = (d: Day, patch: Partial<DayHours>) =>
    onChange({ ...value, [d]: { ...value[d], ...patch } })
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          onChange(
            Object.fromEntries(
              DAYS.map((d) => [d, { ...value.mon }]),
            ) as Record<Day, DayHours>,
          )
        }
        className="mb-3 inline-flex h-10 items-center gap-2 rounded-full bg-sunken px-4 font-display text-[14px] font-medium text-link dark:bg-elevated"
      >
        <Copy size={16} />{" "}
        {t("Kopyahin ang Lunes sa lahat ng araw", "Copy Monday to all days")}
      </button>
      <ul className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface shadow-card dark:bg-elevated/40">
        {DAYS.map((d) => {
          const h = value[d]
          return (
            <li key={d} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[15px] font-semibold">
                  {dayLabel[d][lang === "en" ? 1 : 0]}
                </span>
                <div className="flex gap-1.5">
                  <TogglePill
                    on={h.allDay}
                    onClick={() => set(d, { allDay: !h.allDay, closed: false })}
                  >
                    {t("24 oras", "24 hrs")}
                  </TogglePill>
                  <TogglePill
                    on={h.closed}
                    onClick={() => set(d, { closed: !h.closed, allDay: false })}
                  >
                    {t("Sarado", "Closed")}
                  </TogglePill>
                </div>
              </div>
              <div className="mt-2 flex min-h-10 items-center gap-2">
                {h.closed ? (
                  <span className="text-[14px] font-semibold text-fg-2">
                    {t("Sarado buong araw", "Closed all day")}
                  </span>
                ) : h.allDay ? (
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ok">
                    <Clock size={15} /> {t("Bukas 24 oras", "Open 24 hours")}
                  </span>
                ) : (
                  <>
                    <input
                      type="time"
                      aria-label={t(
                        `Bukas ${dayLabel[d][0]}`,
                        `Opens ${dayLabel[d][1]}`,
                      )}
                      value={h.open}
                      onChange={(e) => set(d, { open: e.target.value })}
                      className={timeInput}
                    />
                    <span className="text-fg-2">{t("hanggang", "to")}</span>
                    <input
                      type="time"
                      aria-label={t(
                        `Sarado ${dayLabel[d][0]}`,
                        `Closes ${dayLabel[d][1]}`,
                      )}
                      value={h.close}
                      onChange={(e) => set(d, { close: e.target.value })}
                      className={timeInput}
                    />
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------ Repeatable menu row ------------------------------ */

export function MenuRows({
  items,
  onChange,
  categories,
  errors,
  placeholder,
  addButtonLabel,
  priceLabel,
}: {
  items: MenuItem[]
  onChange: (v: MenuItem[]) => void
  categories: string[]
  errors?: Record<string, string>
  placeholder?: string
  addButtonLabel?: string
  priceLabel?: string
}) {
  const { t } = useLang()
  const set = (id: string, patch: Partial<MenuItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  return (
    <div className="space-y-2.5">
      {items.map((it, n) => (
        <motion.div
          key={it.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-[18px] border bg-surface p-3 dark:bg-elevated/40",
            errors?.[it.id] ? "border-danger" : "border-line",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken font-display text-[12px] font-semibold text-fg-2 dark:bg-elevated">
              {n + 1}
            </span>
            <input
              value={it.name}
              onChange={(e) => set(it.id, { name: e.target.value })}
              aria-label={t("Pangalan ng item", "Item name")}
              placeholder={placeholder ?? t("hal. Sisig", "e.g. Sisig")}
              className="h-11 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-3 text-[15px] outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i.id !== it.id))}
              aria-label={t("Tanggalin", "Remove")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fg-2 hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="mt-2 flex gap-2 pl-9">
            <div className="relative w-[120px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-display text-[15px] font-semibold text-fg-2">
                ₱
              </span>
              <input
                value={it.price}
                inputMode="decimal"
                onChange={(e) =>
                  set(it.id, { price: e.target.value.replace(/[^\d.]/g, "") })
                }
                aria-label={priceLabel ?? t("Presyo", "Price")}
                placeholder="0"
                className="h-11 w-full rounded-[12px] border border-line bg-bg pl-7 pr-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
            <select
              value={it.category}
              onChange={(e) => set(it.id, { category: e.target.value })}
              aria-label={t("Kategorya", "Category")}
              className="h-11 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-2 text-[15px] outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {errors?.[it.id] && (
            <p className="mt-1.5 pl-9 text-[13px] font-semibold text-danger">
              {errors[it.id]}
            </p>
          )}
        </motion.div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            {
              id: `m${Date.now()}`,
              name: "",
              price: "",
              category: categories[0],
            },
          ])
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-primary/50 font-display text-[15px] font-medium text-link"
      >
        <Plus size={18} /> {addButtonLabel ?? t("Magdagdag ng item", "Add item")}
      </button>
    </div>
  )
}

/* ------------------------------ Go-live preview card ------------------------------ */

const fmt12 = (s: string) => {
  const [h, m] = s.split(":").map(Number)
  const ap = h >= 12 ? "PM" : "AM"
  const hh = h % 12 || 12
  return m ? `${hh}:${String(m).padStart(2, "0")} ${ap}` : `${hh} ${ap}`
}
export function todayHours(b: BusinessProfile, lang: "tl" | "en") {
  const d = DAYS[(new Date().getDay() + 6) % 7]
  const h = b.hours[d]
  if (h.closed) return lang === "en" ? "Closed today" : "Sarado ngayon"
  if (h.allDay) return lang === "en" ? "Open 24 hours" : "Bukas 24 oras"
  return `${
    lang === "en" ? "Today" : "Ngayon"
  } ${fmt12(h.open)}–${fmt12(h.close)}`
}

export function GoLivePreviewCard({
  b,
  verified,
  className,
}: {
  b: BusinessProfile
  verified?: boolean
  className?: string
}) {
  const { lang, t } = useLang()
  const type = label(bizTypeOpts, b.type, lang) ?? t("Negosyo", "Business")
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] bg-surface text-fg shadow-float dark:bg-elevated",
        className,
      )}
      aria-label={t("Preview ng shop", "Shop preview")}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        {b.cover ? (
          <img src={b.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#FFE1C4,#FFF1E3_60%)]">
            <Jimbot
              expression="pointing"
              variant="standalone"
              size={150}
              animate={false}
            />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-brown">
              <ImageOff size={12} /> {t("Default na larawan", "Default photo")}
            </span>
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex h-7 items-center gap-1 rounded-full px-2.5 font-display text-[12px] font-semibold",
            verified ? "bg-ok text-white" : "bg-white/92 text-caution",
          )}
        >
          {verified ? (
            <Check size={13} strokeWidth={3} />
          ) : (
            <TriangleAlert size={13} />
          )}
          {verified
            ? t("Verified", "Verified")
            : t("Hindi pa verified", "Not yet verified")}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-[20px] font-semibold leading-tight">
          {b.name || t("Pangalan ng negosyo", "Business name")}
        </h3>
        <p className="mt-1 text-[14px] text-fg-2">
          {type} ·{" "}
          <span className="font-semibold text-fg">{b.price ?? "₱"}</span> ·{" "}
          {b.city || t("Lungsod", "City")}
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-1 font-display text-[13px] font-semibold text-ok">
          <Clock size={14} /> {todayHours(b, lang)}
        </p>
        {b.about && (
          <p className="mt-3 line-clamp-2 text-[14px] leading-snug text-fg-2">
            {b.about}
          </p>
        )}
        {b.menu.filter((m) => m.name).length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3">
            {b.menu
              .filter((m) => m.name)
              .slice(0, 3)
              .map((m) => (
                <li key={m.id} className="flex justify-between text-[14px]">
                  <span>{m.name}</span>
                  <span className="font-display font-semibold">
                    {m.price ? `₱${m.price}` : "—"}
                  </span>
                </li>
              ))}
          </ul>
        )}
        {b.address && (
          <p className="mt-3 flex items-start gap-1.5 text-[13px] text-fg-2">
            <MapPin size={14} className="mt-0.5 shrink-0" /> {b.address}
          </p>
        )}
      </div>
    </article>
  )
}

export function DismissX({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-sunken"
    >
      <X size={18} />
    </button>
  )
}
