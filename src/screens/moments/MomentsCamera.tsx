import { Camera, Check, RefreshCcw, SlidersHorizontal, SwitchCamera, Zap, ZapOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLang } from '@/app/i18n'
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
  const { lang, t } = useLang()
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
      const data = cam.status === 'live' ? cam.capture(filter) : await applyImageFilter(SAMPLE, filter, t)
      setShot(data ?? SAMPLE)
    } catch (error) {
      showToast({ text: error instanceof Error ? error.message : t('Hindi ma-apply ang camera filter.', 'The camera filter could not be applied.'), expression: 'unsure' })
      setShot(SAMPLE)
    }
  }

  const needsPermission = cam.status === 'idle' || cam.status === 'requesting' || cam.status === 'denied' || cam.status === 'unavailable'

  return (
    <main className={cn(FULL_BLEED, 'z-0 overflow-hidden bg-[#0D0604] text-white')} style={{ colorScheme: 'dark' }}>
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          aria-label={cam.torch ? t('Patayin ang flash', 'Turn off flash') : t('Buksan ang flash', 'Turn on flash')}
          aria-pressed={cam.torch}
          onClick={cam.toggleTorch}
          className={cn('flex h-11 w-11 items-center justify-center rounded-full', cam.torch ? 'bg-amber text-ink' : 'glass-dark')}
        >
          {cam.torch ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
        </button>
        <Segmented tone="dark" label={t('Mode ng Moments', 'Moments mode')} value="camera" onChange={(v) => v === 'map' && navigate('/moments/map')} options={[{ value: 'camera', label: t('Camera', 'Camera') }, { value: 'map', label: t('Mapa', 'Map') }]} />
        <span className="flex w-11 justify-end">
          <PhaseTag phase="P3" />
        </span>
      </div>

      {needsPermission && !shot ? (
        <div className="flex h-full items-center justify-center pb-24">
          <StateView
            tone="dark"
            expression="camera"
            title={cam.status === 'denied' ? t('Naka-block ang camera', 'Camera access is blocked') : cam.status === 'unavailable' ? t('Walang camera na makita', 'No camera found') : t('Payagan ang camera', 'Allow camera access')}
            body={
              cam.status === 'denied'
                ? t('Buksan ang settings ng browser para payagan ang camera. Puwede ka munang gumamit ng sample na larawan.', 'Open your browser settings to allow camera access. You can use a sample photo for now.')
                : cam.status === 'unavailable'
                  ? t('Hindi ma-access ang camera sa device na ito. Subukan ang sample na larawan.', 'The camera is unavailable on this device. Try using a sample photo.')
                  : t('Kailangan ng camera para kumuha ng Moment. Sa device mo lang mase-save ang mga larawan, at pribado ang mga ito.', 'Camera access is needed to capture a Moment. Photos are saved on your device and remain private.')
            }
            action={cam.status === 'idle' || cam.status === 'requesting' ? t('Payagan ang camera', 'Allow camera access') : undefined}
            onAction={() => cam.start()}
            secondary={t('Gumamit ng sample na larawan', 'Use a sample photo')}
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
                {cam.status === 'sample' && <img src={SAMPLE} alt={t('Sample na viewfinder', 'Sample viewfinder')} style={{ filter: CAMERA_FILTERS.find((item) => item.id === cameraFilter)?.css }} className="kenburns h-full w-full object-cover" />}
                {/* framing guides */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="border-[0.5px] border-white/20" />
                  ))}
                </div>
              </div>
              <p className="absolute inset-x-0 bottom-[6%] text-center font-hand text-[22px] text-[#3A1A0E]/60">{cameraDate(new Date(), lang)}</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-[178px] z-20 flex justify-center md:bottom-[116px]">
            <div className="glass-dark flex max-w-[calc(100%-24px)] items-center gap-1.5 overflow-x-auto rounded-full p-1.5" aria-label={t('Mga camera filter', 'Camera filters')}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-white/70" aria-hidden>
                <SlidersHorizontal size={15} />
              </span>
              {CAMERA_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-label={`${t('Filter', 'Filter')}: ${filter.label}`}
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
            <button onClick={() => navigate('/moments/map?gallery=half&f=mine')} aria-label={t('Buksan ang gallery', 'Open gallery')} className="h-14 w-14 overflow-hidden rounded-[14px] border-2 border-white/80 bg-white/10">
              {lastPhoto && <img src={lastPhoto} alt="" className="h-full w-full object-cover" />}
            </button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={shutter} aria-label={t('Kunan ng larawan', 'Take photo')} className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[5px] border-primary bg-transparent p-1">
              <span className="h-full w-full rounded-full bg-white" />
            </motion.button>
            <motion.button whileTap={{ rotate: 180 }} onClick={cam.flip} aria-label={t('Ibaligtad ang camera', 'Switch camera')} className="glass-dark flex h-14 w-14 items-center justify-center rounded-full">
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
              <p className="font-display text-[16px] font-semibold">{t('Kunan mo ang unang Moment mo!', 'Capture your first Moment!')}</p>
              <p className="text-caption text-fg-2">{t('Pribado ito. Ikaw ang magpapasya kung ishe-share.', 'It is private. You decide if you want to share it.')}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowTip(false)
                setCameraTipSeen(true)
              }}
            >
              {t('Sige!', 'Got it!')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{shot && <CaptureResult src={shot} lang={lang} onRetake={() => setShot(null)} />}</AnimatePresence>
    </main>
  )
}

