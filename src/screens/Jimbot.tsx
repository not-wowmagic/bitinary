import { ArrowUp, BookOpen, CalendarCheck, Flag, Headphones, MapPin, Pencil, PiggyBank, Save } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAccount } from '@/app/account'
import { useStore } from '@/app/store'
import { BudgetSheet } from '@/components/BudgetSheet'
import { ListingCard } from '@/components/cards/ListingCard'
import { Jimbot } from '@/components/mascot/Jimbot'
import { OfflineState } from '@/components/states/States'
import { Button } from '@/components/ui/Button'
import { PhaseTag } from '@/components/ui/PhaseTag'
import { VerifiedPill } from '@/components/ui/Pill'
import { greeting, quickChips, replyTo, sampleConversation, type Card, type Msg } from '@/data/chat'
import { itineraryById, stopsTotal } from '@/data/itineraries'
import { placeById } from '@/data/places'
import { cn } from '@/lib/cn'
import { getForcedState } from '@/lib/forced'
import { peso } from '@/lib/format'
import { useOnline } from '@/lib/useOnline'
import { useOpen } from '@/lib/useOpen'

export function JimbotScreen() {
  return <JimbotChat />
}

const initialMessages = (): Msg[] => {
  const st = getForcedState()
  if (st === 'empty') return [greeting]
  if (st === 'loading') return sampleConversation.slice(0, 2)
  return sampleConversation
}

export function JimbotChat({ embedded }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [thinking, setThinking] = useState(getForcedState() === 'loading')
  const [input, setInput] = useState('')
  const [budgetOpen, setBudgetOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const online = useOnline()

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const scroller = embedded ? el.closest('.overflow-y-auto') : document.scrollingElement
    requestAnimationFrame(() => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }))
  }, [messages, thinking, embedded])

  const send = (text: string) => {
    const clean = text.trim()
    if (!clean || thinking) return
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: clean }])
    setInput('')
    setThinking(true)
    const r = replyTo(clean)
    setTimeout(() => {
      setThinking(false)
      setMessages((m) => [...m, { ...r, id: `b${Date.now()}` }])
      if (r.card?.type === 'budget') setTimeout(() => setBudgetOpen(true), 350)
    }, 1500)
  }

  return (
    <main className={cn('flex min-h-dvh flex-col', embedded ? 'min-h-full' : 'pb-[88px] md:pb-0')}>
      <header className={cn('sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-xl', embedded && 'pr-14')}>
        <div className={cn('mx-auto flex items-center gap-3 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]', !embedded && 'max-w-[760px] md:px-6 md:pt-6')}>
          <Jimbot crop="head" size={48} expression={thinking ? 'thinking' : 'waving'} animate={false} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-h2">
              Jimbot <PhaseTag phase="MVP" />
            </h1>
            <p className="text-caption text-fg-2">{thinking ? 'Nag-iisip…' : online ? 'AI travel buddy mo · Tagalog' : 'Offline'}</p>
          </div>
          <Button size="sm" variant="secondary" icon={<PiggyBank size={16} />} onClick={() => setBudgetOpen(true)}>
            Budget
          </Button>
        </div>
      </header>

      {!online ? (
        <OfflineState body="Kailangan ni Jimbot ng internet para gumawa ng bagong plano. Bukas pa rin ang mga naka-save mong itinerary." />
      ) : (
        <div ref={listRef} className={cn('mx-auto w-full flex-1 space-y-4 px-4 pb-4 pt-4', !embedded && 'max-w-[760px] md:px-6')} aria-live="polite">
          <p className="text-center text-caption text-fg-2">Ngayon · Tagalog lang sa bersyong ito</p>
          {messages.map((m) => (m.role === 'user' ? <UserBubble key={m.id} text={m.text} /> : <BotReply key={m.id} msg={m} onBudget={() => setBudgetOpen(true)} onSend={send} />))}
          <AnimatePresence>{thinking && <Thinking />}</AnimatePresence>
        </div>
      )}

      <div className={cn('sticky z-20', embedded ? 'bottom-0' : 'bottom-[88px] md:bottom-0')}>
        <div className={cn('mx-auto w-full', !embedded && 'max-w-[760px] md:px-2')}>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
            {quickChips.map((c) => (
              <motion.button
                key={c.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => send(c.send)}
                disabled={!online}
                className="glass h-9 shrink-0 rounded-full px-3.5 font-display text-[13px] font-medium text-fg shadow-sm disabled:opacity-50"
              >
                {c.label}
              </motion.button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 px-4 pb-3"
          >
            <label className="glass flex h-12 flex-1 items-center rounded-full pl-4 pr-1.5 shadow-float">
              <span className="sr-only">Mensahe kay Jimbot</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Itanong kay Jimbot…"
                disabled={!online}
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-fg-2"
              />
              <button
                type="submit"
                aria-label="Ipadala"
                disabled={!input.trim() || thinking}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-deep text-white transition-opacity disabled:opacity-40"
              >
                <ArrowUp size={20} strokeWidth={2.4} />
              </button>
            </label>
          </form>
        </div>
      </div>
      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </main>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-end">
      <p className="max-w-[80%] rounded-[22px] rounded-br-md bg-deep px-4 py-2.5 text-[16px] leading-6 text-white">{text}</p>
    </motion.div>
  )
}

function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
      <Jimbot expression="thinking" variant="standalone" size={84} />
      <div className="card mb-3 flex items-center gap-1.5 rounded-[22px] rounded-bl-md px-4 py-3">
        <span className="text-[15px] text-fg-2">Gumagawa ng plano</span>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </motion.div>
  )
}

