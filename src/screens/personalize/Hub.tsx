import { ArrowRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useAccount, type ThemeStatus, type TravelerThemeId } from '@/app/account'
import { useLang } from '@/app/i18n'
import { Jimbot } from '@/components/mascot/Jimbot'
import { HubLayout } from '@/components/onboarding/HubLayout'
import { BigSkip, CompletenessRing, ThemeCard } from '@/components/onboarding/Kit'
import { Button } from '@/components/ui/Button'
import { travelerThemes } from '@/data/themes'
import { getForcedState } from '@/lib/forced'
import { useBreakpoint } from '@/lib/useMedia'
import { TravelerThemeForm } from './TravelerThemes'

const sampleStatus: Partial<Record<TravelerThemeId, ThemeStatus>> = { trip: 'done', budget: 'done', food: 'skipped' }

export function ThanksCard({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      role="status"
      className="relative mb-5 flex items-center gap-3 overflow-hidden rounded-[24px] bg-primary p-3 pr-10"
    >
      <Jimbot expression="celebrating" variant="standalone" size={92} className="-my-2 shrink-0" />
      <div>
        <p className="font-display text-[19px] font-bold leading-tight text-white">{t('Salamat! Mas matalino na si Jimbot', 'Thanks! Jimbot just got smarter')}</p>
        <p className="mt-0.5 text-[14px] font-semibold text-ink">{t('Gagamitin ko ito sa mga suhestiyon mo.', "I'll use this for your suggestions.")}</p>
      </div>
      <button onClick={onClose} aria-label={t('Isara', 'Close')} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-white/20">
        <X size={18} />
      </button>
    </motion.div>
  )
}

export function PersonalizeHub() {
  const { id } = useParams<{ id?: TravelerThemeId }>()
  const [params, setParams] = useSearchParams()
  const { prefs, session } = useAccount()
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const desktop = bp === 'desktop'
  const status = getForcedState() === 'sample' ? sampleStatus : prefs.status
  const thanks = params.get('thanks') || (getForcedState() === 'thanks' ? 'trip' : null)
  const from = params.get('from')
  const doneCount = travelerThemes.filter((x) => status[x.id] === 'done').length
  const value = doneCount / travelerThemes.length
  const allTouched = travelerThemes.every((x) => status[x.id])

  useEffect(() => {
    if (!thanks) return
    const tm = setTimeout(() => setParams((p) => (p.delete('thanks'), p), { replace: true }), 6000)
    return () => clearTimeout(tm)
  }, [thanks, setParams])

  const exit = () => navigate(from === 'prefs' ? '/account/preferences' : '/', { replace: true })
  const open = (tid: TravelerThemeId) => navigate(`/personalize/${tid}${from ? `?from=${from}` : ''}`)
  const onDone = (tid: TravelerThemeId) => (s: 'done' | 'skipped') => {
    if (from === 'prefs' && !desktop) return navigate('/account/preferences', { replace: true })
    navigate(`/personalize${s === 'done' ? `?thanks=${tid}` : ''}${from ? `${s === 'done' ? '&' : '?'}from=${from}` : ''}`, { replace: true })
  }

  // Mobile / tablet: a theme is its own screen.
  if (id && !desktop) return <TravelerThemeForm key={id} id={id} onDone={onDone(id)} onBack={() => navigate(-1)} />

  const list = (
    <>
      <AnimatePresence>{thanks && <ThanksCard key="thanks" onClose={() => setParams((p) => (p.delete('thanks'), p), { replace: true })} />}</AnimatePresence>
      <section className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-title">{t('I-personalize ang Bitinary', 'Personalize Bitinary')}</h1>
          <p className="mt-1 text-body text-fg-2">{t('Sagutin ang kahit alin, sa kahit anong pagkakasunod. Puwedeng laktawan lahat.', 'Answer any of these, in any order. You can skip them all.')}</p>
        </div>
        <CompletenessRing value={value} size={88} caption={`${doneCount}/${travelerThemes.length}`} />
      </section>
      <div className="mt-4 flex items-end gap-2">
        <Jimbot expression="idea" variant="standalone" size={86} className="-mb-1 -ml-2 shrink-0" />
        <p className="mb-3 flex-1 rounded-[20px] rounded-bl-md bg-surface px-4 py-3 text-[15px] leading-snug shadow-card dark:bg-elevated">
          {session?.kind === 'user' && doneCount === 0
            ? t('Tip: simulan sa Budget at Pagkain para agad gumanda ang Home mo!', 'Tip: start with Budget and Food to improve your Home right away!')
            : t('Bawat tema ay 2 minuto o mas maikli. Isa-isa lang!', 'Each theme takes 2 minutes or less. One at a time!')}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-1 xl:gap-2.5">
        {travelerThemes.map((x) => (
          <ThemeCard key={x.id} layout={desktop ? 'row' : 'tile'} icon={x.icon} title={x[lang]} minutes={x.minutes} status={status[x.id]} tag={x.optional ? 'optional' : undefined} active={id === x.id} onClick={() => open(x.id)} />
        ))}
      </div>
    </>
  )

  const footer = allTouched ? (
    <Button block size="lg" iconRight={<ArrowRight size={18} />} onClick={exit}>
      {from === 'prefs' ? t('Bumalik sa Preferences', 'Back to Preferences') : t('Tapos na! Pumunta sa Home', 'All set! Go to Home')}
    </Button>
  ) : (
    <BigSkip onClick={exit} label={from === 'prefs' ? t('Bumalik sa Preferences', 'Back to Preferences') : t('Laktawan muna, pumunta sa Home', 'Skip for now, go to Home')} />
  )

  const pane = id ? (
    <TravelerThemeForm key={id} id={id} embedded onDone={onDone(id)} onBack={() => navigate('/personalize')} />
  ) : (
    <section className="flex h-full flex-col items-center justify-center rounded-[28px] bg-surface p-10 text-center shadow-card dark:bg-elevated/40">
      <Jimbot expression="idea" variant="standalone" size={220} />
      <h2 className="mt-4 text-h2">{t('Pumili ng tema sa kaliwa', 'Pick a theme on the left')}</h2>
      <p className="mt-2 max-w-[380px] text-body text-fg-2">{t('Lalabas dito ang mga tanong. Isa-isa lang, at puwedeng laktawan.', 'The questions will appear here. One theme at a time, all skippable.')}</p>
      <Button className="mt-6" onClick={() => open(travelerThemes.find((x) => !status[x.id])?.id ?? 'trip')}>
        {t('Simulan ang susunod', 'Start the next one')}
      </Button>
    </section>
  )

  return <HubLayout onBack={exit} list={list} footer={footer} pane={pane} />
}
