import { useNavigate } from 'react-router'
import { useStore } from '@/app/store'
import { useBreakpoint } from './useMedia'

/** On desktop, listings and itineraries open in the right detail panel; elsewhere they navigate. */
export function useOpen() {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const { setPanel } = useStore()
  return {
    place: (id: string) => (bp === 'desktop' ? setPanel({ type: 'shop', id }) : navigate(`/shop/${id}`)),
    itinerary: (id: string) => (bp === 'desktop' ? setPanel({ type: 'itinerary', id }) : navigate(`/itinerary/${id}`)),
    jimbot: () => (bp === 'desktop' ? setPanel({ type: 'jimbot' }) : navigate('/jimbot')),
  }
}
