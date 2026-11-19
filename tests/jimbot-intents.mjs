import assert from 'node:assert/strict'
import { createServer } from 'vite'

process.env.VITE_SUPABASE_URL ??= 'http://127.0.0.1:54321'
process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key'

const cases = [
  ...['Hi Jimbot', 'Hello!', 'Hey there', 'Kumusta ka?', 'Kamusta Jimbot', 'Magandang umaga', 'Maayong buntag'].map((text) => [text, 'greeting']),
  ...['Mabuti naman', 'Maayo kaayo', 'Ayos lang ako', 'Sige, mabuti', 'Mabuti ako ngayon', 'Maayo ko', 'Ayos naman'].map((text) => [text, 'smalltalk']),
  ...['Salamat', 'Thanks Jimbot', 'Thank you', 'Maraming salamat', 'Daghang salamat', 'Salamat kaayo', 'Thank you so much'].map((text) => [text, 'thanks']),
  ...['Bye', 'Goodbye', 'Paalam', 'See you', 'See you soon', 'Amping kanunay', 'Paalam muna'].map((text) => [text, 'goodbye']),
  ...['Help me', 'Tulong po', 'Ano kaya mo?', 'Anong magagawa mo?', 'Ano ang magagawa mo?', 'Paano ka makakatulong?', 'Can you help me?'].map((text) => [text, 'help']),
  ...['Gumawa ng itinerary', 'Planuhin ang biyahe', 'Gusto ko ng trip', 'Itinerary para sa weekend', 'Magplano ng bakasyon', 'Maglaag ta', '3 araw na biyahe'].map((text) => [text, 'itinerary']),
  ...['Maghanap ng kainan', 'Kan-anan sa Cebu', 'Restarant sa Baguio', 'Saan ang resort?', 'Maghanap ng pasyalan', 'Hotel sa Baguio', 'Negosyo malapit sa akin'].map((text) => [text, 'database_search']),
  ...['Mag-budget tayo', 'Ano ang budget?', 'Magkano ang gastos?', 'Badyet ko', 'Tipid na biyahe', 'Budjet ko', 'Presyo ng biyahe'].map((text) => [text, 'budget']),
  ...['Paano mag-commute?', 'Ano ang transport?', 'Magkano ang pamasahe?', 'Sakay ng jeep', 'Bus papunta roon', 'Train schedule', 'Unsaon pag-adto sa Cebu?'].map((text) => [text, 'transport']),
  ...['Ano ang dapat dalhin?', 'Packing list please', 'Ano ang dadalhin ko?', 'Mag-pack para sa trip', 'Kailangan ko ng maleta', 'Ano ilalagay sa bag?', 'Unsa ang dad-on?'].map((text) => [text, 'packing']),
  ...['Is it safe?', 'Ligtas ba doon?', 'Safety tips please', 'Delikado ba rito?', 'Emergency help', 'Safe ba maglakad?', 'Luwas ba?'].map((text) => [text, 'safety']),
  ...['Weather today', 'Uulan ba?', 'Kamusta ang panahon?', 'May ulan ba bukas?', 'Rain forecast', 'Temperature sa Baguio', 'Init ba sa Baguio?'].map((text) => [text, 'weather']),
  ...['asdf', 'qwerty', 'sfsfds', 'zzzzxxx', 'blrgk', 'kjhhjk', 'xczvbn', 'asdf qwer'].map((text) => [text, 'fallback_gibberish']),
  ...['I like music', 'Could you explain that', 'Where is my wallet', 'Ano ito', 'Bakit ganoon', 'Gusto ko ng bago', 'What do you think about art', 'zzzx'].map((text) => [text, 'fallback_unclear']),
]

