import { ArrowUp, Database, Megaphone, PenLine, Rocket, Settings2, Tag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { Lang } from '@/app/i18n'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { useReducedMotion } from '@/lib/useMedia'
import { WEEKDAYS, hourLabel, num } from '../format'
import { stats } from '../seed'
import { useBiz, type BizData } from '../store'
import { PageHeader } from '../ui'
import { bestSlot, change, week } from './Overview'

type Action = { kind: 'deal' | 'prices' | 'boost' | 'post' | 'review' | 'help'; to: string }
type Msg = { id: number; from: 'me' | 'jimbot'; text: string; actions?: Action[]; data?: [string, string][] }
type Intent = 'customers' | 'promo' | 'menu' | 'trending' | 'review' | 'support' | 'unknown'

const TL_WORDS = /\b(paano|ano|ang|ng|mga|ko|ako|sa|po|naman|gusto|dadami|gumawa|tulungan|suriin|uso|malapit|sagot|tulong|kailangan|magkano)\b/i

function detect(text: string): Intent {
  const s = text.toLowerCase()
  if (/customer|dadami|more people|marami/.test(s)) return 'customers'
  if (/promo|deal|discount|b1t1|buy 1/.test(s)) return 'promo'
  if (/menu|presyo|price/.test(s)) return 'menu'
  if (/trend|uso|nearby|malapit/.test(s)) return 'trending'
  if (/review|sagot|reply/.test(s)) return 'review'
  if (/support|tulong|help/.test(s)) return 'support'
  return 'unknown'
}

function answer(intent: Intent, L: Lang, d: BizData, enough: boolean): Omit<Msg, 'id' | 'from'> {
  const t = (tl: string, en: string) => (L === 'en' ? en : tl)
  const best = bestSlot(stats.heat)
  const day = WEEKDAYS[L][(best.d + 1) % 7]
  if (!enough && intent !== 'support')
    return { text: t('Kulang pa ang data. Subukan ulit pagkalipas ng 2 linggo.', "I don't have enough data yet. Check again in 2 weeks."), data: [[t('Araw na live', 'Days live'), '0'], [t('Views', 'Views'), '0']] }
  const saves = week(stats.saves)
  switch (intent) {
    case 'customers':
    case 'promo':
      return {
        text: t("Mas maraming nagse-save tuwing Biyernes ng gabi. Subukan ang 'Buy 1 Take 1' mula 5 PM hanggang 8 PM.", 'More people save your shop on Friday evenings. Try a Buy 1 Take 1 deal from 5 PM to 8 PM.') + (intent === 'customers' ? ' ' + t('Puwede ring i-boost ang reel mo ng kare-kare, ito ang may pinakamaraming views.', 'You can also boost your kare-kare reel, your most viewed post.') : ''),
        actions: intent === 'customers' ? [{ kind: 'deal', to: '/biz/account/deals?new=b1t1' }, { kind: 'boost', to: '/biz/account/boost?post=p1' }] : [{ kind: 'deal', to: '/biz/account/deals?new=b1t1' }, { kind: 'post', to: '/biz/content/new?type=post&deal=1' }],
        data: [[t('Save ngayong linggo', 'Saves this week'), num(saves)], [t('Pinakamaraming save', 'Peak saves'), `${day}, ${hourLabel(best.h)}`], [t('Pagbabago', 'Change'), `${Math.round(change(stats.saves))}%`], [t('Pinakamagandang post', 'Top post'), 'Reel · 2,140 views']],
      }
    case 'menu': {
      if (d.business.menu.length < 3) return { text: t('Kulang pa ang data. Maglista muna ng kahit 3 item sa menu.', "I don't have enough data yet. Add at least 3 menu items first."), actions: [{ kind: 'prices', to: '/biz/stats/backgrounds#menu' }] }
      const noPhoto = d.business.menu.find((m) => m.name === 'Tapsilog')?.name ?? d.business.menu[d.business.menu.length - 1].name
      return {
        text: t(`Kare-kare ang pinaka-hinahanap mong ulam (312 searches ngayong linggo). Wala pang larawan ang ${noPhoto}, at 2 item ang hindi na-update ang presyo nang 40 araw.`, `Kare-kare is your most searched dish (312 searches this week). ${noPhoto} has no photo yet, and 2 items haven't had a price update in 40 days.`),
        actions: [{ kind: 'prices', to: '/biz/stats/backgrounds#menu' }, { kind: 'post', to: '/biz/content/new?type=post' }],
        data: [[t('Item sa menu', 'Menu items'), String(d.business.menu.length)], [t('Search: kare-kare', 'Search: kare-kare'), '312'], [t('Huling update ng presyo', 'Last price update'), t('40 araw', '40 days')]],
      }
    }
    case 'trending':
      return {
        text: t('Tumaas nang 31% ang "halo-halo Ermita" malapit sa iyo, at 18% ang "kare-kare near me". Mag-post ng halo-halo reel ngayong Biyernes.', 'Searches for "halo-halo Ermita" near you are up 31%, and "kare-kare near me" up 18%. Post a halo-halo reel this Friday.'),
        actions: [{ kind: 'post', to: '/biz/content/new?type=reel' }],
        data: stats.topSearches.slice(0, 3).map((s) => [s.q, `${num(s.n)} (${s.d > 0 ? '+' : ''}${s.d}%)`]),
      }
    case 'review': {
      const r = d.reviews.find((x) => !x.reply && !x.caseId && x.stars <= 3) ?? d.reviews.find((x) => !x.reply && !x.caseId)
      if (!r) return { text: t('Nasagot mo na lahat ng review. Ang galing!', "You've replied to every review. Nice work!") }
      return {
        text: t(`Heto ang draft para kay ${r.nick}: "Salamat po sa feedback, ${r.nick.split(' ')[0]}. Pasensya na sa tagal ng order. Nagdagdag na kami ng tauhan tuwing tanghali. Sana makabalik po kayo!"`, `Here's a draft for ${r.nick}: "Thank you for the feedback, ${r.nick.split(' ')[0]}. Sorry about the wait. We've added staff at lunch. We hope to see you again!"`),
        actions: [{ kind: 'review', to: `/biz/content/reviews/${r.id}?draft=1` }],
        data: [[t('Review', 'Review'), `${r.stars}★ · ${r.nick}`], [t('Paksa', 'Topic'), t('Tagal ng serbisyo', 'Service speed')]],
      }
    }
    case 'support':
      return { text: t('Puwede kitang ikonekta sa Bitinary team. Sumasagot sila Lunes hanggang Sabado, 8 AM–6 PM.', 'I can connect you with the Bitinary team. They reply Monday to Saturday, 8 AM–6 PM.'), actions: [{ kind: 'help', to: '/biz/account/help' }] }
    default:
      return { text: t('Hindi ko pa alam iyan. Subukan ang isa sa mga mungkahi sa ibaba, o itanong tungkol sa customers, promo, menu, trend o review.', "I don't know that one yet. Try a suggestion below, or ask about customers, promos, your menu, trends or reviews.") }
  }
}

export function JimbotChat() {
  const { d, set, t, lang, status } = useBiz()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const enough = status !== 'draft' && getForcedState() !== 'nodata'
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, from: 'jimbot', text: t(`Kumusta, ${d.profile.nickname || 'Ben'}! Ako si Jimbot. Ginagamit ko lang ang sarili mong stats para tumulong. Ano ang gusto mong gawin?`, `Hi ${d.profile.nickname || 'Ben'}! I'm Jimbot. I only use your own stats to help. What would you like to do?`) }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [settings, setSettings] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' })
  }, [msgs, typing, reduce])
  // Show the sample suggestion on first open of the frame (once, even under StrictMode).
  const sampled = useRef(false)
  useEffect(() => {
    if (getForcedState() === 'sample' && !sampled.current && (sampled.current = true)) send(t('Paano dadami ang customers?', 'How do I get more customers?'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chips: [string, string][] = [
    ['Paano dadami ang customers?', 'How do I get more customers?'],
    ['Gumawa ng promo', 'Create a promo'],
    ['Suriin ang menu ko', 'Review my menu'],
    ['Ano ang uso malapit sa akin?', "What's trending nearby?"],
    ['Tulungan akong sumagot sa review', 'Help me reply to a review'],
    ['Tulong', 'Support'],
  ]
  const actionLabel: Record<Action['kind'], [string, string, ReactNode]> = {
    deal: ['Gumawa ng deal', 'Create deal', <Tag size={18} key="d" />],
    prices: ['I-update ang presyo', 'Update prices', <PenLine size={18} key="p" />],
    boost: ['I-boost ang post', 'Boost a post', <Rocket size={18} key="b" />],
    post: ['Sumulat ng post', 'Write a post', <Megaphone size={18} key="w" />],
    review: ['Buksan ang review', 'Open review', <PenLine size={18} key="r" />],
    help: ['Kausapin ang team', 'Talk to the team', <Megaphone size={18} key="h" />],
  }

  function send(text: string) {
    const q = text.trim()
    if (!q) return
    const replyLang: Lang = d.prefs.jimbotMatch ? (TL_WORDS.test(q) ? 'tl' : 'en') : lang
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: q }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { id: Date.now() + 1, from: 'jimbot', ...answer(detect(q), replyLang, d, enough) }])
    }, reduce ? 200 : 900)
  }
  const lastData = [...msgs].reverse().find((m) => m.data)?.data

  return (
    <main className="flex h-[calc(100dvh-64px)] flex-col pb-24 md:pb-0">
      <PageHeader
        title="Jimbot"
        phase="P2"
        sub={t('Ang business assistant mo. Sarili mong stats lang ang ginagamit.', 'Your business assistant. Uses only your own stats.')}
        actions={
          <button onClick={() => setSettings(true)} className="flex h-11 items-center gap-2 rounded-full bg-surface px-4 font-display text-[14px] font-medium shadow-card" aria-label={t('Settings ni Jimbot', 'Jimbot settings')}>
            <Settings2 size={18} /> {d.prefs.jimbotMatch ? t('Sundin ang tina-type ko', 'Match what I type') : lang === 'en' ? 'English' : 'Tagalog'}
          </button>
        }
      />
      <div className="flex min-h-0 flex-1 gap-5 px-4 md:px-8 md:pb-6">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-surface shadow-card">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 md:p-5" aria-live="polite">
            {msgs.map((m) =>
              m.from === 'me' ? (
                <motion.div key={m.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <p className="max-w-[78%] rounded-[22px] rounded-br-md bg-deep px-4 py-2.5 text-[16px] leading-snug text-white">{m.text}</p>
                </motion.div>
              ) : (
                <motion.div key={m.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                  <Jimbot crop="head" size={36} expression={m.actions?.some((a) => a.kind === 'deal') ? 'idea' : 'waving'} animate={false} />
                  <div className="max-w-[82%] space-y-2">
                    <p className="rounded-[22px] rounded-bl-md bg-sunken px-4 py-3 text-[16px] leading-snug dark:bg-elevated">{m.text}</p>
                    {m.actions && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {m.actions.map((a) => (
                          <button key={a.kind} onClick={() => navigate(a.to)} className="flex min-h-14 items-center gap-3 rounded-[18px] border-2 border-primary/40 bg-bg px-3 text-left hover:border-primary">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-ink">{actionLabel[a.kind][2]}</span>
                            <span className="font-display text-[15px] font-semibold">{actionLabel[a.kind][lang === 'en' ? 1 : 0]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {m.data && (
                      <details className="text-[14px] text-fg-2 xl:hidden">
                        <summary className="cursor-pointer font-display font-medium text-link">{t('Data na ginamit ko', 'Data I used')}</summary>
                        <ul className="mt-1 space-y-0.5">
                          {m.data.map(([k, v]) => (
                            <li key={k}>
                              {k}: <b className="text-fg">{v}</b>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </motion.div>
              ),
            )}
            <AnimatePresence>
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-end gap-2" role="status" aria-label={t('Nag-iisip si Jimbot', 'Jimbot is thinking')}>
                  <Jimbot crop="head" size={36} expression="thinking" animate={false} />
                  <span className="flex gap-1 rounded-[22px] rounded-bl-md bg-sunken px-4 py-3.5 dark:bg-elevated">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="h-2 w-2 rounded-full bg-muted" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
                    ))}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={end} />
          </div>
          <div className="border-t border-line p-3">
            <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
              {chips.map(([tl, en]) => (
                <button key={en} onClick={() => send(lang === 'en' ? en : tl)} className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-line bg-bg px-4 font-display text-[14px] font-medium hover:border-primary">
                  {lang === 'en' ? en : tl}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2"
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('Magtanong kay Jimbot…', 'Ask Jimbot…')} aria-label={t('Mensahe', 'Message')} className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-[16px] outline-none focus:border-primary" />
              <button type="submit" disabled={!input.trim()} aria-label={t('Ipadala', 'Send')} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-ink disabled:opacity-40">
                <ArrowUp size={22} />
              </button>
            </form>
          </div>
        </section>

        <aside className="hidden w-[320px] shrink-0 flex-col gap-4 xl:flex" aria-label={t('Data na ginamit ni Jimbot', 'Data Jimbot used')}>
          <div className="rounded-[24px] bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-h3">
              <Database size={20} className="text-link" /> {t('Data na ginamit ko', 'Data I used')}
            </h2>
            {lastData ? (
              <ul className="mt-3 divide-y divide-line">
                {lastData.map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-3 py-2.5 text-[15px]">
                    <span className="text-fg-2">{k}</span>
                    <b className="text-right font-display">{v}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[15px] text-fg-2">{t('Lalabas dito ang stats na pinagbatayan ng bawat sagot.', 'The stats behind each answer appear here.')}</p>
            )}
            <p className="mt-3 rounded-[14px] bg-sunken p-3 text-[14px] text-fg-2 dark:bg-elevated">{t('Sarili mong stats lang ang ginagamit ko. Hindi ko nakikita ang data ng ibang negosyo.', 'I only use your own stats. I never see other businesses’ data.')}</p>
          </div>
          <div className="flex items-end gap-2 rounded-[24px] bg-primary p-4">
            <Jimbot expression="idea" variant="standalone" size={80} className="-mb-2" />
            <p className="pb-2 font-display text-[15px] font-semibold text-ink">{t('Tip: itanong kung ano ang uso malapit sa iyo tuwing Lunes.', 'Tip: ask what’s trending nearby every Monday.')}</p>
          </div>
        </aside>
      </div>

      <Sheet open={settings} onClose={() => setSettings(false)} title={t('Wika ni Jimbot', 'Jimbot language')}>
        <div className="flex items-center gap-3 rounded-[16px] bg-sunken p-4 dark:bg-elevated">
          <div className="flex-1">
            <p className="font-display text-[16px] font-semibold">{t('Sundin ang tina-type ko', 'Match what I type')}</p>
            <p className="text-[15px] text-fg-2">{t('Naiintindihan ang Taglish. Kapag naka-off, sasagot sa wika ng app.', 'Understands Taglish. When off, Jimbot replies in the app language.')}</p>
          </div>
          <Toggle label={t('Sundin ang tina-type ko', 'Match what I type')} checked={d.prefs.jimbotMatch} onChange={(v) => set((x) => ({ ...x, prefs: { ...x.prefs, jimbotMatch: v } }))} />
        </div>
      </Sheet>
    </main>
  )
}
