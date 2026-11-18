import { Navigate, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useAccount } from '@/app/account'
import { useLang } from '@/app/i18n'
import { Skeleton } from '@/components/ui/Skeleton'
import { AuthPrompt } from './AuthPrompt'
import { Toast } from './Toast'

const FLOW = /^\/(splash|language|welcome|onboarding|role|signup|auth|personalize|business|screens|bitinarydev)/

export function Root() {
  const { session, setupDone, resume, prefs, prefsLoading } = useAccount()
  const { t } = useLang()
  const { pathname, search } = useLocation()
  const embedded = new URLSearchParams(search).has('embed')
  const inFlow = FLOW.test(pathname)
  const isAuthRoute = /^\/(auth|signup)/.test(pathname)
  const isLoginRoute = pathname.startsWith('/auth') && new URLSearchParams(search).get('mode') === 'login'
  const isPasswordRecoveryRoute = pathname === '/auth/recovery'
  if (!embedded && session?.kind === 'user' && session.role === 'traveler' && prefsLoading && (!inFlow || pathname.startsWith('/personalize'))) {
    return (
      <main className="min-h-dvh bg-background px-5 py-10 text-fg" aria-busy="true" aria-label={t('Nilo-load ang mga naka-save mong preference', 'Loading your saved preferences')}>
        <div className="mx-auto w-full max-w-[760px] space-y-5" role="status" aria-label={t('Nilo-load ang mga naka-save mong preference', 'Loading your saved preferences')}>
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-32 w-full rounded-[24px]" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28 w-full rounded-[20px]" />
            <Skeleton className="h-28 w-full rounded-[20px]" />
            <Skeleton className="h-28 w-full rounded-[20px]" />
            <Skeleton className="h-28 w-full rounded-[20px]" />
          </div>
        </div>
      </main>
    )
  }
  if (!embedded && !inFlow) {
    if (!session) return <Navigate to="/splash" replace />
    if (session.kind === 'user' && !setupDone) return <Navigate to={resume?.path ?? '/signup/name'} replace />
    if (session.kind === 'user' && session.role === 'traveler' && Object.keys(prefs.status).length === 0) {
      return <Navigate to="/personalize" replace />
    }
  }
  if (!embedded && session?.kind === 'user' && setupDone && isAuthRoute && !isLoginRoute && !isPasswordRecoveryRoute) {
    return <Navigate to={session.role === 'business' ? '/biz' : '/'} replace />
  }
  return (
    <>
      <Outlet />
      <Toast />
      <AuthPrompt />
      <ScrollRestoration />
    </>
  )
}
