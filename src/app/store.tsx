import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { usePersistentState } from '@/lib/usePersistentState'
import { itineraries, type Stop } from '@/data/itineraries'
import type { Moment } from '@/data/moments'
import type { Expression } from '@/components/mascot/Jimbot'

export type ToastMsg = { id: number; text: string; expression?: Expression; action?: { label: string; to: string } }
export type Panel = { type: 'shop'; id: string } | { type: 'itinerary'; id: string } | { type: 'jimbot' } | null

type Store = {
  onboarded: boolean
  setOnboarded: (v: boolean) => void
  saved: string[]
  toggleSaved: (id: string) => void
  savedItineraries: string[]
  saveItinerary: (id: string) => void
  itineraryStops: Record<string, Stop[]>
  setItineraryStops: (id: string, stops: Stop[]) => void
  addStop: (itId: string, stop: Stop) => void
  myMoments: Moment[]
  addMoment: (m: Moment) => boolean
  removeMoment: (id: string) => void
  dataSaver: boolean
  setDataSaver: (v: boolean) => void
  subtitles: boolean
  setSubtitles: (v: boolean) => void
  installDismissed: boolean
  setInstallDismissed: (v: boolean) => void
  cameraTipSeen: boolean
  setCameraTipSeen: (v: boolean) => void
  toast: ToastMsg | null
  showToast: (t: Omit<ToastMsg, 'id'>) => void
  dismissToast: () => void
  panel: Panel
  setPanel: (p: Panel) => void
  resetAll: () => void
}

const Ctx = createContext<Store | null>(null)
const MAX_MOMENTS = 20

export function StoreProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = usePersistentState('onboarded', false)
  const [saved, setSaved] = usePersistentState<string[]>('saved', [])
  const [savedItineraries, setSavedIts] = usePersistentState<string[]>('savedItineraries', [])
  const [itineraryStops, setStopsMap] = usePersistentState<Record<string, Stop[]>>('itineraryStops', {})
  const [myMoments, setMoments] = usePersistentState<Moment[]>('moments', [])
  const [dataSaver, setDataSaver] = usePersistentState('dataSaver', false)
  const [subtitles, setSubtitles] = usePersistentState('subtitles', true)
  const [installDismissed, setInstallDismissed] = usePersistentState('installDismissed', false)
  const [cameraTipSeen, setCameraTipSeen] = usePersistentState('cameraTipSeen', false)
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const [panel, setPanel] = useState<Panel>(null)

  const showToast = useCallback((t: Omit<ToastMsg, 'id'>) => setToast({ ...t, id: Date.now() }), [])
  const dismissToast = useCallback(() => setToast(null), [])

  const toggleSaved = useCallback(
    (id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    [setSaved],
  )
  const saveItinerary = useCallback(
    (id: string) => setSavedIts((s) => (s.includes(id) ? s : [...s, id])),
    [setSavedIts],
  )
  const setItineraryStops = useCallback(
    (id: string, stops: Stop[]) => setStopsMap((m) => ({ ...m, [id]: stops })),
    [setStopsMap],
  )
  const addStop = useCallback(
    (itId: string, stop: Stop) =>
      setStopsMap((m) => {
        const base = m[itId] ?? itineraries.find((i) => i.id === itId)?.stops ?? []
        if (base.some((s) => s.placeId && s.placeId === stop.placeId)) return m
        return { ...m, [itId]: [...base, stop] }
      }),
    [setStopsMap],
  )
  const addMoment = useCallback(
    (mo: Moment) => {
      let ok = true
      setMoments((list) => {
        const next = [mo, ...list]
        if (next.length > MAX_MOMENTS) ok = false
        return next.slice(0, MAX_MOMENTS)
      })
      return ok
    },
    [setMoments],
  )
  const removeMoment = useCallback((id: string) => setMoments((list) => list.filter((moment) => moment.id !== id)), [setMoments])

  const resetAll = useCallback(() => {
    setOnboarded(false)
    setSaved([])
    setSavedIts([])
    setStopsMap({})
    setMoments([])
    setCameraTipSeen(false)
    setInstallDismissed(false)
  }, [setOnboarded, setSaved, setSavedIts, setStopsMap, setMoments, setCameraTipSeen, setInstallDismissed])

  const value = useMemo<Store>(
    () => ({
      onboarded,
      setOnboarded,
      saved,
      toggleSaved,
      savedItineraries,
      saveItinerary,
      itineraryStops,
      setItineraryStops,
      addStop,
      myMoments,
      addMoment,
      removeMoment,
      dataSaver,
      setDataSaver,
      subtitles,
      setSubtitles,
      installDismissed,
      setInstallDismissed,
      cameraTipSeen,
      setCameraTipSeen,
      toast,
      showToast,
      dismissToast,
      panel,
      setPanel,
      resetAll,
    }),
    [onboarded, setOnboarded, saved, toggleSaved, savedItineraries, saveItinerary, itineraryStops, setItineraryStops, addStop, myMoments, addMoment, removeMoment, dataSaver, setDataSaver, subtitles, setSubtitles, installDismissed, setInstallDismissed, cameraTipSeen, setCameraTipSeen, toast, showToast, dismissToast, panel, resetAll],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOptionalStore() {
  return useContext(Ctx)
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore outside StoreProvider')
  return c
}

export function useItineraryStops(id: string) {
  const { itineraryStops } = useStore()
  return itineraryStops[id] ?? itineraries.find((i) => i.id === id)?.stops ?? []
}
