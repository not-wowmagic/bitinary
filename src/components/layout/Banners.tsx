import { Download, Share, SquarePlus, WifiOff, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import appIcon from '@/assets/jimbot/app-icon.png'
import { useStore } from '@/app/store'
import { isForced } from '@/lib/forced'
import { useInstallPrompt } from '@/lib/useInstallPrompt'
import { useOnline } from '@/lib/useOnline'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'

export function InstallBanner() {
  const { installDismissed, setInstallDismissed } = useStore()
  const { canPrompt, isStandalone, isIOS, install } = useInstallPrompt()
  const [howTo, setHowTo] = useState(false)
  const show = isForced('install') || (!installDismissed && !isStandalone)

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="card mx-4 flex items-center gap-3 p-3 md:mx-0"
          >
            <img src={appIcon} alt="" className="h-12 w-12 shrink-0 rounded-[14px]" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold leading-tight">I-install ang Bitinary</p>
              <p className="text-[13px] leading-snug text-fg-2">Mabilis buksan, kahit offline.</p>
            </div>
            <Button
              size="sm"
              icon={<Download size={15} />}
              onClick={async () => {
                if (canPrompt) {
                  if (await install()) setInstallDismissed(true)
                } else setHowTo(true)
              }}
            >
              I-install
            </Button>
            <button aria-label="Isara" onClick={() => setInstallDismissed(true)} className="-mr-1 flex h-11 w-9 items-center justify-center text-muted">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Sheet open={howTo} onClose={() => setHowTo(false)} title="Idagdag sa Home Screen">
        <ol className="space-y-3 text-body">
          {isIOS ? (
            <>
              <li className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sunken"><Share size={20} /></span>
                I-tap ang <b>Share</b> sa ibaba ng Safari.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sunken"><SquarePlus size={20} /></span>
                Piliin ang <b>Add to Home Screen</b>.
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sunken font-display font-bold">⋮</span>
                Buksan ang menu ng browser.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sunken"><Download size={20} /></span>
                Piliin ang <b>Install app</b> o <b>Add to Home screen</b>.
              </li>
            </>
          )}
        </ol>
        <Button block className="mt-5" onClick={() => setHowTo(false)}>
          Sige
        </Button>
      </Sheet>
    </>
  )
}

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div role="status" className="mx-4 flex items-center gap-2.5 rounded-2xl bg-caution-bg px-3.5 py-2.5 text-caution md:mx-0">
      <WifiOff size={18} strokeWidth={2} />
      <p className="text-[14px] font-semibold leading-snug">Offline ka. Naka-save na itinerary at listahan lang ang makikita.</p>
    </div>
  )
}
