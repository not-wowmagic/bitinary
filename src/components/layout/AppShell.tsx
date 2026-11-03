import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import { useStore } from '@/app/store'
import { cn } from '@/lib/cn'
import { useBreakpoint } from '@/lib/useMedia'
import { ItineraryView } from '@/screens/Itinerary'
import { JimbotChat } from '@/screens/Jimbot'
import { ShopDetail } from '@/screens/ShopDetail'
import { GlassTabBar } from './GlassTabBar'
import { NavRail, Sidebar } from './SideNav'

export function AppShell() {
  const { pathname } = useLocation()
  const { panel } = useStore()
  const bp = useBreakpoint()
  const panelOpen = bp === 'desktop' && !!panel
  const hideTabs = pathname.startsWith('/moments/create')
  return (
    <>
      <div className={cn('min-h-dvh md:pl-[88px] xl:pl-[248px]', panelOpen && 'xl:pr-[400px]')}>
        <Outlet />
      </div>
      {!hideTabs && <GlassTabBar tone={pathname === '/moments' ? 'dark' : 'default'} />}
      <NavRail />
      <Sidebar />
      <DetailPanel />
    </>
  )
}

function DetailPanel() {
  const { panel, setPanel } = useStore()
  const bp = useBreakpoint()
  if (bp !== 'desktop') return null
  return (
    <AnimatePresence>
      {panel && (
        <motion.aside
          key={panel.type + ('id' in panel ? panel.id : '')}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          className="fixed inset-y-0 right-0 z-40 flex w-[400px] flex-col border-l border-line bg-bg"
          aria-label={panel.type === 'jimbot' ? 'Jimbot' : 'Detalye'}
        >
          <button
            onClick={() => setPanel(null)}
            aria-label="Isara ang panel"
            className="glass absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full shadow-float"
          >
            <X size={20} />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel.type === 'shop' && <ShopDetail id={panel.id} embedded />}
            {panel.type === 'itinerary' && <ItineraryView id={panel.id} embedded />}
            {panel.type === 'jimbot' && <JimbotChat embedded />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
