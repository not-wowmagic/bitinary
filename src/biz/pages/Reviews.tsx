import { ArrowLeft, BadgeCheck, Camera, ChevronRight, FileUp, Flag, Info, Lock, MessageSquare, Paperclip, QrCode, Send, ShieldAlert, Sparkles, Star } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { inputBase } from '@/components/flow/Fields'
import { Jimbot } from '@/components/mascot/Jimbot'
import { StepDots } from '@/components/onboarding/Kit'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { Stars } from '../charts'
import { longDate, relTime, shortDay, time12 } from '../format'
import { stats, type Case, type CaseStatus, type Review } from '../seed'
import { REPORT_LIMIT, useBiz } from '../store'
import { Card, CaseChip, PageHeader, Pill, StateBlock } from '../ui'
import { ContentTabs } from './Posts'

type Filter = 'all' | 'new' | 'needs' | 'low' | 'photos' | 'reported'

export function ProofPill({ r }: { r: Review }) {
  const { t, lang } = useBiz()
  if (!r.checkin) return <Pill>{t('Walang check-in na record', 'No check-in on record')}</Pill>
  const when = `${shortDay(r.checkin.at, lang)}, ${time12(r.checkin.at)}`
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Pill tone="ok">
        <BadgeCheck size={13} /> {t('Na-verify na bisita', 'Verified visit')}
      </Pill>
      <span className="inline-flex items-center gap-1 text-[13px] text-fg-2">
        <QrCode size={13} />
        {t(`Na-check in noong ${when} sa pamamagitan ng ${r.checkin.via}`, `Checked in ${when} via ${r.checkin.via}`)}
      </span>
    </span>
  )
}

