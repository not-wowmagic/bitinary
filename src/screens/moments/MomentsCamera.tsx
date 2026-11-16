import { Camera, Check, RefreshCcw, SlidersHorizontal, SwitchCamera, Zap, ZapOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '@/app/store'
import { Polaroid } from '@/components/cards/Polaroid'
import { FULL_BLEED } from '@/components/layout/nav'
import { Jimbot } from '@/components/mascot/Jimbot'
import { StateView } from '@/components/states/States'
import { Button } from '@/components/ui/Button'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { Segmented } from '@/components/ui/Segmented'
import { Toggle } from '@/components/ui/Toggle'
import type { Moment } from '@/data/moments'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { getForcedState } from '@/lib/forced'
import { shortDate } from '@/lib/format'
import { useCamera } from './useCamera'

const SAMPLE = 'https://images.unsplash.com/photo-1613892214268-9754501a3542?auto=format&fit=crop&w=900&h=900&q=70'
const CAMERA_FILTERS = [
  { id: 'none', label: 'Original', css: 'none' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.18) saturate(1.25) contrast(1.05)' },
  { id: 'mono', label: 'B&W', css: 'grayscale(1) contrast(1.08)' },
  { id: 'fade', label: 'Fade', css: 'saturate(0.7) contrast(0.9) brightness(1.08)' },
  { id: 'vivid', label: 'Vivid', css: 'saturate(1.55) contrast(1.12)' },
] as const
type CameraFilter = (typeof CAMERA_FILTERS)[number]['id']

export function MomentsCamera() {
  const forced = getForcedState()
  const cam = useCamera()
  const navigate = useNavigate()
  const { myMoments, cameraTipSeen, setCameraTipSeen, showToast } = useStore()
  const [shot, setShot] = useState<string | null>(forced === 'captured' ? SAMPLE : null)
  const [flash, setFlash] = useState(false)
  const [cameraFilter, setCameraFilter] = useState<CameraFilter>('none')
  const [showTip, setShowTip] = useState(forced === 'tip' || (!cameraTipSeen && !forced))
  const lastPhoto = myMoments[0]?.src

  useEffect(() => {
    if (forced === 'sample' || forced === 'captured' || forced === 'tip') {
      cam.setStatus('sample')
      return
    }
    if (forced === 'permission') return
    // auto-start only when permission was already granted
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((p) => {
        if (p.state === 'granted') cam.start()
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shutter = async () => {
    if (cam.torch && !cam.torchSupported) {
      setFlash(true)
      setTimeout(() => setFlash(false), 180)
    }
    const filter = CAMERA_FILTERS.find((item) => item.id === cameraFilter)?.css ?? 'none'
    try {
      const data = cam.status === 'live' ? cam.capture(filter) : await applyImageFilter(SAMPLE, filter)
      setShot(data ?? SAMPLE)
    } catch (error) {
      showToast({ text: error instanceof Error ? error.message : 'Hindi ma-apply ang camera filter.', expression: 'unsure' })
      setShot(SAMPLE)
    }
  }

  const needsPermission = cam.status === 'idle' || cam.status === 'requesting' || cam.status === 'denied' || cam.status === 'unavailable'

  return (
    <main className={cn(FULL_BLEED, 'z-0 overflow-hidden bg-[#0D0604] text-white')} style={{ colorScheme: 'dark' }}>
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          aria-label={cam.torch ? 'Patayin ang flash' : 'Buksan ang flash'}
          aria-pressed={cam.torch}
          onClick={cam.toggleTorch}
          className={cn('flex h-11 w-11 items-center justify-center rounded-full', cam.torch ? 'bg-amber text-ink' : 'glass-dark')}
        >
          {cam.torch ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
        </button>
        <Segmented tone="dark" label="Moments mode" value="camera" onChange={(v) => v === 'map' && navigate('/moments/map')} options={[{ value: 'camera', label: 'Camera' }, { value: 'map', label: 'Mapa' }]} />
        <span className="flex w-11 justify-end">
          <PhaseTag phase="P3" />
        </span>
      </div>

      {needsPermission && !shot ? (
        <div className="flex h-full items-center justify-center pb-24">
          <StateView
            tone="dark"
            expression="camera"
            title={cam.status === 'denied' ? 'Naka-block ang camera' : cam.status === 'unavailable' ? 'Walang camera na makita' : 'Payagan ang camera'}
            body={
              cam.status === 'denied'
                ? 'Buksan ang settings ng browser para payagan ang camera. Puwede ka munang gumamit ng sample na larawan.'
                : cam.status === 'unavailable'
                  ? 'Hindi ma-access ang camera sa device na ito. Subukan ang sample na larawan.'
                  : 'Kailangan ng camera para kumuha ng Moment. Sa device mo lang mase-save ang mga larawan, at pribado ang mga ito.'
            }
            action={cam.status === 'idle' || cam.status === 'requesting' ? 'Payagan ang camera' : undefined}
            onAction={() => cam.start()}
            secondary="Gumamit ng sample na larawan"
            onSecondary={() => cam.setStatus('sample')}
          />
        </div>
      ) : (
        <>
          {/* viewfinder with polaroid frame */}
          <div className="absolute inset-0 flex items-center justify-center pb-[170px] pt-16 md:pb-[130px]">
            <div className="relative w-[min(82vw,calc(100dvh-340px),440px)] bg-[#FFFDF8] p-[5%] pb-[22%] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
              <div className="relative aspect-square overflow-hidden bg-black">
                <video ref={cam.videoRef} playsInline muted style={{ filter: CAMERA_FILTERS.find((item) => item.id === cameraFilter)?.css }} className={cn('h-full w-full object-cover', cam.facing === 'user' && '-scale-x-100', cam.status !== 'live' && 'hidden')} />
                {cam.status === 'sample' && <img src={SAMPLE} alt="Sample na viewfinder" style={{ filter: CAMERA_FILTERS.find((item) => item.id === cameraFilter)?.css }} className="kenburns h-full w-full object-cover" />}
                {/* framing guides */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="border-[0.5px] border-white/20" />
                  ))}
                </div>
              </div>
              <p className="absolute inset-x-0 bottom-[6%] text-center font-hand text-[22px] text-[#3A1A0E]/60">{shortDate(new Date())}</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-[178px] z-20 flex justify-center md:bottom-[116px]">
            <div className="glass-dark flex max-w-[calc(100%-24px)] items-center gap-1.5 overflow-x-auto rounded-full p-1.5" aria-label="Mga camera filter">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-white/70" aria-hidden>
                <SlidersHorizontal size={15} />
              </span>
              {CAMERA_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-label={`Filter: ${filter.label}`}
                  aria-pressed={cameraFilter === filter.id}
                  onClick={() => setCameraFilter(filter.id)}
                  className={cn('shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors', cameraFilter === filter.id ? 'bg-primary text-ink' : 'text-white/80 hover:bg-white/10')}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {/* controls */}
          <div className="absolute inset-x-0 bottom-[96px] z-20 flex items-center justify-around px-8 md:bottom-8">
            <button onClick={() => navigate('/moments/map?gallery=half&f=mine')} aria-label="Buksan ang gallery" className="h-14 w-14 overflow-hidden rounded-[14px] border-2 border-white/80 bg-white/10">
              {lastPhoto && <img src={lastPhoto} alt="" className="h-full w-full object-cover" />}
            </button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={shutter} aria-label="Kunan ng larawan" className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[5px] border-primary bg-transparent p-1">
              <span className="h-full w-full rounded-full bg-white" />
            </motion.button>
            <motion.button whileTap={{ rotate: 180 }} onClick={cam.flip} aria-label="Ibaligtad ang camera" className="glass-dark flex h-14 w-14 items-center justify-center rounded-full">
              <SwitchCamera size={24} />
            </motion.button>
          </div>
        </>
      )}

      {flash && <div className="pointer-events-none absolute inset-0 z-40 bg-white" />}

      <AnimatePresence>
        {showTip && !shot && !needsPermission && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute inset-x-4 bottom-[200px] z-30 mx-auto flex max-w-[420px] items-center gap-3 rounded-[22px] bg-surface p-3 pr-4 text-fg shadow-float md:bottom-36">
            <Jimbot expression="camera" variant="standalone" size={80} />
            <div className="flex-1">
              <p className="font-display text-[16px] font-semibold">Kunan mo ang unang Moment mo!</p>
              <p className="text-caption text-fg-2">Pribado ito. Ikaw ang magpapasya kung ishe-share.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowTip(false)
                setCameraTipSeen(true)
              }}
            >
              Sige!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{shot && <CaptureResult src={shot} onRetake={() => setShot(null)} />}</AnimatePresence>
    </main>
  )
}

async function applyImageFilter(src: string, filter: string): Promise<string> {
  if (filter === 'none') return src
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Hindi ma-load ang sample image para sa filter.'))
  })
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 900
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Hindi ma-apply ang camera filter.')
  context.filter = filter
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.9)
}

function CaptureResult({ src, onRetake }: { src: string; onRetake: () => void }) {
  const tilt = useMemo(() => (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2), [])
  const [caption, setCaption] = useState('')
  const [onMap, setOnMap] = useState(true)
  const [saved, setSaved] = useState(false)
  const { addMoment, showToast } = useStore()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const save = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      showToast({ text: 'Mag-sign in muna para ma-save ang Moment sa database.', expression: 'unsure' })
      return
    }
    const location = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      navigator.geolocation?.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }), () => resolve(null), { enableHighAccuracy: false, timeout: 10000 })
    })
    if (!location) {
      showToast({ text: 'Kailangan ang location para mailagay ang Moment sa mapa.', expression: 'unsure' })
      return
    }
    const blob = await fetch(src).then((response) => response.blob())
    const path = `${userData.user.id}/${Date.now()}.jpg`
    const upload = await supabase.storage.from('images').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (upload.error) {
      showToast({ text: `Hindi na-upload ang larawan: ${upload.error.message}`, expression: 'unsure' })
      return
    }
    const { error } = await supabase.from('moments').insert({
      author_id: userData.user.id,
      storage_path: path,
      caption: caption || 'Moment',
      visited_at: today,
      place_name: '',
      area: '',
      latitude: location.latitude,
      longitude: location.longitude,
      kind: 'Pasyalan',
      frame: 'classic',
      tilt: Math.round(tilt),
      on_map: onMap,
    })
    if (error) {
      await supabase.storage.from('images').remove([path])
      showToast({ text: `Hindi na-save ang Moment: ${error.message}`, expression: 'unsure' })
      return
    }
    const m: Moment = {
      id: `me-${Date.now()}`,
      src,
      caption: caption || 'Moment ko',
      date: today,
      place: '',
      area: '',
      map: { x: 585 + Math.random() * 40 - 20, y: 545 + Math.random() * 40 - 20 },
      kind: 'Pasyalan',
      mine: true,
      frame: 'classic',
      tilt: Math.round(tilt),
      onMap,
    }
    const ok = addMoment(m)
    if (!ok) showToast({ text: 'Puno na ang storage. Pinanatili ang 20 pinakabago.', expression: 'unsure' })
    setSaved(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 overflow-y-auto bg-[#0D0604]/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col items-center px-5 pb-28 pt-[max(16px,env(safe-area-inset-top))] md:pb-10">
        {/* camera slot */}
        <div className="relative z-10 h-6 w-[78%] rounded-b-[14px] bg-[#2A150C] shadow-[inset_0_-4px_0_rgba(0,0,0,0.6)]">
          <span className="absolute inset-x-6 bottom-1.5 h-1 rounded-full bg-black" />
        </div>
        <div className="relative -mt-2 w-[72%] overflow-hidden pb-6 pt-1">
          <motion.div
            initial={{ y: '-105%', rotate: 0 }}
            animate={{ y: 0, rotate: tilt }}
            transition={{ y: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }, rotate: { delay: 0.9, type: 'spring', stiffness: 160, damping: 12 } }}
          >
            <Polaroid src={src} width="100%" developing />
          </motion.div>
        </div>
        <AnimatePresence mode="wait">
          {!saved ? (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="w-full space-y-3">
              <label className="block rounded-[18px] bg-[#FFFDF8] px-4 py-2 text-[#3A1A0E]">
                <span className="font-display text-[11px] font-semibold uppercase tracking-wide text-[#6B3A22]">{shortDate(today)}</span>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Isulat ang tala mo…"
                  className="block h-10 w-full bg-transparent font-hand text-[26px] leading-none outline-none placeholder:text-[#B08A74]"
                  aria-label="Caption"
                />
              </label>
              <div className="flex items-center justify-end gap-3 rounded-[18px] bg-white/10 px-4 py-1.5">
                <span className="flex items-center gap-1 text-[14px]">
                  Idagdag sa mapa <Toggle label="Idagdag sa mapa" checked={onMap} onChange={setOnMap} />
                </span>
              </div>
              <p className="text-center text-[13px] text-white/70">Pribado bilang default. Ikaw lang ang nakakakita nito.</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="darkglass" icon={<RefreshCcw size={18} />} onClick={onRetake}>
                  Kunan ulit
                </Button>
                <Button icon={<Check size={18} />} onClick={save}>
                  I-save
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex w-full flex-col items-center text-center">
              <Jimbot expression="celebrating" variant="standalone" size={130} />
              <p className="mt-2 font-display text-[22px] font-semibold">Na-save ang Moment mo!</p>
              <p className="text-[15px] text-white/75">{onMap ? 'Makikita mo ito sa mapa.' : 'Nasa gallery mo ito.'}</p>
              <div className="mt-4 grid w-full grid-cols-2 gap-2">
                <Button variant="darkglass" icon={<Camera size={18} />} onClick={onRetake}>
                  Kunan pa
                </Button>
                <Button onClick={() => navigate('/moments/map?gallery=half&f=mine')}>Tingnan sa mapa</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
