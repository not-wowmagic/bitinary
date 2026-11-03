import type { Expression } from '@/components/mascot/Jimbot'

export type Card =
  | { type: 'itinerary'; id: string }
  | { type: 'places'; ids: string[] }
  | { type: 'help' }
  | { type: 'alternative'; placeId: string }
  | { type: 'budget' }

export type Msg =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'bot'; expression: Expression; text: string; card?: Card }

export const quickChips = [
  { label: 'Gumawa ng itinerary', send: 'May ₱1,500 ako para sa isang araw sa Intramuros. Gusto ko ng pagkain at kasaysayan.' },
  { label: 'Kainan malapit sa akin sa budget ko', send: 'Kainan malapit sa akin, ₱200 lang ang budget ko.' },
  { label: 'Budget maker', send: 'Budget maker' },
  { label: 'Humingi ng suhestiyon', send: 'May maire-recommend ka bang resort sa Siargao?' },
  { label: 'Tulong / Support', send: 'Tulong' },
]

export const greeting: Msg = {
  id: 'g',
  role: 'bot',
  expression: 'waving',
  text: 'Kumusta! Ako si Jimbot. Sabihin mo ang budget at gusto mong gawin, at gagawa ako ng plano gamit lang ang mga verified na lugar.',
}

export const sampleConversation: Msg[] = [
  greeting,
  { id: 'u1', role: 'user', text: quickChips[0].send },
  {
    id: 'b1',
    role: 'bot',
    expression: 'idea',
    text: 'Ayos! Heto ang 1-araw na plano sa Intramuros. Tantyang ₱1,235 lahat, kaya may ₱265 ka pa para sa pasalubong.',
    card: { type: 'itinerary', id: 'it1' },
  },
]

const KNOWN = /intramuros|binondo|ermita|maynila|manila|batangas|kape|kapihan|lechon|kalesa|isaw|halo/i

/** Rule-based replies over verified sample data. Never invents places. */
export function replyTo(text: string): Omit<Extract<Msg, { role: 'bot' }>, 'id'> {
  const t = text.toLowerCase()
  if (/^budget maker$/.test(t) || /budget maker/.test(t)) {
    return { role: 'bot', expression: 'idea', text: 'Binuksan ko ang Budget maker. Ihambing natin ang plano mo at ang tantyang gastos.', card: { type: 'budget' } }
  }
  if (/tulong|support|help/.test(t)) {
    return { role: 'bot', expression: 'pointing', text: 'Nandito ako para tumulong! Piliin kung ano ang kailangan mo:', card: { type: 'help' } }
  }
  if (/itinerary|araw|biyahe|plano|gala/.test(t) && !/siargao|boracay|palawan|cebu|baguio/.test(t)) {
    if (/kape|₱?800|kalahati/.test(t)) {
      return { role: 'bot', expression: 'idea', text: 'Heto ang kalahating araw ng kape at kultura, swak sa ₱800.', card: { type: 'itinerary', id: 'it2' } }
    }
    if (/street|isaw|₱?500/.test(t)) {
      return { role: 'bot', expression: 'idea', text: 'Street food crawl tayo! Kasya sa ₱500.', card: { type: 'itinerary', id: 'it3' } }
    }
    return { role: 'bot', expression: 'idea', text: 'Ayos! Heto ang 1-araw na plano sa Intramuros. Tantyang ₱1,235 lahat, kaya may ₱265 ka pa para sa pasalubong.', card: { type: 'itinerary', id: 'it1' } }
  }
  if (/kain|gutom|ulam|budget|mura|₱/.test(t)) {
    return { role: 'bot', expression: 'pointing', text: 'Heto ang mga verified na kainan na malapit at pasok sa ₱200 kada tao:', card: { type: 'places', ids: ['p8', 'p4', 'p2'] } }
  }
  if (KNOWN.test(t)) {
    return { role: 'bot', expression: 'idea', text: 'May alam ako diyan! Heto ang mga verified na malapit:', card: { type: 'places', ids: ['p1', 'p2', 'p3'] } }
  }
  const place = text.match(/sa ([A-Z][a-zA-Z]+)/)?.[1] ?? text.match(/\b([A-Z][a-z]{3,})\b/)?.[1]
  return {
    role: 'bot',
    expression: 'unsure',
    text: `Hindi ako sigurado. Wala pa akong verified na impormasyon${place ? ` tungkol sa ${place}` : ' tungkol diyan'}, at ayokong manghula. Pero may verified na beach resort na malapit sa Maynila:`,
    card: { type: 'alternative', placeId: 'p11' },
  }
}
