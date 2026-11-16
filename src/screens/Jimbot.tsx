import { ArrowUp, ChevronLeft, Clock3, MapPin, MessageSquareText, PiggyBank, Plus, ThumbsDown, ThumbsUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { BudgetSheet } from '@/components/BudgetSheet'
import { Jimbot } from '@/components/mascot/Jimbot'
import { OfflineState } from '@/components/states/States'
import { Button } from '@/components/ui/Button'
import { PhaseTag } from '@/components/ui/PhaseTag'
import type { ChatBusinessResult, ChatItineraryResult, ChatResult, Msg } from '@/data/chat'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { useOnline } from '@/lib/useOnline'

// jimbot-intent.ts
// Intent detection, entity extraction, gibberish detection, and fallback replies for Jimbot.
// No dependencies. Works in React / React Native / Node.

/* ============================== TYPES ============================== */

export type Intent =
  | 'greeting'
  | 'smalltalk'
  | 'thanks'
  | 'goodbye'
  | 'help'
  | 'itinerary'
  | 'database_search'
  | 'budget'
  | 'transport'
  | 'packing'
  | 'safety'
  | 'weather'
  | 'fallback_gibberish'
  | 'fallback_unclear'

export interface Entities {
  days?: number
  budget?: number
  people?: number
  location?: string
  vibe?: 'tipid' | 'romantic' | 'pamilya'
  category?: 'kainan' | 'cafe' | 'resort' | 'pasyalan' | 'negosyo'
}

export interface IntentResult {
  intent: Intent
  confidence: number // 0..1
  entities: Entities
  normalized: string
}

export interface ReplyData {
  text: string
  quickReplies?: string[]
  action?: 'ASK_ITINERARY_DETAILS' | 'SEARCH_DB' | 'OPEN_BUDGET' | 'HANDOFF'
}

export interface ChatContext {
  /** consecutive messages Jimbot could not understand */
  fallbackCount: number
  slots: Entities
}

/* ============================ NORMALIZING ========================== */

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (á -> a)
    .replace(/(\d),(?=\d)/g, '$1') // preserve grouped amounts (₱5,000 -> ₱5000)
    .replace(/[^\p{L}\p{N}\s₱$]/gu, ' ') // drop punctuation/emoji
    .replace(/(\p{L})\1{2,}/gu, '$1$1') // "kumustaaaa" -> "kumustaa"
    .replace(/\s+/g, ' ')
    .trim()
}

/* ============================ KEYWORD MAP ========================== */
// weight: 2 = strong signal, 1 = weak signal. Phrases (with spaces) match via includes.

type Keyword = [word: string, weight: number]

const KEYWORDS: Record<Exclude<Intent, 'fallback_gibberish' | 'fallback_unclear'>, Keyword[]> = {
  greeting: [
    ['hi', 2], ['hello', 2], ['hey', 2], ['kumusta', 2], ['kamusta', 2], ['musta', 2],
    ['good morning', 2], ['good afternoon', 2], ['good evening', 2],
    ['magandang umaga', 2], ['magandang hapon', 2], ['magandang gabi', 2],
    ['maayong buntag', 2], ['maayong hapon', 2], ['maayong gabii', 2], ['uy', 1], ['hoy', 1],
  ],
  smalltalk: [
    ['maayo', 2], ['ok', 1], ['okay', 1], ['sige', 1], ['oo', 1], ['opo', 1],
    ['mabuti', 2], ['ayos', 2], ['sana all', 1], ['wala', 1], ['haha', 1], ['hehe', 1],
  ],
  thanks: [['salamat', 2], ['thanks', 2], ['thank you', 2], ['maraming salamat', 2], ['daghang salamat', 2], ['salamat kaayo', 2]],
  goodbye: [['bye', 2], ['paalam', 2], ['goodbye', 2], ['sige na', 1], ['see you', 2], ['ingat', 1], ['amping', 2]],
  help: [['help', 2], ['tulong', 2], ['paano', 1], ['makakatulong', 2], ['ano kaya mo', 2], ['anong magagawa mo', 2], ['ano ang magagawa mo', 2]],
  transport: [['commute', 2], ['transport', 2], ['pamasahe', 2], ['pasahe', 2], ['jeep', 2], ['bus', 2], ['tren', 2], ['train', 2], ['paano pumunta', 2], ['unsaon pag adto', 2], ['how to get', 2]],
  packing: [['packing', 2], ['dala', 2], ['dalhin', 2], ['dadalhin', 2], ['dad on', 2], ['i-pack', 2], ['pack', 2], ['maleta', 2], ['bag', 2]],
  safety: [['safe', 2], ['ligtas', 2], ['luwas', 2], ['safety', 2], ['delikado', 2], ['emergency', 2]],
  weather: [['weather', 2], ['panahon', 2], ['ulan', 2], ['uulan', 2], ['umuulan', 2], ['rain', 2], ['raining', 2], ['forecast', 2], ['temperature', 2], ['init', 2]],
  itinerary: [
    ['itinerary', 2], ['itineraryo', 2], ['plano', 2], ['planuhin', 2], ['biyahe', 2],
    ['byahe', 2], ['trip', 2], ['tour', 1], ['gala', 2], ['laag', 2], ['maglaag', 2], ['lakaw', 2], ['vacation', 2], ['bakasyon', 2],
    ['schedule', 1], ['iskedyul', 1], ['weekend', 1], ['overnight', 1], ['staycation', 2],
  ],
  database_search: [
    ['kainan', 2], ['kan anan', 2], ['restaurant', 2], ['restawran', 2], ['carinderia', 2], ['negosyo', 2],
    ['business', 2], ['lugar', 2], ['pasyalan', 2], ['resort', 2], ['cafe', 2], ['coffee shop', 2],
    ['kapihan', 2], ['recommend', 2], ['suhestiyon', 2], ['suggest', 2], ['saan', 1],
    ['near', 1], ['malapit', 1], ['hotel', 2], ['tindahan', 1], ['pagkain', 1], ['kain', 1],
    ['masarap', 1], ['beach', 1], ['dagat', 1], ['bundok', 1], ['falls', 1], ['simbahan', 1],
    ['parking', 1], ['romantic', 1], ['pamilya', 1], ['family', 1], ['cheap', 1], ['budget friendly', 1],
  ],
  budget: [
    ['budget', 2], ['badyet', 2], ['magkano', 2], ['presyo', 2], ['gastos', 2],
    ['mura', 1], ['tipid', 2], ['barato', 2], ['cost', 1], ['price', 1], ['pamasahe', 1], ['pasahe', 1], ['pera', 1],
  ],
}

