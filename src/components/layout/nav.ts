import { FoxIcon, HomeIcon, PolaroidIcon, SearchIcon, UserIcon } from '../icons/TabIcons'

export const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon, match: (p: string) => p === '/' || p.startsWith('/home') || p.startsWith('/shop') || p.startsWith('/itinerary') },
  { to: '/jimbot', label: 'Jimbot', icon: FoxIcon, match: (p: string) => p.startsWith('/jimbot') },
  { to: '/search', label: 'Search', icon: SearchIcon, match: (p: string) => p.startsWith('/search') },
  { to: '/moments', label: 'Moments', icon: PolaroidIcon, match: (p: string) => p.startsWith('/moments') },
  { to: '/account', label: 'Account', icon: UserIcon, match: (p: string) => p.startsWith('/account') },
]

/** Class for screens that fill the area to the right of the rail/sidebar. */
export const FULL_BLEED = 'fixed inset-0 md:left-[88px] xl:left-[248px]'
