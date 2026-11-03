import { ImagePlus, PenLine, ShieldCheck, Star, Trash2, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import ProgressBar from 'react-bootstrap/ProgressBar'
import ToggleButton from 'react-bootstrap/ToggleButton'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import type { BusinessFeed, ReviewInput } from '@/app/social'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Button } from '@/components/ui/Button'
import type { FeedReview } from '@/data/feed'
import type { Place } from '@/data/places'
import { cn } from '@/lib/cn'
import { src } from '@/lib/media'
import { shrink } from '@/screens/personalize/TravelerThemes'
import { BizLogo, PersonAvatar, Stars, ago } from './Bits'
import { ConfirmModal, ProfileSheet } from './bs'

type Filter = 'all' | 'photos' | 'visited' | '5' | '4' | '3' | '2' | '1'
const FILTERS: { v: Filter; l: string }[] = [
  { v: 'all', l: 'Lahat' },
  { v: 'photos', l: 'May litrato' },
  { v: 'visited', l: 'Bumisita' },
  ...(['5', '4', '3', '2', '1'] as const).map((n) => ({ v: n as Filter, l: `${n}★` })),
]

// flex-none and ml-0 cancel Bootstrap's .btn-group stretching and -1px overlap.
const chip = 'ml-0 inline-flex h-9 flex-none cursor-pointer items-center whitespace-nowrap rounded-full px-3.5 font-display text-[14px] font-medium transition-colors'

