import { Clapperboard, Heart, MessageCircle, Play, Send, Share, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { useNavigate } from 'react-router'
import { useAccount } from '@/app/account'
import type { BusinessFeed } from '@/app/social'
import { useStore } from '@/app/store'
import { SponsoredTag } from '@/components/ui/Pill'
import type { FeedComment, FeedPost } from '@/data/feed'
import type { Place } from '@/data/places'
import { cn } from '@/lib/cn'
import { compact } from '@/lib/format'
import { src } from '@/lib/media'
import { useOnline } from '@/lib/useOnline'
import { BizLogo, PersonAvatar, ago } from './Bits'
import { ProfileSheet } from './bs'

/** Bootstrap tooltip helper (hover, focus and long-press). */
export function Tip({ text, children, id }: { text: string; children: React.ReactElement; id: string }) {
  return (
    <OverlayTrigger placement="top" overlay={<Tooltip id={id}>{text}</Tooltip>}>
      {children}
    </OverlayTrigger>
  )
}

export function PostCard({ post, place, feed, onComments, onShare, onPhoto }: { post: FeedPost; place: Place; feed: BusinessFeed; onComments: () => void; onShare: () => void; onPhoto: (m: string) => void }) {
  const navigate = useNavigate()
  const { requireAccount } = useAccount()
  const { showToast } = useStore()
  const liked = feed.isLiked(post.id)
  const thread = feed.commentsFor(post.id)
  const likes = post.likes + (liked ? 1 : 0)
  const like = () => {
    if (!requireAccount('Para ma-like ang post na ito.')) return
    feed.toggleLike(post.id)
  }
  return (
    <article className="overflow-hidden rounded-[24px] bg-surface shadow-card" aria-label={`Post ng ${place.name}`}>
      <header className="flex items-center gap-2.5 px-4 pt-4">
        <BizLogo place={place} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold leading-tight">{place.name}</p>
          <p className="flex items-center gap-1.5 text-[13px] text-fg-2">
            {ago(post.at)}
            {post.kind === 'video' && (
              <span className="inline-flex items-center gap-1">
                · <Clapperboard size={13} /> Video
              </span>
            )}
            {post.kind === 'blog' && <span>· Blog</span>}
          </p>
        </div>
        {post.kind === 'ad' && (
          <Tip id={`tip-ad-${post.id}`} text="Bayad na promo ng negosyo">
            <span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <SponsoredTag />
            </span>
          </Tip>
        )}
      </header>
      {post.title && <h3 className="px-4 pt-3 font-display text-[18px] font-semibold leading-snug">{post.title}</h3>}
      <p className="whitespace-pre-line px-4 pb-3 pt-1.5 text-body">{post.text}</p>
      <Media post={post} onPhoto={onPhoto} onVideo={() => post.reelId && navigate(`/reels/${post.reelId}`)} />
      {post.ad && (
        <button onClick={() => showToast({ text: 'Na-save ang deal sa account mo', expression: 'celebrating' })} className="flex w-full items-center gap-3 bg-sunken px-4 py-3 text-left dark:bg-elevated">
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] uppercase tracking-wide text-fg-2">{post.ad.until}</span>
            <span className="block truncate font-display text-[15px] font-semibold">{post.title ?? place.name}</span>
          </span>
          <span className="flex h-10 shrink-0 items-center rounded-full bg-primary px-4 font-display text-[14px] font-medium text-ink">{post.ad.cta}</span>
        </button>
      )}
      <div className="flex items-center justify-between px-4 pt-3 text-[13px] text-fg-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-ink">
            <Heart size={11} fill="currentColor" strokeWidth={0} />
          </span>
          {compact(likes)}
        </span>
        <button onClick={onComments} className="min-h-8 hover:underline">
          {thread.length} comment
        </button>
      </div>
      <div className="mx-4 mt-2 grid grid-cols-3 border-t border-line py-1">
        <ActionBtn label={liked ? 'Na-like' : 'Like'} active={liked} onClick={like} icon={<LikeIcon on={liked} />} />
        <ActionBtn label="Comment" onClick={onComments} icon={<MessageCircle size={19} />} />
        <ActionBtn label="Share" onClick={onShare} icon={<Share size={19} />} />
      </div>
      {thread.length > 0 && (
        <div className="space-y-2 px-4 pb-4">
          {thread.slice(-2).map((c) => (
            <CommentLine key={c.id} c={c} place={place} compactView />
          ))}
          {thread.length > 2 && (
            <button onClick={onComments} className="min-h-9 font-display text-[14px] font-medium text-fg-2 hover:underline">
              Tingnan ang lahat ng {thread.length} comment
            </button>
          )}
        </div>
      )}
    </article>
  )
}

function LikeIcon({ on }: { on: boolean }) {
  return (
    <motion.span key={String(on)} initial={{ scale: on ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 14 }} className="inline-flex">
      <Heart size={19} fill={on ? 'currentColor' : 'none'} />
    </motion.span>
  )
}

function ActionBtn({ label, icon, onClick, active }: { label: string; icon: ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cn('flex h-11 items-center justify-center gap-2 rounded-[12px] font-display text-[14px] font-medium hover:bg-sunken dark:hover:bg-elevated', active ? 'text-link' : 'text-fg-2')}>
      {icon}
      {label}
    </button>
  )
}

