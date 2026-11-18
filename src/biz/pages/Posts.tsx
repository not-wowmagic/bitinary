import { Bookmark, CalendarDays, Clapperboard, Eye, FileText, Heart, MessageCircle, MoreHorizontal, PenLine, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { IOSAlert } from '@/components/flow/IOSAlert'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { WD, longDate, num, time12 } from '../format'
import type { Post } from '../seed'
import { useBiz } from '../store'
import { Card, PageHeader, Pill, StateBlock, SubTabs } from '../ui'
import { BusinessAssetImage } from '../ui/BusinessAssetImage'

export function ContentTabs() {
  const { t, d } = useBiz()
  return (
    <SubTabs
      label={t('Nilalaman at Social', 'Blog and Social')}
      items={[
        { to: '/biz/content', label: 'Posts' },
        { to: '/biz/content/comments', label: t('Mga Komento', 'Comments'), badge: d.comments.filter((c) => c.fresh && !c.reply && !c.hidden).length },
        { to: '/biz/content/reviews', label: t('Mga Review', 'Reviews'), badge: d.reviews.filter((r) => !r.reply && !r.caseId).length },
      ]}
    />
  )
}

export function TypePill({ type }: { type: Post['type'] }) {
  return <Pill tone={type === 'reel' ? 'orange' : 'default'}>{type === 'reel' ? 'Reel' : type === 'blog' ? 'Blog' : 'Post'}</Pill>
}

function PostRow({ p, onDelete }: { p: Post; onDelete: () => void }) {
  const { t, lang } = useBiz()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  return (
    <li className="relative flex gap-3 p-3 md:gap-4 md:p-4">
      <button onClick={() => navigate(`/biz/content/edit/${p.id}`)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[14px] bg-sunken md:h-28 md:w-24" aria-label={t('I-edit', 'Edit')}>
        {p.media[0] && <BusinessAssetImage src={p.media[0]} alt="" className="h-full w-full object-cover" />}
        {p.type === 'reel' && <Clapperboard size={18} className="absolute bottom-1.5 left-1.5 text-white drop-shadow" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypePill type={p.type} />
          {p.status === 'scheduled' && <Pill tone="caution">{t('Naka-schedule', 'Scheduled')}</Pill>}
          {p.status === 'draft' && <Pill>Draft</Pill>}
          {p.fb && <Pill>Facebook</Pill>}
        </div>
        <p className="mt-1 line-clamp-2 text-[16px] font-semibold leading-snug">{p.title ?? p.text}</p>
        <p className="mt-0.5 text-[14px] text-fg-2">
          {longDate(p.at, lang)} · {time12(p.at)}
        </p>
        {p.status === 'published' && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-fg-2">
            <li className="flex items-center gap-1">
              <Eye size={15} /> {num(p.views)}
            </li>
            <li className="flex items-center gap-1">
              <Heart size={15} /> {p.likes}
            </li>
            <li className="flex items-center gap-1">
              <Bookmark size={15} /> {p.saves}
            </li>
            <li className="flex items-center gap-1">
              <MessageCircle size={15} /> {p.comments}
            </li>
          </ul>
        )}
      </div>
      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} aria-label={t('Iba pa', 'More')} aria-expanded={menu} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sunken">
          <MoreHorizontal size={20} />
        </button>
        {menu && (
          <div className="absolute right-0 top-11 z-10 w-44 overflow-hidden rounded-[16px] bg-elevated shadow-float ring-1 ring-line">
            <button onClick={() => navigate(`/biz/content/edit/${p.id}`)} className="flex h-12 w-full items-center gap-2 px-4 text-left text-[15px] hover:bg-sunken">
              <PenLine size={17} /> {t('I-edit', 'Edit')}
            </button>
            <button onClick={() => (setMenu(false), onDelete())} className="flex h-12 w-full items-center gap-2 px-4 text-left text-[15px] text-danger hover:bg-danger-bg">
              <Trash2 size={17} /> {t('Burahin', 'Delete')}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function Calendar({ posts }: { posts: Post[] }) {
  const { lang } = useBiz()
  const navigate = useNavigate()
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => i - offset + 1)
  return (
    <div>
      <p className="mb-2 font-display text-[16px] font-semibold">{first.toLocaleString(lang === 'en' ? 'en-PH' : 'fil-PH', { month: 'long', year: 'numeric' })}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[13px] text-fg-2">
        {WD[lang].map((w) => (
          <span key={w} className="py-1 font-display font-medium">
            {w}
          </span>
        ))}
        {cells.map((n, i) => {
          const inMonth = n >= 1 && n <= days
          const ps = inMonth ? posts.filter((p) => new Date(p.at).getDate() === n && new Date(p.at).getMonth() === now.getMonth()) : []
          return (
            <div key={i} className={cn('min-h-[72px] rounded-[12px] p-1 text-left', inMonth ? 'bg-sunken dark:bg-elevated' : 'opacity-0', n === now.getDate() && 'ring-2 ring-primary')}>
              {inMonth && <span className="block px-1 font-display text-[13px] font-semibold text-fg">{n}</span>}
              {ps.map((p) => (
                <button key={p.id} onClick={() => navigate(`/biz/content/edit/${p.id}`)} className={cn('mt-0.5 block w-full truncate rounded-md px-1 text-left text-[11px] font-semibold', p.status === 'scheduled' ? 'bg-primary text-ink' : p.status === 'draft' ? 'bg-line text-fg' : 'bg-ok-bg text-ok')}>
                  {time12(p.at)} {p.type === 'reel' ? 'Reel' : p.type === 'blog' ? 'Blog' : 'Post'}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type View = 'published' | 'scheduled' | 'draft' | 'calendar'

export function Posts() {
  const { d, set, t, showToast } = useBiz()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = (params.get('v') as View) ?? 'published'
  const [del, setDel] = useState<Post | null>(null)
  const posts = getForcedState() === 'empty' ? [] : d.posts
  const list = posts.filter((p) => p.status === view).sort((a, b) => +new Date(b.at) - +new Date(a.at))
  const views: [View, string, number?][] = [
    ['published', t('Na-publish', 'Published'), posts.filter((p) => p.status === 'published').length],
    ['scheduled', t('Naka-schedule', 'Scheduled'), posts.filter((p) => p.status === 'scheduled').length],
    ['draft', 'Drafts', posts.filter((p) => p.status === 'draft').length],
    ['calendar', t('Kalendaryo', 'Calendar')],
  ]
  return (
    <main>
      <PageHeader
        title={t('Nilalaman at Social', 'Blog and Social')}
        phase="P3"
        tabs={<ContentTabs />}
        actions={
          <>
            <Button icon={<Plus size={18} />} onClick={() => navigate('/biz/content/new?type=post')}>
              {t('Bagong post', 'New post')}
            </Button>
            <Button variant="secondary" icon={<Clapperboard size={18} />} onClick={() => navigate('/biz/content/new?type=reel')}>
              {t('Gumawa ng Reel', 'Create a Reel')}
            </Button>
            <Button variant="secondary" icon={<FileText size={18} />} onClick={() => navigate('/biz/content/new?type=blog')}>
              Blog
            </Button>
          </>
        }
      />
      <div className="space-y-4 px-4 md:px-8">
        <div role="tablist" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {views.map(([v, l, n]) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setParams({ v }, { replace: true })} className={cn('flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-display text-[15px] font-medium', view === v ? 'bg-brown text-cream dark:bg-cream dark:text-brown' : 'bg-sunken text-fg-2 dark:bg-elevated')}>
              {v === 'calendar' && <CalendarDays size={17} />}
              {l}
              {n != null && <span className="text-[13px] opacity-75">{n}</span>}
            </button>
          ))}
        </div>
        {view === 'calendar' ? (
          <Card>
            <Calendar posts={posts} />
          </Card>
        ) : list.length === 0 ? (
          <Card>
            <StateBlock pose="camera" placeholder title={t('Wala pang post dito', 'No posts here yet')} body={t('Ang unang post ay mas madali kaysa inaakala mo. Tutulungan ka ni Jimbot.', 'Your first post is easier than you think. Jimbot will help you write it.')} action={t('Gumawa ng post', 'Create a post')} onAction={() => navigate('/biz/content/new?type=post')} />
          </Card>
        ) : (
          <Card className="p-0 md:p-0">
            <ul className="divide-y divide-line">
              {list.map((p) => (
                <PostRow key={p.id} p={p} onDelete={() => setDel(p)} />
              ))}
            </ul>
          </Card>
        )}
      </div>
      <IOSAlert
        open={!!del}
        title={t('Burahin ang post?', 'Delete this post?')}
        message={t('Mawawala ito sa profile ng negosyo mo.', 'It will be removed from your business profile.')}
        actions={[
          { label: t('Kanselahin', 'Cancel'), onClick: () => setDel(null) },
          {
            label: t('Burahin', 'Delete'),
            destructive: true,
            bold: true,
            onClick: () => {
              const p = del!
              set((x) => ({ ...x, posts: x.posts.filter((y) => y.id !== p.id) }))
              setDel(null)
              showToast({ text: t('Nabura ang post', 'Post deleted'), expression: 'pointing', undo: () => set((x) => ({ ...x, posts: [p, ...x.posts] })) })
            },
          },
        ]}
      />
    </main>
  )
}
