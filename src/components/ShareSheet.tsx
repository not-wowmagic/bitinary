import { Copy, Globe, Link2, Mail, MessageCircle, MessageSquareText } from 'lucide-react'
import { useStore } from '@/app/store'
import { Sheet } from './ui/Sheet'

export async function shareOrFallback(data: { title: string; text: string; url?: string }, openFallback: () => void) {
  const payload = { ...data, url: data.url ?? location.href }
  if (navigator.share) {
    try {
      await navigator.share(payload)
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  openFallback()
}

const people = [
  { n: 'Ate Joy', c: '#C84A00' },
  { n: 'Migs', c: '#1B8A3A' },
  { n: 'Barkada', c: '#6B3A22' },
  { n: 'Mama', c: '#C2185B' },
  { n: 'Paolo', c: '#0B7F96' },
]

export function ShareSheet({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) {
  const { showToast } = useStore()
  const act = (label: string) => {
    onClose()
    showToast({ text: label, expression: 'celebrating' })
  }
  return (
    <Sheet open={open} onClose={onClose} title={<span className="line-clamp-1">I-share: {title}</span>}>
      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-4">
        {people.map((p) => (
          <button key={p.n} onClick={() => act(`Naipadala kay ${p.n}`)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full font-display text-[18px] font-semibold text-white" style={{ background: p.c }}>
              {p.n[0]}
            </span>
            <span className="truncate text-[12px] text-fg-2">{p.n}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3 border-y border-line py-4">
        {[
          { i: MessageCircle, l: 'Messenger', bg: '#0866FF' },
          { i: Globe, l: 'Facebook', bg: '#1877F2' },
          { i: MessageSquareText, l: 'SMS', bg: '#1B8A3A' },
          { i: Mail, l: 'Email', bg: '#6B3A22' },
        ].map(({ i: I, l, bg }) => (
          <button key={l} onClick={() => act(`Na-share sa ${l}`)} className="flex flex-col items-center gap-1.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white" style={{ background: bg }}>
              <I size={24} />
            </span>
            <span className="text-[12px] text-fg-2">{l}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl bg-sunken dark:bg-elevated">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(location.href).catch(() => {})
            act('Nakopya ang link')
          }}
          className="flex h-12 w-full items-center justify-between px-4 text-body"
        >
          Kopyahin ang link <Copy size={19} className="text-fg-2" />
        </button>
        <div className="mx-4 h-px bg-line" />
        <button onClick={() => act('Naidagdag sa Mga Paborito')} className="flex h-12 w-full items-center justify-between px-4 text-body">
          Idagdag sa Mga Paborito <Link2 size={19} className="text-fg-2" />
        </button>
      </div>
    </Sheet>
  )
}