// Extra words so we don't mistake normal Tagalog/English filler for gibberish.
const COMMON_WORDS = new Set(
  ('ako ikaw ka mo ko ang ng sa na at o ay ito iyan iyon yung mga si sina kami tayo kayo sila ' +
    'gusto ayaw nais pwede puwede pwedeng paki po ba naman lang din rin pa nga daw raw ' +
    'ano sino saan kailan bakit paano gaano ilan ilang para kay kung pero kasi dahil ' +
    'the a an i you we is are to for of in on and or can could please want need with ' +
    'araw gabi umaga hapon linggo buwan taon bukas ngayon kahapon day days night nights people persons tao kami unsa adto dili ta ' +
    'cebu manila baguio palawan boracay davao bohol iloilo siargao batangas tagaytay').split(' ')
)
const KNOWN_LOCATIONS = ['baguio', 'manila', 'cebu', 'cebu city', 'palawan', 'boracay', 'davao', 'bohol', 'iloilo', 'siargao', 'batangas', 'tagaytay', 'intramuros', 'binondo', 'makati', 'quezon city']

const ALL_KNOWN = new Set<string>(COMMON_WORDS)
for (const list of Object.values(KEYWORDS)) {
  for (const [w] of list) w.split(' ').forEach((p) => ALL_KNOWN.add(p))
}

/* ============================ FUZZY MATCH ========================== */

function levenshtein(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length][b.length]
}

/** allowed typos depends on word length: short words must match exactly */
function maxTypos(len: number): number {
  if (len <= 4) return 0
  if (len <= 7) return 1
  return 2
}

function tokenMatchesWord(token: string, word: string): boolean {
  if (token === word) return true
  const allowed = maxTypos(word.length)
  return allowed > 0 && levenshtein(token, word, allowed) <= allowed
}

function isKnownToken(token: string): boolean {
  if (ALL_KNOWN.has(token)) return true
  if (/^\d+$/.test(token)) return true
  for (const known of ALL_KNOWN) {
    if (known.length >= 5 && tokenMatchesWord(token, known)) return true
  }
  return false
}

/* ========================== GIBBERISH CHECK ======================== */

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qazwsxedc']
const VOWELS = new Set('aeiou')

function isKeyboardMash(token: string): boolean {
  if (token.length < 4) return false
  for (const row of KEYBOARD_ROWS) {
    const rev = [...row].reverse().join('')
    for (let i = 0; i <= token.length - 4; i++) {
      const chunk = token.slice(i, i + 4)
      if (row.includes(chunk) || rev.includes(chunk)) return true
    }
  }
  return false
}

export function isGibberishToken(token: string): boolean {
  if (/^\d+$/.test(token) || isKnownToken(token)) return false
  const letters = [...token].filter((c) => /\p{L}/u.test(c))
  if (letters.length < 4) return false

  const vowelCount = letters.filter((c) => VOWELS.has(c)).length
  const vowelRatio = vowelCount / letters.length
  const longConsonantRun = /[bcdfghjklmnpqrstvwxyz]{5,}/.test(token)
  const unique = new Set(letters).size / letters.length

  if (longConsonantRun) return true // "sfsfds"
  if (vowelRatio < 0.2 || vowelRatio > 0.8) return true
  if (isKeyboardMash(token)) return true // "asdf", "qwer"
  if (letters.length >= 8 && unique < 0.4) return true // "ababababab"
  // long, unknown, and weird-looking: random letters like "adasfsfdsgedsgesdfd"
  if (letters.length >= 12 && !isKnownToken(token) && vowelRatio < 0.3) return true
  return false
}

export function isGibberish(normalized: string): boolean {
  if (!normalized) return true
  if (!/\p{L}/u.test(normalized)) return !/\d/.test(normalized) // only symbols/emoji
  const tokens = normalized.split(' ')
  const gibberish = tokens.filter(isGibberishToken).length
  const known = tokens.filter(isKnownToken).length
  if (known === 0 && gibberish / tokens.length >= 0.5) return true
  return gibberish / tokens.length >= 0.7
}

/* ========================== ENTITY EXTRACTION ====================== */

export function extractEntities(normalized: string): Entities {
  const entities: Entities = {}

  const days = normalized.match(/(\d{1,2})\s*(araw|days?|day|gabi|nights?)/)
  if (days) entities.days = Math.min(parseInt(days[1], 10), 30)
  else if (/weekend/.test(normalized)) entities.days = 2

  const budget = normalized.match(/(?:₱|php|\$|budget(?: ko)?(?: ay)?\s*)\s*(\d{3,7})\s*(?:pesos|php|piso)?|(\d{3,7})\s*(?:pesos|php|piso)/)
  const budgetAmount = budget?.[1] ?? budget?.[2]
  if (budgetAmount) entities.budget = parseInt(budgetAmount, 10)

  const people = normalized.match(/\b(\d{1,2})\s*(?:tao|katao|people|persons?|pax)\b/)
  if (people) entities.people = Math.min(parseInt(people[1], 10), 30)
  else {
    const wordPeople = normalized.match(/\b(isa|dalawa|tatlo|apat|lima|anim)\s+(?:kami|tao|katao|people|pax)\b/)
    if (wordPeople) {
      entities.people = { isa: 1, dalawa: 2, tatlo: 3, apat: 4, lima: 5, anim: 6 }[wordPeople[1]]
    }
  }

  const tokens = normalized.split(' ')
  const hasCategory = (...words: string[]) => words.some((word) =>
    word.includes(' ')
      ? normalized.includes(word)
      : tokens.some((token) => token === word || (word.length >= 6 && tokenMatchesWord(token, word))),
  )
  if (hasCategory('kainan', 'kan anan', 'restaurant', 'restawran', 'carinderia', 'pagkain', 'kain')) entities.category = 'kainan'
  else if (hasCategory('cafe', 'kapihan', 'coffee')) entities.category = 'cafe'
  else if (hasCategory('resort', 'hotel', 'beach', 'dagat')) entities.category = 'resort'
  else if (hasCategory('pasyalan', 'falls', 'bundok', 'simbahan')) entities.category = 'pasyalan'
  else if (hasCategory('negosyo', 'business', 'tindahan')) entities.category = 'negosyo'

  if (/\b(tipid|mura|barato|cheap|budget friendly)\b/.test(normalized)) entities.vibe = 'tipid'
  else if (/\b(romantic|date|date night|romantiko)\b/.test(normalized)) entities.vibe = 'romantic'
  else if (/\b(pamilya|family|pambata|bata)\b/.test(normalized)) entities.vibe = 'pamilya'

  const locationMatch = normalized.match(/\b(?:malapit sa|near|around|sa|in)\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2})/u)
  if (locationMatch) {
    const locationStopwords = new Set([
      'ako', 'amin', 'ang', 'at', 'ba', 'budget', 'cafe', 'gusto', 'hotel', 'itinerary', 'kainan', 'kami',
      'ko', 'lang', 'mga', 'negosyo', 'ng', 'pasyalan', 'please', 'po', 'recommend', 'resort', 'restaurant',
      'sana', 'tayo', 'the', 'trip', 'weekend', 'naman', 'me', 'nearby', 'ako', 'para', 'for', 'with',
      'tao', 'katao', 'people', 'pax', 'araw', 'gabi', 'days', 'day',
    ])
    const locationParts: string[] = []
    for (const part of locationMatch[1].split(' ')) {
      if (locationStopwords.has(part)) break
      locationParts.push(part)
    }
    if (locationParts.length) entities.location = locationParts.join(' ')
  }
  if (!entities.location) {
    const knownLocation = KNOWN_LOCATIONS.find((location) => new RegExp(`\\b${location}\\b`).test(normalized))
    if (knownLocation) entities.location = knownLocation
  }

  return entities
}