function ReviewRow({ r }: { r: Review }) {
  const { d, t, lang } = useBiz()
  const navigate = useNavigate()
  const c = d.cases.find((x) => x.id === r.caseId)
  return (
    <li>
      <button onClick={() => navigate(`/biz/content/reviews/${r.id}`)} className="flex w-full gap-3 p-4 text-left hover:bg-sunken/50">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={r.stars} />
            <b className="font-display text-[15px]">{r.nick}</b>
            <span className="text-[13px] text-fg-2">{longDate(r.at, lang)}</span>
            {r.fresh && !r.reply && <Pill tone="orange">{t('Bago', 'New')}</Pill>}
          </div>
          <p className="mt-1 line-clamp-2 text-[16px]">{r.text}</p>
          {r.photos.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {r.photos.map((p) => (
                <img key={p} src={p} alt="" className="h-14 w-14 rounded-[10px] object-cover" />
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProofPill r={r} />
            {c ? <CaseChip status={c.status} /> : r.reply ? <Pill tone="ok">{t('Nasagot', 'Replied')}</Pill> : <Pill tone="caution">{t('Kailangang sagutin', 'Needs reply')}</Pill>}
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-muted" />
      </button>
    </li>
  )
}

export function Reviews() {
  const { d, t } = useBiz()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('f') as Filter) ?? 'all'
  const all = getForcedState() === 'empty' ? [] : d.reviews
  const avg = all.length ? stats.ratingAll : 0
  const newWeek = all.filter((r) => Date.now() - +new Date(r.at) < 7 * 864e5).length
  const replyRate = all.length ? Math.round((all.filter((r) => r.reply).length / all.length) * 100) : 0
  const list = all.filter((r) => (filter === 'all' ? true : filter === 'new' ? r.fresh : filter === 'needs' ? !r.reply && !r.caseId : filter === 'low' ? r.stars <= 2 : filter === 'photos' ? r.photos.length > 0 : !!r.caseId))
  const filters: [Filter, string][] = [
    ['all', t('Lahat', 'All')],
    ['new', t('Bago', 'New')],
    ['needs', t('Kailangang sagutin', 'Needs reply')],
    ['low', t('Mababang rating', 'Low rating')],
    ['photos', t('May larawan', 'With photos')],
    ['reported', t('Na-report', 'Reported')],
  ]
  return (
    <main>
      <PageHeader title={t('Nilalaman at Social', 'Blog and Social')} phase="P3" tabs={<ContentTabs />} actions={<Button variant="secondary" icon={<Flag size={17} />} onClick={() => navigate('/biz/content/reviews/cases')}>{t('Mga kaso ng report', 'Report cases')}</Button>} />
      <div className="space-y-4 px-4 md:px-8">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-[14px] text-fg-2">{t('Average na rating', 'Average rating')}</p>
            <p className="flex items-center gap-1.5 font-display text-[28px] font-bold">
              {avg.toFixed(1)} <Star size={22} className="fill-amber text-amber" />
            </p>
            <p className="text-[13px] text-fg-2">{t(`${stats.reviewCount} review lahat`, `${stats.reviewCount} reviews all time`)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[14px] text-fg-2">{t('Bago ngayong linggo', 'New this week')}</p>
            <p className="font-display text-[28px] font-bold">{newWeek}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[14px] text-fg-2">{t('Reply rate', 'Reply rate')}</p>
            <p className="font-display text-[28px] font-bold">{replyRate}%</p>
          </Card>
        </div>
        <div role="tablist" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {filters.map(([f, l]) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setParams({ f }, { replace: true })} className={cn('min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 font-display text-[15px] font-medium', filter === f ? 'bg-brown text-cream dark:bg-cream dark:text-brown' : 'bg-sunken text-fg-2 dark:bg-elevated')}>
              {l}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <Card>
            <StateBlock pose="celebrating" title={t('Walang review dito', 'No reviews here')} body={t('Lalabas dito ang mga bagong review.', 'New reviews will show up here.')} />
          </Card>
        ) : (
          <Card className="p-0 md:p-0">
            <ul className="divide-y divide-line">
              {list.map((r) => (
                <ReviewRow key={r.id} r={r} />
              ))}
            </ul>
          </Card>
        )}
        <p className="text-[14px] text-fg-2">{t('Hindi ipinapakita ang personal na detalye ng reviewer.', "Reviewers' personal details are never shown.")}</p>
      </div>
    </main>
  )
}

function Back({ to }: { to: string }) {
  const { t } = useBiz()
  const navigate = useNavigate()
  return (
    <div className="px-4 pt-4 md:px-8">
      <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(to)}>
        {t('Bumalik', 'Back')}
      </Button>
    </div>
  )
}

export function ReviewDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { d, set, t, lang, showToast } = useBiz()
  const navigate = useNavigate()
  const r = d.reviews.find((x) => x.id === id)
  const [reply, setReply] = useState(() => (params.get('draft') && r ? (lang === 'en' ? `Thank you for the feedback, ${r.nick.split(' ')[0]}. Sorry about the wait. We've added staff at lunch. We hope to see you again!` : `Salamat po sa feedback, ${r.nick.split(' ')[0]}. Pasensya na sa tagal ng order. Nagdagdag na kami ng tauhan tuwing tanghali. Sana makabalik po kayo!`) : ''))
  const [report, setReport] = useState(!!getForcedState()?.startsWith('report'))
  if (!r) return <StateBlock pose="unsure" placeholder title={t('Hindi nahanap ang review', 'Review not found')} />
  const c = d.cases.find((x) => x.id === r.caseId)
  const locked = c && ['received', 'review', 'info', 'appealed'].includes(c.status)
  const limitReached = d.reportsUsed >= REPORT_LIMIT
  const ideas =
    r.stars >= 4
      ? [t(`Maraming salamat, ${r.nick.split(' ')[0]}! Natutuwa kaming nagustuhan ninyo. Balik po kayo!`, `Thank you so much, ${r.nick.split(' ')[0]}! We're happy you enjoyed it. See you again!`)]
      : [
          t(`Salamat sa tapat na feedback, ${r.nick.split(' ')[0]}. Pasensya na po. Inaayos na namin ito at sana mabigyan ninyo kami ng isa pang pagkakataon.`, `Thank you for the honest feedback, ${r.nick.split(' ')[0]}. We're sorry. We're fixing this and hope you'll give us another chance.`),
          t('Pasensya na sa naging karanasan ninyo. Puwede ba kaming makipag-usap para maayos ito? Mag-message po kayo sa amin.', "We're sorry about your experience. Could we talk to make it right? Please send us a message."),
        ]
  return (
    <main>
      <Back to="/biz/content/reviews" />
      <PageHeader className="pt-1 md:pt-2" title={t('Review', 'Review')} phase="P3" />
      <div className="grid gap-4 px-4 md:px-8 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Stars value={r.stars} size={20} />
              <b className="font-display text-[17px]">{r.nick}</b>
              <span className="text-[14px] text-fg-2">
                {longDate(r.at, lang)} · {relTime(r.at, lang)}
              </span>
            </div>
            <p className="mt-2 text-[17px] leading-relaxed">{r.text}</p>
            {r.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {r.photos.map((p) => (
                  <img key={p} src={p} alt="" className="h-24 w-24 rounded-[14px] object-cover" />
                ))}
              </div>
            )}
            <div className="mt-3">
              <ProofPill r={r} />
            </div>
          </Card>

          {c && (
            <button onClick={() => navigate(`/biz/content/reviews/cases/${c.id}`)} className="flex w-full items-center gap-3 rounded-[20px] bg-caution-bg p-4 text-left text-caution">
              <Lock size={22} className="shrink-0" />
              <span className="flex-1">
                <span className="block font-display text-[16px] font-semibold">
                  {t('Kaso', 'Case')} {c.id}
                </span>
                <span className="text-[15px]">{locked ? t('Habang sinusuri, hindi mo maitatago o mae-edit ang review.', "While under review, you can't hide or edit this review.") : t('May desisyon na ang kaso.', 'This case has a decision.')}</span>
              </span>
              <CaseChip status={c.status} />
            </button>
          )}

          <Card title={r.reply ? t('Ang sagot mo', 'Your reply') : t('Sumagot', 'Reply')} icon={<MessageSquare size={20} />}>
            {r.reply ? (
              <p className="rounded-[16px] bg-sunken p-3 text-[16px] dark:bg-elevated">{r.reply}</p>
            ) : (
              <>
                <p className="mb-2 flex items-center gap-1.5 font-display text-[14px] font-medium text-link">
                  <Sparkles size={16} /> {t('Mungkahi ni Jimbot', 'Jimbot suggestions')}
                </p>
                <div className="space-y-2">
                  {ideas.map((i) => (
                    <button key={i} onClick={() => setReply(i)} className="w-full rounded-[14px] border border-line p-3 text-left text-[15px] hover:border-primary">
                      {i}
                    </button>
                  ))}
                </div>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder={t('Isulat ang sagot mo…', 'Write your reply…')} aria-label={t('Sagot', 'Reply')} className={cn(inputBase, 'mt-3 h-auto resize-y border-line py-3')} />
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button size="lg" icon={<Send size={18} />} disabled={reply.trim().length < 5} onClick={() => (set((x) => ({ ...x, reviews: x.reviews.map((y) => (y.id === r.id ? { ...y, reply: reply.trim(), fresh: false } : y)) })), showToast({ text: t('Na-publish ang sagot mo', 'Your reply is published'), expression: 'celebrating' }))}>
                    {t('Sumagot', 'Reply')}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
        <aside className="space-y-4">
          <Card title={t('Gabay sa pagsagot', 'Reply guidelines')} icon={<Info size={20} />}>
            <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-fg-2">
              <li>{t('Maging magalang at mahinahon.', 'Be polite and calm.')}</li>
              <li>{t('Magpasalamat, kahit mababa ang rating.', 'Say thank you, even for low ratings.')}</li>
              <li>{t('Huwag magbanggit ng personal na detalye.', 'Never share personal details.')}</li>
              <li>{t('Mag-alok ng paraan para maayos ito.', 'Offer a way to make it right.')}</li>
            </ul>
          </Card>
          {!c && (
            <Card title={t('Hindi totoo ang review?', 'Is this review false?')} icon={<ShieldAlert size={20} />}>
              <p className="text-[15px] text-fg-2">{t('Hindi tinatanggal ang negatibong review dahil lang negatibo ito.', 'Negative reviews are not removed just because they are negative.')}</p>
              <p className="mt-2 text-[14px] text-fg-2">
                {t(`Nagamit: ${d.reportsUsed} sa ${REPORT_LIMIT} ngayong buwan`, `Used: ${d.reportsUsed} of ${REPORT_LIMIT} this month`)}
              </p>
              <Button variant="danger" className="mt-3" icon={<Flag size={17} />} disabled={limitReached} onClick={() => setReport(true)}>
                {t('I-report na hindi totoo', 'Report as false')}
              </Button>
            </Card>
          )}
        </aside>
      </div>
      <ReportSheet open={report} onClose={() => setReport(false)} review={r} />
    </main>
  )
}

/* ------------------------------ Report a false review: one step per screen ------------------------------ */

const REASONS: [string, string, string][] = [
  ['wrong', 'Maling negosyo', 'Wrong business'],
  ['novisit', 'Walang record ng pagbisita', 'No visit on record'],
  ['false', 'Hindi totoo ang nilalaman', 'Content is false'],
  ['competitor', 'Gawa ng kakumpitensya', 'Posted by a competitor'],
  ['fake', 'Peke o dobleng account', 'Fake or duplicate account'],
  ['personal', 'Personal na impormasyon o paninirang-puri', 'Personal information or defamation'],
  ['other', 'Iba pa', 'Other'],
]
export const reasonLabel = (k: string, lang: 'tl' | 'en') => REASONS.find((r) => r[0] === k)?.[lang === 'en' ? 2 : 1] ?? k

function ReportSheet({ open, onClose, review }: { open: boolean; onClose: () => void; review: Review }) {
  const { set, t, lang, d } = useBiz()
  const navigate = useNavigate()
  const forced = getForcedState()
  const [step, setStep] = useState(forced === 'report-2' ? 2 : forced === 'report-5' ? 5 : 1)
  const [reason, setReason] = useState(forced?.startsWith('report-') ? 'competitor' : '')
  const [why, setWhy] = useState(forced?.startsWith('report-') ? 'Walang check-in ang account at nagre-recommend ng ibang kainan.' : '')
  const [files, setFiles] = useState<string[]>([])
  const [agree, setAgree] = useState(false)
  const [caseId, setCaseId] = useState<string | null>(forced === 'report-6' ? 'BTN-2026-0157' : null)
  const total = 5
  const submit = () => {
    const id = `BTN-2026-${String(150 + Math.floor(Math.random() * 800)).padStart(4, '0')}`
    const now = new Date().toISOString()
    const c: Case = { id, reviewId: review.id, reason, explanation: why, evidence: files, status: 'received', createdAt: now, timeline: [{ at: now, status: 'received', en: 'Report received', tl: 'Natanggap ang report' }], messages: [] }
    set((x) => ({ ...x, cases: [c, ...x.cases], reviews: x.reviews.map((r) => (r.id === review.id ? { ...r, caseId: id } : r)), reportsUsed: x.reportsUsed + 1 }))
    setCaseId(id)
  }
  const close = () => {
    onClose()
    setTimeout(() => (setStep(1), setCaseId(null), setAgree(false)), 300)
  }
  return (
    <Sheet open={open} onClose={close} title={caseId ? undefined : t('I-report ang review', 'Report this review')}>
      {caseId ? (
        <div className="flex flex-col items-center py-2 text-center">
          <Jimbot expression="pointing" variant="standalone" size={130} />
          <h2 className="mt-2 text-h2">{t('Natanggap namin ang report', 'We received your report')}</h2>
          <p className="mt-1 text-body text-fg-2">{t('Numero ng kaso', 'Case number')}</p>
          <p className="mt-1 rounded-[14px] bg-sunken px-4 py-2 font-display text-[22px] font-bold tracking-wide dark:bg-elevated">{caseId}</p>
          <p className="mt-3 max-w-[360px] text-[15px] text-fg-2">{t('Karaniwang 2–3 araw ng trabaho ang pagsusuri. Aabisuhan ka namin.', "Reviews usually take 2–3 business days. We'll notify you.")}</p>
          <Button block size="lg" className="mt-5" onClick={() => (close(), navigate(`/biz/content/reviews/cases/${caseId}`))}>
            {t('Subaybayan ang kaso', 'Track this case')}
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <StepDots total={total} current={step} />
            <span className="font-display text-[13px] text-fg-2">{t(`Hakbang ${step} sa ${total}`, `Step ${step} of ${total}`)}</span>
          </div>
          {step === 1 && (
            <>
              <h3 className="text-h3">{t('Bakit mo ito nire-report?', 'Why are you reporting this?')}</h3>
              <p className="mt-2 rounded-[14px] bg-caution-bg px-3 py-2 text-[15px] font-semibold text-caution">{t('Hindi tinatanggal ang negatibong review dahil lang negatibo ito.', 'Negative reviews are not removed just because they are negative.')}</p>
              <div role="radiogroup" className="mt-3 space-y-2">
                {REASONS.map(([k]) => (
                  <button key={k} role="radio" aria-checked={reason === k} onClick={() => setReason(k)} className={cn('flex min-h-14 w-full items-center gap-3 rounded-[16px] border-2 px-4 text-left text-[16px]', reason === k ? 'border-primary bg-primary/10' : 'border-line')}>
                    <span className={cn('h-5 w-5 shrink-0 rounded-full border-2', reason === k ? 'border-primary bg-primary' : 'border-line')} />
                    {reasonLabel(k, lang)}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="text-h3">{t('Ipaliwanag', 'Explain what happened')}</h3>
              <p className="mt-1 text-[15px] text-fg-2">{t('Kahit 30 letra. Sabihin kung bakit hindi ito totoo.', 'At least 30 characters. Tell us why it is not true.')}</p>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={5} aria-label={t('Paliwanag', 'Explanation')} className={cn(inputBase, 'mt-3 h-auto resize-none border-line py-3', why.length > 0 && why.length < 30 && 'border-danger')} />
              <p className={cn('mt-1 text-right text-[14px]', why.length < 30 ? 'text-danger' : 'text-ok')}>{t(`${why.length} letra (minimum 30)`, `${why.length} characters (minimum 30)`)}</p>
            </>
          )}
          {step === 3 && (
            <>
              <h3 className="text-h3">{t('Ebidensya', 'Evidence')} <span className="text-[14px] font-normal text-fg-2">({t('opsyonal', 'optional')})</span></h3>
              <p className="mt-1 text-[15px] text-fg-2">{t('Resibo, CCTV still, permit, o screenshot.', 'Receipts, CCTV stills, permits or screenshots.')}</p>
              <label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-dashed border-line text-link">
                <FileUp size={24} />
                <span className="font-display text-[15px] font-medium">{t('Mag-upload ng file', 'Upload files')}</span>
                <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? []).map((f) => f.name)])} />
              </label>
              <ul className="mt-2 space-y-1">
                {files.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[15px]">
                    <Paperclip size={16} /> {f}
                  </li>
                ))}
              </ul>
            </>
          )}
          {step === 4 && (
            <>
              <h3 className="text-h3">{t('Kumpirmahin', 'Confirm')}</h3>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[16px] border-2 border-line p-4">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--c-primary)]" />
                <span className="text-[16px]">{t('Hindi ko ito nire-report dahil lang mababa ang rating.', 'I am not reporting this only because it is a low rating.')}</span>
              </label>
              <p className="mt-3 text-[14px] text-fg-2">{t(`Gagamit ito ng 1 sa ${REPORT_LIMIT} report mo ngayong buwan (${d.reportsUsed} na ang nagamit).`, `This uses 1 of your ${REPORT_LIMIT} monthly reports (${d.reportsUsed} used).`)}</p>
            </>
          )}
          {step === 5 && (
            <>
              <h3 className="text-h3">{t('Suriin at ipadala', 'Review and submit')}</h3>
              <dl className="mt-3 divide-y divide-line rounded-[16px] border border-line text-[15px]">
                <div className="p-3">
                  <dt className="text-fg-2">{t('Dahilan', 'Reason')}</dt>
                  <dd className="font-semibold">{reasonLabel(reason, lang)}</dd>
                </div>
                <div className="p-3">
                  <dt className="text-fg-2">{t('Paliwanag', 'Explanation')}</dt>
                  <dd>{why}</dd>
                </div>
                <div className="p-3">
                  <dt className="text-fg-2">{t('Ebidensya', 'Evidence')}</dt>
                  <dd>{files.length ? files.join(', ') : t('Wala', 'None')}</dd>
                </div>
              </dl>
              <p className="mt-3 flex items-start gap-2 text-[14px] text-fg-2">
                <Lock size={16} className="mt-0.5 shrink-0" /> {t('Habang sinusuri, hindi mo maitatago o mae-edit ang review.', "While under review, you can't hide or edit the review.")}
              </p>
            </>
          )}
          <div className="mt-5 flex gap-2">
            {step > 1 && (
              <Button size="lg" variant="secondary" onClick={() => setStep(step - 1)}>
                {t('Bumalik', 'Back')}
              </Button>
            )}
            {step === 3 && (
              <Button size="lg" variant="ghost" onClick={() => setStep(4)}>
                {t('Laktawan', 'Skip')}
              </Button>
            )}
            <Button block size="lg" className="flex-1" disabled={(step === 1 && !reason) || (step === 2 && why.trim().length < 30) || (step === 4 && !agree)} onClick={() => (step < total ? setStep(step + 1) : submit())}>
              {step < total ? t('Susunod', 'Next') : t('Ipadala ang report', 'Submit report')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

/* ------------------------------ Case tracking ------------------------------ */

export function Cases() {
  const { d, t, lang } = useBiz()
  const navigate = useNavigate()
  return (
    <main>
      <Back to="/biz/content/reviews" />
      <PageHeader className="pt-1 md:pt-2" title={t('Mga kaso ng report', 'Report cases')} phase="P3" />
      <div className="space-y-4 px-4 md:px-8">
        <Card className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <p className="font-display text-[16px] font-semibold">{t('Limit ng report ngayong buwan', 'Monthly report limit')}</p>
            <p className="text-[15px] text-fg-2">{t('Para patas sa lahat, may limit ang report bawat buwan.', 'To keep things fair, reports are limited each month.')}</p>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex justify-between text-[14px]">
              <span>{t('Nagamit', 'Used')}</span>
              <b className="font-display">
                {d.reportsUsed} / {REPORT_LIMIT}
              </b>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-sunken dark:bg-elevated">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(d.reportsUsed / REPORT_LIMIT) * 100}%` }} />
            </div>
          </div>
        </Card>
        {d.cases.length === 0 ? (
          <Card>
            <StateBlock pose="celebrating" title={t('Walang kaso', 'No cases')} />
          </Card>
        ) : (
          <Card className="p-0 md:p-0">
            <ul className="divide-y divide-line">
              {d.cases.map((c) => {
                const r = d.reviews.find((x) => x.id === c.reviewId)
                return (
                  <li key={c.id}>
                    <button onClick={() => navigate(`/biz/content/reviews/cases/${c.id}`)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/50">
                      <Flag size={20} className="shrink-0 text-link" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15px] font-semibold">{c.id}</span>
                        <span className="block truncate text-[15px] text-fg-2">
                          {reasonLabel(c.reason, lang)} · “{r?.text}”
                        </span>
                        <span className="text-[13px] text-fg-2">{longDate(c.createdAt, lang)}</span>
                      </span>
                      <CaseChip status={c.status} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </div>
    </main>
  )
}

export function CaseDetail() {
  const { id } = useParams()
  const { d, set, t, lang, showToast } = useBiz()
  const [msg, setMsg] = useState('')
  const c = d.cases.find((x) => x.id === id)
  if (!c) return <StateBlock pose="unsure" placeholder title={t('Hindi nahanap ang kaso', 'Case not found')} />
  const r = d.reviews.find((x) => x.id === c.reviewId)
  const decided = c.status === 'removed' || c.status === 'kept'
  const appealUntil = c.decidedAt ? new Date(+new Date(c.decidedAt) + 7 * 864e5) : null
  const canAppeal = decided && appealUntil && appealUntil.getTime() > Date.now()
  const upd = (fn: (c: Case) => Case) => set((x) => ({ ...x, cases: x.cases.map((y) => (y.id === c.id ? fn(y) : y)) }))
  const step = (s: CaseStatus, en: string, tl: string, extra?: Partial<Case>) => upd((y) => ({ ...y, ...extra, status: s, timeline: [...y.timeline, { at: new Date().toISOString(), status: s, en, tl }] }))
  return (
    <main>
      <Back to="/biz/content/reviews/cases" />
      <PageHeader className="pt-1 md:pt-2" title={`${t('Kaso', 'Case')} ${c.id}`} phase="P3" actions={<CaseChip status={c.status} />} />
      <div className="grid gap-4 px-4 md:px-8 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {r && (
            <Card title={t('Ang review', 'The review')} icon={<Star size={20} />}>
              <div className="flex items-center gap-2">
                <Stars value={r.stars} />
                <b className="font-display">{r.nick}</b>
              </div>
              <p className="mt-1 text-[16px]">{r.text}</p>
              <div className="mt-2">
                <ProofPill r={r} />
              </div>
            </Card>
          )}
          <Card title="Timeline">
            <ol className="relative ml-2 border-l-2 border-line pl-5">
              {c.timeline.map((e, i) => (
                <li key={i} className="relative pb-5 last:pb-0">
                  <span className={cn('absolute -left-[29px] top-1 h-4 w-4 rounded-full border-2 border-surface', i === c.timeline.length - 1 ? 'bg-primary' : 'bg-muted')} />
                  <p className="font-display text-[15px] font-semibold">{e[lang]}</p>
                  <p className="text-[13px] text-fg-2">
                    {longDate(e.at, lang)} · {time12(e.at)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
          <Card title={t('Mga mensahe mula sa Bitinary team', 'Messages from the Bitinary team')} icon={<MessageSquare size={20} />}>
            <ul className="space-y-2">
              {c.messages.map((m, i) => (
                <li key={i} className={cn('flex', m.from === 'me' && 'justify-end')}>
                  <p className={cn('max-w-[85%] rounded-[18px] px-4 py-2.5 text-[15px]', m.from === 'me' ? 'rounded-br-md bg-deep text-white' : 'rounded-bl-md bg-sunken dark:bg-elevated')}>
                    {m.from === 'team' && <b className="block font-display text-[13px] text-link">Bitinary Trust & Safety</b>}
                    {m.text}
                  </p>
                </li>
              ))}
              {c.messages.length === 0 && <li className="text-[15px] text-fg-2">{t('Wala pang mensahe.', 'No messages yet.')}</li>}
            </ul>
            <form onSubmit={(e) => (e.preventDefault(), msg.trim() && (upd((y) => ({ ...y, messages: [...y.messages, { from: 'me', text: msg.trim(), at: new Date().toISOString() }] })), setMsg('')))} className="mt-3 flex gap-2">
              <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('Sumulat sa team…', 'Write to the team…')} aria-label={t('Mensahe', 'Message')} className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-[16px] outline-none focus:border-primary" />
              <Button size="lg" className="!h-12" disabled={!msg.trim()} type="submit" aria-label={t('Ipadala', 'Send')}>
                <Send size={18} />
              </Button>
            </form>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card title={t('Detalye', 'Details')}>
            <dl className="space-y-2 text-[15px]">
              <div>
                <dt className="text-fg-2">{t('Dahilan', 'Reason')}</dt>
                <dd className="font-semibold">{reasonLabel(c.reason, lang)}</dd>
              </div>
              <div>
                <dt className="text-fg-2">{t('Paliwanag', 'Explanation')}</dt>
                <dd>{c.explanation}</dd>
              </div>
              <div>
                <dt className="text-fg-2">{t('Ebidensya', 'Evidence')}</dt>
                <dd>
                  {c.evidence.length
                    ? c.evidence.map((e) => (
                        <span key={e} className="mr-2 inline-flex items-center gap-1">
                          <Camera size={14} /> {e}
                        </span>
                      ))
                    : t('Wala', 'None')}
                </dd>
              </div>
            </dl>
          </Card>
          {decided && (
            <Card title={t('Apela', 'Appeal')}>
              {canAppeal ? (
                <>
                  <p className="text-[15px] text-fg-2">{t(`Puwedeng mag-apela hanggang ${longDate(appealUntil!, lang)}.`, `You can appeal until ${longDate(appealUntil!, lang)}.`)}</p>
                  <Button className="mt-3" onClick={() => (step('appealed', 'Appeal submitted', 'Naipadala ang apela'), showToast({ text: t('Naipadala ang apela', 'Appeal submitted'), expression: 'pointing' }))}>
                    {t('Mag-apela', 'Appeal')}
                  </Button>
                </>
              ) : (
                <p className="text-[15px] text-fg-2">{t('Lampas na sa 7 araw para mag-apela.', 'The 7-day appeal window has passed.')}</p>
              )}
            </Card>
          )}
          {!decided && (
            <Card title="Demo">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => step('info', 'More information needed: please add a receipt or CCTV still', 'Kailangan ng dagdag na impormasyon: maglagay ng resibo o CCTV still')}>
                  {t('Kailangan ng info', 'Needs info')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => step('removed', 'Removed: no visit on record and the account is linked to another business', 'Tinanggal: walang record ng pagbisita at konektado ang account sa ibang negosyo', { decidedAt: new Date().toISOString() })}>
                  {t('Tanggalin', 'Remove')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => step('kept', 'Kept: the review describes a personal experience', 'Pinanatili: personal na karanasan ang review', { decidedAt: new Date().toISOString() })}>
                  {t('Panatilihin', 'Keep')}
                </Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </main>
  )
}
