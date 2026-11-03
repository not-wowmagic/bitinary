import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { BigBack } from './Kit'

/**
 * Hub shell. Mobile/tablet: a single scrolling column. Desktop (xl): two columns,
 * the theme list on the left and the current theme on the right.
 */
export function HubLayout({ onBack, right, list, pane, footer, headerRight }: { onBack: () => void; right?: ReactNode; list: ReactNode; pane?: ReactNode; footer?: ReactNode; headerRight?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 bg-bg/92 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl xl:static xl:bg-transparent">
        <div className="mx-auto flex h-16 w-full max-w-[860px] items-center justify-between gap-3 px-5 xl:max-w-[1240px] xl:px-8">
          <BigBack onClick={onBack} />
          {headerRight ?? right}
        </div>
      </header>
      <div className={cn('mx-auto w-full max-w-[860px] px-5 pb-10 xl:grid xl:max-w-[1240px] xl:grid-cols-[440px_1fr] xl:gap-8 xl:px-8 xl:pb-8')}>
        <div className="min-w-0">
          {list}
          {footer && <div className="mt-6">{footer}</div>}
        </div>
        {pane && <div className="sticky top-6 hidden h-[calc(100dvh-112px)] min-h-[560px] xl:block">{pane}</div>}
      </div>
    </div>
  )
}
