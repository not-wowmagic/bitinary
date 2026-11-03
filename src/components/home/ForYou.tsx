import { Sparkles, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAccount } from '@/app/account'
import { useLang } from '@/app/i18n'
import { foodOpts, interestOpts, label } from '@/data/themes'
import { places, type Place } from '@/data/places'
import { peso } from '@/lib/format'
import { cardGrid } from '../ui/cardGrid'
import { ListingCard } from '../cards/ListingCard'
import { Jimbot } from '../mascot/Jimbot'
import { Button } from '../ui/Button'
import { SectionHeader } from '../ui/Section'

const minPrice = (p: Place) => Number(p.priceText.replace(/,/g, '').match(/\d+/)?.[0] ?? 0)

/** Map completed Food / Interests answers to place categories. */
const toCategory: Record<string, string[]> = {
  street: ['Street Food'],
  local: ['Kainan', 'Budget Meals'],
  coffee: ['Kapihan'],
  seafood: ['Kainan'],
  dessert: ['Kapihan', 'Street Food'],
  fine: ['Kainan'],
  beach: ['Resorts'],
  heritage: ['Pasyalan', 'Tours'],
  photo: ['Pasyalan', 'Tours'],
  shopping: ['Pasalubong'],
}

export function personalReason(food: string | undefined, mealBudget: number, lang: 'tl' | 'en') {
  if (lang === 'en') return food ? `For you because you like ${food.toLowerCase()} on a ${peso(mealBudget)} budget` : `For you, within ${peso(mealBudget)} per meal`
  return food ? `Para sa iyo dahil gusto mo ng ${food.toLowerCase()} sa budget na ${peso(mealBudget)}` : `Para sa iyo, pasok sa ${peso(mealBudget)} bawat kain`
}

export function ForYou() {
  const { prefs, consent, session, requireAccount } = useAccount()
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const st = prefs.status
  const personalized = consent.personalization && session?.kind === 'user' && (st.food === 'done' || st.budget === 'done' || st.interests === 'done')

  if (!personalized) {
    return (
      <section className="mx-4 flex items-center gap-3 rounded-[22px] bg-brown p-4 text-cream md:mx-0 dark:bg-elevated">
        <Jimbot expression="idea" crop="head" size={52} animate={false} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] font-semibold">{t('I-personalize ang Home mo', 'Personalize your Home')}</p>
          <p className="text-[14px] text-[#E8CDB9]">{t('Sagutin ang Budget at Pagkain, 2 minuto lang.', 'Answer Budget and Food, just 2 minutes.')}</p>
        </div>
        <Button size="sm" icon={<Sparkles size={15} />} onClick={() => (session?.kind === 'user' ? navigate('/personalize') : requireAccount(t('Kailangan ng account para ma-save ang mga preference mo.', 'You need an account to save your preferences.')))}>
          {t('Simulan', 'Start')}
        </Button>
      </section>
    )
  }

  const keys = [...(st.food === 'done' ? prefs.foods : []), ...(st.interests === 'done' ? prefs.interests : [])]
  const cats = new Set(keys.flatMap((k) => toCategory[k] ?? []))
  const budget = st.budget === 'done' ? prefs.mealBudget * (prefs.flexible ? 1.2 : 1) : Infinity
  const noPork = st.food === 'done' && prefs.diet.includes('nopork')
  let list = places.filter((p) => p.area !== 'Batangas' || prefs.interests.includes('beach'))
  list = list.filter((p) => (!cats.size || cats.has(p.category)) && minPrice(p) <= budget && !(noPork && ['p4', 'p5'].includes(p.id)))
  const exact = list.length > 0
  if (!exact) list = places.filter((p) => p.area !== 'Batangas').slice(0, 3)
  const food = st.food === 'done' ? label(foodOpts, prefs.foods[0], lang) : st.interests === 'done' ? label(interestOpts, prefs.interests[0], lang) : undefined

  return (
    <section className="space-y-3">
      <SectionHeader title={t('Para sa iyo', 'For you')} action={t('Baguhin', 'Edit')} onAction={() => navigate('/account/preferences')} />
      <p className="flex items-start gap-2 px-4 text-[15px] text-fg-2 md:px-0">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-link" />
        <span>{exact ? personalReason(food, prefs.mealBudget, lang) : t('Wala pang eksaktong tugma malapit dito, kaya heto muna ang pinakamalapit na verified.', 'No exact match nearby yet, so here are the closest verified spots.')}</span>
      </p>
      <div className={cardGrid}>
        {list.slice(0, 6).map((p) => (
          <ListingCard key={p.id} place={p} />
        ))}
      </div>
    </section>
  )
}

export function GuestBanner() {
  const { session } = useAccount()
  const navigate = useNavigate()
  const [hidden, setHidden] = useState(false)
  if (session?.kind !== 'guest' || hidden) return null
  return (
    <div className="card mx-4 flex items-center gap-3 p-3 md:mx-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-ink">
        <UserPlus size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-semibold leading-tight">Nag-e-explore ka bilang guest</p>
        <p className="text-[13px] text-fg-2">Mag-sign up para ma-save ang trips at lugar.</p>
      </div>
      <Button size="sm" onClick={() => navigate('/signup/role')}>
        Mag-sign up
      </Button>
      <button aria-label="Isara" onClick={() => setHidden(true)} className="-mr-1 flex h-11 w-8 items-center justify-center text-muted">
        <X size={18} />
      </button>
    </div>
  )
}