/* ============================ CLASSIFIER =========================== */

export function detectIntent(raw: string): IntentResult {
  const normalized = normalize(raw)
  const entities = extractEntities(normalized)

  if (isGibberish(normalized)) {
    return { intent: 'fallback_gibberish', confidence: 0.95, entities, normalized }
  }

  const tokens = normalized.split(' ')
  const scores = new Map<Intent, number>()

  for (const [intent, list] of Object.entries(KEYWORDS) as [Intent, Keyword[]][]) {
    let score = 0
    for (const [word, weight] of list) {
      if (word.includes(' ')) {
        if (normalized.includes(word)) score += weight + 1 // phrases are stronger
      } else if (tokens.some((t) => tokenMatchesWord(t, word))) {
        score += weight
      }
    }
    if (score > 0) scores.set(intent, score)
  }

  // Entity boosts: "3 araw" / "₱5000" imply planning even without keywords
  if (entities.days) scores.set('itinerary', (scores.get('itinerary') ?? 0) + 2)
  if (entities.budget) scores.set('budget', (scores.get('budget') ?? 0) + 1)
  if (entities.category) scores.set('database_search', (scores.get('database_search') ?? 0) + 1)

  if (scores.size === 0) {
    return { intent: 'fallback_unclear', confidence: 0.3, entities, normalized }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  const [topIntent, topScore] = ranked[0]
  const second = ranked[1]?.[1] ?? 0
  const total = ranked.reduce((s, [, v]) => s + v, 0)
  const confidence = Math.min(0.99, (topScore / total) * (topScore >= 2 ? 1 : 0.7))

  if (entities.category) return { intent: 'database_search', confidence: 0.9, entities, normalized }
  if (/\b(weather|panahon|ulan|uulan|umuulan|rain|raining|forecast|temperature|init)\b/.test(normalized)) {
    return { intent: 'weather', confidence: 0.9, entities, normalized }
  }
  if (/\b(safety|safe|ligtas|luwas|delikado|emergency)\b/.test(normalized)) {
    return { intent: 'safety', confidence: 0.9, entities, normalized }
  }
  if (/\b(commute|transport|pamasahe|pasahe|jeep|bus|tren|train|transit)\b|unsaon pag adto/.test(normalized)) {
    return { intent: 'transport', confidence: 0.9, entities, normalized }
  }
  if (/\b(packing|dadalhin|dalhin|dala|pack|maleta)\b|dad on/.test(normalized)) {
    return { intent: 'packing', confidence: 0.9, entities, normalized }
  }
  if (entities.days && !entities.category) return { intent: 'itinerary', confidence: 0.9, entities, normalized }
  if (!entities.days && /\b(budget|badyet|magkano|presyo|gastos|tipid|mura|barato|price)\b/.test(normalized)) {
    return { intent: 'budget', confidence: 0.9, entities, normalized }
  }

  // Greeting + real request ("hi, gusto ko ng itinerary") -> prefer the request
  if (topIntent === 'greeting' && second > 0) {
    const real = ranked.find(([i]) => i !== 'greeting')!
    return { intent: real[0], confidence, entities, normalized }
  }

  // Weak and ambiguous -> ask again instead of guessing
  if (topScore < 2 && topScore - second < 1) {
    return { intent: 'fallback_unclear', confidence, entities, normalized }
  }

  return { intent: topIntent, confidence, entities, normalized }
}

/* ============================== REPLIES ============================ */

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const MENU = ['Gumawa ng itinerary', 'Maghanap ng kainan', 'Maghanap ng pasyalan', 'Mag-budget']

export function buildReply(result: IntentResult, ctx: ChatContext): ReplyData {
  const { intent, entities } = result

  switch (intent) {
    case 'greeting':
      return {
        text: pick([
          'Kumusta! Ako si Jimbot, ang AI travel buddy mo. Ano ang maitutulong ko sa biyahe mo?',
          'Hello! Handa na akong tumulong sa plano mo. Itinerary, kainan, o pasyalan?',
        ]),
        quickReplies: MENU,
      }

    case 'smalltalk':
      return { text: pick(['Mabuti naman! Saan mo gustong gumala?', 'Ayos! May plano ka na bang puntahan?', 'Nandito lang ako kung kailangan mo ng travel tips o rekomendasyon.']), quickReplies: MENU }

    case 'thanks':
      return { text: 'Walang anuman! Sabihin mo lang kung may iba ka pang kailangan.' }

    case 'goodbye':
      return { text: 'Paalam! Ingat sa biyahe, at balik ka lang kay Jimbot kapag may bagong plano. 🐯' }

    case 'help':
      return {
        text: 'Matutulungan kitang maghanap ng verified na lugar, tumingin ng naka-save na itinerary, magplano ayon sa araw at budget, at magbigay ng pangkalahatang tips sa biyahe.',
        quickReplies: [...MENU, 'Tips sa commute', 'Tips sa pag-iimpake'],
      }

    case 'itinerary': {
      if (!entities.days) {
        return {
          text: 'Ilang araw ang biyahe mo?',
          quickReplies: ['1 araw', '2 araw', '3 araw', 'Weekend'],
        }
      }
      if (!entities.location) return { text: `Saan mo gustong pumunta para sa ${entities.days}-araw na biyahe?`, quickReplies: ['Baguio', 'Cebu', 'Intramuros'] }
      return { text: `Titingnan ko ang mga naka-save na itinerary sa ${entities.location}. Ang database ay walang haba ng biyahe o bilang ng kasama, kaya hindi ko makukumpirmang tugma ang mga iyon.`, action: 'ASK_ITINERARY_DETAILS' }
    }

    case 'database_search':
      if (!entities.category) return { text: 'Anong uri ng lugar ang hanap mo?', quickReplies: ['Kainan', 'Cafe', 'Resort', 'Pasyalan'] }
      if (!entities.location) return { text: `Saang lugar ako maghahanap ng ${entities.category}?`, quickReplies: ['Baguio', 'Cebu', 'Intramuros'] }
      return { text: `Hahanapin ko ang verified na ${entities.category} sa ${entities.location}.`, action: 'SEARCH_DB' }

    case 'budget':
      return {
        text: entities.budget
          ? pick([`Noted, ₱${entities.budget.toLocaleString()} ang budget mo. Buksan natin ang planner para makita ang mga gastos.`, `₱${entities.budget.toLocaleString()} ang ilalaan mo. Nasa Budget planner ang breakdown ng biyahe mo.`])
          : 'Magkano ang budget mo? Buksan natin ang planner para maitala ang mga gastos.',
        action: 'OPEN_BUDGET',
      }

    case 'transport':
      return { text: 'Wala akong live na ruta o pamasahe. I-check ang opisyal na transit app o operator bago bumiyahe, at maglaan ng dagdag na oras para sa transfers at traffic.' }

    case 'packing':
      return { text: pick(['Ihanda ang valid ID, charger, gamot na kailangan mo, at damit ayon sa panahon. I-check ang baggage rules ng sasakyan mo bago bumiyahe.', 'Magdala ng tubig, power bank, kopya ng booking, at komportableng sapatos. Iakma ang damit sa haba at aktibidad ng biyahe.']) }

    case 'safety':
      return { text: 'Pangkalahatang paalala: itago nang maayos ang mahahalagang gamit, ipaalam sa kasama ang plano, at gamitin ang opisyal na emergency channels. Wala akong live safety reports para sa mga lugar.' }

    case 'weather':
      return { text: 'Wala akong live na weather forecast. Tingnan ang opisyal na forecast bago umalis; kung ibibigay mo ang lugar, makakatulong akong maghanap ng mga verified na puntahan doon.' }

    case 'fallback_gibberish':
    case 'fallback_unclear':
      return buildFallback(intent, ctx)
  }
}

/** Escalating fallback so the bot never repeats the exact same line forever. */
function buildFallback(intent: 'fallback_gibberish' | 'fallback_unclear', ctx: ChatContext): ReplyData {
  const level = ctx.fallbackCount // 0 = first miss

  if (level === 0) {
    return {
      text:
        intent === 'fallback_gibberish'
          ? 'Hmm, hindi ko maintindihan ang mensahe mo. 😅 Pwede mo bang ulitin o piliin ang isa sa baba?'
          : 'Pasensya na, hindi ko pa nakuha ang ibig mong sabihin. Ano ang gusto mong malaman?',
      quickReplies: MENU,
    }
  }
  if (level === 1) {
    return {
      text: 'Pasensya na ulit! Subukan mo ang ganito: "Gumawa ng 3 araw na itinerary sa Baguio" o "Kainan malapit sa Session Road".',
      quickReplies: MENU,
    }
  }
  return {
    text: 'Mukhang nahihirapan akong intindihin ka. Gusto mo bang makausap ang support team namin, o subukan ulit sa mga pagpipilian sa baba?',
    quickReplies: [...MENU.slice(0, 2), 'Kausapin ang support'],
    action: 'HANDOFF',
  }
}

/* ============================ MAIN ENTRY =========================== */

export function handleMessage(raw: string, ctx: ChatContext): { reply: ReplyData; ctx: ChatContext; result: IntentResult } {
  let result = detectIntent(raw)
  const isFollowUp = /\b(mas mura|mas tipid|mas barato|barato|cheap|budget friendly|yung mas|mas mahal|cheaper|cheapest|lower price|sa .+ naman|may parking|with parking)\b/.test(result.normalized)
  if (isFollowUp && (ctx.slots.category || ctx.slots.location)) {
    result = { ...result, intent: 'database_search', confidence: 0.8 }
  } else if (result.intent === 'fallback_unclear' && extractEntities(result.normalized).location && (ctx.slots.category || ctx.slots.location)) {
    result = { ...result, intent: 'database_search', confidence: 0.8 }
  }
  const isFallback = result.intent === 'fallback_gibberish' || result.intent === 'fallback_unclear'
  const slots = isFallback ? ctx.slots : { ...ctx.slots, ...result.entities }
  if (/\b(mas mura|mas tipid|mas barato|barato|tipid|cheap|cheaper|cheapest|lower price)\b/.test(result.normalized)) slots.vibe = 'tipid'
  if (/\b(mas mahal)\b/.test(result.normalized)) slots.vibe = undefined
  const enrichedResult = { ...result, entities: slots }
  const reply = buildReply(enrichedResult, { ...ctx, slots })
  return {
    reply,
    result: enrichedResult,
    ctx: { fallbackCount: isFallback ? ctx.fallbackCount + 1 : 0, slots },
  }
}

/* ============================ CHAT UI ============================== */
type BotMsg = Extract<Msg, { role: 'bot' }>
type Conversation = { id: string; updated_at: string; title: string }

const MAX_INPUT = 300

const welcomeMessage: Msg = {
  id: 'welcome',
  role: 'bot',
  expression: 'waving',
  text: 'Kumusta! Ako si Jimbot. Maghanap tayo ng lugar, magplano ng biyahe, o tingnan ang budget mo.',
  quickReplies: MENU,
}

// Words that carry no search meaning, so they don't cause false matches in the businesses table.
const SEARCH_STOPWORDS = new Set(
  ('ang ng sa na at ay mga ko mo gusto ako ikaw po ba naman lang para kay kung ito yung ' +
    'saan ano pwede puwede paki maghanap hanap hanapin recommend suggest suhestiyon ' +
    'lugar kainan kan anan restaurant negosyo business pasyalan resort cafe kapihan malapit near the a an i for of in ' +
    'gusto ko sana maghanap hanapin please show find mura tipid barato cheap budget friendly family romantic pamilya mas mahal naman yung with may parking').split(' ')
)

type BusinessRow = {
  id: string
  name: string
  about: string | null
  city: string | null
  address: string | null
  business_type: string | null
  price_range: string | null
  specialties: string[] | null
  cover_url: string | null
  verification_status: string
}

const CATEGORY_FILTERS: Record<NonNullable<Entities['category']>, string[]> = {
  kainan: ['food', 'restaurant', 'kainan', 'carinderia', 'eatery'],
  cafe: ['cafe', 'coffee', 'kapihan'],
  resort: ['resort', 'hotel', 'beach'],
  pasyalan: ['attraction', 'tour', 'museum', 'park', 'pasyalan'],
  negosyo: [],
}

function safeFilterTerm(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}-]/gu, '')
}

