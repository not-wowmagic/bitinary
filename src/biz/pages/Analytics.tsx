import { Download, FileText, Lightbulb, MapPin, QrCode, Search, Sheet as SheetIcon, Star, Ticket, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import { Donut } from '@/components/ui/Charts'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { BarChart, Funnel, HeatStrip, LineChart, Sparkline, Stars } from '../charts'
import { WD, hourLabel, num, shortDay } from '../format'
import { useBizStats } from '../statsService'
import { useBiz } from '../store'
import { Card, Delta, Pill, StateBlock } from '../ui'
import { PageHeader } from '../ui'
import { StatsTabs, sum } from './Overview'
import { BusinessAssetImage } from '../ui/BusinessAssetImage'

type Range = 'day' | 'week' | 'month'
type Metric = 'views' | 'saves' | 'trips' | 'checkins'
const D = 864e5

function Skeleton({ h = 220 }: { h?: number }) {
  return <div className="skeleton rounded-[20px]" style={{ height: h }} />
}

export function Analytics() {
  const { t, lang, status, verified, d, showToast } = useBiz()
  const dbStats = useBizStats({ businessId: d.business.id, live: d.business.live })
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState<Range>('week')
  const [exp, setExp] = useState(false)
  const metric = (params.get('m') as Metric) ?? 'views'
  const forced = getForcedState()
  const n = range === 'day' ? 24 : range === 'week' ? 7 : 30

  const metricLabel: Record<Metric, string> = { views: t('Views ng profile', 'Profile views'), saves: t('Mga save', 'Saves'), trips: t('Sa trip plan', 'Trip-plan adds'), checkins: 'Check-ins' }
  const today = (new Date().getDay() + 6) % 7
  const hourly = (m: Metric) => (m === 'checkins' ? dbStats.heat[today] : Array.from({ length: 24 }, () => 0))
  const cur = (m: Metric) => (range === 'day' ? hourly(m) : dbStats[m].slice(-n))
  const prev = (m: Metric) => (range === 'day' ? Array.from({ length: 24 }, () => 0) : dbStats[m].slice(-2 * n, -n))
  const labels = range === 'day' ? Array.from({ length: 24 }, (_, h) => hourLabel(h)) : Array.from({ length: n }, (_, i) => shortDay(Date.now() - (n - 1 - i) * D, lang))
  const rangeText = range === 'day' ? shortDay(Date.now(), lang) : `${shortDay(Date.now() - (n - 1) * D, lang)} – ${shortDay(Date.now(), lang)}`
  const totals = (m: Metric) => sum(cur(m))
  const chg = (m: Metric) => {
    const p = sum(prev(m))
    return p ? ((totals(m) - p) / p) * 100 : 0
  }
  const byWeekday = WD[lang].map((_, i) => sum(dbStats.checkins.slice(-28).filter((__, k) => (new Date(Date.now() - (27 - k) * D).getDay() + 6) % 7 === i)))
  const src = dbStats.sources
  const topics: Record<string, string> = { taste: t('Lasa', 'Taste'), price: t('Presyo', 'Price'), service: t('Serbisyo', 'Service'), cleanliness: t('Kalinisan', 'Cleanliness') }
  const deal = d.deals.find((x) => x.status === 'ended')

  const exportCsv = () => {
    const rows = [['date', 'views', 'saves', 'trip_plan_adds', 'check_ins'], ...labels.map((l, i) => [l, cur('views')[i], cur('saves')[i], cur('trips')[i], cur('checkins')[i]])]
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bitinary-report-${range}.csv`
    a.click()
    setExp(false)
    showToast({ text: t('Na-download ang CSV', 'CSV downloaded'), expression: 'celebrating' })
  }

  const header = (
    <PageHeader
      title={t('Statistika', 'Statistics')}
      phase="P2"
      tabs={<StatsTabs />}
      actions={
        <Button variant="secondary" icon={<Download size={18} />} onClick={() => setExp(true)}>
          {t('I-export ang report', 'Export report')}
        </Button>
      }
    />
  )

  if (status === 'draft' || forced === 'nodata')
    return (
      <main>
        {header}
        <div className="px-4 md:px-8">
          <Card>
            <StateBlock pose="idea" title={t('Kulang pa ang data', "Not enough data yet")} body={t('Kulang pa ang data. Subukan ulit pagkalipas ng 2 linggo.', "I don't have enough data yet. Check again in 2 weeks.")} />
          </Card>
        </div>
      </main>
    )
  if (forced === 'error')
    return (
      <main>
        {header}
        <div className="px-4 md:px-8">
          <Card>
            <StateBlock pose="unsure" placeholder title={t('Hindi ma-load ang analitika', "Couldn't load analytics")} body={t('Subukan ulit. Naka-save pa rin ang lahat ng data mo.', 'Please try again. All your data is safe.')} action={t('Subukan ulit', 'Try again')} onAction={() => location.reload()} />
          </Card>
        </div>
      </main>
    )

  return (
    <main>
      {header}
      <div className="space-y-4 px-4 md:px-8">
        {dbStats.error && (
          <div role="alert" className="rounded-[16px] border border-danger/30 bg-danger-bg p-4 text-danger">
            <p className="font-semibold">{t('Hindi ma-load ang analytics mula sa database.', 'Business analytics could not be loaded from the database.')}</p>
            <p className="mt-1 break-words text-[14px]">{dbStats.error}</p>
            <button type="button" className="mt-2 min-h-11 font-semibold underline underline-offset-2" onClick={dbStats.refresh}>
              {t('Subukan ulit', 'Retry')}
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Range>
            label={t('Saklaw', 'Range')}
            value={range}
            onChange={setRange}
            options={[
              { value: 'day', label: t('Araw', 'Day') },
              { value: 'week', label: t('Linggo', 'Week') },
              { value: 'month', label: t('Buwan', 'Month') },
            ]}
          />
          <span className="rounded-full bg-surface px-4 py-2 font-display text-[14px] font-medium shadow-card">{rangeText}</span>
        </div>

        {forced === 'loading' ? (
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Skeleton h={320} />
            </div>
            <Skeleton h={320} />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2" title={metricLabel[metric]} icon={<TrendingUp size={20} />} sub={t('Putol-putol na linya: nakaraang panahon', 'Dashed line: previous period')}>
              <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
                {(Object.keys(metricLabel) as Metric[]).map((m) => (
                  <button key={m} onClick={() => setParams({ m }, { replace: true })} aria-pressed={metric === m} className={cn('flex min-h-11 shrink-0 flex-col items-start rounded-[14px] border-2 px-3 py-1.5 text-left', metric === m ? 'border-primary bg-primary/10' : 'border-line')}>
                    <span className="whitespace-nowrap text-[13px] text-fg-2">{metricLabel[m]}</span>
                    <span className="flex items-center gap-1.5">
                      <b className="font-display text-[18px]">{num(totals(m))}</b>
                      <Delta value={chg(m)} />
                    </span>
                  </button>
                ))}
              </div>
              <LineChart data={cur(metric)} compare={prev(metric)} labels={labels} ariaLabel={`${metricLabel[metric]} ${rangeText}`} />
            </Card>

            <Card title={t('Funnel', 'Funnel')} icon={<Users size={20} />} sub={t('Mula views hanggang check-in', 'From views to check-ins')}>
              <Funnel steps={[{ label: 'Views', value: totals('views') }, { label: t('Save', 'Saves'), value: totals('saves') }, { label: t('Trip plan', 'Trip plans'), value: totals('trips') }, { label: 'Check-ins', value: totals('checkins') }]} />
            </Card>

            <Card title={t('Check-ins bawat araw', 'Check-ins by day')} icon={<MapPin size={20} />} sub={t('Huling 4 na linggo', 'Last 4 weeks')}>
              <BarChart data={byWeekday} labels={WD[lang]} highlight={byWeekday.indexOf(Math.max(...byWeekday))} ariaLabel={t('Check-ins bawat araw', 'Check-ins by day')} />
            </Card>

            <Card title={t('Pinanggalingan ng bisita', 'Traffic sources')} icon={<Search size={20} />}>
              <div className="flex items-center gap-4">
                <Donut size={130} stroke={20} segments={[{ label: 'Search', value: src.search, color: '#FF6A00' }, { label: 'Jimbot', value: src.jimbot, color: '#FFB400' }, { label: 'Posts', value: src.posts, color: '#6B3A22' }, { label: 'Reels', value: src.reels, color: '#B08A74' }]}>
                  <span className="font-display text-[20px] font-bold">{src.search}%</span>
                  <span className="text-[12px] text-fg-2">Search</span>
                </Donut>
                <ul className="flex-1 space-y-2 text-[15px]">
                  {[
                    [t('Paghahanap', 'Search'), src.search, '#FF6A00'],
                    ['Jimbot', src.jimbot, '#FFB400'],
                    ['Posts', src.posts, '#6B3A22'],
                    ['Reels', src.reels, '#B08A74'],
                  ].map(([l, v, c]) => (
                    <li key={l as string} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: c as string }} />
                      <span className="flex-1">{l}</span>
                      <b className="font-display">{v}%</b>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card title={t('Pinaka-abalang oras', 'Peak hours')} icon={<TrendingUp size={20} />} sub={t('Mas madilim, mas maraming bisita', 'Darker means busier')}>
              <HeatStrip grid={dbStats.heat} days={WD[lang]} />
            </Card>

            <Card className="xl:col-span-2" title={t('Mga hinahanap malapit sa iyo', 'Top searches near you')} icon={<Lightbulb size={20} />} sub={t('Demand insights sa loob ng 2 km', 'Demand insights within 2 km')}>
              <table className="w-full text-left text-[15px]">
                <thead className="text-[13px] text-fg-2">
                  <tr className="border-b border-line">
                    <th className="py-2 font-medium">{t('Hinanap', 'Search term')}</th>
                    <th className="py-2 text-right font-medium">{t('Bilang', 'Searches')}</th>
                    <th className="hidden py-2 text-right font-medium sm:table-cell">{t('Pagbabago', 'Change')}</th>
                    <th className="py-2 text-right font-medium">{t('Lumalabas ka?', 'You appear?')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStats.topSearches.map((s) => (
                    <tr key={s.q} className="border-b border-line last:border-0">
                      <td className="py-2.5 font-medium">{s.q}</td>
                      <td className="py-2.5 text-right font-display">{num(s.n)}</td>
                      <td className="hidden py-2.5 text-right sm:table-cell">
                        <Delta value={s.d} />
                      </td>
                      <td className="py-2.5 text-right">{s.me ? <Pill tone="ok">{t('Oo', 'Yes')}</Pill> : <Pill tone="caution">{t('Hindi pa', 'Not yet')}</Pill>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[14px] text-fg-2">{t('Tip: idagdag ang "silog" sa menu para lumabas sa "silog 24 hours".', 'Tip: add "silog" to your menu to appear for "silog 24 hours".')}</p>
            </Card>

            <Card title={t('Kumpara sa katulad', 'Nearby benchmark')} icon={<Users size={20} />} sub={t('Anonymous, 18 katulad na kainan', 'Anonymous, 18 similar eateries')}>
              <div className="flex items-center gap-3">
                <Jimbot expression="celebrating" variant="standalone" size={72} />
                <p className="font-display text-[22px] font-bold leading-tight">{t('12% mas mataas', '12% above')}</p>
              </div>
              <p className="mt-1 text-[15px] text-fg-2">{t('kaysa sa katulad na kainan sa views. Mas mababa ka nang 6% sa reply rate.', 'similar eateries in views. You are 6% below on reply rate.')}</p>
            </Card>

            <Card title={t('Insight sa mga review', 'Review insights')} icon={<Star size={20} />}>
              <div className="flex items-center gap-3">
                <span className="font-display text-[34px] font-bold">{dbStats.ratingAll.toFixed(1)}</span>
                <div className="flex-1">
                  <Stars value={dbStats.ratingAll} />
                  <Sparkline data={dbStats.rating} height={30} color="var(--c-amber)" />
                </div>
              </div>
              <p className="mb-2 mt-3 font-display text-[14px] font-medium">{t('Pinakabanggit na paksa', 'Most mentioned topics')}</p>
              <ul className="space-y-2">
                {dbStats.topics.map((x) => (
                  <li key={x.k}>
                    <div className="mb-1 flex justify-between text-[14px]">
                      <span>{topics[x.k]}</span>
                      <span className="text-fg-2">
                        {x.pos}% {t('positibo', 'positive')} · {x.n}
                      </span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-danger/30">
                      <div className="h-full bg-ok" style={{ width: `${x.pos}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title={t('Performance ng posts', 'Post performance')} icon={<FileText size={20} />} phase="P3">
              <ul className="divide-y divide-line">
                {d.posts
                  .filter((p) => p.status === 'published')
                  .map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <BusinessAssetImage src={p.media[0]} alt="" className="h-12 w-12 rounded-[12px] object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold">{p.title ?? p.text}</p>
                        <p className="text-[13px] text-fg-2">
                          {t('Abot', 'Reach')} {num(p.views)} · {p.likes} likes · {p.comments} {t('komento', 'comments')}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </Card>

            <Card id="deals" title={t('Deals at Mga Dumating', 'Deals and Customers sent')} icon={<Ticket size={20} />} phase="P2">
              {verified && deal ? (
                <>
                  <p className="text-[15px] text-fg-2">{deal.kind === 'discount' ? `${deal.percent}% off ${deal.item}` : deal.item}</p>
                  <p className="mt-1 font-display text-[34px] font-bold leading-none">{deal.redeemed.qr + deal.redeemed.code}</p>
                  <p className="text-[14px] text-fg-2">{t('Mga Dumating', 'Customers sent')} · {num(deal.views)} views</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-[14px] bg-sunken p-3 dark:bg-elevated">
                      <QrCode size={20} className="text-link" />
                      <span>
                        <b className="block font-display text-[18px]">{deal.redeemed.qr}</b>
                        <span className="text-[13px] text-fg-2">QR</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-[14px] bg-sunken p-3 dark:bg-elevated">
                      <SheetIcon size={20} className="text-link" />
                      <span>
                        <b className="block font-display text-[18px]">{deal.redeemed.code}</b>
                        <span className="text-[13px] text-fg-2">{t('Code', 'Code')}</span>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[15px] text-fg-2">{t('Bubukas ang deals pagka-verify. Dito mo makikita kung ilan ang dumating dahil sa deal mo.', "Deals unlock after verification. You'll see here how many customers came because of your deal.")}</p>
              )}
            </Card>
          </div>
        )}
      </div>

      <Sheet open={exp} onClose={() => setExp(false)} title={t('I-export ang report', 'Export report')}>
        <p className="mb-4 text-body text-fg-2">
          {t('Saklaw', 'Range')}: <b className="text-fg">{rangeText}</b>
        </p>
        <div className="grid gap-2">
          <Button size="lg" icon={<FileText size={18} />} onClick={() => (setExp(false), setTimeout(() => window.print(), 300))}>
            PDF
          </Button>
          <Button size="lg" variant="secondary" icon={<SheetIcon size={18} />} onClick={exportCsv}>
            CSV
          </Button>
        </div>
      </Sheet>
    </main>
  )
}
