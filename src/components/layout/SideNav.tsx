import { Download, Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useLocation } from 'react-router'
import { useStore } from '@/app/store'
import { useTheme } from '@/app/theme'
import { cn } from '@/lib/cn'
import { useInstallPrompt } from '@/lib/useInstallPrompt'
import { Jimbot } from '../mascot/Jimbot'
import { tabs } from './nav'

/** Tablet: 88px glass navigation rail. */
export function NavRail() {
  const { pathname } = useLocation()
  return (
    <nav aria-label="Pangunahing navigation" className="glass fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center gap-2 border-r py-5 md:flex xl:hidden">
      <Link to="/" aria-label="Bitinary home" className="mb-4">
        <Jimbot crop="head" size={46} animate={false} shape="squircle" />
      </Link>
      {tabs.map((t) => {
        const active = t.match(pathname)
        const Icon = t.icon
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={active ? 'page' : undefined}
            className={cn('relative flex h-[60px] w-[68px] flex-col items-center justify-center gap-1 rounded-[22px]', active ? 'text-ink' : 'text-muted dark:text-[#C9A893]')}
          >
            {active && <motion.span layoutId="rail-capsule" className="absolute inset-0 rounded-[22px] bg-primary" />}
            <Icon active={active} className="relative" />
            <span className="relative font-display text-[11px] font-medium">{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/** Desktop: 248px sidebar. */
export function Sidebar() {
  const { pathname } = useLocation()
  const { setPanel, panel } = useStore()
  const { resolved, setMode } = useTheme()
  const install = useInstallPrompt()
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-line bg-surface px-4 py-6 xl:flex">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
        <Jimbot crop="head" size={42} animate={false} shape="squircle" />
        <span className="font-display text-[22px] font-bold tracking-tight">
          Bit<span className="text-primary">inary</span>
        </span>
      </Link>
      <nav aria-label="Pangunahing navigation" className="flex flex-col gap-1">
        {tabs.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-12 items-center gap-3 rounded-2xl px-3 font-display text-[15px] font-medium',
                active ? 'text-ink' : 'text-fg-2 hover:bg-sunken',
              )}
            >
              {active && <motion.span layoutId="side-capsule" className="absolute inset-0 rounded-2xl bg-primary" />}
              <Icon active={active} className="relative" />
              <span className="relative">{t.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => setPanel(panel?.type === 'jimbot' ? null : { type: 'jimbot' })}
        className="mt-6 flex items-center gap-3 rounded-[20px] bg-brown p-3 text-left text-cream dark:bg-elevated"
      >
        <Jimbot crop="head" size={44} animate={false} />
        <span>
          <span className="block font-display text-[14px] font-semibold">Tanungin si Jimbot</span>
          <span className="block text-[12px] text-[#E8CDB9]">Gawa tayo ng itinerary</span>
        </span>
      </button>

      <div className="mt-auto space-y-3">
        {!install.isStandalone && (
          <div className="rounded-[20px] bg-sunken p-3 dark:bg-elevated">
            <p className="font-display text-[13px] font-semibold">I-install ang Bitinary</p>
            <p className="text-[12px] leading-snug text-fg-2">Mabilis buksan, gumagana kahit offline.</p>
            <button
              onClick={() => install.install()}
              className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 font-display text-[13px] font-medium text-ink"
            >
              <Download size={15} /> I-install
            </button>
          </div>
        )}
        <button
          onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
          className="flex h-11 w-full items-center gap-2 rounded-2xl px-3 font-display text-[14px] text-fg-2 hover:bg-sunken"
        >
          {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {resolved === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
