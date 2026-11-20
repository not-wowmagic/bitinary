# Travel Buddy itinerary — Cursor reference package v3

**Read `CURSOR_START_HERE.md` first.** It instructs Cursor to inspect the existing app and **ask the user targeted questions BEFORE editing code**.

This package is a **reference, not a new app to adopt**. It preserves the current approved layout while polishing the styling toward a restrained, iOS/UIKit-inspired product interface.

## What is where

- `CURSOR_START_HERE.md` — full implementer prompt, mandatory repo audit, user interview, visual fidelity and QA contract.
- `REFERENCE_APPROVED_LAYOUT.png` — user-approved concept; **composition/source of truth for layout**.
- `index.html`, `styles.css`, `script.js`, `assets/` — working design reference and illustrative interactions. Open `index.html` in a browser (or start a local static server).
- `VISUAL_SPEC.md` — section hierarchy, practical tokens, responsive rules and anti-template polish.
- `MOTION_SPEC.md` — **new** smooth-animation guidance for Cursor: optional native-feeling transitions, reduced-motion behavior, and animation QA. Apply only where the actual app supports it cleanly.
- `REFERENCE_RESEARCH.md` — short rationale with useful Apple, GitHub and community links.

## Copy to Cursor

Attach the whole folder to the project or place under `docs/design-references/itinerary-v3/` and ask:

> Follow `docs/design-references/itinerary-v3/CURSOR_START_HERE.md`. First audit the actual project, then ask me any unresolved decisions and wait for my answer. Do not code until we've agreed. Preserve my approved screenshot layout, faithfully adapt the polished HTML's craft, and use the existing system design and real itinerary data. If feasible, add restrained smooth animations according to `MOTION_SPEC.md`, without changing the approved layout or harming accessibility.

## Limits of this sample

- The demonstration data, businesses, prices, times and route estimates are **not verified**.
- Save, refine, share and maps are **integration stubs**; demo interactions explicitly explain the missing production services. Do not pretend they work in production.
- This is a web styling prototype inspired by UIKit/HIG, **not native UIKit code**.
- Chatbot logo and sample images are illustrative assets repurposed from the prior design reference; verify usage permissions and actual venue imagery before production.
- HTML preview may render slightly differently in different browsers; use screenshots and constraints as guidance, not to override the host app's fonts and tokens.
