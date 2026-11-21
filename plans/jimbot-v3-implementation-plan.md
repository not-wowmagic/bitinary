# Jimbot V3 Implementation Plan

> Executed from the approved Cursor plan. Do not confuse with the Cursor plan artifact (left untouched).

Runtime model: `gpt-4.1-mini` (default + `OPENAI_MODEL` in `supabase/functions/.env`)  
Offline sentence: `Hindi ako makasagot ngayon. Subukan ulit mamaya.`  
Model call cap: 3 (early local synthesize after search when ≥3 trusted IDs on a plan ask)

## Phases (done)

1. **AI-only traveler client** — keyword bot removed; history includes current turn; payload restore; offline line
2. **Edge reliability** — tool OR fix, draft/map/`confirm_save`/message repair, schema sanitizer test, `gpt-4.1-mini`
3. **Hybrid embeddings** — `business_embeddings` + embed seed + city filter then rank + `ilike` fallback
4. **UI** — empty-draft guards, loading chrome, `open_map`, hydrate display
5. **Ship gate** — `pnpm test:jimbot-ai` in prebuild; QC fixtures; live traveler smoke; secrets check

## Local ship checklist

1. `npx supabase functions serve jimbot --env-file supabase/functions/.env --no-verify-jwt`
2. `pnpm embed:businesses` after every `db reset` / seed (empty index → `ilike` fallback only)
3. Sign in as `traveler@bitinary.local` / `password123`
4. Ask: `Gumawa ng 1 araw na itinerary sa Quezon City, budget 2500 para sa 2 tao`
5. Expect: short caption, itinerary card, budget, map pins, I-save (target &lt;15s)

## Verified

- `pnpm test:jimbot-ai` — 0 problems
- `pnpm build` — green
- Live QC smoke as traveler — draft + budget + map + `confirm_save` (~4s with early synthesize)
- No `OPENAI_API_KEY` in `src/`; key only in gitignored `supabase/functions/.env`
