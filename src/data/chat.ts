import type { Expression } from '@/components/mascot/Jimbot'

export type ChatBusinessResult = {
  kind: 'business'
  id: string
  name: string
  city: string | null
  address: string | null
  type: string | null
  priceRange: string | null
  photo: string | null
  verified: boolean
}

export type ChatItineraryResult = {
  kind: 'itinerary'
  id: string
  title: string
  subtitle: string | null
  area: string | null
  budget: number
}

export type ChatResult = ChatBusinessResult | ChatItineraryResult

export type Msg =
  | { id: string; role: 'user'; text: string }
  | {
      id: string
      role: 'bot'
      expression: Expression
      text: string
      quickReplies?: string[]
      results?: ChatResult[]
      feedback?: 'up' | 'down'
      feedbackError?: string
    }
