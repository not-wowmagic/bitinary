import { Ban, Bell, EyeOff, Flag, Heart, MessageCircle, Search, Sparkles, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { relTime } from '../format'
import type { Comment } from '../seed'
import { useBiz } from '../store'
import { Avatar, Card, PageHeader, Pill, StateBlock } from '../ui'
import { ContentTabs } from './Posts'

type Filter = 'all' | 'new' | 'needs' | 'hidden' | 'reported'

export function replyIdeas(lang: 'tl' | 'en', nick: string, text: string) {
  const n = nick.split(/[._ ]/)[0]
  const q = /\?|magkano|bukas|may/i.test(text)
  if (lang === 'en')
    return q
      ? [`Hi ${n}! Yes, we're open daily 8 AM to 8 PM. See you!`, `Thanks for asking, ${n}! Kare-kare for 2 is ₱320.`, `Great question, ${n}! Send us a message and we'll help.`]
      : [`Thank you so much, ${n}! See you again soon.`, `We're glad you enjoyed it, ${n}!`, `Thanks for the support, ${n}!`]
  return q
    ? [`Hi ${n}! Opo, bukas kami araw-araw, 8 AM hanggang 8 PM. Kita-kits!`, `Salamat sa tanong, ${n}! ₱320 po ang kare-kare good for 2.`, `Magandang tanong, ${n}! Mag-message lang po kayo at tutulungan namin kayo.`]
    : [`Maraming salamat, ${n}! Balik po kayo.`, `Natutuwa kami na nagustuhan ninyo, ${n}!`, `Salamat sa suporta, ${n}!`]
}

const reasons = (t: (a: string, b: string) => string): [string, string][] => [
  ['spam', 'Spam'],
  ['abusive', t('Mapang-abusong salita', 'Abusive language')],
  ['personal', t('Personal na impormasyon', 'Personal information')],
  ['offtopic', t('Walang kinalaman', 'Off-topic')],
]

function CommentRow({ c, focus }: { c: Comment; focus?: boolean }) {
  const { d, set, t, lang, showToast } = useBiz()
  const [replying, setReplying] = useState(focus ?? false)
  const [reply, setReply] = useState('')
  const [report, setReport] = useState(false)
  const [block, setBlock] = useState(false)
  const blocked = d.blocked.includes(c.nick)
  const upd = (p: Partial<Comment>) => set((x) => ({ ...x, comments: x.comments.map((y) => (y.id === c.id ? { ...y, ...p } : y)) }))
  return (
    <li id={`c-${c.id}`} className={cn('p-4', focus && 'bg-primary/5')}>
      <div className="flex gap-3">
        <Avatar name={c.nick} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="font-display text-[15px]">{c.nick}</b>
            <span className="text-[13px] text-fg-2">{relTime(c.at, lang)}</span>
            {c.fresh && !c.reply && <Pill tone="orange">{t('Bago', 'New')}</Pill>}
            {c.hidden && <Pill>{t('Nakatago', 'Hidden')}</Pill>}
            {c.reported && <Pill tone="danger">{t('Na-report', 'Reported')}</Pill>}
            {blocked && <Pill tone="danger">{t('Naka-block', 'Blocked')}</Pill>}
          </div>
          <p className={cn('mt-0.5 text-[16px]', c.hidden && 'text-fg-2 line-through decoration-1')}>{c.text}</p>
          {c.reply && (
            <p className="mt-2 rounded-[14px] rounded-tl-sm bg-sunken px-3 py-2 text-[15px] dark:bg-elevated">
              <b className="font-display text-link">{d.business.name}: </b>
              {c.reply}
            </p>
          )}
          <div className="-ml-2 mt-1 flex flex-wrap">
            {[
              [<MessageCircle size={17} key="r" />, t('Sumagot', 'Reply'), () => setReplying((r) => !r), false],
              [<Heart size={17} key="l" className={c.liked ? 'fill-danger text-danger' : ''} />, c.liked ? t('Nagustuhan', 'Liked') : 'Like', () => upd({ liked: !c.liked }), false],
              [<EyeOff size={17} key="h" />, c.hidden ? t('Ipakita', 'Unhide') : t('Itago', 'Hide'), () => {
                upd({ hidden: !c.hidden })
                if (!c.hidden) showToast({ text: t('Itinago ang komento', 'Comment hidden'), expression: 'pointing', undo: () => upd({ hidden: false }) })
              }, false],
              [<Flag size={17} key="f" />, t('I-report', 'Report'), () => setReport(true), !!c.reported],
              [<Ban size={17} key="b" />, blocked ? t('Naka-block', 'Blocked') : t('I-block', 'Block'), () => setBlock(true), blocked],
            ].map(([icon, label, fn, dis], i) => (
              <button key={i} disabled={dis as boolean} onClick={fn as () => void} className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 font-display text-[14px] font-medium text-fg-2 hover:bg-sunken disabled:opacity-40">
                {icon as React.ReactNode} {label as string}
              </button>
            ))}
          </div>
          {replying && (
            <div className="mt-2 space-y-2">
              <p className="flex items-center gap-1.5 font-display text-[13px] font-medium text-link">
                <Sparkles size={15} /> {t('Mungkahi ni Jimbot', 'Jimbot suggestions')}
              </p>
              <div className="flex flex-wrap gap-2">
                {replyIdeas(lang, c.nick, c.text).map((s) => (
                  <button key={s} onClick={() => setReply(s)} className="min-h-11 rounded-[14px] border border-line px-3 py-2 text-left text-[14px] hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('Isulat ang sagot…', 'Write a reply…')} aria-label={t('Sagot', 'Reply')} className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-[16px] outline-none focus:border-primary" />
                <Button size="lg" className="!h-12" disabled={!reply.trim()} onClick={() => (upd({ reply: reply.trim(), fresh: false }), setReplying(false), showToast({ text: t('Naipadala ang sagot', 'Reply sent'), expression: 'celebrating' }))}>
                  {t('Sumagot', 'Reply')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Sheet open={report} onClose={() => setReport(false)} title={t('I-report ang komento', 'Report comment')}>
        <div className="space-y-2">
          {reasons(t).map(([k, l]) => (
            <button key={k} onClick={() => (upd({ reported: k, hidden: true }), setReport(false), showToast({ text: t('Na-report at itinago. Salamat!', 'Reported and hidden. Thanks!'), expression: 'pointing' }))} className="flex min-h-14 w-full items-center rounded-[16px] border border-line px-4 text-left text-[16px] hover:border-primary">
              {l}
            </button>
          ))}
        </div>
      </Sheet>
      <IOSAlert
        open={block}
        title={t(`I-block si ${c.nick}?`, `Block ${c.nick}?`)}
        message={t('Hindi na siya makakapag-komento sa mga post mo.', "They won't be able to comment on your posts.")}
        actions={[
          { label: t('Kanselahin', 'Cancel'), onClick: () => setBlock(false) },
          { label: t('I-block', 'Block'), destructive: true, bold: true, onClick: () => (set((x) => ({ ...x, blocked: [...x.blocked, c.nick] })), setBlock(false)) },
        ]}
      />
    </li>
  )
}

export function Comments() {
  const { d, set, t } = useBiz()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('f') as Filter) ?? 'all'
  const focus = params.get('focus')
  const [q, setQ] = useState('')
  useEffect(() => {
    if (focus) setTimeout(() => document.getElementById(`c-${focus}`)?.scrollIntoView({ block: 'center' }), 200)
  }, [focus])
  const all = getForcedState() === 'empty' ? [] : d.comments
  const match = (c: Comment) =>
    (!q || (c.text + c.nick).toLowerCase().includes(q.toLowerCase())) &&
    (filter === 'all' ? true : filter === 'new' ? c.fresh && !c.hidden : filter === 'needs' ? !c.reply && !c.hidden : filter === 'hidden' ? c.hidden : !!c.reported)
  const list = all.filter(match)
  const groups = d.posts.filter((p) => list.some((c) => c.postId === p.id))
  const filters: [Filter, string][] = [
    ['all', t('Lahat', 'All')],
    ['new', t('Bago', 'New')],
    ['needs', t('Kailangang sagutin', 'Needs reply')],
    ['hidden', t('Nakatago', 'Hidden')],
    ['reported', t('Na-report', 'Reported')],
  ]
  return (
    <main>
      <PageHeader title={t('Nilalaman at Social', 'Blog and Social')} phase="P3" tabs={<ContentTabs />} />
      <div className="space-y-4 px-4 md:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="flex items-center gap-3 p-4">
            <Timer size={24} className="text-link" />
            <div>
              <p className="text-[14px] text-fg-2">{t('Average na bilis ng sagot', 'Average response time')}</p>
              <p className="font-display text-[22px] font-bold">1h 12m</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <MessageCircle size={24} className="text-link" />
            <div>
              <p className="text-[14px] text-fg-2">{t('Kailangang sagutin', 'Needs reply')}</p>
              <p className="font-display text-[22px] font-bold">{all.filter((c) => !c.reply && !c.hidden).length}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <Bell size={24} className="text-link" />
            <div className="flex-1">
              <p className="text-[14px] text-fg-2">{t('Alerto sa bagong komento', 'New comment alerts')}</p>
              <p className="font-display text-[16px] font-semibold">{d.prefs.notif.comments ? 'On' : 'Off'}</p>
            </div>
            <Toggle label={t('Alerto', 'Alerts')} checked={d.prefs.notif.comments} onChange={(v) => set((x) => ({ ...x, prefs: { ...x.prefs, notif: { ...x.prefs.notif, comments: v } } }))} />
          </Card>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="tablist" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            {filters.map(([f, l]) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setParams({ f }, { replace: true })} className={cn('min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 font-display text-[15px] font-medium', filter === f ? 'bg-brown text-cream dark:bg-cream dark:text-brown' : 'bg-sunken text-fg-2 dark:bg-elevated')}>
                {l}
              </button>
            ))}
          </div>
          <label className="relative lg:ml-auto lg:w-72">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Hanapin sa komento', 'Search comments')} aria-label={t('Hanapin sa komento', 'Search comments')} className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[16px] outline-none focus:border-primary" />
          </label>
        </div>
        {groups.length === 0 ? (
          <Card>
            <StateBlock pose="celebrating" title={t('Walang komento dito', 'No comments here')} body={t('Nasagot mo na lahat. Ang galing!', "You're all caught up. Nice!")} />
          </Card>
        ) : (
          groups.map((p) => (
            <Card key={p.id} className="p-0 md:p-0">
              <div className="flex items-center gap-3 border-b border-line p-4">
                <img src={p.media[0]} alt="" className="h-12 w-12 rounded-[12px] object-cover" />
                <p className="line-clamp-2 flex-1 font-display text-[15px] font-semibold">{p.title ?? p.text}</p>
                <Pill>{list.filter((c) => c.postId === p.id).length}</Pill>
              </div>
              <ul className="divide-y divide-line">
                {list
                  .filter((c) => c.postId === p.id)
                  .map((c) => (
                    <CommentRow key={c.id} c={c} focus={focus === c.id} />
                  ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </main>
  )
}
