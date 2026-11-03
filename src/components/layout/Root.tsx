import { Navigate, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useAccount } from '@/app/account'
import { AuthPrompt } from './AuthPrompt'
import { Toast } from './Toast'

const FLOW = /^\/(splash|language|welcome|onboarding|role|signup|auth|personalize|business|screens|bitinarydev)/

export function Root() {
  const { session, setupDone, resume } = useAccount()
  const { pathname, search } = useLocation()
  const embedded = new URLSearchParams(search).has('embed')
  const inFlow = FLOW.test(pathname)
  const isAuthRoute = /^\/(auth|signup)/.test(pathname)
  if (!embedded && !inFlow) {
    if (!session) return <Navigate to="/splash" replace />
    if (session.kind === 'user' && !setupDone) return <Navigate to={resume?.path ?? '/signup/name'} replace />
  }
  if (!embedded && session?.kind === 'user' && setupDone && isAuthRoute) {
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
