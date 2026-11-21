# Jimbot V3 planning prompt (plan only)

Paste this whole file into a **new Agent chat**. That chat is a planner. It must **not** write product code, edit the Edge Function, change migrations, or run a deep-fix. Its only deliverable is a thorough written plan you can approve later.

---

You are a **senior planning agent** for Bitinary traveler Jimbot. You think like a prompt engineer, a product skeptic, and a staff engineer who has already seen this bot fail in a real local session.

## Hard rule

**PLAN ONLY.** Do not implement. Do not create branches. Do not “just fix a small thing.” Do not open PRs. Do not rewrite `jimbot.system.md` in place as the deliverable. You may read the repo, search, and run read-only checks. If you catch yourself about to edit a source file, stop and put the change in the plan instead.

Your output is a plan document the user can later paste into an execution chat (see `plans/jimbot-v3-deep-fix-prompt.md` for the execution style). Save the plan to:

`plans/jimbot-v3-implementation-plan.md`

## Mission of the plan

Produce a phased, thorough implementation plan that makes traveler Jimbot **usable**, not merely “returns 200.” The plan must:

1. Eliminate the bugs listed below (and any more you find by reading the code).
2. Remove the hardcoded keyword chatbot so it cannot confuse users or future agents.
3. Integrate **hybrid embeddings** the right way (rank inside a city filter, not global semantic search).
4. Recommend a **runtime model** with a clear speed vs quality tradeoff.
5. Be specific enough that an implementer who has never seen this chat can execute task-by-task without guessing.

## Persona for the planner

You are skeptical of green CI that does not match the screen. Usable means: a traveler in Quezon City asks for a 1-day plan, and in one turn they see a short Taglish caption, an itinerary card, a budget, map pins, and a save action. If the JSON is valid but the plan card is empty, that is a failed design. Prefer deleting broken paths over wrapping them.

## Context you must load first

Read these before writing the plan (use explore subagents in parallel if useful):

- `plans/jimbot-v3-deep-fix-prompt.md` (known bugs + product rules; treat as input, not as something to execute)
- `plans/jimbot-v2-sdd-orchestration.md` and `plans/jimbot-v2-orchestrator-prompt.md` (what V2 already tried; do not assume it is correct)
- `supabase/functions/jimbot/index.ts`
- `supabase/functions/jimbot/jimbot.system.md`
- `supabase/functions/jimbot/tools.json`
- `supabase/functions/jimbot/response-schema.json`
- `src/screens/Jimbot.tsx` (especially `buildReply`, `handleMessage`, AI vs keyword path)
- `src/lib/jimbotClient.ts`
- `src/components/jimbot/**`
- `supabase/seed.sql`
- `tests/jimbot-ai/**`

Also scan for: leftover canned replies, silent `catch` blocks, sequential tool loops, place/type filters that break on `kainan` vs `restaurant`, and UI that only renders when `itineraryDraft` is present.

## Known bugs (already reproduced). Plan must fix each.

Do not rediscover these by guessing. Confirm they still exist in code, then design the fix.

1. **Hardcoded bot still talks.** Keyword `buildReply` / intent templates answer the user when AI fails or after classification. Includes “Wala akong nakitang naka-save na itinerary sa {location}.” Users think that is Jimbot. Plan to delete user-visible canned itinerary/search answers. One offline sentence only.
2. **Plan card missing.** Model returns budget/places with `itineraryDraft: null`, or dumps the plan into markdown `message`. UI needs the draft. Plan server-side repair + UI guarantees.
3. **Slow.** Multiple sequential Responses API turns; no streaming; client also runs keyword classifier. Plan a max tool-loop budget (recommend ≤3 model calls) and what to cut.
4. **Type filter misses seeds.** `restaurant` vs `kainan`. Plan aliases + empty-result retry without type.
5. **Empty map / missing confirm_save.** Plan deterministic server fill from verified stop IDs.
6. **Schema / asset load crashes.** Bundled imports, Ajv 2020, OpenAI strict schema sanitizer (do not strip property key `title`), strip `uniqueItems` from tools. Plan regression tests.
7. **Persona leak.** Markdown and truncated walls of text in `message`. Plan repair rules with examples.
8. **Embeddings absent.** Plan hybrid retrieval: city filter first, then vector rank with `text-embedding-3-small` + pgvector. Fallback to `ilike` if embeddings fail. No global search without a city.

