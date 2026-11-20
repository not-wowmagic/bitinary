# Reference-prototype QA (not an app integration test)

## Completed

- Verified `script.js` parses with `node --check`.
- Rendered HTML, CSS, scripts and local assets into a headless browser (embedded assets for sandbox browser policy).
- Captured desktop (1024px), tablet (768px), mobile (430px), small mobile (375px), and narrow mobile (320px) previews.
- Confirmed five scheduled demo stops render at each width and zero browser JavaScript page errors were reported.
- Confirmed no document-wide horizontal overflow at tested widths.
- Confirmed mobile whole-row stop tap opens the details sheet and close dismisses it.
- Confirmed Map segmented option switches to the clearly labelled schematic view.
- Confirmed sample known-stop costs total `₱1,350` and remaining unallocated amount is `₱150` **before transport**.

## Not validated / deliberately not implemented

- No real AI data, venue verification, addresses, accurate routing, pricing or production state management is supplied.
- Save / Share / Refine are clearly identified as integration points in demo sheets.
- This prototype is not connected to the user's actual repository; Cursor must perform host app integration and verification.
- Actual automated accessibility auditing / real iOS VoiceOver / full 200% text zoom tests are for integration stage. This prototype includes basic focus management, keyboard-operable tabs, reduced motion and mobile touch targets.
- No screenshots were captured with the user's real application's surrounding chat composer/header, so spacing needs host-level validation.

## Primary visuals

- `REFERENCE_APPROVED_LAYOUT.png` — approved composition from the previous iteration.
- `preview-desktop.png` — implemented reference at 1024px.
- `preview-mobile.png` — implemented reference at 430px.
- `preview-mobile-small.png` — implemented reference at 375px.
- `preview-mobile-320.png` — implemented narrow reference at 320px.
- `preview-tablet.png` — implemented reference at 768px.