function BotReply({ msg, onBudget, onSend }: { msg: Extract<Msg, { role: 'bot' }>; onBudget: () => void; onSend: (t: string) => void }) {
  const big = msg.expression === 'unsure'
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
      {big ? (
        <Jimbot expression="unsure" variant="standalone" size={64} className="-ml-1 shrink-0" />
      ) : (
        <Jimbot crop="head" expression={msg.expression} size={36} animate={false} className="mt-1" />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn('card rounded-[22px] rounded-tl-md px-4 py-3', big && 'border-2 border-dashed border-caution/50')}>
          {big && <p className="mb-1 font-display text-[15px] font-semibold text-caution">Hindi ako sigurado</p>}
          <p className="text-[16px] leading-6">{msg.text}</p>
        </div>
        {msg.card && <ReplyCard card={msg.card} onBudget={onBudget} onSend={onSend} />}
      </div>
    </motion.div>
  )
}

function ReplyCard({ card, onBudget, onSend }: { card: Card; onBudget: () => void; onSend: (t: string) => void }) {
  const { saveItinerary, savedItineraries, showToast } = useStore()
  const { requireAccount } = useAccount()
  const open = useOpen()
  const navigate = useNavigate()

  if (card.type === 'itinerary') {
    const it = itineraryById(card.id)!
    const stops = it.stops.filter((s) => s.kind !== 'Transport')
    const transport = it.stops.find((s) => s.kind === 'Transport')
    const saved = savedItineraries.includes(it.id)
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-ink">
          <div>
            <p className="font-display text-[12px] font-semibold opacity-80">ITINERARY · {it.area.toUpperCase()}</p>
            <p className="font-display text-[18px] font-bold leading-tight text-white">{it.title}</p>
          </div>
          <CalendarCheck size={26} />
        </div>
        <ol className="divide-y divide-line px-4">
          {stops.map((s, i) => {
            const p = s.placeId ? placeById(s.placeId) : undefined
            return (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken font-display text-[14px] font-bold text-link dark:bg-elevated">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-semibold">{s.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-caption text-fg-2">{s.time}</span>
                    {p && <VerifiedPill days={p.verifiedDays} size="sm" short />}
                  </div>
                </div>
                <span className="font-display text-[15px] font-semibold">{peso(s.cost)}</span>
              </li>
            )
          })}
        </ol>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[14px]">
          <span className="text-fg-2">{transport ? `+ ${transport.name} ${peso(transport.cost)}` : 'Kabuuan'}</span>
          <span>
            Tantya <b className="font-display text-[17px]">{peso(stopsTotal(it.stops))}</b>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 pt-1">
          <Button
            variant={saved ? 'secondary' : 'primary'}
            icon={<Save size={17} />}
            onClick={() => {
              if (!requireAccount('Para ma-save ang itinerary na ito.')) return
              saveItinerary(it.id)
              showToast({ text: 'Na-save ang itinerary!', expression: 'celebrating', action: { label: 'Buksan', to: `/itinerary/${it.id}` } })
            }}
          >
            {saved ? 'Naka-save' : 'I-save'}
          </Button>
          <Button variant="secondary" icon={<Pencil size={17} />} onClick={() => open.itinerary(it.id)}>
            Baguhin
          </Button>
        </div>
      </div>
    )
  }
  if (card.type === 'places') {
    return (
      <div className="space-y-2">
        {card.ids.map((id) => (
          <ListingCard key={id} place={placeById(id)!} layout="row" />
        ))}
      </div>
    )
  }
  if (card.type === 'alternative') {
    const p = placeById(card.placeId)!
    return (
      <div className="space-y-2">
        <ListingCard place={p} layout="row" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<MapPin size={15} />} onClick={() => onSend('Gumawa ng itinerary para sa Batangas beach')}>
            Plano para dito
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/search')}>
            Maghanap pa
          </Button>
        </div>
      </div>
    )
  }
  if (card.type === 'budget') {
    return (
      <Button variant="secondary" icon={<PiggyBank size={17} />} onClick={onBudget}>
        Buksan ang Budget maker
      </Button>
    )
  }
  return (
    <div className="overflow-hidden rounded-[20px] bg-surface shadow-card">
      {[
        { i: BookOpen, t: 'Paano gumagana ang Verified?', s: 'Bawat lugar ay sinusuri ng team at may petsa ng huling check.' },
        { i: Flag, t: 'Mag-ulat ng maling impormasyon', s: 'Buksan ang lugar at i-tap ang "Mag-ulat ng mali".' },
        { i: Headphones, t: 'Kausapin ang Bitinary team', s: 'Sumasagot kami sa loob ng 24 oras.' },
      ].map(({ i: I, t, s }, idx) => (
        <button key={t} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left', idx && 'border-t border-line')}>
          <I size={20} className="mt-0.5 shrink-0 text-link" />
          <span>
            <span className="block font-display text-[15px] font-semibold">{t}</span>
            <span className="block text-caption text-fg-2">{s}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