function cameraDate(date: Date, lang: 'tl' | 'en') {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-PH' : 'fil-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

async function applyImageFilter(src: string, filter: string, t: (tl: string, en: string) => string): Promise<string> {
  if (filter === 'none') return src
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error(t('Hindi ma-load ang sample image para sa filter.', 'The sample image could not be loaded for filtering.')))
  })
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 900
  const context = canvas.getContext('2d')
  if (!context) throw new Error(t('Hindi ma-apply ang camera filter.', 'The camera filter could not be applied.'))
  context.filter = filter
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.9)
}

function CaptureResult({ src, lang, onRetake }: { src: string; lang: 'tl' | 'en'; onRetake: () => void }) {
  const { t } = useLang()
  const tilt = useMemo(() => (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2), [])
  const [caption, setCaption] = useState('')
  const [onMap, setOnMap] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  // Ref ang guard para sabay na taps ay maharang bago pa mag-update ang React state.
  const savingRef = useRef(false)
  const savedRef = useRef(false)
  const { addMoment, showToast } = useStore()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const save = async () => {
    // Iwas duplicate upload; kung pumalya ang database insert, nililinis din ang orphaned file.
    if (savingRef.current || savedRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) {
        showToast({ text: t('Mag-sign in muna para ma-save ang Moment sa database.', 'Sign in to save your Moment to the database.'), expression: 'unsure' })
        return
      }
      const location = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null)
          return
        }
        navigator.geolocation.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }), () => resolve(null), { enableHighAccuracy: false, timeout: 10000 })
      })
      if (!location) {
        showToast({ text: t('Kailangan ang location para mailagay ang Moment sa mapa.', 'Location is required to add this Moment to the map.'), expression: 'unsure' })
        return
      }
      const response = await fetch(src)
      if (!response.ok) throw new Error(t('Hindi ma-load ang larawan.', 'The photo could not be loaded.'))
      const blob = await response.blob()
      const path = `${userData.user.id}/${crypto.randomUUID()}.jpg`
      const upload = await supabase.storage.from('images').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
      if (upload.error) {
        showToast({ text: t(`Hindi na-upload ang larawan: ${upload.error.message}`, `The photo could not be uploaded: ${upload.error.message}`), expression: 'unsure' })
        return
      }
      const { error } = await supabase.from('moments').insert({
        author_id: userData.user.id,
        storage_path: path,
        caption: caption || t('Moment', 'Moment'),
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
        const { error: cleanupError } = await supabase.storage.from('images').remove([path])
        if (cleanupError) console.error('Failed to remove an orphaned Moment image.', cleanupError)
        showToast({ text: t(`Hindi na-save ang Moment: ${error.message}`, `The Moment could not be saved: ${error.message}`), expression: 'unsure' })
        return
      }
      const m: Moment = {
        id: `me-${Date.now()}`,
        src,
        caption: caption || t('Moment ko', 'My Moment'),
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
      if (!ok) showToast({ text: t('Puno na ang storage. Pinanatili ang 20 pinakabago.', 'Storage is full. Your 20 newest Moments were kept.'), expression: 'unsure' })
      savedRef.current = true
      setSaved(true)
    } catch (error) {
      console.error('Moment save failed.', error)
      showToast({
        text: error instanceof Error
          ? t(`Hindi na-save ang Moment: ${error.message}`, `The Moment could not be saved: ${error.message}`)
          : t('Hindi na-save ang Moment. Subukan ulit.', 'The Moment could not be saved. Try again.'),
        expression: 'unsure',
      })
    } finally {
      savingRef.current = false
      setSaving(false)
    }
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
                <span className="font-display text-[11px] font-semibold uppercase tracking-wide text-[#6B3A22]">{cameraDate(new Date(`${today}T12:00:00`), lang)}</span>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t('Isulat ang tala mo…', 'Write a note…')}
                  className="block h-10 w-full bg-transparent font-hand text-[26px] leading-none outline-none placeholder:text-[#B08A74]"
                  aria-label={t('Caption', 'Caption')}
                />
              </label>
              <div className="flex items-center justify-end gap-3 rounded-[18px] bg-white/10 px-4 py-1.5">
                <span className="flex items-center gap-1 text-[14px]">
                  {t('Idagdag sa mapa', 'Add to map')} <Toggle label={t('Idagdag sa mapa', 'Add to map')} checked={onMap} onChange={setOnMap} />
                </span>
              </div>
              <p className="text-center text-[13px] text-white/70">{t('Pribado bilang default. Ikaw lang ang nakakakita nito.', 'Private by default. Only you can see this.')}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="darkglass" icon={<RefreshCcw size={18} />} onClick={onRetake}>
                  {t('Kunan ulit', 'Retake')}
                </Button>
                <Button icon={<Check size={18} />} onClick={save} disabled={saving || saved} aria-busy={saving}>
                  {saving ? t('Sine-save…', 'Saving…') : t('I-save', 'Save')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex w-full flex-col items-center text-center">
              <Jimbot expression="celebrating" variant="standalone" size={130} />
              <p className="mt-2 font-display text-[22px] font-semibold">{t('Na-save ang Moment mo!', 'Your Moment was saved!')}</p>
              <p className="text-[15px] text-white/75">{onMap ? t('Makikita mo ito sa mapa.', 'You can find it on the map.') : t('Nasa gallery mo ito.', 'It is in your gallery.')}</p>
              <div className="mt-4 grid w-full grid-cols-2 gap-2">
                <Button variant="darkglass" icon={<Camera size={18} />} onClick={onRetake}>
                  {t('Kunan pa', 'Take another')}
                </Button>
                <Button onClick={() => navigate('/moments/map?gallery=half&f=mine')}>{t('Tingnan sa mapa', 'View on map')}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
