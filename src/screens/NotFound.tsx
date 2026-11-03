import { useNavigate } from 'react-router'
import { StateView } from '@/components/states/States'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <main className="flex min-h-[80dvh] items-center justify-center">
      <StateView expression="unsure" title="Naligaw tayo!" body="Wala ang pahinang ito. Balik tayo sa Home." action="Bumalik sa Home" onAction={() => navigate('/')} />
    </main>
  )
}
