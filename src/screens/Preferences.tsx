import { ChevronRight, Download, RefreshCw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAccount, type TravelerPrefs, type TravelerThemeId } from '@/app/account'
import { useLang } from '@/app/i18n'
import { useStore } from '@/app/store'
import { BackButton } from '@/components/layout/TopBar'
import { Jimbot } from '@/components/mascot/Jimbot'
import { CompletenessRing, ThemeStatusLabel } from '@/components/onboarding/Kit'
import { Button } from '@/components/ui/Button'
import {
  ageOpts, companionOpts, dietOpts, foodOpts, frequencyOpts, interestOpts, isStale, label, needOpts, nextTripOpts, paceOpts, relativeTrip, transportOpts, travelerThemes, type Opt,
} from '@/data/themes'
import { getForcedState } from '@/lib/forced'
import { peso } from '@/lib/format'

const names = (opts: Opt[], ids: string[], lang: 'tl' | 'en') => ids.map((i) => label(opts, i, lang)).filter(Boolean) as string[]

export function Preferences() {
  const { prefs: real, setPrefs, profile, consent } = useAccount()
  const { lang, t } = useLang()
  const { showToast } = useStore()
  const navigate = useNavigate()
  const forced = getForcedState()
  // `?state=stale` previews the freshness prompt with a 4-month-old answer.
  const prefs: TravelerPrefs = forced === 'stale' ? { ...real, lastTrip: '1-3m', lastTripAt: new Date(Date.now() - 40 * 864e5).toISOString(), tripCheckedAt: undefined, status: { ...real.status, trip: 'done' }, foods: ['street'], mealBudget: 300 } : real
  const stale = isStale(prefs)
  const rel = relativeTrip(prefs, lang)

  const summary = (id: TravelerThemeId): string | null => {
    const p = prefs
    switch (id) {
      case 'trip':
        return [rel, label(frequencyOpts, p.frequency, lang), p.nextTrip && `${t('Susunod', 'Next')}: ${label(nextTripOpts, p.nextTrip, lang)}`].filter(Boolean).join(' · ') || null
      case 'budget':
        return p.status.budget ? `${peso(p.dailyBudget)}${t('/araw', '/day')} · ${peso(p.mealBudget)}${t('/kain', '/meal')}${p.flexible ? ' · Flexible' : ''}` : null
      case 'food':
        return [...names(foodOpts, p.foods, lang), ...names(dietOpts, p.diet, lang)].join(' · ') || null
      case 'interests':
        return names(interestOpts, p.interests, lang).join(' · ') || null
      case 'companions':
        return [...names(companionOpts, p.companions, lang), ...names(transportOpts, p.transport, lang), label(paceOpts, p.pace, lang)].filter(Boolean).join(' · ') || null
      case 'needs':
        return names(needOpts, p.needs, lang).join(' · ') || null
      case 'about':
        return [label(ageOpts, profile.ageRange, lang), profile.city].filter(Boolean).join(' · ') || null
      case 'privacy':
        return [consent.location ? t('Lokasyon: habang ginagamit', 'Location: while using') : t('Lokasyon: off', 'Location: off'), consent.personalization ? 'Personalization: on' : 'Personalization: off', consent.marketing ? 'Promos: on' : 'Promos: off'].join(' · ')
    }
  }
  const done = travelerThemes.filter((x) => prefs.status[x.id] === 'done').length

  return (
    <main className="mx-auto max-w-[760px] pb-32 md:px-6 md:pb-12">
      <header className="sticky top-0 z-20 bg-bg/90 px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl md:px-0 md:pt-6">
        <div className="flex items-center gap-2">
          <BackButton fallback="/account" />
          <h1 className="text-h2">{t('Mga Preference ko', 'My Preferences')}</h1>
        </div>
      </header>

      <div className="px-4 pt-2 md:px-0">
        <section className="flex items-center gap-4 rounded-[24px] bg-surface p-4 shadow-card dark:bg-elevated/50">
          <CompletenessRing value={done / travelerThemes.length} size={72} stroke={8} />
          <p className="flex-1 text-[15px] text-fg-2">{t('Ito ang ginagamit ni Jimbot para sa mga suhestiyon mo. I-tap ang tema para baguhin.', 'Jimbot uses these for your suggestions. Tap a theme to edit it.')}</p>
        </section>
        {!consent.personalization && (
          <p className="mt-3 rounded-2xl bg-caution-bg px-4 py-3 text-[14px] font-semibold text-caution">{t('Naka-off ang Personalization, kaya hindi muna ginagamit ang mga sagot na ito.', 'Personalization is off, so these answers are not used for now.')}</p>
        )}

        <ul className="mt-4 overflow-hidden rounded-[22px] bg-surface shadow-card dark:bg-elevated/50">
          {travelerThemes.map((x) => {
            const s = summary(x.id)
            const I = x.icon
            return (
              <li key={x.id} className="border-b border-line last:border-0">
                <button onClick={() => navigate(`/personalize/${x.id}?from=prefs`)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-link dark:bg-elevated">
                    <I size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-[15px] font-semibold">{x.id === 'trip' ? t('Huling biyahe', 'Last trip') : x[lang]}</span>
                    </span>
                    {s ? <span className="mt-0.5 line-clamp-2 block text-[14px] text-fg-2">{s}</span> : <span className="mt-0.5 block"><ThemeStatusLabel status={prefs.status[x.id]} /></span>}
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </button>
                {x.id === 'trip' && stale && prefs.lastTrip && (
                  <div className="mx-4 mb-3.5 flex items-center gap-3 rounded-[18px] bg-caution-bg p-3 text-caution">
                    <Jimbot crop="head" expression="idea" size={36} animate={false} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[15px] font-semibold">{t('Tama pa ba ito?', 'Is this still right?')}</p>
                      <p className="text-[13px]">{t('Higit 3 buwan na mula nang sagutin mo ito.', 'You answered this over 3 months ago.')}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="brown" icon={<RefreshCw size={14} />} onClick={() => (setPrefs((p) => ({ ...p, tripCheckedAt: new Date().toISOString() })), showToast({ text: t('Salamat! Na-update.', 'Thanks! Updated.'), expression: 'celebrating' }))}>
                        {t('Oo, tama pa', 'Yes, still right')}
                      </Button>
                      <button onClick={() => navigate('/personalize/trip?from=prefs')} className="h-8 font-display text-[13px] font-medium underline underline-offset-2">
                        {t('Baguhin', 'Update')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" icon={<Download size={18} />} onClick={() => showToast({ text: t('Ipapadala namin sa email mo ang kopya ng datos mo.', "We'll email you a copy of your data."), expression: 'pointing' })}>
            {t('I-download ang datos ko', 'Download my data')}
          </Button>
          <Button variant="danger" icon={<Trash2 size={18} />} onClick={() => showToast({ text: t('Kumpirmahin sa email na ipapadala namin.', 'Confirm through the email we will send.'), expression: 'unsure' })}>
            {t('Burahin ang account', 'Delete account')}
          </Button>
        </div>
      </div>
    </main>
  )
}
