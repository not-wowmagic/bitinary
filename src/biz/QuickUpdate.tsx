import { Ban, CircleCheck, Clock3, PackageX, Save } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useBiz } from './store'

function BigToggle({ on, onClick, icon, label, tone }: { on: boolean; onClick: () => void; icon: ReactNode; label: string; tone: 'ok' | 'danger' | 'caution' }) {
  const onCls = { ok: 'border-ok bg-ok-bg text-ok', danger: 'border-danger bg-danger-bg text-danger', caution: 'border-caution bg-caution-bg text-caution' }[tone]
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn('flex min-h-[76px] flex-col items-start justify-between gap-1 rounded-[18px] border-2 p-3 text-left transition-colors', on ? onCls : 'border-line bg-bg text-fg-2 dark:bg-elevated')}
    >
      <span className="flex w-full items-center justify-between">
        {icon}
        <span className={cn('h-5 w-5 rounded-full border-2', on ? 'border-current bg-current' : 'border-line')} aria-hidden />
      </span>
      <span className="font-display text-[15px] font-semibold leading-tight">{label}</span>
    </motion.button>
  )
}

/** One-tap status toggles, today's special and quick price edits. Shared by the Overview card and the top-bar sheet. */
export function QuickUpdatePanel({ compact, onDone }: { compact?: boolean; onDone?: () => void }) {
  const { d, set, t, showToast } = useBiz()
  const q = d.quick
  const [special, setSpecial] = useState(q.special)
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries(d.business.menu.map((m) => [m.id, m.price])))
  const changedPrices = d.business.menu.some((m) => (prices[m.id] ?? m.price) !== m.price)

  const toast = () => showToast({ text: t('Na-update!', 'Updated!'), expression: 'celebrating' })
  const patch = (p: Partial<typeof q>) => {
    set((x) => ({ ...x, quick: { ...x.quick, ...p, at: new Date().toISOString() } }))
    toast()
  }
  const saveRest = () => {
    set((x) => ({ ...x, quick: { ...x.quick, special, at: new Date().toISOString() }, business: { ...x.business, menu: x.business.menu.map((m) => ({ ...m, price: prices[m.id] ?? m.price })) } }))
    toast()
    onDone?.()
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        <BigToggle on={q.state === 'open'} onClick={() => patch({ state: 'open' })} icon={<CircleCheck size={22} />} label={t('Bukas ngayon', 'Open today')} tone="ok" />
        <BigToggle on={q.state === 'closed'} onClick={() => patch({ state: 'closed' })} icon={<Ban size={22} />} label={t('Sarado', 'Closed')} tone="danger" />
        <BigToggle on={q.soldOut} onClick={() => patch({ soldOut: !q.soldOut })} icon={<PackageX size={22} />} label={t('Ubos na', 'Sold out')} tone="caution" />
        <BigToggle on={q.longQueue} onClick={() => patch({ longQueue: !q.longQueue })} icon={<Clock3 size={22} />} label={t('Mahaba ang pila', 'Long queue')} tone="caution" />
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block font-display text-[14px] font-medium">{t('Espesyal ngayong araw', "Today's special")}</span>
        <input value={special} onChange={(e) => setSpecial(e.target.value)} placeholder={t('hal. Sinigang na hipon', 'e.g. Shrimp sinigang')} className="h-12 w-full rounded-[14px] border border-line bg-bg px-4 text-[16px] outline-none focus:border-primary dark:bg-elevated" />
      </label>
      <div className="mt-4">
        <p className="mb-1.5 font-display text-[14px] font-medium">{t('Mabilis na pag-edit ng presyo', 'Quick price edit')}</p>
        <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line">
          {d.business.menu.slice(0, compact ? 4 : 6).map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[16px]">{m.name}</span>
              <span className="font-display text-fg-2">₱</span>
              <input
                inputMode="decimal"
                aria-label={t(`Presyo ng ${m.name}`, `Price of ${m.name}`)}
                value={prices[m.id] ?? m.price}
                onChange={(e) => setPrices((p) => ({ ...p, [m.id]: e.target.value.replace(/[^\d.]/g, '') }))}
                className="h-10 w-20 rounded-[10px] border border-line bg-bg px-2 text-right font-display text-[16px] font-semibold outline-none focus:border-primary dark:bg-elevated"
              />
            </li>
          ))}
          {d.business.menu.length === 0 && <li className="px-3 py-3 text-[15px] text-fg-2">{t('Wala pang menu. Idagdag sa Impormasyon ng Negosyo.', 'No menu yet. Add it in Backgrounds.')}</li>}
        </ul>
      </div>
      <Button block size="lg" className="mt-4" icon={<Save size={18} />} disabled={special === q.special && !changedPrices} onClick={saveRest}>
        {t('I-save ang update', 'Save update')}
      </Button>
    </div>
  )
}
