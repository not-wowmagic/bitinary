import { type LucideIcon, LogOut, UserCog, BadgeCheck, BarChart3, Database, ExternalLink, History, LayoutDashboard, Lock, Megaphone, Menu, Moon, Palette, Radio, ShieldAlert, Store, Sun, ToggleRight, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { IDLE_MS, currentDev, useConsole, useCurrentDev } from '@/app/console'
import { SetPassword, SignIn } from './Auth'
import { Avatar } from './ui'
import { useTheme } from '@/app/theme'
import { Toast } from '@/components/layout/Toast'
import { Jimbot } from '@/components/mascot/Jimbot'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'
import { SYNC_EVENT } from '@/lib/usePersistentState'

const BASE = '/bitinarydev'

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean }
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Overview', items: [{ to: BASE, label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  {
    group: 'Manage',
    items: [
      { to: `${BASE}/users`, label: 'Users', icon: Users },
      { to: `${BASE}/businesses`, label: 'Businesses', icon: Store },
      { to: `${BASE}/verification`, label: 'Verification', icon: BadgeCheck },
      { to: `${BASE}/moderation`, label: 'Moderation', icon: ShieldAlert },
    ],
  },
  {
    group: 'Grow',
    items: [
      { to: `${BASE}/banners`, label: 'Banners & ads', icon: Megaphone },
      { to: `${BASE}/announcements`, label: 'Announcements', icon: Radio },
    ],
  },
  {
    group: 'Build',
    items: [
      { to: `${BASE}/theme`, label: 'Theme', icon: Palette },
      { to: `${BASE}/flags`, label: 'Feature flags', icon: ToggleRight },
      { to: `${BASE}/data`, label: 'Data tools', icon: Database },
      { to: `${BASE}/log`, label: 'Activity log', icon: History },
      { to: `${BASE}/team`, label: 'Team', icon: UserCog },
    ],
  },
]
const flat = NAV.flatMap((g) => g.items)
const isActive = (pathname: string, to: string, exact?: boolean) => (exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to))

/** Console frame: toast and scroll restoration. Not wrapped by maintenance mode or announcements. */
export function ConsoleRoot() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Bitinary Dev Console'
    return () => {
      document.title = prev
    }
  }, [])
  return (
    <>
      <Outlet />
      <Toast />
      <ScrollRestoration />
    </>
  )
}

/** Developer sign-in (no shared PIN). Sessions end after 30 minutes without activity. */
export function RequireDevAccount() {
  const { c, update } = useConsole()
  const { pathname } = useLocation()
  const [, tick] = useState(0)
  const dev = currentDev(c)
  // Re-check the idle timer every 30 s, and count navigation and clicks as activity.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (dev) update((x) => (x.devSession ? { ...x, devSession: { ...x.devSession, lastActive: Date.now() } } : x))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  useEffect(() => {
    if (!dev) return
    let last = Date.now()
    const on = () => {
      if (Date.now() - last < 60_000) return
      last = Date.now()
      update((x) => (x.devSession ? { ...x, devSession: { ...x.devSession, lastActive: Date.now() } } : x))
    }
    window.addEventListener('pointerdown', on)
    return () => window.removeEventListener('pointerdown', on)
  }, [dev, update])
  if (!dev) {
    const s = c.devSession
    const acc = s && c.devAccounts.find((a) => a.id === s.accountId)
    const notice = !s ? undefined : !acc ? 'Your account was removed. Ask a teammate for a new one.' : !acc.active ? 'Your account was turned off.' : 'You were signed out after 30 minutes without activity.'
    return <SignIn notice={notice} />
  }
  if (dev.mustChange) return <SetPassword account={dev} />
  return <ConsoleLayout />
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to={BASE} className="flex items-center gap-2.5">
      <Jimbot crop="head" shape="squircle" size={compact ? 44 : 40} animate={false} />
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[16px] font-bold">Bitinary Dev</span>
          <span className="block text-[12px] text-[#E8CDB9]">Console</span>
        </span>
      )}
    </Link>
  )
}

