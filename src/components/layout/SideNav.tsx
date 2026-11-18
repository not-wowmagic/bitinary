import { Download, Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useStore } from '@/app/store'
import { useLang } from '@/app/i18n'
import { useTheme } from '@/app/theme'
import { cn } from '@/lib/cn'
import { useInstallPrompt } from '@/lib/useInstallPrompt'
import { Jimbot } from '../mascot/Jimbot'
import { Sheet } from '../ui/Sheet'
import { tabs } from './nav'

function tabLabel(to: string, t: (tl: string, en: string) => string) {
  const labels: Record<string, [string, string]> = {
    '/': ['Tahanan', 'Home'],
    '/jimbot': ['Jimbot', 'Jimbot'],
    '/search': ['Hanap', 'Search'],
    '/moments': ['Moments', 'Moments'],
    '/account': ['Aking Account', 'Account'],
  }
  const label: [string, string] = labels[to] ?? [to, to]
  return t(...label)
}

/** Tablet: 88px glass navigation rail. */
export function NavRail() {
  const { pathname } = useLocation()
  const { t: translate } = useLang()
  return (
    <nav aria-label={translate('Pangunahing nabigasyon', 'Main navigation')} className="glass fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center gap-2 border-r py-5 md:flex xl:hidden">
      <Link to="/" aria-label={translate('Bitinary home', 'Bitinary home')} className="mb-4">
        <Jimbot crop="full" variant="standalone" size={46} animate={false} />
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
            <span className="relative font-display text-[11px] font-medium">{tabLabel(t.to, translate)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/** Desktop: 248px sidebar. */
export function Sidebar() {
  const { pathname } = useLocation()
  const { t: translate } = useLang()
  const { setPanel, panel } = useStore()
  const { resolved, setMode } = useTheme()
  const install = useInstallPrompt()
  const [installHelp, setInstallHelp] = useState(false)
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-line bg-surface px-4 py-6 xl:flex">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
        <Jimbot crop="full" variant="standalone" size={42} animate={false} />
        <span className="font-display text-[22px] font-bold tracking-tight">
          Bit<span className="text-primary">inary</span>
        </span>
      </Link>
      <nav aria-label={translate('Pangunahing nabigasyon', 'Main navigation')} className="flex flex-col gap-1">
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
              <span className="relative">{tabLabel(t.to, translate)}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => setPanel(panel?.type === 'jimbot' ? null : { type: 'jimbot' })}
        className="mt-6 flex items-center gap-3 rounded-[20px] bg-brown p-3 text-left text-cream dark:bg-elevated"
      >
        <Jimbot crop="full" variant="standalone" size={44} animate={false} />
        <span>
          <span className="block font-display text-[14px] font-semibold">{translate('Tanungin si Jimbot', 'Ask Jimbot')}</span>
          <span className="block text-[12px] text-[#E8CDB9]">{translate('Gawa tayo ng itinerary', "Let's plan an itinerary")}</span>
        </span>
      </button>

      <div className="mt-auto space-y-3">
        {!install.isStandalone && (
          <div className="rounded-[20px] bg-sunken p-3 dark:bg-elevated">
            <p className="font-display text-[13px] font-semibold">{translate('I-install ang Bitinary', 'Install Bitinary')}</p>
            <p className="text-[12px] leading-snug text-fg-2">{translate('Mabilis buksan, gumagana kahit offline.', 'Open quickly, even offline.')}</p>
            <button
              onClick={async () => {
                if (!install.canPrompt || !(await install.install())) {
                  setInstallHelp(true)
                }
              }}
              className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 font-display text-[13px] font-medium text-ink"
            >
              <Download size={15} /> {translate('I-install', 'Install')}
            </button>
          </div>
        )}
        <Sheet
          open={installHelp}
          onClose={() => setInstallHelp(false)}
          title={translate('Idagdag sa Home Screen', 'Install Bitinary')}
        >
          <ol className="space-y-3 text-body">
            {install.isIOS ? (
              <>
                <li>{translate('Sa Safari, i-tap ang Share sa ibaba ng screen.', 'In Safari, tap Share at the bottom of the screen.')}</li>
                <li>{translate('Piliin ang Add to Home Screen.', 'Choose Add to Home Screen.')}</li>
              </>
            ) : (
              <>
                <li>{translate('Buksan ang menu ng browser.', 'Open your browser menu.')}</li>
                <li>{translate('Piliin ang Install app o Add to Home screen.', 'Choose Install app or Add to Home screen.')}</li>
              </>
            )}
          </ol>
          <p className="mt-4 text-caption text-fg-2">
            {translate('Kung walang opsyong i-install, buksan ang Bitinary sa Safari o Chrome.', 'If you do not see an install option, open Bitinary in Safari or Chrome.')}
          </p>
        </Sheet>
        <button
          onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
          className="flex h-11 w-full items-center gap-2 rounded-2xl px-3 font-display text-[14px] text-fg-2 hover:bg-sunken"
        >
          {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {resolved === 'dark' ? translate('Maliwanag na tema', 'Light mode') : translate('Madilim na tema', 'Dark mode')}
        </button>
      </div>
    </aside>
  )
}