function safeCityFilter(value: string) {
  return value.replace(/[%,_*()]/g, '').trim()
}

async function findBusinesses(entities: Entities, normalized: string, widenLocation = false, relaxPrice = false, relaxVibe = false): Promise<ChatBusinessResult[]> {
  let query = supabase
    .from('businesses')
    .select('id, name, about, city, address, business_type, price_range, specialties, cover_url, verification_status')
    .eq('live', true)
    .eq('verification_status', 'verified')
    .limit(30)

  if (entities.location && !widenLocation) query = query.ilike('city', `%${safeCityFilter(entities.location)}%`)
  if (entities.category) {
    const types = CATEGORY_FILTERS[entities.category]
    if (types.length) query = query.or(types.map((type) => `business_type.ilike.%${type}%`).join(','))
  }
  if (entities.vibe === 'tipid' && !relaxPrice) query = query.eq('price_range', '₱')
  if (!relaxVibe && entities.vibe === 'romantic') query = query.or('about.ilike.%romantic%,about.ilike.%date%,specialties.cs.{romantic},specialties.cs.{date}')
  if (!relaxVibe && entities.vibe === 'pamilya') query = query.or('about.ilike.%family%,about.ilike.%pamilya%,specialties.cs.{family},specialties.cs.{pamilya}')

  const locationWords = new Set((entities.location ?? '').split(' '))
  const categoryWords = new Set([
    ...(entities.category ? [entities.category, ...CATEGORY_FILTERS[entities.category]] : []),
    ...(entities.category === 'kainan' ? ['kan', 'anan', 'carinderia', 'eatery'] : []),
    ...(entities.category === 'cafe' ? ['kapihan', 'coffee'] : []),
    ...(entities.category === 'resort' ? ['hotel', 'beach', 'dagat'] : []),
    ...(entities.category === 'pasyalan' ? ['falls', 'bundok', 'simbahan'] : []),
  ])
  const terms = normalized
    .split(' ')
    .filter(
      (term) =>
        term.length > 2 &&
        !SEARCH_STOPWORDS.has(term) &&
        !locationWords.has(term) &&
        ![...categoryWords].some((category) => tokenMatchesWord(term, category)),
    )
    .map(safeFilterTerm)
    .filter(Boolean)
  for (const term of [...new Set(terms)].slice(0, 3)) {
    query = query.or(`name.ilike.%${term}%,about.ilike.%${term}%,specialties.cs.{${term}}`)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as BusinessRow[])
    .map((business) => ({
      kind: 'business' as const,
      id: business.id,
      name: business.name,
      city: business.city,
      address: business.address,
      type: business.business_type,
      priceRange: business.price_range,
      photo: business.cover_url && /^https?:\/\//i.test(business.cover_url) ? business.cover_url : null,
      verified: business.verification_status === 'verified',
    }))
    .sort((a, b) => {
      const location = entities.location?.toLowerCase() ?? ''
      const aExactCity = Number(a.city?.toLowerCase() === location)
      const bExactCity = Number(b.city?.toLowerCase() === location)
      const aType = Number(!!entities.category && a.type?.toLowerCase().includes(entities.category))
      const bType = Number(!!entities.category && b.type?.toLowerCase().includes(entities.category))
      return bExactCity - aExactCity || bType - aType || Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name)
    })
}