export function ReviewsTab({ place, feed, onWrite, onPhoto, highlight }: { place: Place; feed: BusinessFeed; onWrite: () => void; onPhoto: (m: string) => void; highlight?: string | null }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [del, setDel] = useState<string | null>(null)
  const list = feed.reviews.filter((r) => (filter === 'all' ? true : filter === 'photos' ? r.photos.length > 0 : filter === 'visited' ? r.visited : r.stars === Number(filter)))
  const dist = [5, 4, 3, 2, 1].map((n) => feed.reviews.filter((r) => r.stars === n).length)
  const max = Math.max(1, ...dist)
  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center gap-5 rounded-[24px] bg-surface p-4 shadow-card md:p-5">
        <div className="text-center">
          <p className="font-display text-[44px] font-bold leading-none">{feed.stats.rating.toFixed(1)}</p>
          <Stars value={feed.stats.rating} size={16} className="mt-1.5" />
          <p className="mt-1 text-[13px] text-fg-2">{feed.stats.reviewCount.toLocaleString()} review</p>
        </div>
        <div className="min-w-[160px] flex-1 space-y-1.5">
          {dist.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className="w-3 font-display font-semibold">{5 - i}</span>
              <ProgressBar now={(c / max) * 100} aria-label={`${5 - i} bituin: ${c} review`} className="h-2 flex-1 rounded-full bg-sunken dark:bg-elevated" />
            </div>
          ))}
        </div>
        <Button block className="md:w-auto" icon={<PenLine size={18} />} onClick={onWrite}>
          {feed.myReview ? 'I-edit ang review mo' : 'Mag-review'}
        </Button>
      </section>

      <ToggleButtonGroup type="radio" name="review-filter" value={filter} onChange={(v: Filter) => setFilter(v)} aria-label="Salain ang reviews" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <ToggleButton key={f.v} id={`rf-${f.v}`} value={f.v} variant="" className={cn(chip, filter === f.v ? 'bg-brown text-cream dark:bg-primary dark:text-ink' : 'bg-surface text-fg shadow-card dark:bg-elevated')}>
            {f.l}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {list.length ? (
        <ul className="space-y-3">
          {list.map((r) => (
            <ReviewCard key={r.id} r={r} place={place} mine={!!feed.me && r.authorId === feed.me} onEdit={onWrite} onDelete={() => setDel(r.id)} onPhoto={onPhoto} highlight={highlight === r.id} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <Jimbot expression="idea" variant="standalone" size={120} />
          <p className="mt-2 font-display text-[18px] font-semibold">{feed.reviews.length ? 'Walang tugma sa filter' : 'Ikaw ang unang mag-review!'}</p>
          <p className="text-body text-fg-2">{feed.reviews.length ? 'Subukan ang ibang filter.' : 'Ikuwento ang karanasan mo para sa ibang biyahero.'}</p>
        </div>
      )}
      <ConfirmModal
        open={!!del}
        title="Burahin ang review mo?"
        message="Hindi na ito maibabalik."
        onClose={() => setDel(null)}
        actions={[
          { label: 'Kanselahin', onClick: () => setDel(null) },
          { label: 'Burahin', destructive: true, bold: true, onClick: () => (del && feed.deleteReview(del), setDel(null)) },
        ]}
      />
    </div>
  )
}

function ReviewCard({ r, place, mine, onEdit, onDelete, onPhoto, highlight }: { r: FeedReview; place: Place; mine: boolean; onEdit: () => void; onDelete: () => void; onPhoto: (m: string) => void; highlight: boolean }) {
  return (
    <motion.li layout initial={highlight ? { scale: 0.98, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} className={cn('rounded-[24px] bg-surface p-4 shadow-card', highlight && 'ring-2 ring-primary')}>
      <div className="flex items-center gap-2.5">
        <PersonAvatar name={r.nick} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-display text-[15px] font-semibold">
            {r.nick}
            {mine && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-link">Ikaw</span>}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-[13px] text-fg-2">
            <Stars value={r.stars} size={13} />
            {ago(r.at)}
            {r.visited && (
              <span className="inline-flex items-center gap-1 font-semibold text-ok">
                <ShieldCheck size={13} /> Bumisita
              </span>
            )}
          </p>
        </div>
      </div>
      <p className="mt-2.5 whitespace-pre-line text-body">{r.text}</p>
      {r.photos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {r.photos.map((p, i) => (
            <button key={i} onClick={() => onPhoto(p)} className="overflow-hidden rounded-[14px]" aria-label="Tingnan ang litrato">
              <img src={src(p, 300, 300)} alt="" className="h-20 w-20 object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {r.reply && (
        <div className="mt-3 flex gap-2.5 rounded-[18px] bg-sunken p-3 dark:bg-elevated">
          <BizLogo place={place} size={30} />
          <div className="min-w-0">
            <p className="font-display text-[13px] font-semibold">Sagot ng may-ari</p>
            <p className="text-[15px]">{r.reply}</p>
          </div>
        </div>
      )}
      {mine && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" icon={<PenLine size={15} />} onClick={onEdit}>
            I-edit
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={onDelete}>
            Burahin
          </Button>
        </div>
      )}
    </motion.li>
  )
}

const starLabel = ['', 'Hindi maganda', 'Puwede na', 'Okay lang', 'Maganda', 'Sobrang ganda!']

export function ReviewSheet({ open, onClose, place, feed, onSaved }: { open: boolean; onClose: () => void; place: Place; feed: BusinessFeed; onSaved: (id: string) => void }) {
  return open ? <ReviewForm key={feed.myReview?.id ?? 'new'} onClose={onClose} place={place} feed={feed} onSaved={onSaved} /> : null
}

function ReviewForm({ onClose, place, feed, onSaved }: { onClose: () => void; place: Place; feed: BusinessFeed; onSaved: (id: string) => void }) {
  const prev = feed.myReview
  const start: ReviewInput = { stars: prev?.stars ?? 0, text: prev?.text ?? '', photos: prev?.photos ?? [], visited: prev?.visited ?? false }
  const [v, setV] = useState<ReviewInput>(start)
  const [code, setCode] = useState('')
  const [tried, setTried] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [full, setFull] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dirty = JSON.stringify(v) !== JSON.stringify(start)
  const codeOk = !v.visited || (prev?.visited && !code) || code.trim().length >= 4
  const err = { stars: !v.stars ? 'Pumili ng bituin.' : '', text: v.text.trim().length < 10 ? 'Magsulat ng kahit 10 letra.' : '', code: !codeOk ? 'Ilagay ang check-in code (4 na letra pataas).' : '' }
  const bad = !!(err.stars || err.text || err.code)
  const close = () => (dirty ? setConfirm(true) : onClose())
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setTried(true)
    if (bad) return
    const id = feed.saveReview({ ...v, text: v.text.trim() })
    if (!id) return setFull(true)
    onSaved(id)
  }
  return (
    <>
      <ProfileSheet
        open
        onClose={close}
        title={prev ? 'I-edit ang review mo' : `I-review ang ${place.name}`}
        footer={
          <Button block size="lg" onClick={() => submit()} aria-disabled={bad} className={cn(bad && tried && 'opacity-60')}>
            {prev ? 'I-save ang pagbabago' : 'I-post ang review'}
          </Button>
        }
      >
        <Form noValidate onSubmit={submit} className="space-y-5">
          <div className="flex items-center gap-3">
            <PersonAvatar name={feed.nick} size={40} />
            <div>
              <p className="font-display text-[15px] font-semibold">{feed.nick}</p>
              <p className="text-[13px] text-fg-2">Makikita ito ng lahat at ng may-ari</p>
            </div>
          </div>

          <Form.Group>
            <Form.Label as="p" className="mb-0 font-display text-[16px] font-semibold">
              Ilang bituin?
            </Form.Label>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <ToggleButtonGroup type="radio" name="stars" value={v.stars || undefined} onChange={(n: number) => setV({ ...v, stars: n })} aria-label="Bituin" className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <ToggleButton key={n} id={`star-${n}`} value={n} variant="" aria-label={`${n} bituin, ${starLabel[n]}`} className="ml-0 flex h-12 w-12 flex-none items-center justify-center rounded-full border-0 p-0">
                    <Star size={36} className={n <= v.stars ? 'text-amber' : 'text-line'} fill={n <= v.stars ? 'currentColor' : 'none'} strokeWidth={n <= v.stars ? 0 : 1.5} />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <span className="ml-2 font-display text-[15px] font-medium text-fg-2">{starLabel[v.stars]}</span>
            </div>
            {tried && err.stars && <p className="mt-1 text-[13px] font-semibold text-danger">{err.stars}</p>}
          </Form.Group>

          <Form.Group controlId="review-text">
            <Form.Label className="font-display text-[16px] font-semibold">Ikuwento ang karanasan mo</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={v.text}
              onChange={(e) => setV({ ...v, text: e.target.value.slice(0, 1000) })}
              isInvalid={tried && !!err.text}
              placeholder="Ano ang inorder mo? Kumusta ang serbisyo at lugar?"
              className="resize-none rounded-[18px] px-4 py-3 text-[16px] shadow-none"
            />
            <div className="mt-1 flex justify-between text-[13px]">
              <Form.Control.Feedback type="invalid" className="block font-semibold">
                {tried && err.text}
              </Form.Control.Feedback>
              <Form.Text className="ml-auto text-fg-2">{v.text.length}/1000</Form.Text>
            </div>
          </Form.Group>

          <div>
            <p className="font-display text-[16px] font-semibold">
              Mga litrato <span className="font-normal text-fg-2">(hanggang 3)</span>
            </p>
            <div className="mt-2 flex gap-2">
              {v.photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={src(p, 200, 200)} alt="" className="h-20 w-20 rounded-[14px] object-cover" />
                  <button type="button" onClick={() => setV({ ...v, photos: v.photos.filter((_, j) => j !== i) })} aria-label="Tanggalin ang litrato" className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brown text-cream">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {v.photos.length < 3 && (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-primary/50 text-link">
                  <ImagePlus size={22} />
                  <span className="text-[11px] font-semibold">Idagdag</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []).slice(0, 3 - v.photos.length)
                  const added = await Promise.all(files.map((f) => shrink(f, 720)))
                  setV((x) => ({ ...x, photos: [...x.photos, ...added].slice(0, 3) }))
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          <div className="rounded-[18px] bg-sunken p-4 dark:bg-elevated">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="shrink-0 text-ok" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold">Bumisita ako</p>
                <p className="text-[13px] text-fg-2">May "Bumisita" badge ang review na may check-in</p>
              </div>
              <Form.Check type="switch" id="visited-switch" aria-label="Bumisita ako" checked={v.visited} onChange={(e) => setV({ ...v, visited: e.target.checked })} className="m-0 min-h-0 text-[22px] [&_.form-check-input]:m-0 [&_.form-check-input]:h-7 [&_.form-check-input]:w-12 [&_.form-check-input]:cursor-pointer" />
            </div>
            {v.visited && (
              <Form.Group controlId="checkin-code" className="mt-3">
                <Form.Label className="text-[14px] font-semibold">Check-in code</Form.Label>
                <Form.Control value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} isInvalid={tried && !!err.code} placeholder={prev?.visited ? 'Naka-check in na' : 'Hal. KMB-7F3A'} autoCapitalize="characters" className="h-12 rounded-[14px] px-4 font-display text-[16px] tracking-wider shadow-none" />
                {tried && err.code ? (
                  <Form.Control.Feedback type="invalid" className="block font-semibold">
                    {err.code}
                  </Form.Control.Feedback>
                ) : (
                  <Form.Text className="text-[13px] text-fg-2">Nasa QR o counter ng tindahan ang code.</Form.Text>
                )}
              </Form.Group>
            )}
          </div>

          <p className="text-[13px] text-fg-2">Maging tapat at magalang. Bawal ang personal na impormasyon at pekeng review.</p>
        </Form>
      </ProfileSheet>
      <ConfirmModal
        open={confirm}
        title="Itapon ang review?"
        message="Mawawala ang mga isinulat mo."
        onClose={() => setConfirm(false)}
        actions={[
          { label: 'Ituloy', bold: true, onClick: () => setConfirm(false) },
          { label: 'Itapon', destructive: true, onClick: () => (setConfirm(false), onClose()) },
        ]}
      />
      <ConfirmModal open={full} title="Puno na ang storage" message="Bawasan ang litrato at subukan ulit." actions={[{ label: 'OK', bold: true, onClick: () => setFull(false) }]} />
    </>
  )
}