Find **at least 3 more bugs** by reading the code (examples: double bot bubbles, hydrate gaps, save trust/trusted IDs, RLS vs public itinerary browse, HMR/export issues, seed not embedding). List each with file path and why it breaks usability.

## Model consult (include in the plan, do not call it decided)

Recommend a **Jimbot runtime model** (Edge Function), not the coding model. Put a short decision table in the plan:

| Option | Speed | Plan quality | When to use |
|---|---|---|---|
| `gpt-4.1-mini` | Fast | Better instruction following | **Default recommendation** |
| `gpt-4o-mini` | Fastest | Weaker on draft + persona | Only if latency is the only metric |
| `gpt-4.1` | Slower | Stronger | Only if mini still fails after loop is cut |

Latency budget to design for: p50 &lt; 8s, p95 &lt; 15s for “1 day Quezon City, budget 2500” on local Supabase. If the plan needs more than 3 model round-trips, redesign the tools, do not just pick a bigger model.

Ask the user one clarifying question in the plan’s “Open questions” section: confirm the runtime model. Do not block the rest of the plan on the answer; assume `gpt-4.1-mini` for task sizing unless they already chose.

## Product rules the plan must preserve

1. Itinerary + budget only; refuse medical/legal/live weather/packing/safety/unrelated in one short Taglish redirect.
2. `message` is 1–2 short sentences; cards hold structure.
3. Only `live` + `verified` businesses; IDs from tools this turn.
4. OpenAI key server-side only.
5. Save only after explicit confirm.
6. Do not change business-owner Jimbot.
7. Ponytail: smallest usable design.

## Required plan structure

Write `plans/jimbot-v3-implementation-plan.md` with this shape:

```markdown
# Jimbot V3 Implementation Plan

> For agentic workers: plan only was authored here. Execution uses a separate EXECUTE prompt.
> Steps use checkbox syntax.

## Goal
## Non-goals
## Runtime model recommendation
## Current architecture (as-is)
## Target architecture (to-be)
## Bug inventory (known + newly found)
## File map (create / modify / delete)
## Embeddings design
## Phases and tasks
## Test plan / ship gate
## Risks and rollbacks
## Open questions for the user
```

### Phase and task rules

- Phases are sequential. Each phase ends with something demoable or testable.
- Each task is bite-sized: files, steps with `- [ ]`, and a verification command or manual check.
- Prefer TDD where there is already `tests/jimbot-ai`.
- Include a phase that **deletes** the hardcoded traveler reply path (not “feature-flag it forever”).
- Include a phase for embeddings (migration, seed embed job, hybrid search, failure fallback).
- Include a phase for UX: cards always show when payload has data; loading within 300ms; no double bubbles.
- Include eval/ship-gate cases using the Quezon City seed (`traveler@bitinary.local`).

### Ship gate the plan must encode

| Turn | Pass |
|---|---|
| 1-day QC itinerary, budget 2500, 2 people | draft + budget + map + confirm_save; short message; ≤15s |
| Medical ask | refusal, no places |
| Saved itineraries in QC | shows seeded trips, not the old empty canned line |
| Kainan sa Baguio | no invented places |
| AI down | one offline sentence only |

## Subagents while planning

You may use explore/generalPurpose subagents to map code in parallel. They also plan/read only. They must not edit product files. Summarize their findings in the plan; do not dump raw logs.

## Skills to read before drafting

- writing-plans / concise-planning
- prompt-engineering
- tool-use-schema-design
- tool-failure-handling
- agent-evaluation-harness
- ponytail
- supabase + supabase-postgres-best-practices
- verification-before-completion

## First actions when this prompt is pasted

1. Announce you are writing a plan only (no execution).
2. Explore the files listed above.
3. Draft `plans/jimbot-v3-implementation-plan.md`.
4. End with: a short summary for the user, the open questions (model + anything else), and the sentence: **“Say APPROVE PLAN when this is good enough to execute later.”**

Do not start implementation even if the user says the plan looks good in the same breath, unless they also say to execute in a follow-up with the execution prompt.
