# CURSOR IMPLEMENTATION BRIEF — Travel Buddy itinerary response (v3)

> **ROLE:** You are acting simultaneously as (1) a principal product designer, (2) an iOS-HIG-literate UI engineer, (3) a senior frontend engineer in an **existing** codebase, and (4) a meticulous design QA reviewer. This is **reference-to-product integration**, NOT a greenfield redesign.
>
> **MANDATORY STOP:** Before writing or changing implementation code, inspect the existing system, then **interview the user about unresolved product and engineering decisions**. Do not start implementation until the user answers or explicitly authorizes defaults. The interview is mandatory, not a courtesy.

## 0. Hierarchy of authority (read this carefully)

1. **Actual application architecture / APIs / established design tokens / functional requirements** — respect these, especially existing user data, accessibility, security, auth, and data contracts.
2. **`REFERENCE_APPROVED_LAYOUT.png`** — the **approved composition and information hierarchy**. Its component order, main card proportions, route, stop timeline, budget, tips, and actions should remain recognizable and visually close.
3. **`index.html`, `styles.css`, `script.js`, `assets/`** — a **polished, runnable WEB reference** preserving that composition. Treat its spacing, typography, shapes, hierarchy, and interactions as more precise than generic design prompts. `preview-*.png` if present are only screenshot references, never required for the app.
4. **`VISUAL_SPEC.md`** — refinements, edge cases, responsive rules and acceptance criteria.
5. **`MOTION_SPEC.md`** — OPTIONAL, restrained motion guidance. It is not authorization to change the layout or introduce an animation library.
6. **Your design judgment** — use only to solve real conflicts, not to add new visual flourishes.

**Critical interpretation:** The screenshots and prototype are reference materials, not production source of truth. The final component MUST match the *real application's* design system and technical architecture **while staying as visually close as practicable to the reference**. Never use "match the existing design system" as an excuse to revert to boring generic boxes or abandon the approved composition. Never use "pixel perfect" as an excuse to break existing responsive, accessible, or data functionality. If fidelity and integration conflict, explain the tradeoff and offer the smallest viable adaptation.

## 1. Scope and real product context

This is a travel-planning chatbot. The user tells the assistant:
- where they are staying / their travel destination (and potentially neighborhood),
- number of days,
- total budget and currency,
- preferences such as local food, sights, cafes, mobility constraints, travel pace, etc.

The AI creates a consolidated itinerary that appears **as one structured response inside the chat conversation**. The places shown in the plan are THE recommendations; **do not render a separate duplicate places list** above the schedule. The user should be able to follow the day in chronological order, understand expected spend, explore an individual stop, make a targeted refinement, and save/share via the existing app.

The visual concept uses a **Quezon City one-day sample**. All specific businesses, activities, photos, prices and travel times in the sample are **ILLUSTRATIVE**, NOT verified real-world data. Do not hard-code them, claim they exist, or quietly manufacture hours, coordinates, prices or routing.

**In scope:** the itinerary response component, its genuine actions, necessary normalization/validation, data bindings, responsive UI, and minimum supporting styles. **Out of scope:** chat composer overhaul, login/auth, onboarding, landing pages, routing shell, chatbot personality/avatar, unrelated refactors, global token rebrands, or wholesale UI library replacements.

## 2. Required phase 1 — Inspect the system BEFORE asking questions

Read and report what actually exists:

- Determine framework, version and rendering model (React/Next.js/Vue/etc. or truly native iOS); CSS strategy, component library, packages, icon system, fonts, tokens, breakpoints and design conventions.
- Locate the actual chat thread screen, assistant message renderer, itinerary output renderer (if any), AI prompt/response schema, streaming/parser boundary, and state/persistence architecture.
- Inspect the current way that destination, stay location, trip days, total budget, and area/local preferences are gathered. Identify any data already known by the app; do not ask the user for answers already evident in the repo.
- Inspect API services for place data, mapping, geocoding, travel time, price estimates, image assets, save/share, and itinerary regeneration; separate **implemented** from **not implemented**.
- Identify the real max-width of a chat assistant response, current mobile constraints, locale, keyboard/scroll behavior, and whether itinerary output is a message attachment, rich card, or page.
- Review these reference files and **open the HTML prototype** when possible. Note that the concept is UIKit-INSPIRED styling; web apps cannot import native UIKit. Reuse existing web primitives; for a true native app, adapt to real platform APIs.