async function findItineraries(entities: Entities): Promise<ChatItineraryResult[]> {
  let query = supabase
    .from('itineraries')
    .select('id, title, subtitle, area, budget')
    .eq('is_saved', true)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (entities.location) query = query.ilike('area', `%${safeFilterTerm(entities.location)}%`)
  if (entities.budget) query = query.lte('budget', entities.budget)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((itinerary) => ({ kind: 'itinerary', ...itinerary, budget: Number(itinerary.budget) }))
}

export function JimbotScreen() {
  return <JimbotChat />
}

export function JimbotChat({ embedded }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([welcomeMessage])
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<Conversation[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [conversationError, setConversationError] = useState(false)
  const [switchingConversation, setSwitchingConversation] = useState(false)
  const conversationId = useRef<string | undefined>(undefined)
  const chatCtx = useRef<ChatContext>({ fallbackCount: 0, slots: {} })
  const listRef = useRef<HTMLDivElement>(null)
  const online = useOnline()
  const navigate = useNavigate()

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const scroller = embedded ? el.closest('.overflow-y-auto') : document.scrollingElement
    requestAnimationFrame(() => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }))
  }, [messages, thinking, embedded])

  useEffect(() => {
    let active = true
    void (async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || !active) {
        if (active) setHistoryLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('jimbot_conversations')
        .select('id, updated_at')
        .eq('user_id', auth.user.id)
        .order('updated_at', { ascending: false })
        .limit(30)
      if (error) {
        console.error('Jimbot conversation lookup failed', error)
        if (active) {
          setHistoryError(true)
          setHistoryLoading(false)
        }
        return
      }
      if (!active) return
      const conversations = data ?? []
      const ids = conversations.map((conversation) => conversation.id)
      const { data: userMessages, error: messagesError } = ids.length
        ? await supabase
            .from('jimbot_messages')
            .select('conversation_id, content')
            .eq('role', 'user')
            .in('conversation_id', ids)
            .order('created_at', { ascending: true })
        : { data: [], error: null }
      if (messagesError) {
        console.error('Jimbot history lookup failed', messagesError)
        if (active) {
          setHistoryError(true)
          setHistoryLoading(false)
        }
        return
      }
      if (!active) return
      const firstMessage = new Map<string, string>()
      for (const message of userMessages ?? []) {
        if (!firstMessage.has(message.conversation_id)) firstMessage.set(message.conversation_id, message.content)
      }
      const conversationList = conversations.map((conversation) => ({
        ...conversation,
        title: firstMessage.get(conversation.id)?.slice(0, 52) || 'Bagong usapan',
      }))
      setHistory(conversationList)
      setHistoryLoading(false)
      if (conversationList[0]) await openConversation(conversationList[0].id, activeCheck)
    })()

    function activeCheck() {
      return active
    }

    return () => {
      active = false
    }
  }, [])

  const openConversation = async (id: string, isActive: () => boolean = () => true) => {
    setSwitchingConversation(true)
    const { data, error } = await supabase
      .from('jimbot_messages')
      .select('id, role, content, intent')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Jimbot conversation load failed', error)
      if (isActive()) setConversationError(true)
      setSwitchingConversation(false)
      return
    }
    if (!isActive()) return
    const restored: Msg[] = [welcomeMessage]
    chatCtx.current = { fallbackCount: 0, slots: {} }
    for (const message of data ?? []) {
      if (message.intent?.startsWith('feedback_')) continue
      if (message.role === 'user') {
        restored.push({ id: message.id, role: 'user', text: message.content })
        chatCtx.current = handleMessage(message.content, chatCtx.current).ctx
      } else {
        restored.push({ id: message.id, role: 'bot', expression: 'idea', text: message.content })
      }
    }
    conversationId.current = id
    setMessages(restored)
    setConversationError(false)
    setSwitchingConversation(false)
    setHistoryOpen(false)
  }

  const saveMessage = async (role: 'user' | 'bot', content: string, intent: string) => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return false
    let createdConversation = false
    if (!conversationId.current) {
      const { data, error } = await supabase.from('jimbot_conversations').insert({ user_id: auth.user.id }).select('id').single()
      if (error) throw error
      conversationId.current = data.id
      createdConversation = true
    }
    const id = conversationId.current
    if (!id) throw new Error('Hindi nagawa ang pag-uusap ni Jimbot.')
    const { error } = await supabase.from('jimbot_messages').insert({
      conversation_id: id,
      user_id: auth.user.id,
      role,
      intent,
      content,
    })
    if (error) throw error
    const updatedAt = new Date().toISOString()
    const { error: updateError } = await supabase.from('jimbot_conversations').update({ updated_at: updatedAt }).eq('id', id)
    if (updateError) throw updateError
    setHistory((current) => {
      const existing = current.find((conversation) => conversation.id === id)
      const next = {
        id,
        updated_at: updatedAt,
        title: createdConversation && role === 'user' ? content.slice(0, 52) : existing?.title ?? 'Bagong usapan',
      }
      return [next, ...current.filter((conversation) => conversation.id !== id)].slice(0, 30)
    })
    return true
  }

  const send = async (text: string) => {
    const clean = text.trim().slice(0, MAX_INPUT)
    if (!clean || thinking) return

    // 1. Classify (handles typos, gibberish, entities) and update the fallback counter.
    const { reply, ctx, result } = handleMessage(clean, chatCtx.current)
    chatCtx.current = ctx
    const intent = result.intent
    const isFallback = intent === 'fallback_gibberish' || intent === 'fallback_unclear'

    const pushBot = async (replyText: string, expression: BotMsg['expression'], quickReplies?: string[], results?: ChatResult[]) => {
      setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', expression, text: replyText, quickReplies, results }])
      await saveMessage('bot', replyText, intent)
    }

    // 2. Show the user's message immediately.
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: clean }])
    setInput('')
    setThinking(true)

    try {
      await saveMessage('user', clean, intent)

      // 3. Intents that don't need the database, and slot-filling turns, use the reply directly.
      if ((intent !== 'itinerary' && intent !== 'database_search') || !reply.action) {
        if (reply.action === 'OPEN_BUDGET') setBudgetOpen(true)
        // TODO: handle reply.action === 'HANDOFF' (open your support screen) and drop this filter.
        const quick = reply.quickReplies?.filter((q) => q !== 'Kausapin ang support')
        await pushBot(reply.text, intent === 'greeting' ? 'waving' : isFallback ? 'unsure' : 'idea', quick)
        return
      }

      // 4. Saved itineraries
      if (intent === 'itinerary') {
        const itineraries = await findItineraries(result.entities)
        const replyText = itineraries.length
          ? `May ${itineraries.length} naka-save na itinerary sa ${result.entities.location}. Hindi naka-record ang haba ng biyahe o bilang ng kasama, kaya hindi ko makukumpirmang tugma ang mga iyon.`
          : `Wala akong nakitang naka-save na itinerary sa ${result.entities.location}${result.entities.budget ? ` na pasok sa ₱${result.entities.budget.toLocaleString()} budget` : ''}. Maaari kang mag-browse ng verified na lugar para buuin ang biyahe.`
        await pushBot(replyText, itineraries.length ? 'idea' : 'unsure', undefined, itineraries)
        return
      }

      // 5. Business search (kainan, cafe, resort, ...)
      let matches = await findBusinesses(result.entities, result.normalized)
      let broadenedPrice = false
      let broadenedLocation = false
      let broadenedVibe = false
      if (!matches.length && result.entities.vibe === 'tipid') {
        matches = await findBusinesses(result.entities, result.normalized, false, true)
        broadenedPrice = matches.length > 0
      }
      if (!matches.length && result.entities.location) {
        matches = await findBusinesses(result.entities, result.normalized, true, true)
        broadenedLocation = matches.length > 0
      }
      if (!matches.length && result.entities.vibe && result.entities.vibe !== 'tipid') {
        matches = await findBusinesses(result.entities, result.normalized, false, true, true)
        broadenedVibe = matches.length > 0
      }
      if (!matches.length && result.entities.location && result.entities.vibe && result.entities.vibe !== 'tipid') {
        matches = await findBusinesses(result.entities, result.normalized, true, true, true)
        broadenedLocation = matches.length > 0
        broadenedVibe = matches.length > 0
      }

      const intro = matches.length
        ? broadenedLocation
          ? `Wala akong nahanap sa ${result.entities.location}, kaya pinalawak ko ang paghahanap sa iba pang verified na lugar.`
          : broadenedVibe
            ? `Wala akong nahanap na lugar na may ${result.entities.vibe} tag sa ${result.entities.location}; narito ang iba pang verified na tugma.`
          : broadenedPrice
            ? `Walang pasok sa price tier na ₱. Pinalawak ko ang presyo para makakita ka ng iba pang verified na lugar sa ${result.entities.location}.`
            : `Narito ang mga verified na ${result.entities.category} sa ${result.entities.location}.`
        : `Wala akong nahanap na verified na ${result.entities.category} sa ${result.entities.location}. Subukan ang ibang lugar o kategorya.`
      const groundedIntro = result.entities.budget && intent === 'database_search'
        ? `${intro} May price tier lang ang business records, hindi eksaktong presyo bawat tao; hindi ko masisiguro kung pasok sa ₱${result.entities.budget.toLocaleString()}.`
        : result.entities.people && intent === 'database_search'
            ? `${intro} Naitala ko ang ${result.entities.people} na kasama, pero wala sa business records ang presyo bawat tao.`
            : intro
      await pushBot(groundedIntro, matches.length ? 'idea' : 'unsure', matches.length ? ['Sa Baguio naman', 'Sa Cebu naman', 'Sa Intramuros naman'] : ['Baguio', 'Cebu', 'Intramuros'], matches)
    } catch (error) {
      console.error('Jimbot database request failed', error)
      const replyText = 'Hindi ko ma-access ang database ngayon. Subukan ulit mamaya.'
      setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', expression: 'unsure', text: replyText }])
      try {
        await saveMessage('bot', replyText, intent)
      } catch {
        // The original database error is already surfaced in the response.
      }
    } finally {
      setThinking(false)
    }
  }

  const sendFeedback = async (messageId: string, value: 'up' | 'down') => {
    try {
      const saved = await saveMessage('user', `Jimbot response ${messageId}: ${value === 'up' ? 'helpful' : 'not helpful'}`, `feedback_${value}`)
      if (!saved) throw new Error('Mag-sign in para maitala ang feedback.')
      setMessages((current) => current.map((message) => (message.id === messageId && message.role === 'bot' ? { ...message, feedback: value, feedbackError: undefined } : message)))
    } catch (error) {
      console.error('Jimbot feedback save failed', error)
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId && message.role === 'bot'
            ? { ...message, feedbackError: error instanceof Error ? error.message : 'Hindi na-save ang feedback. Subukan ulit.' }
            : message,
        ),
      )
    }
  }

  const startNewConversation = () => {
    if (thinking || switchingConversation) return
    conversationId.current = undefined
    chatCtx.current = { fallbackCount: 0, slots: {} }
    setMessages([welcomeMessage])
    setInput('')
    setConversationError(false)
    setHistoryOpen(false)
  }

  const lastBotId = [...messages].reverse().find((m) => m.role === 'bot')?.id

  return (
    <main className={cn('flex min-h-dvh flex-col', embedded ? 'min-h-full' : 'pb-[88px] md:pb-0')}>
      <header className={cn('sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-xl', embedded && 'pr-14')}>
        <div className={cn('mx-auto flex items-center gap-2 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]', !embedded && 'max-w-[760px] md:px-6 md:pt-6')}>
          <button
            type="button"
            aria-label={historyOpen ? 'Isara ang mga usapan' : 'Buksan ang mga usapan'}
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-sunken"
          >
            {historyOpen ? <ChevronLeft size={20} /> : <MessageSquareText size={19} />}
          </button>
          <Jimbot crop="head" size={48} expression={thinking ? 'thinking' : 'waving'} animate={false} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-h2">
              Jimbot <PhaseTag phase="MVP" />
            </h1>
            <p className="text-caption text-fg-2">{thinking ? 'Nag-iisip…' : online ? 'AI travel buddy mo · Tagalog / Bisaya / English' : 'Offline'}</p>
          </div>
          <Button size="sm" variant="secondary" icon={<Plus size={16} />} onClick={startNewConversation} disabled={thinking || switchingConversation || historyLoading}>
            Bago
          </Button>
          <Button size="sm" variant="secondary" icon={<PiggyBank size={16} />} onClick={() => setBudgetOpen(true)}>
            Budget
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {historyOpen && (
          <aside className={cn('absolute inset-y-0 left-0 z-30 flex w-[min(280px,85vw)] flex-col border-r border-line bg-bg shadow-float md:w-[260px]', !embedded && 'md:static md:shadow-none')}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold">
                <Clock3 size={17} className="text-link" /> Mga usapan
              </h2>
              <button type="button" aria-label="Isara ang mga usapan" onClick={() => setHistoryOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-sunken">
                <ChevronLeft size={19} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {historyLoading ? (
                <p className="px-3 py-4 text-sm text-fg-2">Kinukuha ang mga usapan…</p>
              ) : historyError ? (
                <p role="alert" className="px-3 py-4 text-sm text-danger">Hindi ma-load ang kasaysayan ng usapan.</p>
              ) : history.length ? (
                <ul className="space-y-1">
                  {history.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => void openConversation(conversation.id)}
                        disabled={switchingConversation || thinking}
                        aria-current={conversationId.current === conversation.id ? 'page' : undefined}
                        className={cn(
                          'w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sunken disabled:opacity-50',
                          conversationId.current === conversation.id && 'bg-primary/10 text-primary',
                        )}
                      >
                        <span className="block truncate text-sm font-medium">{conversation.title}</span>
                        <span className="mt-1 block text-xs text-fg-2">{new Date(conversation.updated_at).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-4 text-sm text-fg-2">Wala pang naka-save na usapan.</p>
              )}
            </div>
          </aside>
        )}
        <section className="flex min-w-0 flex-1 flex-col">
          {!online ? (
            <OfflineState body="Kailangan ni Jimbot ng internet para gumawa ng bagong plano. Bukas pa rin ang mga naka-save mong itinerary." />
          ) : (
            <div ref={listRef} className={cn('mx-auto w-full flex-1 space-y-4 px-4 pb-4 pt-4', !embedded && 'max-w-[760px] md:px-6')} aria-live="polite">
              {switchingConversation ? (
                <p className="text-center text-caption text-fg-2">Binubuksan ang usapan…</p>
              ) : (
                <>
                  {conversationError && <p role="alert" className="text-center text-sm text-danger">Hindi ma-load ang usapan. Subukan itong buksan ulit.</p>}
                  <p className="text-center text-caption text-fg-2">Ngayon · Tagalog, Bisaya, at English</p>
                  {messages.map((m) =>
                    m.role === 'user' ? (
                      <UserBubble key={m.id} text={m.text} />
                    ) : (
                      <BotReply
                        key={m.id}
                        msg={m}
                        showQuickReplies={m.id === lastBotId && !thinking}
                        onPick={send}
                        onFeedback={(value) => sendFeedback(m.id, value)}
                        onOpenResult={(result) => navigate(result.kind === 'business' ? `/shop/${result.id}` : `/itinerary/${result.id}`)}
                      />
                    )
                  )}
                  <AnimatePresence>{thinking && <Thinking />}</AnimatePresence>
                </>
              )}
            </div>
          )}

          <div className={cn('sticky z-20', embedded ? 'bottom-0' : 'bottom-[88px] md:bottom-0')}>
            <div className={cn('mx-auto w-full', !embedded && 'max-w-[760px] md:px-2')}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-center gap-2 px-4 pb-3"
              >
                <label className="glass flex h-12 flex-1 items-center rounded-full pl-4 pr-1.5 shadow-float">
                  <span className="sr-only">Mensahe kay Jimbot</span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={MAX_INPUT}
                    placeholder="Itanong kay Jimbot…"
                    disabled={!online || switchingConversation}
                    className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-fg-2"
                  />
                  <button
                    type="submit"
                    aria-label="Ipadala"
                    disabled={!input.trim() || thinking || switchingConversation}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-deep text-white transition-opacity disabled:opacity-40"
                  >
                    <ArrowUp size={20} strokeWidth={2.4} />
                  </button>
                </label>
              </form>
            </div>
          </div>
        </section>
      </div>
      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </main>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-end">
      <p className="max-w-[80%] rounded-[22px] rounded-br-md bg-deep px-4 py-2.5 text-[16px] leading-6 text-white">{text}</p>
    </motion.div>
  )
}

function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
      <Jimbot expression="thinking" variant="standalone" size={84} />
      <div className="card mb-3 flex items-center gap-1.5 rounded-[22px] rounded-bl-md px-4 py-3">
        <span className="text-[15px] text-fg-2">Gumagawa ng plano</span>
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </motion.div>
  )
}

