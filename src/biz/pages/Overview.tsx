import { BadgeCheck, Bookmark, ChevronRight, Eye, FileWarning, Flag, MapPin, MessageCircle, Route, Send, Sparkles, Star, Ticket, TriangleAlert, Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Jimbot } from '@/components/mascot/Jimbot'
import { CompletenessRing } from '@/components/onboarding/Kit'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { cn } from '@/lib/cn'
import { WEEKDAYS, greeting, hourLabel, longDate, num } from '../format'
import { QuickUpdatePanel } from '../QuickUpdate'
import { useBizStats } from '../statsService'
import { useBiz, type Channel } from '../store'
import { Card, KpiCard, PageHeader, SubTabs } from '../ui'

export function StatsTabs() {
  const { t } = useBiz()
  return (
    <SubTabs
      label={t('Statistika', 'Statistics')}
      items={[
        { to: '/biz/stats', label: t('Pangkalahatan', 'Overview'), exact: true },
        { to: '/biz/stats/analytics', label: t('Analitika', 'Analytics') },
        { to: '/biz/stats/backgrounds', label: t('Impormasyon ng Negosyo', 'Backgrounds') },
      ]}
    />
  )
}

export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)
export const week = (a: number[], back = 0) => sum(a.slice(a.length - 7 * (back + 1), a.length - 7 * back))
export const change = (a: number[]) => {
  const p = week(a, 1)
  return p ? ((week(a) - p) / p) * 100 : 0
}

export function bestSlot(heat: number[][]) {
  let best = { d: 0, h: 0, v: 0 }
  heat.forEach((row, d) => row.forEach((v, h) => v > best.v && (best = { d, h, v })))
  return best
}

export function useHealth() {
  const { d, t } = useBiz()
  const b = d.business
  const items = [
    { id: 'photos', label: t('Mga larawan (cover + 3)', 'Photos (cover + 3)'), ok: !!b.cover && b.photos.length >= 3, cta: t('Magdagdag', 'Add photos') },
    { id: 'hours', label: t('Oras ng bukas', 'Opening hours'), ok: b.status.hours === 'done', cta: t('Itakda', 'Set hours') },
    { id: 'menu', label: t('Mga presyo (3+ item)', 'Prices (3+ items)'), ok: b.menu.filter((m) => m.price).length >= 3, cta: t('Ilista', 'Add prices') },
    { id: 'verify', label: t('Permit', 'Permit'), ok: b.verification.status === 'verified' || b.verification.status === 'pending', cta: t('I-upload', 'Upload') },
    { id: 'contact', label: t('Contact', 'Contact'), ok: b.status.contact === 'done', cta: t('Idagdag', 'Add contact') },
  ]
  return { items, score: Math.round((items.filter((i) => i.ok).length / items.length) * 100) }
}

function VerificationBanner() {
  const { status, t } = useBiz()
  const navigate = useNavigate()
  if (status === 'draft') return null
  const m = {
    live: { cls: 'bg-brown text-cream dark:bg-elevated', icon: <BadgeCheck size={22} />, title: t('Hindi pa na-verify', 'Not yet verified'), body: t('Mag-verify para makuha ang badge, deals, boosts at reservations.', 'Verify to unlock the badge, deals, boosts and reservations.'), cta: t('Mag-verify', 'Verify') },
    pending: { cls: 'bg-caution-bg text-caution', icon: <BadgeCheck size={22} />, title: t('Sinusuri ang verification', 'Verification pending'), body: t('Natanggap namin ang permit mo. Karaniwang 1–2 araw ng trabaho.', 'We received your permit. Usually 1–2 business days.'), cta: t('Tingnan', 'View') },
    'needs-docs': { cls: 'bg-danger-bg text-danger', icon: <FileWarning size={22} />, title: t('Kailangan ng dagdag na dokumento', 'More documents needed'), body: t('Malabo ang kopya ng mayor’s permit. Mag-upload ng mas malinaw.', "The mayor's permit copy is unclear. Please upload a clearer one."), cta: t('Mag-upload', 'Upload') },
    verified: { cls: 'bg-ok-bg text-ok', icon: <BadgeCheck size={22} />, title: t('Na-verify!', 'Verified!'), body: t('Bukas na ang badge, deals, boosts at reservations.', 'The badge, deals, boosts and reservations are unlocked.'), cta: t('Gumawa ng deal', 'Create a deal') },
  }[status]
  return (
    <div role="status" className={cn('flex flex-wrap items-center gap-3 rounded-[20px] p-4', m.cls)}>
      {status === 'verified' ? <Jimbot expression="celebrating" variant="standalone" size={52} className="-my-2" /> : m.icon}
      <div className="min-w-0 flex-1">
        <p className="font-display text-[16px] font-semibold">{m.title}</p>
        <p className="text-[15px] leading-snug opacity-90">{m.body}</p>
      </div>
      <Button size="md" variant={status === 'live' ? 'primary' : 'outline'} onClick={() => navigate(status === 'verified' ? '/biz/account/deals' : '/biz/stats/backgrounds#verify')}>
        {m.cta}
      </Button>
    </div>
  )
}