Produce a concise `Current-state audit` listing confirmed facts, file paths, and **only** the true unknowns.

## 3. Required phase 2 — GRILL THE USER (mandatory before coding)

**Do not begin editing code in your first response.** Once you have inspected the repo, ask targeted and pointed questions in **two tiers**. Ask the highest-impact unresolved ones first; do not ask what is already clear from the code or the approved design. Provide your recommendation/default beside each question where useful. Ask the user to confirm the proposed interpretation and priorities. If the user says "use your judgment" or "proceed", document the assumptions, then implement.

### Decision blockers (ask if not already answered in the project)

1. **Where does this UI live?** Inside the existing chatbot message bubble, full width inside the chat thread, a side panel, or a separate itinerary detail page? Show the exact component/route you found and explain the visual consequence.
2. **How strict is visual fidelity?** Is the composition in `REFERENCE_APPROVED_LAYOUT.png` locked? Proposed default: **yes**, preserve hero → segmented control → route ribbon → chronological day timeline → budget → compact tips → Save/Refine/Share. The modifications allowed are subtle craft polish, accessibility, and responsive adaptation — **not reimagining the layout**.
3. **Is the app web or truly native iOS?** Default: follow the existing repo. If web, implement UIKit-inspired visual patterns with web components, not a Swift or UIKit dependency.
4. **How does AI output arrive?** Structured JSON schema, tool/function output, streamed tokens, or free-form prose? What current action updates a single stop? Default: normalize structured output with runtime validation and safe text fallback.
5. **Which travel data is real?** Are venues, geocoordinates, hours, prices, transit times and images backed by a provider? How should unknown or unverified items display? Default: `unknown` is explicit; do not invent.
6. **Budget semantics:** Is the supplied amount per person or group, and does it include transport, entrance fees, meals, accommodation and buffers? Default: show only itemized known estimates and explicit exclusions; do not label unallocated funds as "safe spending money".
7. **What must Refine/Swap actually do?** Replace one stop, replan the whole day, or send a new chat turn? Should a suggested replacement require confirmation before updating the plan? Default: preview candidate(s), confirm, then recompute one canonical itinerary state.
8. **What do Save and Share mean in this app?** Is there existing auth/persistence and a real shareable URL? Default: connect to current services; do not simulate saving or generate dead links.

### UX details (ask as a short second group if material)

9. **Multi-day presentation:** For 2–7+ days, should the central selected "Day 1" control become a day picker while Overview and Map remain views? Default: yes, keep the same top-row footprint, but separate day selection from subview switching semantically.
10. **Navigation and device target:** iPhone Safari-first, Android, desktop, or all? Does the chat have fixed input/composer at the bottom? Default: mobile-first responsive web, no interference with app shell or chat scroll.
11. **Map expectations:** actual live directions, static map, or order-only route overview? Default: labelled route schematic until real coordinates/routing are available.
12. **Copywriting, identity and imagery:** Should the friendly Taglish tone and existing mascot remain unchanged? Does the repo contain approved brand photos? Default: preserve both; use real appropriately licensed/verified place photos where available, neutral placeholders otherwise.
13. **Motion preferences (if this impacts the existing system):** Does the app already have animation utilities, established durations, reduced-motion handling or a preference to avoid motion? Would the user like subtle, native-feeling transitions on tabs, details sheets, save/refine states, and confirmed itinerary changes? Default: **yes, add restrained smooth animations only where they genuinely improve clarity and the current platform supports them**; use existing motion tokens and respect reduced-motion accessibility settings. This is optional polish, not a reason to change layout or install a new library.

After the questions, present: (a) brief proposed component tree, (b) screen/behavior changes, (c) key assumptions, (d) implementation stages. **STOP and await the user's responses or permission**. Do not treat silence as permission.

## 4. Required phase 3 — Design fidelity contract (no AI-template drift)

### Lock the approved structural order

The design must remain recognizably close to the approved reference:

1. **Top conversation context:** user's location chip aligned right; small mascot; assistant reply is one SHORT Taglish sentence, not an essay.
2. **Destination hero:** one strong image-led card; prominent place title; days and budget on one row; one-sentence travel tone; restrained category chips. Not a generic dashboard with 4 statistic tiles.
3. **Segmented section:** three clearly related choices matching the visual footprint of Overview / Day 1 / Map in the one-day mockup. A selected state is obvious. Don't invent a global navigation bar.
4. **Horizontal route ribbon:** numbered/icon-connected stops with a thin dotted connection line, integrated in the same itinerary surface. On narrow phones: horizontally scrollable with part of next item peeking in; avoid compressing five place names into illegible 7px text.
5. **Single vertical itinerary timeline:** one continuous line of times/stops, not five unrelated floating cards. Each has time badge, modest 4:3 or square thumbnail, name, contextual category/description, *estimated* price and a clear row-detail affordance. Travel time is a between-stops connector, not a fake exact promise.
6. **Budget:** a single clear spending summary with well-scaled amount and progress fill, a remaining/over-budget message and transparent exclusions. The same source of truth powers totals and cards.
7. **Travel buddy tips:** quieter grouped information area with just the most helpful local advice. No 3 glowing infographic tiles, generic marketing claims or repetitive icons.
8. **Actions:** Save primary; Refine/Share secondary. On mobile, controls wrap/stack instead of shrinking labels below readability, and they never cover the message composer.

### Visual craft direction

The approved UI already has a good composition. Polish, do not restyle beyond recognition:

- **Personality:** warm espresso / terracotta, gentle orange, real travel imagery, conversational Taglish. Premium, friendly, grounded. Not neon gaming UI, not futuristic AI landing page.
- **Typography:** platform/system sans where compatible with the existing app; use actual weights/hierarchy instead of huge gradients. Main place title ~32–38px in the reference; major section titles ~19–21px; stop titles 13–15px; body 13–15px; metadata 11–13px only when comfortably readable. Use clamp/responsive adjustments; don't hardcode tiny sizes on mobile.
- **Spacing:** 4/8px rhythm; content outer margin ~14–26px depending on viewport; surfaces ~12–22px interior padding. Align hero title, route, timeline and budget baselines; no unrelated left edges.
- **Color hierarchy:** accent orange belongs to active state, key icons, primary CTA, price emphasis or progress bar. **Do not** color every paragraph, border and chip orange.
- **Surface discipline:** only the hero and meaningful sections have prominent fills. Within itinerary use dividers and connecting timeline, not an outer stroke around every stop.
- **Geometry:** use consistent radius scale; inner radii always less than parent radii. No arbitrary asymmetrical blobs or excessive pill shapes.
- **Shadows:** subtle ambient depth, avoid glow. Reserve gradients for image legibility and maybe a restrained primary state, not backgrounds of every panel.
- **Icons:** one coherent existing library; proper alignment and consistent visual stroke/weight. No emoji as control icons; only keep the brand mascot if it belongs to the product.
- **Text:** labels should describe actual actions: View details, Save plan, Refine, Share plan. Fewer generic headline slogans, no overenthusiastic "perfect trip!" claims or decorative sparkles around every section.
- **Imagery:** deliberate crops and consistent subject scale. An asset must represent the actual destination/place if represented as factual, otherwise use a neutral illustrated/demo thumbnail; check rights/attribution.
- **iOS feeling:** familiar segmented controls, grouped cells, native-feeling transitions, generous touch targets, safe-area handling, predictable sheets. **This does not mean importing UIKit into a web app or coating content in blur/glass.**

### Explicit anti-slop review (review every section, do not blindly remove familiar UI patterns)

- No repeated same-size glowing cards just because generators often use cards.
- No more than **one** visually dominant orange call to action per state.
- No pointless badge stacks, duplicate place recommendations or duplicate budget summaries.
- No unnecessary icons when text would be clearer.
- No extra navigation sidebars, chart widgets, performance KPIs, hero stats or decorative illustrations not in the reference.
- No fake map, verification badge, confidence claim, hours, travel route or invented currency conversion.
- No excessive text truncation, ultra-small mobile metadata, misaligned prices, overflowing pills, inaccessible hover-only actions or disabled browser zoom.
- Do not eliminate **all** cards, shadows, gradients or round corners just because some online users call them "AI slop". The goal is **intentionality**, not avoidance of a visual trend.