function Media({ post, onPhoto, onVideo }: { post: FeedPost; onPhoto: (m: string) => void; onVideo: () => void }) {
  const m = post.media
  if (!m.length) return null
  if (post.kind === 'video') {
    return (
      <button onClick={onVideo} className="relative block aspect-[4/5] max-h-[520px] w-full overflow-hidden bg-black" aria-label="I-play ang video">
        <img src={src(m[0], 900)} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="glass flex h-16 w-16 items-center justify-center rounded-full shadow-float">
            <Play size={28} fill="currentColor" className="ml-1" />
          </span>
        </span>
      </button>
    )
  }
  if (m.length === 1)
    return (
      <button onClick={() => onPhoto(m[0])} className="block w-full" aria-label="Tingnan ang larawan">
        <img src={src(m[0], 1000)} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
      </button>
    )
  return (
    <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-0.5">
      {m.slice(0, 3).map((x, i) => (
        <button key={x + i} onClick={() => onPhoto(x)} className={cn('overflow-hidden', i === 0 && 'row-span-2')} aria-label="Tingnan ang larawan">
          <img src={src(x, i === 0 ? 700 : 400)} alt="" className="h-full w-full object-cover" loading="lazy" />
        </button>
      ))}
    </div>
  )
}

function CommentLine({ c, place, compactView, mine, onDelete }: { c: FeedComment; place: Place; compactView?: boolean; mine?: boolean; onDelete?: () => void }) {
  return (
    <div className="flex gap-2">
      <PersonAvatar name={c.nick} size={compactView ? 28 : 34} />
      <div className="min-w-0 flex-1">
        <div className={cn('inline-block max-w-full rounded-[18px] bg-sunken px-3 py-2 dark:bg-elevated', c.hidden && 'opacity-60')}>
          <p className="font-display text-[13px] font-semibold">{c.nick}</p>
          <p className={cn('break-words text-[15px]', compactView && 'line-clamp-2')}>{c.text}</p>
        </div>
        {!compactView && (
          <p className="mt-0.5 flex items-center gap-3 pl-3 text-[12px] text-fg-2">
            {ago(c.at)}
            {c.hidden && <span className="font-semibold text-caution">Itinago ng may-ari</span>}
            {mine && (
              <button onClick={onDelete} className="inline-flex min-h-8 items-center gap-1 font-semibold hover:text-danger">
                <Trash2 size={12} /> Burahin
              </button>
            )}
          </p>
        )}
        {c.reply && !compactView && (
          <div className="mt-2 flex gap-2">
            <BizLogo place={place} size={28} />
            <div className="rounded-[18px] bg-primary/10 px-3 py-2">
              <p className="font-display text-[13px] font-semibold">
                {place.name} <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-ink">May-ari</span>
              </p>
              <p className="text-[15px]">{c.reply}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const MAX = 500

/** Comments for one post, in a Bootstrap Offcanvas (phones) or Modal (tablet and desktop). */
export function CommentsSheet({ post, place, feed, onClose }: { post: FeedPost | null; place: Place; feed: BusinessFeed; onClose: () => void }) {
  const { session, requireAccount } = useAccount()
  const { showToast } = useStore()
  const online = useOnline()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const thread = post ? feed.commentsFor(post.id) : []
  const signedIn = session?.kind === 'user'
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [thread.length])
  const send = () => {
    const v = text.trim()
    if (!post || !v) return
    if (!requireAccount('Para makapag-comment sa post na ito.')) return
    if (!feed.addComment(post.id, v)) return showToast({ text: 'Hindi na-save. Puno na ang storage ng device.', expression: 'unsure' })
    setText('')
    if (!online) showToast({ text: 'Ipapadala pagbalik ng internet', expression: 'sleeping' })
  }
  return (
    <ProfileSheet
      open={!!post}
      onClose={onClose}
      title={`${thread.length} comment`}
      footer={
        signedIn ? (
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <div className="flex items-end gap-2">
              <PersonAvatar name={feed.nick} size={36} />
              <InputGroup className="min-w-0 flex-1 flex-nowrap items-end">
                <Form.Label htmlFor="comment-input" visuallyHidden>
                  Isulat ang comment
                </Form.Label>
                <Form.Control
                  id="comment-input"
                  as="textarea"
                  rows={1}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX))}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder={`Mag-comment bilang ${feed.nick}…`}
                  className="max-h-32 min-h-11 resize-none rounded-[22px] border border-line bg-bg px-4 py-2.5 text-[15px] shadow-none"
                />
              </InputGroup>
              <button type="submit" disabled={!text.trim()} aria-label="Ipadala" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-ink disabled:opacity-40">
                <Send size={19} />
              </button>
            </div>
            {text.length > 400 && <Form.Text className="mt-1 block text-right text-[12px] text-fg-2">{text.length}/{MAX}</Form.Text>}
          </Form>
        ) : (
          <button onClick={() => requireAccount('Para makapag-comment sa post na ito.')} className="h-12 w-full rounded-full bg-primary font-display text-[15px] font-medium text-ink">
            Mag-sign in para mag-comment
          </button>
        )
      }
    >
      {post && (
        <div className="space-y-4">
          <p className="line-clamp-2 rounded-[16px] bg-sunken px-3 py-2 text-[14px] text-fg-2 dark:bg-elevated">
            <b className="text-fg">{place.name}:</b> {post.title ?? post.text}
          </p>
          <AnimatePresence initial={false}>
            {thread.map((c) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CommentLine c={c} place={place} mine={!!feed.me && c.authorId === feed.me} onDelete={() => feed.deleteComment(c.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {!thread.length && <p className="py-6 text-center text-body text-fg-2">Wala pang comment. Ikaw ang mauna!</p>}
          <div ref={endRef} />
        </div>
      )}
    </ProfileSheet>
  )
}