assert.equal(cases.length, 100, 'The regression corpus must contain exactly 100 messages.')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { detectIntent, handleMessage } = await server.ssrLoadModule('/src/screens/Jimbot.tsx')
  const failures = cases.flatMap(([text, expected]) => {
    const actual = detectIntent(text).intent
    return actual === expected ? [] : [`${JSON.stringify(text)}: expected ${expected}, got ${actual}`]
  })

  const firstTurn = handleMessage('Kainan sa Baguio', { fallbackCount: 0, slots: {} })
  const followUp = handleMessage('Mas mura sana', firstTurn.ctx)
  const tripDetails = handleMessage('Gumawa ng 3 araw sa Baguio para sa 4 tao, budget ₱5,000, family', { fallbackCount: 0, slots: {} })
  const budgetedTrip = detectIntent('3 araw sa Baguio, budget ₱5,000')
  const typoSearch = detectIntent('Restarant sa Baguio')
  const multiDayBudget = detectIntent('Plan a 3-day trip in Cebu with a budget of 5k')
  const singleWordSearch = handleMessage('Larsian', { fallbackCount: 0, slots: {} })
  const categorySearch = handleMessage('hotel', { fallbackCount: 0, slots: {} })
  const locationSearch = handleMessage('Cebu', { fallbackCount: 0, slots: {} })
  assert.equal(firstTurn.result.entities.location, 'baguio', 'Location extraction should retain the requested city.')
  assert.equal(followUp.result.intent, 'database_search', 'A refinement should reuse the previous search intent.')
  assert.equal(followUp.result.entities.category, 'kainan', 'A refinement should retain the previous category.')
  assert.equal(followUp.result.entities.location, 'baguio', 'A refinement should retain the previous location.')
  assert.equal(followUp.result.entities.vibe, 'tipid', 'A cheaper follow-up should update the remembered price preference.')
  assert.equal(tripDetails.result.entities.days, 3, 'Trip length should be extracted.')
  assert.equal(tripDetails.result.entities.people, 4, 'Party size should be extracted.')
  assert.equal(tripDetails.result.entities.budget, 5000, 'Budget should be extracted without confusing it with the trip length.')
  assert.equal(tripDetails.result.entities.vibe, 'pamilya', 'Family vibe should be extracted.')
  assert.equal(tripDetails.result.entities.location, 'baguio', 'Location extraction should stop before later trip details.')
  assert.equal(budgetedTrip.intent, 'itinerary', 'A trip-length request with a budget should remain an itinerary request.')
  assert.equal(budgetedTrip.entities.budget, 5000, 'Budget extraction should preserve comma-grouped amounts.')
  assert.equal(typoSearch.entities.category, 'kainan', 'A common restaurant typo should still resolve to the food category.')
  assert.equal(typoSearch.entities.location, 'baguio', 'A typo in the category should not interfere with location extraction.')
  assert.equal(singleWordSearch.result.intent, 'database_search', 'A standalone business keyword should search the database.')
  assert.equal(singleWordSearch.reply.action, 'SEARCH_DB', 'A standalone business keyword should run a database search without asking for a category.')
  assert.equal(categorySearch.reply.action, 'SEARCH_DB', 'A category keyword should search the full database without requiring a location.')
  assert.equal(locationSearch.reply.action, 'SEARCH_DB', 'A standalone location should search database businesses in that city.')
  assert.equal(multiDayBudget.entities.days, 3, 'Hyphenated day counts should be understood.')
  assert.equal(multiDayBudget.entities.budget, 5000, 'Shorthand budgets such as 5k should be understood.')

  let tripContext = { fallbackCount: 0, slots: {} }
  tripContext = handleMessage('Plan a trip', tripContext).ctx
  const dayReply = handleMessage('3', tripContext)
  assert.equal(dayReply.result.intent, 'itinerary', 'A bare day count should answer the itinerary follow-up.')
  assert.equal(dayReply.result.entities.days, 3, 'The follow-up day count should be retained.')
  const destinationReply = handleMessage('Cebu City', dayReply.ctx)
  assert.equal(destinationReply.result.entities.location, 'cebu city', 'A destination-only follow-up should retain the itinerary intent.')
  assert.equal(destinationReply.reply.action, 'ASK_ITINERARY_DETAILS', 'A completed itinerary request should continue to saved itineraries.')

  let searchContext = { fallbackCount: 0, slots: {} }
  searchContext = handleMessage('Find a bakery in Cebu', searchContext).ctx
  const partyReply = handleMessage('for 4 people', searchContext)
  assert.equal(partyReply.result.intent, 'database_search', 'A party-size follow-up should retain a business search.')
  assert.equal(partyReply.result.entities.people, 4, 'A party-size follow-up should be captured.')
  const budgetQuestion = handleMessage('What is a good budget?', { fallbackCount: 0, slots: {} })
  const budgetAmount = handleMessage('5k', budgetQuestion.ctx)
  assert.equal(budgetAmount.result.intent, 'budget', 'A shorthand amount should answer the budget follow-up.')
  assert.equal(budgetAmount.result.entities.budget, 5000, 'A shorthand amount should be normalized in a budget follow-up.')

  const { detect: detectBusiness, answer: answerBusiness } = await server.ssrLoadModule('/src/biz/pages/JimbotChat.tsx')
  const { demoData } = await server.ssrLoadModule('/src/biz/store.tsx')
  assert.equal(detectBusiness('How can I attract more clients?'), 'customers', 'Business advice should understand customer-growth language.')
  assert.equal(detectBusiness('Any ideas for social media?'), 'post', 'Business advice should understand social content language.')
  assert.equal(detectBusiness('Can you check my business profile?'), 'profile', 'Business advice should understand profile questions.')
  assert.equal(detectBusiness('Paano dumami ang customer ko?'), 'customers', 'Business advice should understand Tagalog growth questions.')
  assert.equal(detectBusiness('what about that?', 'customers'), 'customers', 'Business chat should keep context for short follow-ups.')
  const menuReply = answerBusiness('menu', 'en', demoData, true)
  assert.ok(menuReply.text.includes(demoData.business.menu[0].name), 'Business menu replies should use the current profile menu.')
  const reviewReply = answerBusiness('review', 'en', demoData, true)
  assert.ok(!reviewReply.text.includes("We've added staff"), 'Review drafts must not invent business actions.')
  const firstGrowthReply = answerBusiness('customers', 'en', demoData, true)
  const growthFollowUp = answerBusiness('customers', 'en', demoData, true, true)
  assert.notEqual(growthFollowUp.text, firstGrowthReply.text, 'Business follow-ups should add a new, relevant suggestion.')

  assert.deepEqual(failures, [], failures.join('\n'))
  console.log(`Passed ${cases.length} Jimbot intent cases and conversation-slot checks.`)
} finally {
  await server.close()
}