## 5. Architecture, data and edge-case contract

Adapt this illustrative normalized model to the repository's existing data, **do not make an incompatible parallel schema**:

```ts
type Trip = {
  id: string;
  destination: string;
  stayLocation?: { label: string; latitude?: number; longitude?: number };
  durationDays: number;
  budget: {
    amount: number;
    currency: string;          // e.g. PHP
    scope?: 'perPerson' | 'group';
    includes?: string[];       // categories of cost user agreed to include
  };
  preferences?: string[];
  days: Array<{
    id: string;
    dayNumber: number;
    stops: Array<{
      id: string;
      startTime?: string | null;
      durationMinutes?: number | null;
      place: {
        id?: string;
        name: string;
        area?: string;
        address?: string;
        coordinates?: { lat: number; lng: number };
        verification?: 'verified' | 'unverified' | 'unknown';
      };
      category?: string;
      description?: string;
      image?: { url: string; attribution?: string } | null;
      costs: Array<{ category: string; amount: number | null; estimate: boolean }>;
      transferFromPreviousMinutes?: number | null;
    }>;
  }>;
  otherCosts?: Array<{ category: string; amount: number | null; estimate: boolean }>;
  status?: 'draft' | 'saved';
};
```

- A **single canonical trip object** feeds all visible fields: header, route nodes, day list, budget, share text and maps.
- `unknown` != `₱0`. If cost is unknown, include an honest note and exclude it from numeric totals, with an explicit partial-total label.
- Derived totals must not silently double-count between-stops travel, unknown costs or per-person/group estimates.
- When a stop changes, update time order, duration, transfer, budget and map in a transaction. Show optimistic UI only if rollback is robust and visually clear.
- Rendering unstructured AI output must have schema checks / resilient normalization and a readable text fallback. Never dump raw JSON or render unsafe user-generated HTML.
- Keep multi-day trips legible: separate day selection, day subtotal where relevant, full-trip total consistently shown and keyed stops on all days.
- Empty/loading/partial/error states, zero-budget, over-budget, no photo, long venue names, only one stop, 10+ stops and user preferences must all be designed.
- Data sources: distinguish verified venue/route facts, machine estimates and illustrative examples in text and interaction. Avoid presenting sample figures as confirmed recommendations.

## 6. Interaction requirements

- **Route icon and matching timeline row** both open the SAME stop details; share IDs and data. On touch, don't require hover. Full-row click is preferred on narrow mobile where View button is hidden.
- **Stop details:** modal bottom sheet / drawer with photo (optional), location, intended visit time, estimated costs, contextual actions and clearly labelled replacement request; keyboard Escape, focus capture/return and explicit close.
- **Refine:** allow specific requests: cheaper, shorter travel, more local food, slower pace, change one stop. Reuse the existing AI chat / update flow. Do not pretend changes happened if integration doesn't exist.
- **Overview / day / Map**: visible selected control, preserve current context. Map is a real provider-backed map only with true coordinates; otherwise say "route order preview".
- **Save:** keep existing auth+save semantics; show success only after persistence returns successfully. **Share:** existing share link/service or real Web Share; no dead placeholder links.
- **Budget disclosure:** tap to see itemized included amounts and missing estimates. Budget bar is only a ratio of known costs and chosen inclusions, not an approximation portrayed as precise.
- **Animation (conditional but desired):** If the host system can support it cleanly, add polished, subtle, iOS-like transitions. Animate interactions that communicate change: tab selection, sheet opening/closing, timeline row selection, confirmed stop replacement, budget change and save feedback. Avoid decorative looping, dramatic staggered entrances, bouncing cards or motion that delays reading the itinerary. The existing product's design tokens and motion conventions outrank demo timings. Read `MOTION_SPEC.md` for individual behavior and acceptance rules.
- **Performance:** lazy-load lower images, reserve aspect ratio to avoid shifting, reuse app caching, don't cause big re-renders while chat streams. Prefer compositor-friendly opacity/transform animations, avoid layout thrashing, and respect `prefers-reduced-motion` and any in-app motion settings.