function NavList({ onPick, rail }: { onPick?: () => void; rail?: boolean }) {
  const { pathname } = useLocation()
  return (
    <nav aria-label="Console navigation" className={cn('flex flex-col', rail ? 'items-center gap-1' : 'gap-4')}>
      {NAV.map((g) => (
        <div key={g.group} className={cn(rail ? 'contents' : 'space-y-1')}>
          {!rail && <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A893]">{g.group}</p>}
          {g.items.map((n) => {
            const active = isActive(pathname, n.to, n.exact)
            const I = n.icon
            return (
              <Link key={n.to} to={n.to} onClick={onPick} aria-current={active ? 'page' : undefined} title={rail ? n.label : undefined} aria-label={rail ? n.label : undefined} className={cn('relative flex items-center gap-3 rounded-[14px] font-display text-[15px] font-medium', rail ? 'h-12 w-12 justify-center' : 'min-h-11 px-3', active ? 'text-ink' : 'text-cream/85 hover:bg-white/10')}>
                {active && <motion.span layoutId={rail ? 'dev-rail' : 'dev-side'} className="absolute inset-0 rounded-[14px] bg-primary" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                <I size={19} className="relative shrink-0" />
                {!rail && <span className="relative">{n.label}</span>}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function ConsoleLayout() {
  const { update } = useConsole()
  const { resolved, setMode } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [me, setMe] = useState(false)
  const dev = useCurrentDev()!
  const current = [...flat].reverse().find((n) => isActive(pathname, n.to, n.exact))
  const signOut = () => {
    update((x) => x, { area: 'Access', action: 'Signed out' })
    update((x) => ({ ...x, devSession: null }))
    navigate(BASE)
  }
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col overflow-y-auto bg-brown px-3 pb-5 pt-6 text-cream xl:flex dark:border-r dark:border-line dark:bg-surface">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-6 flex-1">
          <NavList />
        </div>
        <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener" className="mt-4 flex min-h-11 items-center gap-2 rounded-[14px] bg-white/10 px-3 font-display text-[14px] font-medium hover:bg-white/15">
          <ExternalLink size={17} /> Open the app
        </a>
      </aside>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[80px] flex-col items-center gap-4 overflow-y-auto bg-brown py-5 text-cream md:flex xl:hidden dark:border-r dark:border-line dark:bg-surface">
        <Brand compact />
        <NavList rail />
      </aside>

      <div className="md:pl-[80px] xl:pl-[248px]">
        <div className="glass sticky top-0 z-30 border-x-0 border-t-0 pt-[env(safe-area-inset-top)]">
          <div className="flex min-h-16 items-center gap-2 px-3 md:px-6">
            <button onClick={() => setMenu(true)} aria-label="Open menu" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sunken md:hidden">
              <Menu size={22} />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="rounded-full bg-danger px-2 py-0.5 font-display text-[11px] font-bold tracking-wider text-white">DEV</span>
              <p className="truncate font-display text-[16px] font-semibold">{current?.label ?? 'Console'}</p>
            </div>
            <SyncDot />
            <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener" className="hidden h-10 items-center gap-1.5 rounded-full px-3 font-display text-[14px] font-medium text-link hover:bg-sunken sm:flex xl:hidden">
              <ExternalLink size={16} /> App
            </a>
            <a href={`${import.meta.env.BASE_URL}dev`} target="_blank" rel="noopener" title="Screen Index" aria-label="Screen Index" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sunken dark:hover:bg-elevated">
              <BarChart3 size={20} />
            </a>
            <button onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')} aria-label={resolved === 'dark' ? 'Light mode' : 'Dark mode'} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sunken dark:hover:bg-elevated">
              {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMe(true)} aria-label={`Account: ${dev.name}`} className="flex h-11 items-center gap-2 rounded-full pl-1 pr-3 hover:bg-sunken dark:hover:bg-elevated">
              <Avatar name={dev.name} size={34} />
              <span className="hidden font-display text-[14px] font-medium sm:inline">{dev.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-4 py-6 pb-24 md:px-8">
          <Outlet />
        </div>
      </div>

      <Sheet open={me} onClose={() => setMe(false)} title="Developer account">
        <div className="flex items-center gap-3">
          <Avatar name={dev.name} size={48} />
          <div className="min-w-0">
            <p className="truncate font-display text-[17px] font-semibold">{dev.name}</p>
            <p className="truncate text-[14px] text-fg-2">{dev.email}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Link to={`${BASE}/team#me`} onClick={() => setMe(false)} className="flex h-12 items-center gap-3 rounded-2xl bg-sunken px-4 font-display text-[15px] font-medium dark:bg-elevated">
            <UserCog size={18} className="text-link" /> My account and team
          </Link>
          <button onClick={() => (setMe(false), signOut())} className="flex h-12 w-full items-center gap-3 rounded-2xl bg-sunken px-4 text-left font-display text-[15px] font-medium text-danger dark:bg-elevated">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </Sheet>
      <Sheet open={menu} onClose={() => setMenu(false)} dark title="Bitinary Dev">
        <div className="text-cream">
          <NavList onPick={() => setMenu(false)} />
        </div>
      </Sheet>
    </div>
  )
}

export const IDLE_MINUTES = IDLE_MS / 60_000

/** Shows that other tabs on this device (traveler app, /biz) sync live; pulses when a change arrives. */
function SyncDot() {
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    const on = () => setPulse((n) => n + 1)
    window.addEventListener(SYNC_EVENT, on)
    return () => window.removeEventListener(SYNC_EVENT, on)
  }, [])
  return (
    <span title="Updates from other tabs on this device appear automatically" className="hidden h-9 items-center gap-2 rounded-full bg-ok-bg px-3 font-display text-[13px] font-medium text-ok sm:flex">
      <span className="relative flex h-2.5 w-2.5">
        {pulse > 0 && <motion.span key={pulse} initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 rounded-full bg-ok" />}
        <span className="relative h-2.5 w-2.5 rounded-full bg-ok" />
      </span>
      Live · synced
    </span>
  )
}