export function Overview() {
  const { d, t, lang, set, status, verified } = useBiz()
  const navigate = useNavigate()
  const health = useHealth()
  const [tip, setTip] = useState(0)
  const draft = status === 'draft'
  const dbStats = useBizStats({
    businessId: d.business.id,
    live: d.business.live,
  })
  const z = (a: number[]) => (draft ? a.map(() => 0) : a)
  const best = bestSlot(dbStats.heat)
  const unanswered = d.reviews.filter((r) => !r.reply && !r.caseId)
  const newComments = d.comments.filter((c) => c.fresh && !c.reply && !c.hidden)
  const openCases = d.cases.filter((c) => c.status === 'review' || c.status === 'info' || c.status === 'received')
  const name = d.profile.nickname || d.profile.name.split(' ')[0] || 'Ben'

  const tips = useMemo(() => {
    const list: { pose: 'idea'; text: string; cta: string; to: string }[] = []
    health.items.filter((i) => !i.ok).forEach((i) => list.push({ pose: 'idea', text: t(`Kumpletuhin ang ${i.label.toLowerCase()} para tumaas ang Profile Health Score.`, `Complete ${i.label.toLowerCase()} to raise your Profile Health Score.`), cta: i.cta, to: `/biz/stats/backgrounds#${i.id}` }))
    if (unanswered.length) list.push({ pose: 'idea', text: t(`May ${unanswered.length} review na wala pang sagot. Ang mabilis na sagot ay nagpapataas ng tiwala.`, `${unanswered.length} reviews have no reply yet. Quick replies build trust.`), cta: t('Sumagot', 'Reply'), to: '/biz/content/reviews?f=needs' })
    list.push({ pose: 'idea', text: t("Mas maraming nagse-save tuwing Biyernes ng gabi. Subukan ang 'Buy 1 Take 1' mula 5 PM hanggang 8 PM.", 'More people save your shop on Friday evenings. Try a Buy 1 Take 1 deal from 5 PM to 8 PM.'), cta: t('Gumawa ng deal', 'Create deal'), to: '/biz/account/deals?new=b1t1' })
    list.push({ pose: 'idea', text: t('Ang reels mo ay may 2x na mas maraming views kaysa sa photo posts. Gumawa ng bago ngayong linggo.', 'Your reels get 2x more views than photo posts. Make a new one this week.'), cta: t('Gumawa ng reel', 'Create a reel'), to: '/biz/content/new?type=reel' })
    return list
  }, [health.items, unanswered.length, t])
  const cur = tips[tip % tips.length]

  return (
    <main>
      <PageHeader title={t('Statistika', 'Statistics')} phase="MVP" tabs={<StatsTabs />} />
      <div className="space-y-4 px-4 md:px-8">
        <section className="flex items-center gap-3 overflow-hidden rounded-[24px] bg-primary px-4 py-3 md:px-6">
          <Jimbot expression="waving" variant="standalone" size={92} className="-my-3 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] font-semibold text-ink">{longDate(new Date(), lang)}</p>
            <h2 className="font-display text-[26px] font-bold leading-tight text-white md:text-[30px]">
              {greeting(lang)}, {name}!
            </h2>
            <p className="truncate font-display text-[15px] font-medium text-ink">{d.business.name || t('Negosyo mo', 'Your business')}</p>
          </div>
        </section>

        <VerificationBanner />
        {dbStats.error && (
          <div role="alert" className="rounded-[16px] border border-danger/30 bg-danger-bg p-4 text-danger">
            <p className="font-semibold">{t('Hindi ma-load ang analytics mula sa database.', 'Business analytics could not be loaded from the database.')}</p>
            <p className="mt-1 break-words text-[14px]">{dbStats.error}</p>
            <button type="button" className="mt-2 min-h-11 font-semibold underline underline-offset-2" onClick={dbStats.refresh}>
              {t('Subukan ulit', 'Retry')}
            </button>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="xl:col-span-5 xl:row-span-2" title={t('Mabilis na Update', 'Quick Update')} icon={<Zap size={20} />} phase="MVP" sub={d.quick.at ? t('Huling update: ngayong araw', 'Last update: today') : undefined}>
            <QuickUpdatePanel />
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:col-span-7 xl:grid-cols-3">
            <KpiCard label={t('Views ng profile', 'Profile views')} value={week(z(dbStats.views))} delta={draft ? undefined : change(dbStats.views)} series={z(dbStats.views).slice(-14)} icon={<Eye size={18} />} to="/biz/stats/analytics" />
            <KpiCard label={t('Mga save', 'Saves')} value={week(z(dbStats.saves))} delta={draft ? undefined : change(dbStats.saves)} series={z(dbStats.saves).slice(-14)} icon={<Bookmark size={18} />} to="/biz/stats/analytics?m=saves" />
            <KpiCard label={t('Idinagdag sa trip plan', 'Added to trip plans')} value={week(z(dbStats.trips))} delta={draft ? undefined : change(dbStats.trips)} series={z(dbStats.trips).slice(-14)} icon={<Route size={18} />} to="/biz/stats/analytics?m=trips" />
            <KpiCard label="Check-ins" value={week(z(dbStats.checkins))} delta={draft ? undefined : change(dbStats.checkins)} series={z(dbStats.checkins).slice(-14)} icon={<MapPin size={18} />} to="/biz/stats/analytics?m=checkins" />
            <KpiCard label={t('Average na rating', 'Average rating')} value={draft || dbStats.reviewCount === 0 ? '–' : dbStats.ratingAll.toFixed(1)} delta={draft ? undefined : 2.4} series={draft || dbStats.rating.length === 0 ? undefined : dbStats.rating} icon={<Star size={18} />} to="/biz/content/reviews" />
            <KpiCard label={t('Bagong komento', 'New comments')} value={draft ? 0 : newComments.length + week(dbStats.comments)} delta={draft ? undefined : change(dbStats.comments)} series={z(dbStats.comments).slice(-14)} icon={<MessageCircle size={18} />} to="/biz/content/comments" />
          </div>
          <div className="xl:col-span-7">
            <KpiCard label={t('Customers mula sa deals', 'Customers from deals')} value={verified ? week(dbStats.dealCustomers) : '–'} delta={verified ? change(dbStats.dealCustomers) : undefined} series={verified ? dbStats.dealCustomers.slice(-14) : undefined} icon={<Ticket size={18} />} to="/biz/stats/analytics#deals" sub={verified ? undefined : t('Bubukas pagka-verify', 'Unlocks after verification')} />
          </div>

          <Card className="xl:col-span-4" title="Profile Health Score" icon={<Sparkles size={20} />} phase="MVP">
            <div className="flex items-center gap-4">
              <CompletenessRing value={health.score / 100} size={104} stroke={11} />
              <p className="flex-1 text-[15px] text-fg-2">{health.score === 100 ? t('Kumpleto ang profile mo. Ang galing!', 'Your profile is complete. Great job!') : t('Mas kumpleto, mas madalas kang lumabas sa Search at kay Jimbot.', 'The more complete, the more often you show up in Search and Jimbot.')}</p>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {health.items.map((i) => (
                <li key={i.id} className="flex min-h-12 items-center gap-3 py-1.5">
                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', i.ok ? 'bg-ok text-white dark:text-ink' : 'border-2 border-line')} aria-hidden>
                    {i.ok && <BadgeCheck size={14} />}
                  </span>
                  <span className={cn('flex-1 text-[15px]', i.ok && 'text-fg-2')}>{i.label}</span>
                  {!i.ok && (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/biz/stats/backgrounds#${i.id}`)}>
                      {i.cta}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="xl:col-span-4" title={t('Susunod na hakbang', 'Next step')} icon={<Sparkles size={20} />} phase="MVP">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tip} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="flex items-end gap-2">
                  <Jimbot expression="idea" variant="standalone" size={72} className="-mb-1 shrink-0" />
                  <p className="mb-2 flex-1 rounded-[18px] rounded-bl-md bg-sunken px-3.5 py-2.5 text-[15px] leading-snug dark:bg-elevated">{cur.text}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => navigate(cur.to)}>{cur.cta}</Button>
                  <Button variant="ghost" onClick={() => setTip((x) => x + 1)}>
                    {t('Iba pang mungkahi', 'Another tip')}
                  </Button>
                </div>
                <p className="mt-2 text-[13px] text-fg-2">
                  {(tip % tips.length) + 1} / {tips.length}
                </p>
              </motion.div>
            </AnimatePresence>
          </Card>

          <Card className="xl:col-span-4" title={t('Kailangan ng atensyon mo', 'Needs your attention')} icon={<TriangleAlert size={20} />}>
            <ul className="divide-y divide-line">
              {[
                { n: unanswered.length, icon: <Star size={18} />, label: t('Review na wala pang sagot', 'Unanswered reviews'), to: '/biz/content/reviews?f=needs', phase: 'P3' as const },
                { n: newComments.length, icon: <MessageCircle size={18} />, label: t('Bagong komento', 'New comments'), to: '/biz/content/comments?f=new', phase: 'P3' as const },
                { n: openCases.length, icon: <Flag size={18} />, label: t('Report na sinusuri', 'Reports under review'), to: '/biz/content/reviews/cases', phase: 'P3' as const },
              ].map((r) => (
                <li key={r.label}>
                  <button onClick={() => navigate(r.to)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sunken text-link dark:bg-elevated">{r.icon}</span>
                    <span className="flex-1 text-[15px]">
                      {r.label} <PhaseTag phase={r.phase} />
                    </span>
                    <span className={cn('flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-display text-[14px] font-semibold', r.n ? 'bg-primary text-ink' : 'bg-sunken text-fg-2 dark:bg-elevated')}>{r.n}</span>
                    <ChevronRight size={18} className="text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <WeeklyReport className="xl:col-span-12" best={best} />
        </div>
      </div>
    </main>
  )

  function WeeklyReport({ className, best }: { className?: string; best: { d: number; h: number } }) {
    const day = WEEKDAYS[lang][(best.d + 1) % 7]
    return (
      <Card className={className} title={t('Lingguhang report ni Jimbot', 'Weekly Jimbot report')} icon={<Send size={20} />} phase="P2" sub={t('Ipinapadala tuwing Lunes, 8 AM', 'Sent every Monday, 8 AM')}>
        {draft ? (
          <p className="text-body text-fg-2">{t('Kulang pa ang data. Subukan ulit pagkalipas ng 2 linggo.', "I don't have enough data yet. Check again in 2 weeks.")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr]">
            <div className="grid grid-cols-2 gap-2">
              {[
                [t('Views', 'Views'), num(week(dbStats.views))],
                [t('Mga save', 'Saves'), num(week(dbStats.saves))],
                [t('Pinakamagandang araw', 'Best day'), day],
                [t('Pinakamagandang oras', 'Best hour'), hourLabel(best.h)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[16px] bg-sunken p-3 dark:bg-elevated">
                  <p className="text-[13px] text-fg-2">{k}</p>
                  <p className="font-display text-[20px] font-bold leading-tight">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Jimbot crop="head" expression="idea" size={44} animate={false} />
              <p className="flex-1 rounded-[18px] rounded-bl-md bg-sunken px-3.5 py-2.5 text-[15px] leading-snug dark:bg-elevated">
                {t(`Pinaka-abala ka tuwing ${day} ng ${hourLabel(best.h)}. Mag-post ng special isang oras bago nito.`, `You're busiest on ${day} around ${hourLabel(best.h)}. Post a special an hour before.`)}
              </p>
            </div>
            <div>
              <p className="mb-2 font-display text-[14px] font-medium">{t('Paano ipapadala', 'Delivery')}</p>
              <Segmented<Channel>
                className="w-full"
                label={t('Paano ipapadala', 'Delivery')}
                value={d.prefs.channel}
                onChange={(c) => set((x) => ({ ...x, prefs: { ...x.prefs, channel: c } }))}
                options={[
                  { value: 'notif', label: 'Notification' },
                  { value: 'messenger', label: 'Messenger' },
                  { value: 'sms', label: 'SMS' },
                ]}
              />
              <Button variant="secondary" className="mt-3" onClick={() => navigate('/biz/stats/analytics')}>
                {t('Buksan ang buong report', 'Open full report')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    )
  }
}