## 7. Implementation and visual QA acceptance gates

**Implement in small steps and show the user progress after their approval:**

1. Validate data and identify the actual chat insertion point.
2. Build the faithful static structure using app components and tokens; DON'T wire backend first if doing so hides layout problems.
3. Bind a normalized existing AI response; test true input variations.
4. Implement genuine interactions and all known states.
5. Verify responsive and accessible behavior.
6. Compare side-by-side with the supplied reference and repair design drift.

**Required visual checks:** 320px, 375px, 390px, 430px, 768px, 1024px, and the app's actual chat-message maximum width. Also 200% browser zoom, large text, iOS safe-area and chat composer overlap. Review both short and long content, 1 vs 3 vs 7 days, missing images, unknown prices and budget overrun. At large widths the layout should not become a giant sparse dashboard; keep the itinerary visually consolidated and inside its chat context.

**Required interactions/tests:** keyboard traverse tabs, activate stop, close sheet by Escape and button, restore focus, handle loading/error/empty state, confirm a swap updates the same row and budget, and Save/Share only report legitimate outcomes. Where animations are added, test real touch/keyboard behavior, rapid repeat clicks, slow devices, mid-transition interruption and reduced-motion mode. No content may become inaccessible or wait on an animation to complete. Use existing repo test/lint/typecheck/build commands; report skipped checks if tooling is unavailable.

**Before declaring completion, report a fidelity delta checklist**:
- Which sections match the reference (structure, spacing, color, imagery, layout)?
- Which sections intentionally differ because of the actual app design system or device width? **Why?**
- Which actions are really integrated vs blocked by missing back-end capabilities?
- What files changed, and which tests/screenshots were run?
- Where does source data come from, and which figures remain estimates/unknown?

**Non-negotiable:** Don't produce a visually generic replacement. Don't overengineer. Don't rewrite unrelated UI. Do not start coding before completing the audit + user grilling/approval.

## 8. Minimal response template for your FIRST Cursor turn

After inspecting the repo, your FIRST answer to the user should use this structure:

> **What I found in your current system**
>
> - Framework + UI libraries / design tokens: ... (with paths)
> - Current chat renderer and itinerary data path: ... (with paths)
> - Available APIs and missing capabilities: ...
>
> **What I'll preserve from the approved reference**
>
> - Hero → segmented views → route ribbon → chronological timeline → budget → tips → action row.
>
> **Questions I need you to answer before I touch the code**
>
> 1. ... [only unresolved blockers, with a default recommendation]
> 2. ...
>
> **My proposed changes / tradeoffs**
>
> - ...
>
> **No files have been changed yet.** Please answer the questions or explicitly tell me to proceed with the recommended defaults.

Do **not** turn this into boilerplate interrogation: if you already know an answer from the repo or from these instructions, state it rather than asking it again.

---

## 9. Research anchors (these inform craft, not an excuse to redesign)

- Apple HIG Design Principles — purposeful hierarchy, agency, consistency, simplicity, craft: https://developer.apple.com/design/human-interface-guidelines/design-principles
- Apple HIG Layout (updated September 2026) — alignment, adaptability, safe areas, text scaling: https://developer.apple.com/design/human-interface-guidelines/layout
- Apple HIG Segmented Controls — closely related views and consistent options: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
- Vercel Web Interface Guidelines — focus, motion, targets, nested radii, states, text: https://github.com/vercel-labs/web-interface-guidelines
- GitHub Primer typography guidance — typographic rhythm/scale, accessible units, left alignment: https://github.com/primer/design/blob/main/content/foundations/typography.mdx
- W3C WAI-ARIA modal dialog pattern — keyboard focus, Escape and focus return: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Community discussions (opinion, not design standards): https://www.reddit.com/r/UI_Design/comments/1w70kqb/question_about_websites_looking_like_ai_slop/ and https://www.reddit.com/r/UXDesign/comments/1tvt03p/aigenerated_ui_proves_people_value_design_but_not/
