# Travel Buddy v3 — visual QA specification

## Intent

This is a faithful polish of the **approved current layout**, NOT a switch to the previous sparse UIKit redesign. It keeps: chat context → image-led hero → three-position segment → route ribbon → unified chronological stop list → budget progress → small local advice → Save / Refine / Share. The UI is **UIKit-inspired** (system typography, segmented control behavior, clean grouped surfaces, touch targets, sheets), but built in the **host application's stack**.

## Relative layout and priority

| Element | Priority | What a user should understand | Craft notes |
| --- | --- | --- | --- |
| Conversation bubble | Context only | Why the AI is showing a plan | Brief Taglish, keep existing avatar |
| Hero | Main landmark | Where, how long, budget, trip vibe | Destination title is dominant, image credible, minimal chips |
| Segments | View control | Overview / selected day / Map | Real selected states, keyboard operable; multi-day needs separate day selector semantics |
| Route ribbon | Pattern recognition | Which stops, in what order | Thin connector; mobile horizontal scrolling instead of cramming |
| Day timeline | Primary content | When, where, what to do, cost and transfers | One shared timeline rail; continuous list; no isolated stop borders |
| Budget | Decision support | Known estimated costs vs budget | Clear included/excluded amounts, partial totals treated honestly |
| Tips | Supporting context | What to consider locally | 1–3 specific tips, visually quiet |
| Actions | Next step | Save, refine or share plan | One orange primary action; secondary actions quiet |

## Visual tokens in demonstration HTML (guidelines, NOT required global overrides)

| Token | Demo value | Usage |
| --- | --- | --- |
| Page background | `#190f0c` | warm dark surround |
| Group surface | `#2b1e18` | one shared stop/tips/budget container |
| Secondary group | `#35251e` | inset muted material |
| Primary text | `#f5f0eb` | titles / stop names |
| Secondary text | `#c6b5a9` | explanations / timings |
| Muted text | `#a38d7f` | nonessential labels |
| Divider | `rgba(255,226,207,.105)` | 1px inset separators |
| Warm accent | `#f09a50` | active controls, key icons |
| CTA accent | `#ef7f27` | Save plan (one dominant CTA) |
| Hero radius | `24px` desktop / `20px` mobile | image-led content card |
| Major panel radius | `22–23px` desktop / `17–19px` mobile | continuous content surfaces |
| Inner radius | `8–15px` | buttons, photos, route strip |
| Outer content width | `~860px` max in standalone demo | real app chat response width wins |
| Control size | `≥44px` touch when practical | allow full-row taps on small viewports |
| Motion | `150–220ms` typical, app tokens take precedence | gentle interaction feedback only; details in `MOTION_SPEC.md` |

### Important design tweaks vs AI-generated reference

- More precise alignment of hero facts, timeline rail, prices, actions.
- Softer panel backgrounds, almost invisible strokes and no neon borders.
- Simplified stop actions: View on desktop, whole-row action recommended on mobile, chevron stays an affordance.
- Reduced decorative emoji and no gratuitous text gradients.
- Section titles less oversized; single dominant destination title.
- Clearer exclusions: in the demo, ₱1,350 is the sum of stop examples and leaves ₱150 **before transport**. This is intentionally more truthful than "₱150 left for extras".
- Transfer example total from individual example labels is 5 + 9 + 13 + 8 = **35 minutes**, so the visible header uses 35 — the earlier mockup inconsistently claimed 45. **These figures are not verified**.

## Responsive behavior

**≥ 768px / wide assistant message:** preserve near-identical visual flow and landscape hero. Time column at left, photo next to title, price/action aligned to right. Three tips can sit in one quiet row.

**375–430px:** hero image remains visible with gradient overlay for legibility; timeline rail is narrower; thumbnails smaller but not microscopic; price stays visible; hide redundant View chip only if entire row can open details; route ribbon may scroll with visible overflow affordance; tips stack or compress thoughtfully; three actions remain tappable.

**320–374px:** can use two-column actions or one full-width Save + two half-width secondaries if needed. The time rail must not overlap the photo. No 8px text, false single-line ellipsis on venue name, or horizontal document overflow.

**Accessibility:** dynamic font/zoom must increase row height, not clip important content. Escape and close button both dismiss sheets. Use visible focus, no focus lost behind chat composer.

## Data and visual states Cursor must design (not all are implemented in demo)

- 1, 2, 3, 7 day trips (including day switching and trip total), 1 / 5 / 10 stops.
- A venue with a very long name and an address/locality that wraps.
- A stop missing photo, price or time.
- Budget partial total / overrun / zero budget / missing accommodation cost.
- A map with verified coordinates vs schematic route-only; don't conflate them.
- Slow streaming AI, parse failure, no available places, replacement awaiting confirmation.
- Saved vs unsaved, disabled share due to missing link, error toast with recovery.

## Motion polish (optional and conditional)

Add smooth, purpose-driven micro-interactions **if supported by the app's existing UI stack**. Do not make the composition feel newly designed, and do not add elaborate animation just to impress. Preferred moments are the segmented-control selection, opening/closing place details, confirming a stop replacement, a changed budget meter, and subtle save confirmation. Use platform/design-system motion tokens, support `prefers-reduced-motion`, and avoid continuously moving elements or animation on every streamed AI token. See `MOTION_SPEC.md` for motion timing, interaction and QA details.

## Final implementation review

Compare actual app screenshots to BOTH `REFERENCE_APPROVED_LAYOUT.png` and the runnable demo (`index.html`): the first locks the **composition**, the second refines spacing/style/behaviors. Screenshots of demo may not be included if the sandbox browser is unavailable. The app must visually preserve the approved look; any deviation should be justified, not improvised.