function BotReply({
  msg,
  showQuickReplies,
  onPick,
  onFeedback,
  onOpenResult,
}: {
  msg: BotMsg
  showQuickReplies: boolean
  onPick: (text: string) => void
  onFeedback: (value: 'up' | 'down') => void
  onOpenResult: (result: ChatResult) => void
}) {
  const big = msg.expression === 'unsure'
  const [visibleResults, setVisibleResults] = useState(5)
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
      {big ? (
        <Jimbot expression="unsure" variant="standalone" size={64} className="-ml-1 shrink-0" />
      ) : (
        <Jimbot crop="head" expression={msg.expression} size={36} animate={false} className="mt-1" />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn('card rounded-[22px] rounded-tl-md px-4 py-3', big && 'border-2 border-dashed border-caution/50')}>
          {big && <p className="mb-1 font-display text-[15px] font-semibold text-caution">Hindi ako sigurado</p>}
          <p className="text-[16px] leading-6">{msg.text}</p>
        </div>
        {msg.results && msg.results.length > 0 && (
          <div className="space-y-2">
            {msg.results.slice(0, visibleResults).map((result) => (
              <ResultCard key={`${result.kind}-${result.id}`} result={result} onOpen={() => onOpenResult(result)} />
            ))}
            {visibleResults < msg.results.length && (
              <button type="button" onClick={() => setVisibleResults((count) => count + 5)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-link hover:bg-surface">
                Ipakita pa ({msg.results.length - visibleResults})
              </button>
            )}
          </div>
        )}
        {showQuickReplies && msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.quickReplies.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onPick(label)}
                className="rounded-full border border-line bg-bg/60 px-3.5 py-1.5 text-[14px] text-fg transition-colors hover:bg-bg"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {msg.id !== 'welcome' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[12px] text-fg-2">Nakatulong ba ito?</span>
            <button type="button" aria-label="Nakatulong" aria-pressed={msg.feedback === 'up'} onClick={() => onFeedback('up')} className={cn('rounded-full p-1.5 text-fg-2 hover:bg-surface', msg.feedback === 'up' && 'bg-primary/15 text-primary')}>
              <ThumbsUp size={15} />
            </button>
            <button type="button" aria-label="Hindi nakatulong" aria-pressed={msg.feedback === 'down'} onClick={() => onFeedback('down')} className={cn('rounded-full p-1.5 text-fg-2 hover:bg-surface', msg.feedback === 'down' && 'bg-primary/15 text-primary')}>
              <ThumbsDown size={15} />
            </button>
            {msg.feedbackError && <span role="alert" className="text-xs text-danger">{msg.feedbackError}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ResultCard({ result, onOpen }: { result: ChatResult; onOpen: () => void }) {
  if (result.kind === 'itinerary') {
    return (
      <button type="button" onClick={onOpen} className="card flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MapPin size={20} />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{result.title}</span>
          <span className="block truncate text-sm text-fg-2">{[result.area, result.subtitle, `₱${result.budget.toLocaleString()}`].filter(Boolean).join(' · ')}</span>
        </span>
      </button>
    )
  }

  return (
    <button type="button" onClick={onOpen} className="card flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface">
      {result.photo ? (
        <img src={result.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MapPin size={20} />
        </div>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{result.name}</span>
        <span className="block truncate text-sm text-fg-2">{[result.type, result.city, result.priceRange].filter(Boolean).join(' · ')}</span>
        {result.address && <span className="block truncate text-xs text-fg-2">{result.address}</span>}
      </span>
      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary">Verified</span>
    </button>
  )
}